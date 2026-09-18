import uuid
import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth import create_access_token

client = TestClient(app)

class TestBranchManagementBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        admin_res = client.post('/api/auth/login', json={'email': 'admin@smartsalon.in', 'password': 'Admin@123'})
        assert admin_res.status_code == 200, f"Admin login failed: {admin_res.text}"
        cls.admin_headers = {'Authorization': f"Bearer {admin_res.json()['access_token']}"}

        cust_res = client.post('/api/auth/login', json={'email': 'nagoor@example.com', 'password': 'Customer@123'})
        assert cust_res.status_code == 200, f"Customer login failed: {cust_res.text}"
        cls.customer_headers = {'Authorization': f"Bearer {cust_res.json()['access_token']}"}

    def test_01_rbac_guard_blocks_customer(self):
        res = client.get('/api/branches', headers=self.customer_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn('Only administrators can manage branches.', res.json()['detail'])

        res = client.post('/api/branches', json={'name': 'X', 'address': 'Y', 'city': 'Z', 'phone': '123'}, headers=self.customer_headers)
        self.assertEqual(res.status_code, 403)

        res = client.put('/api/branches/badvel-1', json={'name': 'X'}, headers=self.customer_headers)
        self.assertEqual(res.status_code, 403)

        res = client.delete('/api/branches/badvel-1', headers=self.customer_headers)
        self.assertEqual(res.status_code, 403)

    def test_02_admin_can_list_and_filter_branches(self):
        res = client.get('/api/branches', headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data), 0)

        res_city = client.get('/api/branches?city=Badvel', headers=self.admin_headers)
        self.assertEqual(res_city.status_code, 200)
        for b in res_city.json():
            self.assertEqual(b['city'].lower(), 'badvel')

        res_status = client.get('/api/branches?status=ACTIVE', headers=self.admin_headers)
        self.assertEqual(res_status.status_code, 200)
        for b in res_status.json():
            self.assertEqual(b['status'], 'ACTIVE')

    def test_03_admin_can_create_edit_and_toggle_branch(self):
        """Admin creates, edits, and toggles status of a new branch"""
        test_id = f"br-mgmt-test-{uuid.uuid4().hex[:6]}"
        payload = {
            'id': test_id,
            'name': 'Tirupati Temple Road',
            'code': 'TPT-01',
            'address': 'Opp: Bus Stand, Tirupati',
            'city': 'Tirupati',
            'state': 'Andhra Pradesh',
            'phone': '+91 99887 76655',
            'email': 'tirupati@smartsalon.in',
            'status': 'ACTIVE',
            'opening_time': '09:30 AM',
            'closing_time': '08:30 PM',
            'working_days': 'Tuesday - Sunday'
        }
        res = client.post('/api/branches', json=payload, headers=self.admin_headers)
        self.assertEqual(res.status_code, 201)
        b = res.json()
        self.assertEqual(b['name'], 'Tirupati Temple Road')
        self.assertEqual(b['working_days'], 'Tuesday - Sunday')
        self.assertEqual(b['status'], 'ACTIVE')

        edit_payload = {
            'name': 'Tirupati Central Branch',
            'working_days': 'All 7 Days',
            'status': 'INACTIVE'
        }
        res_edit = client.put(f'/api/branches/{test_id}', json=edit_payload, headers=self.admin_headers)
        self.assertEqual(res_edit.status_code, 200)
        b_edit = res_edit.json()
        self.assertEqual(b_edit['name'], 'Tirupati Central Branch')
        self.assertEqual(b_edit['working_days'], 'All 7 Days')
        self.assertEqual(b_edit['status'], 'INACTIVE')

        res_active = client.get('/api/branches/active')
        self.assertEqual(res_active.status_code, 200)
        active_ids = [item['id'] for item in res_active.json()]
        self.assertNotIn(test_id, active_ids)

        res_del = client.delete(f'/api/branches/{test_id}', headers=self.admin_headers)
        self.assertEqual(res_del.status_code, 200)
        self.assertFalse(res_del.json()['soft_deleted'])
        self.assertEqual(res_del.json()['status'], 'DELETED')

    def test_04_safe_delete_blocks_deletion_with_bookings(self):
        res = client.delete('/api/branches/badvel-1', headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['soft_deleted'])
        self.assertEqual(data['status'], 'INACTIVE')

        res_check = client.get('/api/branches/badvel-1')
        self.assertEqual(res_check.status_code, 200)
        self.assertEqual(res_check.json()['status'], 'INACTIVE')

        client.put('/api/branches/badvel-1', json={'status': 'ACTIVE'}, headers=self.admin_headers)

if __name__ == '__main__':
    unittest.main()
