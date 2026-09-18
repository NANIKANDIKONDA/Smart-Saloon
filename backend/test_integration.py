import requests
import json
import sys

BASE_API = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5173"

def run_integration_tests():
    passed = 0
    failed = 0

    print("=== SmartSalon Frontend-Backend Integration Test Suite ===")

    # Test 1: Frontend is reachable
    try:
        r = requests.get(FRONTEND_URL, timeout=5)
        assert r.status_code == 200
        assert "<div id=\"root\"></div>" in r.text
        print("[PASS] Frontend served at http://localhost:5173 (HTTP 200)")
        passed += 1
    except Exception as e:
        print(f"[FAIL] Frontend reachability: {e}")
        failed += 1

    # Test 2: Backend root and health
    try:
        r = requests.get(f"{BASE_API}/api/health", timeout=5)
        assert r.status_code == 200
        data = r.json()
        assert data.get("database") == "connected"
        print(f"[PASS] Backend health endpoint (DB: {data.get('database')}, Ollama: {data.get('ollama', {}).get('status')})")
        passed += 1
    except Exception as e:
        print(f"[FAIL] Backend health: {e}")
        failed += 1

    # Test 3: Services endpoint
    try:
        r = requests.get(f"{BASE_API}/api/services", timeout=5)
        assert r.status_code == 200
        services = r.json()
        assert len(services) >= 6
        first = services[0]
        for field in ["id", "name", "category", "price", "duration", "description"]:
            assert field in first, f"Missing field {field}"
        print(f"[PASS] GET /api/services returned {len(services)} services with valid schema")
        passed += 1
    except Exception as e:
        print(f"[FAIL] GET /api/services: {e}")
        failed += 1

    # Test 4: Services category filter
    try:
        r = requests.get(f"{BASE_API}/api/services?category=Hair", timeout=5)
        assert r.status_code == 200
        hair_services = r.json()
        assert all(s["category"] == "Hair" for s in hair_services)
        print(f"[PASS] GET /api/services?category=Hair returned {len(hair_services)} hair services")
        passed += 1
    except Exception as e:
        print(f"[FAIL] GET /api/services?category=Hair: {e}")
        failed += 1

    # Test 5: Availability for normal date
    try:
        r = requests.get(f"{BASE_API}/api/availability?date=2026-09-25&service_id=svc_haircut_01", timeout=5)
        assert r.status_code == 200
        slots = r.json()
        assert len(slots) > 0
        assert all("time" in s and "available" in s for s in slots)
        print(f"[PASS] GET /api/availability returned {len(slots)} slots")
        passed += 1
    except Exception as e:
        print(f"[FAIL] GET /api/availability: {e}")
        failed += 1

    # Test 6: Availability for Sunday (400 validation error passthrough)
    try:
        # 2026-09-27 is Sunday
        r = requests.get(f"{BASE_API}/api/availability?date=2026-09-27", timeout=5)
        assert r.status_code == 400
        assert "closed on Sundays" in r.json().get("detail", "")
        print(f"[PASS] GET /api/availability on Sunday correctly returned HTTP 400: '{r.json().get('detail')}'")
        passed += 1
    except Exception as e:
        print(f"[FAIL] Sunday availability validation: {e}")
        failed += 1

    # Test 7: Chatbot known query (haircut price)
    try:
        r = requests.post(f"{BASE_API}/api/chat", json={"message": "How much does a haircut cost?"}, timeout=15)
        assert r.status_code == 200
        ans = r.json().get("answer", "")
        assert "500" in ans or "haircut" in ans.lower()
        printable_ans = ans.replace("\u20b9", "Rs.")
        print(f"[PASS] POST /api/chat known query answered correctly: '{printable_ans}'")
        passed += 1
    except Exception as e:
        print(f"[FAIL] POST /api/chat known query: {e}")
        failed += 1

    # Test 8: Chatbot unknown query (tattoo - strict closed knowledge)
    try:
        r = requests.post(f"{BASE_API}/api/chat", json={"message": "Do you provide tattoo services?"}, timeout=15)
        assert r.status_code == 200
        ans = r.json().get("answer", "")
        expected = "I don't know whether SmartSalon provides tattoo services because this information is not available in our current salon data."
        assert ans == expected or ("tattoo" in ans and "not available" in ans)
        print(f"[PASS] POST /api/chat unknown query strictly followed closed-knowledge: '{ans}'")
        passed += 1
    except Exception as e:
        print(f"[FAIL] POST /api/chat unknown query: {e}")
        failed += 1

    # Test 9: Create booking (POST /api/bookings)
    test_booking_id = None
    try:
        booking_payload = {
            "service_id": "svc_haircut_01",
            "date": "2026-09-25",
            "time_slot": "09:00 AM",
            "customer_name": "Integration Test User",
            "phone": "+91 98765 43210",
            "email": "integration@test.com",
            "special_notes": "Test booking"
        }
        r = requests.post(f"{BASE_API}/api/bookings", json=booking_payload, timeout=5)
        assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
        res = r.json()
        test_booking_id = res.get("bookingId") or res.get("booking_id")
        assert test_booking_id.startswith("SS-2026-"), f"Unexpected ID format: {test_booking_id}"
        assert res.get("status") == "Confirmed"
        print(f"[PASS] POST /api/bookings created booking with server ID: {test_booking_id}")
        passed += 1
    except Exception as e:
        print(f"[FAIL] POST /api/bookings: {e}")
        failed += 1

    # Test 10: Duplicate booking conflict (409)
    try:
        booking_payload = {
            "service_id": "svc_haircut_01",
            "date": "2026-09-25",
            "time_slot": "09:00 AM",
            "customer_name": "Second User",
            "phone": "+91 98765 11111",
            "email": "second@test.com"
        }
        r = requests.post(f"{BASE_API}/api/bookings", json=booking_payload, timeout=5)
        assert r.status_code == 409
        print(f"[PASS] POST /api/bookings duplicate slot returned HTTP 409 Conflict: '{r.json().get('detail')}'")
        passed += 1
    except Exception as e:
        print(f"[FAIL] POST /api/bookings conflict: {e}")
        failed += 1

    # Test 11: Booking on Sunday (400)
    try:
        booking_payload = {
            "service_id": "svc_haircut_01",
            "date": "2026-09-27",
            "time_slot": "10:00 AM",
            "customer_name": "Sunday User",
            "phone": "+91 98765 22222",
            "email": "sunday@test.com"
        }
        r = requests.post(f"{BASE_API}/api/bookings", json=booking_payload, timeout=5)
        assert r.status_code == 400
        print(f"[PASS] POST /api/bookings on Sunday returned HTTP 400 Bad Request: '{r.json().get('detail')}'")
        passed += 1
    except Exception as e:
        print(f"[FAIL] POST /api/bookings on Sunday: {e}")
        failed += 1

    print("\n--------------------------------------------------")
    print(f"Total tests: {passed + failed} | Passed: {passed} | Failed: {failed}")
    print("--------------------------------------------------")
    return failed == 0

if __name__ == "__main__":
    success = run_integration_tests()
    sys.exit(0 if success else 1)
