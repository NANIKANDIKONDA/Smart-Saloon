from typing import Optional, Any, Union, List
from pydantic import BaseModel, Field, EmailStr

class ServiceResponse(BaseModel):
    id: str
    name: str
    category: str
    price: int
    duration: int
    featured: bool
    description: str
    image: str
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True

class ServiceCreateUpdateRequest(BaseModel):
    name: str
    category: str
    price: int
    duration: int
    featured: Optional[bool] = False
    description: str
    image: str
    is_active: Optional[bool] = True

class BranchResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    address: str
    city: str
    state: Optional[str] = "Andhra Pradesh"
    phone: str
    email: Optional[str] = None
    status: str
    opening_time: str
    closing_time: str
    working_days: Optional[str] = "Monday - Saturday"
    image: Optional[str] = None
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None

    class Config:
        from_attributes = True

class BranchCreateUpdateRequest(BaseModel):
    id: Optional[str] = None
    name: str
    code: Optional[str] = None
    address: str
    city: str
    state: Optional[str] = "Andhra Pradesh"
    phone: str
    email: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    opening_time: Optional[str] = "09:00 AM"
    closing_time: Optional[str] = "09:00 PM"
    working_days: Optional[str] = "Monday - Saturday"
    image: Optional[str] = None

class BranchUpdateRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    working_days: Optional[str] = None
    image: Optional[str] = None

class StaffResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    role: str
    branch_id: Optional[str] = None
    specialization: Optional[str] = None
    working_hours: Optional[str] = None
    status: Optional[str] = "Available"

    class Config:
        from_attributes = True

class StaffCreateUpdateRequest(BaseModel):
    name: str
    phone: str
    email: str
    role: str
    branch_id: Optional[str] = None
    specialization: Optional[str] = None
    working_hours: Optional[str] = "09:00 AM - 08:00 PM"
    status: Optional[str] = "Available"

class SlotAvailability(BaseModel):
    time: str
    available: bool

# Auth Schemas
class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    role: Optional[str] = "customer"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    branch_id: Optional[str] = None
    created_at: str

# Payment Schemas
class PaymentOrderCreateRequest(BaseModel):
    booking_id: Optional[str] = None
    amount: int = 99 # ₹99 advance payment standard

class PaymentOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str = "INR"
    key_id: str
    mock: bool = False

class PaymentVerifyRequest(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    method: Optional[str] = "UPI"

class PaymentVerifyResponse(BaseModel):
    success: bool
    message: str
    booking_id: str
    payment_status: str
    amount_paid: int

class BookingCreateRequest(BaseModel):
    customerName: Optional[str] = None
    name: Optional[str] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    customerPhone: Optional[str] = None
    customer_phone: Optional[str] = None
    email: Optional[str] = None
    customerEmail: Optional[str] = None
    customer_email: Optional[str] = None
    notes: Optional[str] = None
    special_notes: Optional[str] = None
    date: str
    time: Optional[str] = None
    timeSlot: Optional[str] = None
    time_slot: Optional[str] = None
    branchId: Optional[str] = None
    branch_id: Optional[str] = None
    staffId: Optional[str] = None
    staff_id: Optional[str] = None
    bookingType: Optional[str] = "walk_in" # walk_in, home_service
    booking_type: Optional[str] = None
    service: Optional[Union[dict, str]] = None
    serviceId: Optional[str] = None
    service_id: Optional[str] = None
    serviceIds: Optional[List[str]] = None
    service_ids: Optional[List[str]] = None
    serviceName: Optional[str] = None
    service_name: Optional[str] = None
    price: Optional[int] = None
    duration: Optional[int] = None
    location: Optional[str] = None
    paymentMethod: Optional[str] = "UPI"
    advancePaid: Optional[int] = None

    def get_customer_name(self) -> str:
        val = self.customerName or self.name or self.customer_name or ""
        return val.strip()

    def get_phone(self) -> str:
        val = self.phone or self.customerPhone or self.customer_phone or ""
        return val.strip()

    def get_email(self) -> str:
        val = self.email or self.customerEmail or self.customer_email or ""
        return val.strip()

    def get_time_slot(self) -> str:
        val = self.time or self.timeSlot or self.time_slot or ""
        return val.strip()

    def get_branch_id(self) -> str:
        return self.branchId or self.branch_id or "badvel-1"

    def get_service_ids(self) -> List[str]:
        ids = self.serviceIds or self.service_ids or []
        if not ids:
            single = self.serviceId or self.service_id
            if single:
                ids = [single]
            elif isinstance(self.service, dict) and "id" in self.service:
                ids = [self.service["id"]]
            elif isinstance(self.service, str) and self.service:
                ids = [self.service]
        return ids

    def get_service_details(self) -> tuple[str, str, int, int]:
        """Returns (service_id, service_name, price, duration) for legacy compatibility"""
        s_id = self.serviceId or self.service_id or ""
        s_name = self.serviceName or self.service_name or ""
        s_price = self.price or 0
        s_duration = self.duration or 0

        if isinstance(self.service, dict):
            s_id = self.service.get("id", s_id)
            s_name = self.service.get("name", s_name)
            s_price = self.service.get("price", s_price)
            s_duration = self.service.get("duration", s_duration)
        elif isinstance(self.service, str) and not s_id:
            s_id = self.service

        return s_id, s_name, s_price, s_duration

class BookingItemResponse(BaseModel):
    serviceId: str
    serviceName: str
    price: int
    duration: int

class BookingResponse(BaseModel):
    bookingId: str
    createdAt: str
    customerName: str
    phone: str
    email: str
    notes: Optional[str] = None
    date: str
    time: str
    timeSlot: str
    serviceId: str
    serviceName: str
    service: dict
    services: Optional[List[BookingItemResponse]] = []
    branchId: Optional[str] = None
    branchName: Optional[str] = None
    price: int
    totalAmount: Optional[int] = None
    advancePaid: Optional[int] = None
    balanceDue: Optional[int] = None
    duration: int
    location: str
    status: str
    paymentStatus: Optional[str] = "Pending"
    bookingType: Optional[str] = "walk_in"
    notification_message: Optional[str] = None
    whatsapp_url: Optional[str] = None
    sms_url: Optional[str] = None
    live_dispatched: Optional[bool] = False
    sms_provider: Optional[str] = None

    class Config:
        from_attributes = True

class AppointmentStatusUpdateRequest(BaseModel):
    status: str # Booked, Confirmed, Checked-in, In Service, Completed, Cancelled, No-show
    payment_status: Optional[str] = None

class CustomerNoteCreateRequest(BaseModel):
    note: str

class CustomerTagCreateRequest(BaseModel):
    tag: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str

class TestSmsRequest(BaseModel):
    phone: str
    message: Optional[str] = "Hi! This is a live test notification from SmartSalon."

class HealthResponse(BaseModel):
    status: str
    database: str
    ollama: dict

