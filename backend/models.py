from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from .database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    price = Column(Integer, nullable=False) # In Indian Rupees (₹)
    duration = Column(Integer, nullable=False) # In minutes
    featured = Column(Boolean, default=False)
    description = Column(Text, nullable=False)
    image = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, default="Kadapa")
    state = Column(String(100), nullable=False, default="Andhra Pradesh")
    phone = Column(String(50), nullable=False)
    email = Column(String(100), nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, INACTIVE
    opening_time = Column(String(20), default="09:00 AM", nullable=False)
    closing_time = Column(String(20), default="09:00 PM", nullable=False)
    working_days = Column(String(100), default="Monday - Saturday", nullable=True)
    image = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

class Staff(Base):
    __tablename__ = "staff"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False) # Barber, Stylist, Therapist, Manager, Receptionist
    branch_id = Column(String(50), ForeignKey("branches.id"), nullable=True)
    specialization = Column(String(200), default="Hair & Beard")
    working_hours = Column(String(100), default="09:00 AM - 08:00 PM")
    status = Column(String(50), default="Available") # Available, Busy, On Leave, Off Duty

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(20), default="customer", nullable=False) # admin, customer
    branch_id = Column(String(50), ForeignKey("branches.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(50), primary_key=True, index=True) # e.g. SS-2026-XXXXX
    service_id = Column(String(50), nullable=False)
    service_name = Column(String(100), nullable=False)
    service_price = Column(Integer, nullable=False)
    date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    time_slot = Column(String(20), nullable=False, index=True) # e.g. 10:00 AM
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(100), nullable=False, index=True)
    customer_phone = Column(String(20), nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="Confirmed", nullable=False) # Booked, Confirmed, Checked-in, In Service, Completed, Cancelled, No-show
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Extended CRM & Multi-service columns
    branch_id = Column(String(50), ForeignKey("branches.id"), nullable=True)
    staff_id = Column(String(50), ForeignKey("staff.id"), nullable=True)
    customer_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    booking_type = Column(String(20), default="walk_in") # walk_in, home_service
    total_amount = Column(Integer, default=0)
    advance_paid = Column(Integer, default=0)
    balance_due = Column(Integer, default=0)
    payment_status = Column(String(20), default="Pending") # Pending, Paid, Partial, Refunded, Failed
    payment_method = Column(String(50), default="UPI")

class AppointmentService(Base):
    __tablename__ = "appointment_services"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String(50), ForeignKey("bookings.id"), index=True, nullable=False)
    service_id = Column(String(50), nullable=False)
    service_name = Column(String(100), nullable=False)
    price = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(50), primary_key=True, index=True)
    booking_id = Column(String(50), ForeignKey("bookings.id"), index=True, nullable=False)
    order_id = Column(String(100), nullable=True)
    payment_id = Column(String(100), nullable=True)
    signature = Column(String(255), nullable=True)
    amount = Column(Integer, nullable=False) # In INR
    currency = Column(String(10), default="INR")
    method = Column(String(50), default="UPI") # UPI, Cards, Netbanking, Wallet, Cash
    status = Column(String(20), default="Pending") # Pending, Captured, Failed, Refunded
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class CustomerNote(Base):
    __tablename__ = "customer_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_email = Column(String(100), index=True, nullable=False)
    author_name = Column(String(100), nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class CustomerTag(Base):
    __tablename__ = "customer_tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_email = Column(String(100), index=True, nullable=False)
    tag = Column(String(50), nullable=False) # VIP, New, Regular, Inactive, High Value

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, autoincrement=True)
    branch_id = Column(String(50), nullable=True) # None = all branches
    date = Column(String(20), index=True, nullable=False) # YYYY-MM-DD
    description = Column(String(200), nullable=False)
