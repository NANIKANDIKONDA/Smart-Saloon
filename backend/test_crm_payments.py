import sys
import os
import unittest
import random
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app

client = TestClient(app)

class TestCrmAndPayments(unittest.TestCase):

    def setUp(self):
        # Obtain admin token
        login_resp = client.post("/api/auth/login", json={
            "email": "admin@smartsalon.in",
            "password": "Admin@123"
        })
        self.assertEqual(login_resp.status_code, 200, f"Admin login failed: {login_resp.text}")
        self.admin_token = login_resp.json()["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Obtain customer token
        cust_login = client.post("/api/auth/login", json={
            "email": "nagoor@example.com",
            "password": "Customer@123"
        })
        self.assertEqual(cust_login.status_code, 200)
        self.cust_token = cust_login.json()["access_token"]
        self.cust_headers = {"Authorization": f"Bearer {self.cust_token}"}
        # Obtain manager token
        mgr_login = client.post("/api/auth/login", json={
            "email": "manager@smartsalon.in",
            "password": "Manager@123"
        })
        self.assertEqual(mgr_login.status_code, 200)
        self.mgr_token = mgr_login.json()["access_token"]
        self.mgr_headers = {"Authorization": f"Bearer {self.mgr_token}"}

    def test_01_branches_endpoint(self):
        # Public active branches endpoint
        pub_resp = client.get("/api/branches/active")
        self.assertEqual(pub_resp.status_code, 200)
        active_branches = pub_resp.json()
        self.assertGreaterEqual(len(active_branches), 6)
        branch_ids = [b["id"] for b in active_branches]
        self.assertIn("badvel-1", branch_ids)
        self.assertIn("kadapa-1", branch_ids)
        print("  [PASS] GET /api/branches/active: Returned active salon branches for public/booking")

        # Manager full branches endpoint
        mgr_resp = client.get("/api/branches", headers=self.mgr_headers)
        self.assertEqual(mgr_resp.status_code, 200)
        all_branches = mgr_resp.json()
        self.assertGreaterEqual(len(all_branches), 6)
        print("  [PASS] GET /api/branches (Manager): Returned full branch management list")

    def test_02_rbac_guard(self):
        # Customer attempting to access CRM dashboard should get 403 Forbidden
        resp = client.get("/api/crm/dashboard", headers=self.cust_headers)
        self.assertEqual(resp.status_code, 403)
        print("  [PASS] RBAC Guard: Customer forbidden (403) from CRM dashboard")

        # Admin accessing CRM dashboard should succeed (200)
        admin_resp = client.get("/api/crm/dashboard", headers=self.admin_headers)
        self.assertEqual(admin_resp.status_code, 200)
        data = admin_resp.json()
        self.assertIn("kpis", data)
        self.assertIn("revenueTrend", data)
        print("  [PASS] RBAC Guard: Admin granted 200 to CRM dashboard")

    def test_03_multi_service_booking_and_payment(self):
        # Generate an unoccupied future date to test fresh booking and double-booking prevention
        random_offset = random.randint(30, 200)
        test_dt = datetime.now() + timedelta(days=random_offset)
        if test_dt.weekday() == 6: # Sunday
            test_dt += timedelta(days=1)
        test_date_str = test_dt.strftime("%Y-%m-%d")

        booking_payload = {
            "customerName": "Test Customer",
            "phone": "9876543210",
            "email": "testcust@example.com",
            "date": test_date_str,
            "timeSlot": "02:00 PM",
            "branchId": "badvel-1",
            "serviceIds": ["clean-shave", "haircut-classic"],
            "notes": "Testing multi-service luxury booking"
        }
        resp = client.post("/api/bookings", json=booking_payload)
        self.assertEqual(resp.status_code, 201)
        b_data = resp.json()
        booking_id = b_data["bookingId"]
        self.assertEqual(b_data["totalAmount"], 49 + 99) # 148
        self.assertEqual(b_data["advancePaid"], 99)
        self.assertEqual(b_data["balanceDue"], 49)
        self.assertEqual(len(b_data["services"]), 2)
        print(f"  [PASS] POST /api/bookings: Created multi-service booking {booking_id} on {test_date_str}")

        # Double-booking verification: booking the same slot immediately should return 409 Conflict
        conflict_resp = client.post("/api/bookings", json=booking_payload)
        self.assertEqual(conflict_resp.status_code, 409)
        print("  [PASS] Double-booking prevention: Slot conflict correctly rejected with 409 Conflict")

        # Create Razorpay order
        order_resp = client.post("/api/payments/create-order", json={
            "booking_id": booking_id,
            "amount": 99
        })
        self.assertEqual(order_resp.status_code, 200)
        order_data = order_resp.json()
        self.assertIn("order_id", order_data)
        self.assertEqual(order_data["amount"], 99)
        print(f"  [PASS] POST /api/payments/create-order: Created order {order_data['order_id']}")

        # Verify payment with sandbox signature
        verify_resp = client.post("/api/payments/verify", json={
            "booking_id": booking_id,
            "razorpay_order_id": order_data["order_id"],
            "razorpay_payment_id": "pay_test_mock123",
            "razorpay_signature": f"mock_sig_{order_data['order_id']}_pay_test_mock123",
            "method": "UPI"
        })
        self.assertEqual(verify_resp.status_code, 200)
        v_data = verify_resp.json()
        self.assertTrue(v_data["success"])
        print(f"  [PASS] POST /api/payments/verify: Verified payment and recorded in DB")

        # Check booking status in CRM
        detail_resp = client.get(f"/api/bookings/{booking_id}")
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.json()["paymentStatus"], "Partial")

    def test_04_crm_customer_360_and_notes(self):
        # Retrieve customer 360
        resp = client.get("/api/crm/customers/nagoor@example.com", headers=self.admin_headers)
        self.assertEqual(resp.status_code, 200)
        cust_data = resp.json()
        self.assertIn("stats", cust_data)
        self.assertIn("appointments", cust_data)
        print("  [PASS] GET /api/crm/customers/nagoor@example.com: Customer 360 loaded")

        # Add a note
        note_resp = client.post(
            "/api/crm/customers/nagoor@example.com/notes",
            json={"note": "Automated test note: Customer is a premium patron"},
            headers=self.admin_headers
        )
        self.assertEqual(note_resp.status_code, 200)
        print("  [PASS] POST /api/crm/customers/.../notes: Added note")

if __name__ == "__main__":
    unittest.main()
