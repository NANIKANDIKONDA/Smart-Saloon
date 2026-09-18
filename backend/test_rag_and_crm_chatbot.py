"""
Test suite for SmartSalon RAG Pipeline & Authorized CRM Chatbot
Verifies:
1. Salon knowledge question -> Grounded response matching approved Master Cutts document
2. Ungrounded question -> Exact "I don't know because this information is not available in the current SmartSalon knowledge base."
3. Off-topic question -> Exact "I'm here to help with SmartSalon-related questions."
4. Authorized CRM customer question -> Live SQLite-backed bookings
5. Unauthorized CRM question -> Access denied, no data leakage
6. Authorized CRM admin question -> Live SQLite aggregate business metrics
7. SQLite engine preservation
8. Booking creation and mobile notification deep links
"""

import unittest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.main import app
from backend.database import SessionLocal
from backend.config import settings
from backend.models import User, Booking
from backend.auth import create_access_token
from backend.intent_router import OFF_TOPIC_REFUSAL, GROUNDING_REFUSAL

client = TestClient(app)


class TestRAGAndCRMChatbot(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db: Session = SessionLocal()
        # Find or use existing admin and customer
        cls.admin_user = cls.db.query(User).filter(User.role == "admin").first()
        cls.customer_user = cls.db.query(User).filter(User.role == "customer").first()

        cls.admin_token = create_access_token(
            {"sub": cls.admin_user.id, "email": cls.admin_user.email, "role": cls.admin_user.role}
        ) if cls.admin_user else ""

        cls.customer_token = create_access_token(
            {"sub": cls.customer_user.id, "email": cls.customer_user.email, "role": cls.customer_user.role}
        ) if cls.customer_user else ""

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_salon_knowledge_grounded_haircut(self):
        """Test question grounded in approved Master Cutts document"""
        resp = client.post("/api/chat", json={"message": "How much does a Classic Haircut cost?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertTrue("100" in ans or "200" in ans)
        print(f"  [PASS] Grounded Classic Haircut answer: {ans}")

    def test_02_salon_knowledge_grounded_beard(self):
        """Test beard service pricing from Master Cutts document"""
        resp = client.post("/api/chat", json={"message": "How much is a Beard Trim?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertTrue("50" in ans or "200" in ans)
        print(f"  [PASS] Grounded Beard Trim answer: {ans}")

    def test_03_ungrounded_refusal_tattoo(self):
        """Question absent from document gets exact grounding refusal"""
        resp = client.post("/api/chat", json={"message": "Do you provide tattoo services?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertEqual(ans, GROUNDING_REFUSAL)
        print(f"  [PASS] Ungrounded tattoo query: '{ans}'")

    def test_04_ungrounded_refusal_pool(self):
        """Question absent from document gets exact grounding refusal"""
        resp = client.post("/api/chat", json={"message": "Do you have a swimming pool?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertEqual(ans, GROUNDING_REFUSAL)
        print(f"  [PASS] Ungrounded swimming pool query: '{ans}'")

    def test_05_ungrounded_refusal_laser(self):
        """Question absent from document gets exact grounding refusal"""
        resp = client.post("/api/chat", json={"message": "Do you provide laser treatment?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertEqual(ans, GROUNDING_REFUSAL)
        print(f"  [PASS] Ungrounded laser treatment query: '{ans}'")

    def test_06_off_topic_refusal_general_knowledge(self):
        """Off-topic question gets exact fixed refusal"""
        resp = client.post("/api/chat", json={"message": "Who is the president of France?"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertEqual(ans, OFF_TOPIC_REFUSAL)
        print(f"  [PASS] Off-topic query refusal: '{ans}'")

    def test_07_off_topic_refusal_coding(self):
        """Off-topic programming question gets exact fixed refusal"""
        resp = client.post("/api/chat", json={"message": "Write a python function to sort an array"})
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertEqual(ans, OFF_TOPIC_REFUSAL)
        print(f"  [PASS] Off-topic coding query refusal: '{ans}'")

    def test_08_authorized_crm_customer_bookings(self):
        """Customer asking for own bookings gets their live bookings from SQLite"""
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        resp = client.post("/api/chat", json={"message": "What are my bookings?"}, headers=headers)
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertTrue("appointments" in ans.lower() or "booking" in ans.lower())
        print(f"  [PASS] Authorized CRM customer bookings: {ans[:70]}...")

    def test_09_unauthorized_crm_denial(self):
        """Customer asking for admin stats gets clear denial with no data leaked"""
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        resp = client.post("/api/chat", json={"message": "What is our total revenue?"}, headers=headers)
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertIn("Access denied", ans)
        self.assertNotIn("₹", ans)
        print(f"  [PASS] Unauthorized CRM denial: '{ans}'")

    def test_10_authorized_crm_admin_stats(self):
        """Admin asking for stats gets live SQLite aggregate data"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        resp = client.post("/api/chat", json={"message": "What is our total revenue?"}, headers=headers)
        self.assertEqual(resp.status_code, 200)
        ans = resp.json()["answer"]
        self.assertIn("Administrator Live Metrics", ans)
        self.assertIn("Total Bookings", ans)
        print(f"  [PASS] Authorized CRM admin metrics: {ans[:70]}...")

    def test_11_sqlite_database_preserved(self):
        """Verify SQLite is still the only database engine in use"""
        self.assertTrue(settings.DATABASE_URL.startswith("sqlite"))
        print(f"  [PASS] SQLite engine confirmed: {settings.DATABASE_URL}")

    def test_12_booking_creation_with_mobile_notification_links(self):
        """Verify booking creation returns notification_message, whatsapp_url, and sms_url"""
        import random, datetime
        target_date = datetime.date.today() + datetime.timedelta(days=random.randint(100, 500))
        if target_date.weekday() == 6:  # Skip Sunday (closed)
            target_date += datetime.timedelta(days=1)
        dyn_date = target_date.strftime("%Y-%m-%d")
        dyn_time = f"1{random.randint(0, 1)}:00 AM"
        payload = {
            "name": "Narendra",
            "phone": "9876543210",
            "email": f"narendra_{random.randint(1000, 9999)}@example.com",
            "date": dyn_date,
            "time": dyn_time,
            "serviceIds": ["srv-haircut"],
            "branchId": "badvel-1"
        }
        resp = client.post("/api/bookings", json=payload)
        self.assertIn(resp.status_code, [200, 201])
        data = resp.json()
        self.assertIn("notification_message", data)
        self.assertIn("whatsapp_url", data)
        self.assertIn("sms_url", data)
        self.assertTrue(data["whatsapp_url"].startswith("https://api.whatsapp.com/send"))
        self.assertTrue(data["sms_url"].startswith("sms:"))
        self.assertIn("Hi Narendra", data["notification_message"])
        print(f"  [PASS] Booking created with WhatsApp and SMS deep links: ID={data['bookingId']}")


if __name__ == "__main__":
    unittest.main()
