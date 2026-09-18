import sys
import os
import unittest
import uuid
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app

client = TestClient(app)

class TestAuthAndBranchManagement(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # 1. Login with all 4 roles via /login
        cls.roles = {
            "admin": {"email": "admin@smartsalon.in", "password": "Admin@123"},
            "manager": {"email": "manager@smartsalon.in", "password": "Manager@123"},
            "staff": {"email": "staff@smartsalon.in", "password": "Staff@123"},
            "customer": {"email": "nagoor@example.com", "password": "Customer@123"}
        }
        cls.tokens = {}
        cls.headers = {}

        for role, creds in cls.roles.items():
            # Test POST /login alias
            resp = client.post("/login", json=creds)
            assert resp.status_code == 200, f"Login failed for {role}: {resp.text}"
            data = resp.json()
            assert "access_token" in data
            assert data["user"]["role"] == role
            cls.tokens[role] = data["access_token"]
            cls.headers[role] = {"Authorization": f"Bearer {data['access_token']}"}

    def test_01_login_endpoint_role_verification(self):
        """Verify POST /login and POST /api/auth/login return exact role and token"""
        for role, creds in self.roles.items():
            resp = client.post("/api/auth/login", json=creds)
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("access_token", data)
            self.assertEqual(data["user"]["role"], role)
            self.assertEqual(data["user"]["email"], creds["email"])

            # Verify /api/auth/me returns current authenticated user with role
            me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
            self.assertEqual(me_resp.status_code, 200)
            me_data = me_resp.json()
            self.assertEqual(me_data["role"], role)
            self.assertEqual(me_data["email"], creds["email"])

    def test_02_manager_only_guard_enforcement(self):
        """Verify only manager has access to /api/branches; admin, staff, customer receive 403"""
        # Unauthenticated -> 401
        unauth_resp = client.get("/api/branches")
        self.assertEqual(unauth_resp.status_code, 401)

        # Customer -> 403
        cust_resp = client.get("/api/branches", headers=self.headers["customer"])
        self.assertEqual(cust_resp.status_code, 403)
        self.assertEqual(cust_resp.json()["detail"], "Only managers can manage branches.")

        # Staff -> 403
        staff_resp = client.get("/api/branches", headers=self.headers["staff"])
        self.assertEqual(staff_resp.status_code, 403)
        self.assertEqual(staff_resp.json()["detail"], "Only managers can manage branches.")

        # Admin -> 403 (strict manager exclusivity)
        admin_resp = client.get("/api/branches", headers=self.headers["admin"])
        self.assertEqual(admin_resp.status_code, 403)
        self.assertEqual(admin_resp.json()["detail"], "Only managers can manage branches.")

        # Manager -> 200
        mgr_resp = client.get("/api/branches", headers=self.headers["manager"])
        self.assertEqual(mgr_resp.status_code, 200)
        self.assertIsInstance(mgr_resp.json(), list)

    def test_03_manager_create_and_update_branch(self):
        """Verify manager can create and update branch, non-managers receive 403"""
        test_branch_id = f"test-branch-{uuid.uuid4().hex[:6]}"
        payload = {
            "id": test_branch_id,
            "name": "Luxury Test Branch",
            "city": "Hyderabad",
            "state": "Telangana",
            "address": "Road No 36, Jubilee Hills",
            "phone": "+91 9876543219",
            "email": "jubilee@smartsalon.in",
            "open_time": "09:00 AM",
            "close_time": "09:00 PM",
            "status": "active"
        }

        # Non-managers forbidden from creating branch
        for role in ["admin", "staff", "customer"]:
            forbidden_resp = client.post("/api/branches", json=payload, headers=self.headers[role])
            self.assertEqual(forbidden_resp.status_code, 403, f"{role} should have been forbidden")
            self.assertEqual(forbidden_resp.json()["detail"], "Only managers can manage branches.")

        # Manager creates branch
        create_resp = client.post("/api/branches", json=payload, headers=self.headers["manager"])
        self.assertEqual(create_resp.status_code, 201)
        created_data = create_resp.json()
        self.assertEqual(created_data["id"], test_branch_id)
        self.assertEqual(created_data["city"], "Hyderabad")
        self.assertEqual(created_data["state"], "Telangana")

        # Manager updates branch
        update_payload = {
            "name": "Luxury Test Branch - Updated",
            "city": "Hyderabad",
            "state": "Telangana",
            "address": "Road No 36, Near Metro, Jubilee Hills",
            "phone": "+91 9876543219",
            "email": "jubilee.updated@smartsalon.in",
            "open_time": "08:30 AM",
            "close_time": "09:30 PM",
            "status": "active"
        }
        update_resp = client.put(f"/api/branches/{test_branch_id}", json=update_payload, headers=self.headers["manager"])
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.json()["name"], "Luxury Test Branch - Updated")

        # Clean up hard delete (no bookings on this branch)
        del_resp = client.delete(f"/api/branches/{test_branch_id}", headers=self.headers["manager"])
        self.assertEqual(del_resp.status_code, 200)

    def test_04_soft_delete_branch_with_history(self):
        """Verify that deleting a branch with dependent bookings results in soft-delete (status='inactive')"""
        test_branch_id = f"hist-branch-{uuid.uuid4().hex[:6]}"
        payload = {
            "id": test_branch_id,
            "name": "History Test Branch",
            "city": "Bangalore",
            "state": "Karnataka",
            "address": "Indiranagar 100ft Road",
            "phone": "+91 9999988888",
            "email": "indiranagar@smartsalon.in",
            "open_time": "10:00 AM",
            "close_time": "08:00 PM",
            "status": "active"
        }
        # Manager creates branch
        create_resp = client.post("/api/branches", json=payload, headers=self.headers["manager"])
        self.assertEqual(create_resp.status_code, 201)

        # Create a booking attached to this branch
        booking_payload = {
            "customerName": "Branch History Test",
            "phone": "9999988888",
            "email": "historytest@example.com",
            "date": "2026-11-20",
            "timeSlot": "11:00 AM",
            "branchId": test_branch_id,
            "serviceIds": ["haircut-classic"]
        }
        b_resp = client.post("/api/bookings", json=booking_payload)
        self.assertEqual(b_resp.status_code, 201)

        # Manager attempts to delete the branch -> Soft delete expected
        del_resp = client.delete(f"/api/branches/{test_branch_id}", headers=self.headers["manager"])
        self.assertEqual(del_resp.status_code, 200)
        del_data = del_resp.json()
        self.assertIn("deactivated", del_data["message"].lower())
        self.assertEqual(del_data["status"], "inactive")

        # Verify active branches list DOES NOT include this inactive branch
        active_resp = client.get("/api/branches/active")
        self.assertEqual(active_resp.status_code, 200)
        active_ids = [b["id"] for b in active_resp.json()]
        self.assertNotIn(test_branch_id, active_ids)

        # Verify attempting to book an inactive branch returns 400 Bad Request
        bad_booking_resp = client.post("/api/bookings", json=booking_payload)
        self.assertEqual(bad_booking_resp.status_code, 400)
        self.assertIn("inactive", bad_booking_resp.json()["detail"].lower())

        # Verify manager GET /api/branches still sees it as inactive
        all_branches_resp = client.get("/api/branches", headers=self.headers["manager"])
        all_branches = {b["id"]: b for b in all_branches_resp.json()}
        self.assertIn(test_branch_id, all_branches)
        self.assertEqual(all_branches[test_branch_id]["status"], "inactive")

if __name__ == "__main__":
    unittest.main()
