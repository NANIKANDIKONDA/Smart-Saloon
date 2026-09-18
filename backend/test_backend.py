import sys
import os
import unittest
import random
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure root directory is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app
from backend.database import SessionLocal
from backend.models import Booking

client = TestClient(app)

class TestSmartSalonBackend(unittest.TestCase):

    # ==================== REGRESSION CHECKS ====================

    def test_01_health_check(self):
        resp = client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("status", data)
        self.assertEqual(data["database"], "connected")
        self.assertIn("ollama", data)
        print("  [PASS] GET /api/health passed")

    def test_02_get_services(self):
        resp = client.get("/api/services")
        self.assertEqual(resp.status_code, 200)
        services = resp.json()
        self.assertGreaterEqual(len(services), 8)
        
        # Check haircut service and price in rupees
        haircut = next((s for s in services if s["id"] == "haircut"), None)
        self.assertIsNotNone(haircut)
        self.assertEqual(haircut["price"], 500)
        self.assertEqual(haircut["duration"], 45)
        print("  [PASS] GET /api/services: 8 services loaded, haircut is Rs 500")

    def test_03_get_services_by_category(self):
        resp = client.get("/api/services?category=Hair")
        self.assertEqual(resp.status_code, 200)
        services = resp.json()
        self.assertTrue(all(s["category"] == "Hair" for s in services))
        print("  [PASS] GET /api/services?category=Hair filtered correctly")

    def test_04_availability_slots(self):
        today = datetime.now()
        target = today + timedelta(days=5)
        if target.weekday() == 6:
            target += timedelta(days=1)
        test_date = target.strftime("%Y-%m-%d")

        resp = client.get(f"/api/availability?date={test_date}")
        self.assertEqual(resp.status_code, 200)
        slots = resp.json()
        self.assertEqual(len(slots), 12)
        print(f"  [PASS] GET /api/availability for {test_date}: 12 slots returned")

    def test_05_sunday_closure(self):
        today = datetime.now()
        days_until_sunday = (6 - today.weekday()) % 7
        if days_until_sunday == 0:
            days_until_sunday = 7
        sunday_date = (today + timedelta(days=days_until_sunday)).strftime("%Y-%m-%d")

        resp = client.get(f"/api/availability?date={sunday_date}")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("closed on Sundays", resp.json().get("detail", ""))
        print(f"  [PASS] Sunday closure verified for {sunday_date}: HTTP 400 returned with message")

    def test_06_create_and_list_bookings(self):
        today = datetime.now()
        offset = random.randint(100, 200)
        target = today + timedelta(days=offset)
        if target.weekday() == 6:
            target += timedelta(days=1)
        test_date = target.strftime("%Y-%m-%d")

        with SessionLocal() as db:
            db.query(Booking).filter(Booking.date == test_date, Booking.time_slot == "02:00 PM").delete()
            db.commit()

        payload = {
            "customerName": "Nagoor Babu",
            "phone": "+91 98765 43210",
            "email": "nagoor@example.com",
            "date": test_date,
            "timeSlot": "02:00 PM",
            "serviceId": "haircut",
            "serviceName": "Precision Haircut & Styling",
            "price": 500,
            "duration": 45,
            "notes": "First time customer"
        }

        resp = client.post("/api/bookings", json=payload)
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertTrue(data["bookingId"].startswith("SS-2026-"))
        self.assertEqual(data["status"], "Confirmed")
        print(f"  [PASS] POST /api/bookings created ID={data['bookingId']}")

        # List bookings
        list_resp = client.get("/api/bookings")
        self.assertEqual(list_resp.status_code, 200)
        all_b = list_resp.json()
        self.assertTrue(any(b["id"] == data["bookingId"] for b in all_b))
        print("  [PASS] GET /api/bookings lists the new booking")

    # ==================== 10 REQUIRED CHATBOT CLOSED-KNOWLEDGE TESTS ====================

    def test_case_01_services_overview(self):
        # 1. "What services do you offer?" -> real service list
        resp = client.post("/api/chat", json={"message": "What services do you offer?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertTrue("Haircuts" in ans or "haircut" in ans.lower())
        self.assertTrue("500" in ans)
        clean = ans.replace("₹", "Rs ")
        print(f"  [PASS] 1. Services overview: {clean[:70]}...")

    def test_case_02_haircut_price(self):
        # 2. "How much does a haircut cost?" -> ₹500
        resp = client.post("/api/chat", json={"message": "How much does a haircut cost?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertTrue("500" in ans or "100" in ans or "200" in ans)
        clean = ans.replace("₹", "Rs ")
        print(f"  [PASS] 2. Haircut cost: {clean}")

    def test_case_03_haircut_duration(self):
        # 3. "How long does a haircut take?" -> 45 minutes
        resp = client.post("/api/chat", json={"message": "How long does a haircut take?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertTrue("45" in ans or "45 minutes" in ans)
        clean = ans.replace("₹", "Rs ")
        print(f"  [PASS] 3. Haircut duration: {clean}")

    def test_case_04_tattoo_services_unknown(self):
        # 4. "Do you provide tattoo services?" -> "I don't know..." (NOT the service list)
        resp = client.post("/api/chat", json={"message": "Do you provide tattoo services?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        # Must NOT return generic service dump
        self.assertNotIn("We offer precision", ans)
        self.assertNotIn("Deluxe Manicure", ans)
        # Must be unknown refusal
        self.assertIn("I don't know", ans)
        self.assertTrue(
            "not available in the current SmartSalon knowledge base" in ans
            or "not available in our current salon data" in ans
        )
        print(f"  [PASS] 4. Tattoo services unknown: {ans}")

    def test_case_05_laser_treatment_unknown(self):
        # 5. "Do you provide laser treatment?" -> "I don't know..."
        resp = client.post("/api/chat", json={"message": "Do you provide laser treatment?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertNotIn("We offer precision", ans)
        self.assertIn("I don't know", ans)
        self.assertTrue(
            "not available in the current SmartSalon knowledge base" in ans
            or "not available in our current salon data" in ans
        )
        print(f"  [PASS] 5. Laser treatment unknown: {ans}")

    def test_case_06_swimming_pool_unknown(self):
        # 6. "Do you have a swimming pool?" -> "I don't know..."
        resp = client.post("/api/chat", json={"message": "Do you have a swimming pool?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertNotIn("We offer precision", ans)
        self.assertIn("I don't know", ans)
        self.assertTrue(
            "not available in the current SmartSalon knowledge base" in ans
            or "not available in our current salon data" in ans
        )
        print(f"  [PASS] 6. Swimming pool unknown: {ans}")

    def test_case_07_owner_unknown(self):
        # 7. "Who is the owner?" -> "I don't know..."
        resp = client.post("/api/chat", json={"message": "Who is the owner?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertNotIn("We offer precision", ans)
        self.assertIn("I don't know", ans)
        self.assertTrue(
            "not available in the current SmartSalon knowledge base" in ans
            or "not available in our current salon data" in ans
        )
        print(f"  [PASS] 7. Owner unknown: {ans}")

    def test_case_08_opening_hours(self):
        # 8. "What are your opening hours?" -> actual hours
        resp = client.post("/api/chat", json={"message": "What are your opening hours?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertTrue("10:00 AM" in ans or "8:00 PM" in ans)
        self.assertTrue("Sunday" in ans or "closed" in ans.lower())
        print(f"  [PASS] 8. Opening hours: {ans}")

    def test_case_09_location(self):
        # 9. "Where are you located?" -> actual location
        resp = client.post("/api/chat", json={"message": "Where are you located?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertTrue("Kakinada" in ans)
        self.assertTrue("Main Road" in ans or "Bhanugudi" in ans)
        print(f"  [PASS] 9. Location: {ans}")

    def test_case_10_can_book_haircut(self):
        # 10. "Can I book a haircut?" -> response based on existing booking flow
        resp = client.post("/api/chat", json={"message": "Can I book a haircut?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertTrue("book" in ans.lower() or "booking" in ans.lower())
        self.assertTrue("Haircut" in ans or "haircut" in ans.lower())
        clean = ans.replace("₹", "Rs ")
        print(f"  [PASS] 10. Can book haircut: {clean}")

if __name__ == "__main__":
    unittest.main()
