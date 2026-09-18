import sqlite3
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import engine, Base
from .models import (
    Service, Branch, Staff, User, Booking, AppointmentService,
    Payment, CustomerNote, CustomerTag, Holiday
)
from .data import (
    SALON_INFO, BRANCHES_SEED, STAFF_SEED, SERVICES_SEED
)
from .auth import hash_password

def migrate_existing_tables():
    """Adds missing columns to existing SQLite tables if needed."""
    with engine.connect() as conn:
        # Check bookings table columns
        res = conn.execute(text("PRAGMA table_info(bookings);")).fetchall()
        existing_cols = {row[1] for row in res}
        
        needed_booking_cols = [
            ("branch_id", "VARCHAR(50)"),
            ("staff_id", "VARCHAR(50)"),
            ("customer_id", "VARCHAR(50)"),
            ("booking_type", "VARCHAR(20) DEFAULT 'walk_in'"),
            ("total_amount", "INTEGER DEFAULT 0"),
            ("advance_paid", "INTEGER DEFAULT 0"),
            ("balance_due", "INTEGER DEFAULT 0"),
            ("payment_status", "VARCHAR(20) DEFAULT 'Pending'"),
            ("payment_method", "VARCHAR(50) DEFAULT 'UPI'")
        ]
        
        for col_name, col_type in needed_booking_cols:
            if col_name not in existing_cols:
                try:
                    conn.execute(text(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_type};"))
                    conn.commit()
                except Exception as e:
                    print(f"Migration notice: {e}")

        # Check services table columns
        res = conn.execute(text("PRAGMA table_info(services);")).fetchall()
        svc_cols = {row[1] for row in res}
        if "is_active" not in svc_cols:
            try:
                conn.execute(text("ALTER TABLE services ADD COLUMN is_active BOOLEAN DEFAULT 1;"))
                conn.commit()
            except Exception as e:
                print(f"Migration notice: {e}")

        # Check branches table columns
        res = conn.execute(text("PRAGMA table_info(branches);")).fetchall()
        branch_cols = {row[1] for row in res}
        needed_branch_cols = [
            ("state", "VARCHAR(100) DEFAULT 'Andhra Pradesh'"),
            ("email", "VARCHAR(100)"),
            ("working_days", "VARCHAR(100) DEFAULT 'Monday - Saturday'"),
            ("created_at", "DATETIME"),
            ("updated_at", "DATETIME")
        ]
        for col_name, col_type in needed_branch_cols:
            if col_name not in branch_cols:
                try:
                    conn.execute(text(f"ALTER TABLE branches ADD COLUMN {col_name} {col_type};"))
                    conn.commit()
                except Exception as e:
                    print(f"Migration notice: {e}")

        # Normalize branch statuses to 'ACTIVE' / 'INACTIVE' and set working_days
        try:
            conn.execute(text("UPDATE branches SET status = 'ACTIVE' WHERE LOWER(status) IN ('active', 'open') OR status IS NULL;"))
            conn.execute(text("UPDATE branches SET status = 'INACTIVE' WHERE LOWER(status) IN ('inactive', 'closed');"))
            conn.execute(text("UPDATE branches SET working_days = 'Monday - Saturday' WHERE working_days IS NULL OR working_days = '';"))
            conn.commit()
        except Exception as e:
            print(f"Migration notice: {e}")

def seed_all_data():
    # 1. Create all tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Run schema column additions on existing tables
    migrate_existing_tables()
    
    with Session(engine) as session:
        # 3. Seed Branches
        if session.query(Branch).count() == 0:
            for b_data in BRANCHES_SEED:
                branch = Branch(
                    id=b_data["id"],
                    name=b_data["name"],
                    code=b_data["code"],
                    address=b_data["address"],
                    city=b_data["city"],
                    phone=b_data["phone"],
                    status=b_data.get("status", "ACTIVE").upper(),
                    opening_time=b_data["opening_time"],
                    closing_time=b_data["closing_time"],
                    working_days=b_data.get("working_days", "Monday - Saturday"),
                    image=b_data.get("image")
                )
                session.add(branch)
            session.commit()

        # 4. Seed Staff
        # 4. Seed Staff
        for st_data in STAFF_SEED:
            existing_staff = session.query(Staff).filter(Staff.id == st_data["id"]).first()
            if not existing_staff:
                staff = Staff(
                    id=st_data["id"],
                    name=st_data["name"],
                    phone=st_data["phone"],
                    email=st_data["email"],
                    role=st_data["role"],
                    branch_id=st_data["branch_id"],
                    specialization=st_data["specialization"],
                    working_hours=st_data["working_hours"],
                    status=st_data["status"]
                )
                session.add(staff)
        session.commit()

        # 5. Seed Users (Admin, Manager, Staff, Customer)
        default_users = [
            {
                "id": "usr-admin-01",
                "email": "admin@smartsalon.in",
                "password": "Admin@123",
                "name": "Luxury Concierge Admin",
                "phone": "+91 884 234 5678",
                "role": "admin",
                "branch_id": None
            },
            {
                "id": "usr-mgr-01",
                "email": "manager@smartsalon.in",
                "password": "Manager@123",
                "name": "Ravi Kumar (Manager)",
                "phone": "+91 98765 43216",
                "role": "manager",
                "branch_id": "badvel-1"
            },
            {
                "id": "usr-staff-01",
                "email": "staff@smartsalon.in",
                "password": "Staff@123",
                "name": "Rahul Sharma (Master Barber)",
                "phone": "+91 98765 43211",
                "role": "staff",
                "branch_id": "badvel-1"
            },
            {
                "id": "usr-cust-01",
                "email": "nagoor@example.com",
                "password": "Customer@123",
                "name": "Nagoor Babu",
                "phone": "+91 98765 43210",
                "role": "customer",
                "branch_id": None
            }
        ]

        for u_data in default_users:
            existing_user = session.query(User).filter(User.email == u_data["email"]).first()
            if not existing_user:
                new_user = User(
                    id=u_data["id"],
                    email=u_data["email"],
                    hashed_password=hash_password(u_data["password"]),
                    name=u_data["name"],
                    phone=u_data["phone"],
                    role=u_data["role"],
                    branch_id=u_data["branch_id"],
                    created_at=datetime.now(timezone.utc)
                )
                session.add(new_user)
        session.commit()

        # 6. Seed / Upsert Services
        existing_svc_ids = {s.id for s in session.query(Service).all()}
        for s_data in SERVICES_SEED:
            if s_data["id"] not in existing_svc_ids:
                svc = Service(
                    id=s_data["id"],
                    name=s_data["name"],
                    category=s_data["category"],
                    price=s_data["price"],
                    duration=s_data["duration"],
                    featured=s_data["featured"],
                    description=s_data["description"],
                    image=s_data["image"],
                    is_active=True
                )
                session.add(svc)
        session.commit()

        # 7. Seed Sample Tags & Notes for Customers
        if session.query(CustomerTag).count() == 0:
            sample_tags = [
                CustomerTag(customer_email="nagoor@example.com", tag="VIP"),
                CustomerTag(customer_email="nagoor@example.com", tag="Frequent Visitor"),
                CustomerTag(customer_email="nani@example.com", tag="New")
            ]
            session.add_all(sample_tags)

            sample_notes = [
                CustomerNote(
                    customer_email="nagoor@example.com",
                    author_name="Ravi Kumar (Manager)",
                    note="Prefers appointment with Rahul Sharma. Likes herbal tea during hair treatment.",
                    created_at=datetime.now(timezone.utc) - timedelta(days=2)
                )
            ]
            session.add_all(sample_notes)
            session.commit()

        # 8. Ensure bookings have amounts and distributed branch assignments
        bookings = session.query(Booking).all()
        branch_cycle = ["kakinada-main", "badvel-1", "kadapa-1", "badvel-2", "kadapa-2", "kodur"]
        staff_by_branch = {
            "kakinada-main": "st-105",
            "badvel-1": "st-101",
            "kadapa-1": "st-103",
            "badvel-2": "st-107",
            "kadapa-2": "st-108",
            "kodur": "st-110"
        }
        for i, b in enumerate(bookings):
            if not b.total_amount or b.total_amount == 0:
                b.total_amount = b.service_price or 500
                b.advance_paid = 99
                b.balance_due = max(0, b.total_amount - b.advance_paid)
                b.payment_status = "Partial"
            if not b.branch_id:
                b.branch_id = branch_cycle[i % len(branch_cycle)]
                b.staff_id = staff_by_branch.get(b.branch_id, "st-101")
        session.commit()

if __name__ == "__main__":
    seed_all_data()
    print("Database initialization and migration completed successfully.")
