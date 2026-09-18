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
        # 1. Login with supported roles: Admin and Customer
        cls.valid_roles = {
            "admin": {"email": "admin@smartsalon.in", "password": "Admin@123"},
            "customer": {"email": "nagoor@example.com", "password": "Customer@123"}
        }
        cls.deprecated_roles = {
            "manager": {"email": "manager@smartsalon.in", "password": "Manager@123"},
            "staff": {"email": "staff@smartsalon.in", "password": "Staff@123"}
        }
        cls.tokens = {}
        cls.headers = {}

        for role, creds in cls.valid_roles.items():
            resp = client.post("/login", json=creds)
            assert resp.status_code == 200, f"Login failed for {role}: {resp.text}"
            data = resp.json()
            assert "access_token" in data
            assert data["user"]["role"] == role
            cls.tokens[role] = data["access_token"]
            cls.headers[role] = {"Authorization": f"Bearer {data['access_token']}"}

    def test_01_two_roles_login_verification(self):
        """Verify Admin and Customer login successfully and return correct backend-verified roles"""
        for role, creds in self.valid_roles.items():
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

    def test_02_manager_and_staff_login_unsupported(self):
        """Verify Manager and Staff logins are rejected at the authorization layer (HTTP 401)"""
        for role, creds in self.deprecated_roles.items():
            # Test /login endpoint
            resp = client.post("/login", json=creds)
            self.assertEqual(resp.status_code, 401, f"{role} should have been rejected with 401")
            self.assertIn("deprecated or unsupported", resp.json().get("detail", "").lower())

            # Test /api/auth/login endpoint
            api_resp = client.post("/api/auth/login", json=creds)
            self.assertEqual(api_resp.status_code, 401)

        # Test registration with deprecated roles is blocked (HTTP 400)
        for dep_role in ["manager", "staff"]:
            reg_resp = client.post("/api/auth/register", json={
                "email": f"new_{dep_role}_{uuid.uuid4().hex[:4]}@smartsalon.in",
                "password": "Password@123",
                "name": f"Test {dep_role.title()}",
                "role": dep_role
            })
            self.assertEqual(reg_resp.status_code, 400)
            self.assertIn("no longer supported", reg_resp.json().get("detail", "").lower())

    def test_03_admin_and_customer_access_control(self):
        """Verify Admin can access branches and CRM, while Customer receives HTTP 403 Forbidden"""
        # Unauthenticated -> 401
        unauth_resp = client.get("/api/branches")
        self.assertEqual(unauth_resp.status_code, 401)

        # Customer -> 403 on admin branch management
        cust_branch = client.get("/api/branches", headers=self.headers["customer"])
        self.assertEqual(cust_branch.status_code, 403)
        self.assertEqual(cust_branch.json()["detail"], "Only administrators can manage branches.")

        # Customer -> 403 on CRM dashboard
        cust_crm = client.get("/api/crm/dashboard", headers=self.headers["customer"])
        self.assertEqual(cust_crm.status_code, 403)

        # Customer -> 403 on CRM appointments
        cust_appts = client.get("/api/crm/appointments", headers=self.headers["customer"])
        self.assertEqual(cust_appts.status_code, 403)

        # Admin -> 200 on branch management
        admin_branch = client.get("/api/branches", headers=self.headers["admin"])
        self.assertEqual(admin_branch.status_code, 200)
        self.assertIsInstance(admin_branch.json(), list)

        # Admin -> 200 on CRM dashboard
        admin_crm = client.get("/api/crm/dashboard", headers=self.headers["admin"])
        self.assertEqual(admin_crm.status_code, 200)

        # Admin -> 200 on CRM appointments
        admin_appts = client.get("/api/crm/appointments", headers=self.headers["admin"])
        self.assertEqual(admin_appts.status_code, 200)

    def test_04_deprecated_api_routes(self):
        """Verify hitting old Manager/Staff API routes fails closed (HTTP 403)"""
        resp_mgr = client.get("/api/manager/dashboard")
        self.assertEqual(resp_mgr.status_code, 403)
        self.assertIn("deprecated", resp_mgr.json().get("detail", "").lower())

        resp_staff = client.get("/api/staff/dashboard")
        self.assertEqual(resp_staff.status_code, 403)
        self.assertIn("deprecated", resp_staff.json().get("detail", "").lower())

    def test_05_admin_branch_crud_and_soft_delete(self):
        """Verify admin can create, update, and soft-delete branches, while customer receives 403"""
        test_branch_id = f"test-branch-{uuid.uuid4().hex[:6]}"
        payload = {
            "id": test_branch_id,
            "name": "Luxury Admin Branch",
            "city": "Hyderabad",
            "state": "Telangana",
            "address": "Road No 36, Jubilee Hills",
            "phone": "+91 9876543219",
            "email": "admin.jubilee@smartsalon.in",
            "opening_time": "09:00 AM",
            "closing_time": "09:00 PM",
            "status": "active"
        }

        # Customer forbidden from creating branch (403)
        forbidden_resp = client.post("/api/branches", json=payload, headers=self.headers["customer"])
        self.assertEqual(forbidden_resp.status_code, 403)
        self.assertEqual(forbidden_resp.json()["detail"], "Only administrators can manage branches.")

        # Admin creates branch (201)
        create_resp = client.post("/api/branches", json=payload, headers=self.headers["admin"])
        self.assertEqual(create_resp.status_code, 201)
        created_data = create_resp.json()
        self.assertEqual(created_data["id"], test_branch_id)
        self.assertEqual(created_data["city"], "Hyderabad")

        # Admin updates branch (200)
        update_payload = {
            "name": "Luxury Admin Branch - Updated",
            "city": "Hyderabad",
            "state": "Telangana",
            "address": "Road No 36, Near Metro, Jubilee Hills",
            "phone": "+91 9876543219",
            "email": "admin.jubilee.updated@smartsalon.in",
            "opening_time": "08:30 AM",
            "closing_time": "09:30 PM",
            "status": "active"
        }
        update_resp = client.put(f"/api/branches/{test_branch_id}", json=update_payload, headers=self.headers["admin"])
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.json()["name"], "Luxury Admin Branch - Updated")

        # Clean up hard delete (no bookings on this branch)
        del_resp = client.delete(f"/api/branches/{test_branch_id}", headers=self.headers["admin"])
        self.assertEqual(del_resp.status_code, 200)

if __name__ == "__main__":
    unittest.main()
