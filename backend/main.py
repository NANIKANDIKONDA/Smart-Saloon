import random
import uuid
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc

from .config import settings
from .database import engine, get_db
from .init_db import seed_all_data
from .models import (
    Service, Branch, Staff, User, Booking, AppointmentService,
    Payment, CustomerNote, CustomerTag, Holiday
)
from .schemas import (
    ServiceResponse,
    ServiceCreateUpdateRequest,
    BranchResponse,
    BranchCreateUpdateRequest,
    StaffResponse,
    StaffCreateUpdateRequest,
    SlotAvailability,
    BookingCreateRequest,
    BookingResponse,
    BookingItemResponse,
    AppointmentStatusUpdateRequest,
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    PaymentOrderCreateRequest,
    PaymentOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    CustomerNoteCreateRequest,
    CustomerTagCreateRequest,
    ChatRequest,
    ChatResponse,
    HealthResponse
)
from .data import (
    SALON_INFO,
    SERVICES_SEED,
    SALON_TIME_SLOTS,
    CHATBOT_FALLBACK_ANSWER
)
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
    require_roles,
    require_admin
)
from .payments import (
    create_razorpay_order,
    verify_razorpay_signature
)
from .ollama_service import generate_chat_response, check_ollama_health, resolve_verified_salon_query
from .notifications import send_booking_confirmation_sms, send_booking_confirmation_whatsapp, generate_mobile_dispatch_urls
from .intent_router import classify_intent, OFF_TOPIC_REFUSAL, GROUNDING_REFUSAL
from .rag_service import handle_rag_pipeline
from .crm_query_service import execute_authorized_crm_query

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_all_data()
    yield

app = FastAPI(
    title="SmartSalon Luxury & CRM API",
    description="Full-stack FastAPI + SQLite + Razorpay + Ollama Engine for SmartSalon Rebuild",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
for origin in settings.CORS_ORIGINS:
    if origin and origin != "*" and origin not in allowed_origins:
        allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
def root():
    return {
        "status": "online",
        "service": "SmartSalon Luxury Grooming API",
        "version": "2.0.0",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.query(Service).limit(1).all()
    except Exception as e:
        db_status = f"error: {e}"

    ollama_info = await check_ollama_health()

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "ollama": ollama_info
    }

# ==================== AUTHENTICATION ====================

@app.post("/api/auth/register", response_model=TokenResponse, tags=["Auth"])
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    if req.role in ["manager", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Manager and Staff roles are no longer supported. Only Admin and Customer accounts are allowed."
        )

    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please log in."
        )

    user_id = f"usr-{uuid.uuid4().hex[:10]}"
    assigned_role = "admin" if req.role == "admin" else "customer"

    new_user = User(
        id=user_id,
        email=req.email.lower().strip(),
        hashed_password=hash_password(req.password),
        name=req.name.strip(),
        phone=req.phone.strip() if req.phone else None,
        role=assigned_role,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "phone": new_user.phone,
            "role": new_user.role,
            "branch_id": new_user.branch_id
        }
    }

@app.post("/login", response_model=TokenResponse, tags=["Auth"])
@app.post("/api/auth/login", response_model=TokenResponse, tags=["Auth"])
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Only Admin and Customer roles exist end-to-end
    if user.role not in ["admin", "customer"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account role is deprecated or unsupported. Only Admin and Customer logins are permitted."
        )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "role": user.role,
            "branch_id": user.branch_id
        }
    }

@app.get("/api/auth/me", response_model=UserResponse, tags=["Auth"])
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "phone": current_user.phone,
        "role": current_user.role,
        "branch_id": current_user.branch_id,
        "created_at": current_user.created_at.isoformat()
    }

# ==================== BRANCHES ====================

@app.get("/api/branches/active", response_model=List[BranchResponse], tags=["Branches"])
def get_active_branches(db: Session = Depends(get_db)):
    """Public customer-facing endpoint returning only active salon branches."""
    branches = db.query(Branch).filter(func.lower(Branch.status).in_(["active", "open"])).all()
    return branches

@app.get("/api/branches", response_model=List[BranchResponse], tags=["Branches"])
def get_branches(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin-only endpoint returning all branches (active & inactive)."""
    branches = db.query(Branch).order_by(Branch.name.asc()).all()
    return branches

@app.post("/api/branches", response_model=BranchResponse, status_code=status.HTTP_201_CREATED, tags=["Branches"])
def create_branch(
    req: BranchCreateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin-only endpoint to add a new salon branch."""
    if not req.name.strip() or not req.address.strip() or not req.city.strip() or not req.phone.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Branch name, address, city, and phone number are required."
        )

    branch_id = req.id.strip() if req.id and req.id.strip() else f"br-{uuid.uuid4().hex[:8]}"
    code = req.code.strip() if req.code and req.code.strip() else f"BR-{random.randint(100, 999)}"

    new_branch = Branch(
        id=branch_id,
        name=req.name.strip(),
        code=code,
        address=req.address.strip(),
        city=req.city.strip(),
        state=req.state.strip() if req.state else "Andhra Pradesh",
        phone=req.phone.strip(),
        email=req.email.strip() if req.email else None,
        status="active",
        opening_time=req.opening_time or "09:00 AM",
        closing_time=req.closing_time or "09:00 PM",
        image=req.image,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(new_branch)
    db.commit()
    db.refresh(new_branch)
    return new_branch

@app.put("/api/branches/{branch_id}", response_model=BranchResponse, tags=["Branches"])
def update_branch(
    branch_id: str,
    req: BranchCreateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin-only endpoint to update branch details."""
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail=f"Branch '{branch_id}' not found")

    if req.name and req.name.strip():
        branch.name = req.name.strip()
    if req.code and req.code.strip():
        branch.code = req.code.strip()
    if req.address and req.address.strip():
        branch.address = req.address.strip()
    if req.city and req.city.strip():
        branch.city = req.city.strip()
    if req.state and req.state.strip():
        branch.state = req.state.strip()
    if req.phone and req.phone.strip():
        branch.phone = req.phone.strip()
    if req.email is not None:
        branch.email = req.email.strip() if req.email.strip() else None
    if req.status and req.status.strip():
        branch.status = req.status.strip().lower()
    if req.opening_time:
        branch.opening_time = req.opening_time
    if req.closing_time:
        branch.closing_time = req.closing_time
    if req.image is not None:
        branch.image = req.image

    branch.updated_at = datetime.now()
    db.commit()
    db.refresh(branch)
    return branch

@app.delete("/api/branches/{branch_id}", tags=["Branches"])
def delete_branch(
    branch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin-only endpoint to remove a branch.
    Performs soft delete (status='inactive') if the branch has dependent bookings or staff,
    to preserve historical data.
    """
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail=f"Branch '{branch_id}' not found")

    # Check dependencies
    has_bookings = db.query(Booking).filter(Booking.branch_id == branch_id).count() > 0
    has_staff = db.query(Staff).filter(Staff.branch_id == branch_id).count() > 0

    if has_bookings or has_staff:
        branch.status = "inactive"
        branch.updated_at = datetime.now()
        db.commit()
        return {
            "message": "Branch deactivated successfully (preserved historical records).",
            "status": "inactive",
            "soft_deleted": True
        }
    else:
        db.delete(branch)
        db.commit()
        return {
            "message": "Branch removed successfully.",
            "soft_deleted": False
        }

@app.get("/api/branches/{branch_id}", response_model=BranchResponse, tags=["Branches"])
def get_branch_by_id(branch_id: str, db: Session = Depends(get_db)):
    b = db.query(Branch).filter(Branch.id == branch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Branch not found")
    return b

# ==================== SERVICES ====================

@app.get("/api/services", response_model=List[ServiceResponse], tags=["Services"])
def get_services(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Service).filter(Service.is_active == True)
    if category and category.lower() != "all":
        query = query.filter(Service.category.ilike(category))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(Service.name.ilike(term), Service.description.ilike(term)))

    services = query.order_by(Service.featured.desc(), Service.price.asc()).all()
    return services

@app.get("/api/services/{service_id}", response_model=ServiceResponse, tags=["Services"])
def get_service_by_id(service_id: str, db: Session = Depends(get_db)):
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found")
    return svc

# ==================== AVAILABILITY ====================

@app.get("/api/availability", response_model=List[SlotAvailability], tags=["Availability"])
def get_availability(
    date: Optional[str] = Query(None, description="Booking date YYYY-MM-DD"),
    branch_id: Optional[str] = Query(None, description="Branch identifier"),
    branchId: Optional[str] = Query(None, description="Branch identifier alias"),
    service_id: Optional[str] = Query(None, description="Service ID"),
    serviceId: Optional[str] = Query(None, description="Service ID alias"),
    staff_id: Optional[str] = Query(None, description="Staff ID"),
    db: Session = Depends(get_db)
):
    if not date:
        return []

    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d")
        if parsed_date.weekday() == 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SmartSalon is closed on Sundays. Please select Monday through Saturday."
            )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD")

    # Check branch holiday
    target_branch = branch_id or branchId
    holiday = db.query(Holiday).filter(
        Holiday.date == date,
        or_(Holiday.branch_id == target_branch, Holiday.branch_id == None)
    ).first()
    if holiday:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Salon closed on this date for holiday: {holiday.description}"
        )

    # Fetch active bookings for this date and branch
    query = db.query(Booking).filter(
        Booking.date == date,
        Booking.status.in_(["Booked", "Confirmed", "Checked-in", "In Service"])
    )
    if target_branch:
        query = query.filter(or_(Booking.branch_id == target_branch, Booking.branch_id == None))
    if staff_id:
        query = query.filter(Booking.staff_id == staff_id)

    existing_bookings = query.all()
    booked_slots = {b.time_slot for b in existing_bookings}

    slots = []
    day_num = parsed_date.day
    for slot in SALON_TIME_SLOTS:
        is_booked = slot in booked_slots
        # Realistic pattern for unoccupied test dates
        if not is_booked and len(booked_slots) == 0:
            mock_busy = (day_num % 2 == 0 and slot == "11:00 AM") or (day_num % 3 == 0 and slot == "03:00 PM")
            is_booked = mock_busy

        slots.append({
            "time": slot,
            "available": not is_booked
        })

    return slots

# ==================== BOOKINGS ====================

@app.post("/api/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED, tags=["Bookings"])
def create_booking(
    booking_in: BookingCreateRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    cust_name = booking_in.get_customer_name()
    phone = booking_in.get_phone()
    email = booking_in.get_email()
    time_slot = booking_in.get_time_slot()
    date_str = booking_in.date
    branch_id = booking_in.get_branch_id()

    # Auto-fill from logged in profile if empty
    if current_user:
        if not cust_name:
            cust_name = current_user.name
        if not email:
            email = current_user.email
        if not phone and current_user.phone:
            phone = current_user.phone

    if not cust_name or not phone or not email or not time_slot or not date_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required booking fields (name, phone, email, date, time)"
        )

    # Validate Sunday closure
    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d")
        if parsed_date.weekday() == 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SmartSalon is closed on Sundays. Please select a Monday to Saturday date."
            )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD")

    # Branch validation (must be active)
    branch = db.query(Branch).filter(Branch.id == branch_id).first() if branch_id else None
    if branch and branch.status and branch.status.lower() in ["inactive", "closed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Branch '{branch.name}' is currently inactive. Please choose an active branch."
        )

    # Validate slot conflict (branch + date + time)
    existing = db.query(Booking).filter(
        Booking.date == date_str,
        Booking.time_slot == time_slot,
        Booking.status.in_(["Booked", "Confirmed", "Checked-in", "In Service"]),
        or_(Booking.branch_id == branch_id, Booking.branch_id == None)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"The slot {time_slot} on {date_str} at this branch is already booked. Please choose another time."
        )

    # Resolve services & calculate real total server-side
    svc_ids = booking_in.get_service_ids()
    chosen_services = []
    total_price = 0
    total_duration = 0

    if svc_ids:
        db_services = db.query(Service).filter(Service.id.in_(svc_ids)).all()
        for svc in db_services:
            chosen_services.append(svc)
            total_price += svc.price
            total_duration += svc.duration

    if not chosen_services:
        # Fallback to single legacy service extraction
        s_id, s_name, s_price, s_dur = booking_in.get_service_details()
        if s_id:
            svc = db.query(Service).filter(Service.id == s_id).first()
            if svc:
                chosen_services.append(svc)
                total_price = svc.price
                total_duration = svc.duration
            else:
                total_price = s_price or 500
                total_duration = s_dur or 45
        else:
            total_price = 500
            total_duration = 45

    primary_service_id = chosen_services[0].id if chosen_services else "haircut"
    primary_service_name = chosen_services[0].name if chosen_services else "Precision Haircut & Styling"

    # Advance payment calculation (₹99 standard advance, remainder at salon)
    advance_amount = min(99, total_price) if total_price > 0 else 99
    balance_due = max(0, total_price - advance_amount)

    # Branch info
    branch_name = branch.name if branch else "Badvel Branch"
    location_desc = booking_in.location or (branch.address if branch else SALON_INFO["address"])

    # Auto assign staff if available
    staff_member = db.query(Staff).filter(
        Staff.branch_id == branch_id,
        Staff.status == "Available"
    ).first()
    staff_id = staff_member.id if staff_member else None

    # Generate unique ID: SS-2026-XXXXX
    while True:
        candidate_id = f"SS-2026-{random.randint(10000, 99999)}"
        if not db.query(Booking).filter(Booking.id == candidate_id).first():
            booking_id = candidate_id
            break

    new_booking = Booking(
        id=booking_id,
        service_id=primary_service_id,
        service_name=primary_service_name,
        service_price=total_price,
        date=date_str,
        time_slot=time_slot,
        customer_name=cust_name,
        customer_email=email,
        customer_phone=phone,
        notes=booking_in.notes or booking_in.special_notes or "",
        status="Confirmed",
        created_at=datetime.now(timezone.utc),
        branch_id=branch_id,
        staff_id=staff_id,
        customer_id=current_user.id if current_user else None,
        booking_type=booking_in.bookingType or booking_in.booking_type or "walk_in",
        total_amount=total_price,
        advance_paid=advance_amount,
        balance_due=balance_due,
        payment_status="Pending",
        payment_method=booking_in.paymentMethod or "UPI"
    )

    db.add(new_booking)
    db.flush()

    # Create AppointmentService links
    service_items_resp = []
    for svc in chosen_services:
        item = AppointmentService(
            booking_id=new_booking.id,
            service_id=svc.id,
            service_name=svc.name,
            price=svc.price,
            duration=svc.duration
        )
        db.add(item)
        service_items_resp.append({
            "serviceId": svc.id,
            "serviceName": svc.name,
            "price": svc.price,
            "duration": svc.duration
        })

    db.commit()
    db.refresh(new_booking)

    # Dispatch cellular SMS and WhatsApp confirmation
    sms_res = {}
    try:
        sms_res = send_booking_confirmation_sms(
            phone=new_booking.customer_phone,
            customer_name=new_booking.customer_name,
            booking_id=new_booking.id,
            date=new_booking.date,
            time_slot=new_booking.time_slot,
            branch_name=branch_name,
            service_name=new_booking.service_name,
            price=new_booking.service_price,
            duration=total_duration or 45
        )
        send_booking_confirmation_whatsapp(
            phone=new_booking.customer_phone,
            customer_name=new_booking.customer_name,
            booking_id=new_booking.id,
            date=new_booking.date,
            time_slot=new_booking.time_slot,
            branch_name=branch_name,
            service_name=new_booking.service_name,
            price=new_booking.service_price,
            duration=total_duration or 45
        )
    except Exception as e:
        logger.warning(f"Notification dispatch error: {e}")

    return {
        "bookingId": new_booking.id,
        "createdAt": new_booking.created_at.isoformat(),
        "customerName": new_booking.customer_name,
        "phone": new_booking.customer_phone,
        "email": new_booking.customer_email,
        "notes": new_booking.notes,
        "date": new_booking.date,
        "time": new_booking.time_slot,
        "timeSlot": new_booking.time_slot,
        "serviceId": new_booking.service_id,
        "serviceName": new_booking.service_name,
        "service": {
            "id": new_booking.service_id,
            "name": new_booking.service_name,
            "price": new_booking.service_price,
            "duration": total_duration or 45
        },
        "services": service_items_resp,
        "branchId": new_booking.branch_id,
        "branchName": branch_name,
        "price": new_booking.service_price,
        "totalAmount": new_booking.total_amount,
        "advancePaid": new_booking.advance_paid,
        "balanceDue": new_booking.balance_due,
        "duration": total_duration or 45,
        "location": location_desc,
        "status": new_booking.status,
        "paymentStatus": new_booking.payment_status,
        "bookingType": new_booking.booking_type,
        "notification_message": sms_res.get("message", ""),
        "whatsapp_url": sms_res.get("whatsapp_url", ""),
        "sms_url": sms_res.get("sms_url", ""),
        "live_dispatched": sms_res.get("live_dispatched", False),
        "sms_provider": sms_res.get("provider", "dev_console")
    }

@app.get("/api/bookings", tags=["Bookings"])
def list_bookings(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(Booking).order_by(Booking.created_at.desc())
    if current_user and current_user.role == "customer":
        query = query.filter(or_(Booking.customer_email == current_user.email, Booking.customer_id == current_user.id))
    return query.all()

@app.get("/api/bookings/my", tags=["Bookings"])
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(
        or_(Booking.customer_email == current_user.email, Booking.customer_id == current_user.id)
    ).order_by(Booking.created_at.desc()).all()
    return bookings

@app.get("/api/bookings/{booking_id}", tags=["Bookings"])
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking '{booking_id}' not found"
        )
    
    # Load appointment services
    items = db.query(AppointmentService).filter(AppointmentService.booking_id == booking_id).all()
    branch = db.query(Branch).filter(Branch.id == booking.branch_id).first() if booking.branch_id else None

    resp = {
        "bookingId": booking.id,
        "id": booking.id,
        "createdAt": booking.created_at.isoformat() if booking.created_at else "",
        "customerName": booking.customer_name,
        "phone": booking.customer_phone,
        "email": booking.customer_email,
        "notes": booking.notes,
        "date": booking.date,
        "time": booking.time_slot,
        "timeSlot": booking.time_slot,
        "serviceId": booking.service_id,
        "serviceName": booking.service_name,
        "branchId": booking.branch_id,
        "branchName": branch.name if branch else "SmartSalon Branch",
        "branchAddress": branch.address if branch else SALON_INFO["address"],
        "price": booking.service_price,
        "totalAmount": booking.total_amount or booking.service_price,
        "advancePaid": booking.advance_paid or 99,
        "balanceDue": booking.balance_due or 0,
        "status": booking.status,
        "paymentStatus": booking.payment_status or "Pending",
        "bookingType": booking.booking_type or "walk_in",
        "services": [{"serviceId": i.service_id, "serviceName": i.service_name, "price": i.price, "duration": i.duration} for i in items]
    }
    return resp

@app.delete("/api/bookings/{booking_id}", tags=["Bookings"])
def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user and current_user.role == "customer" and booking.customer_email != current_user.email:
        raise HTTPException(status_code=403, detail="Cannot cancel another customer's booking")

    booking.status = "Cancelled"
    db.commit()
    return {"message": "Booking successfully cancelled", "bookingId": booking_id, "status": "Cancelled"}

# ==================== PAYMENTS (RAZORPAY) ====================

@app.post("/api/payments/create-order", response_model=PaymentOrderResponse, tags=["Payments"])
async def create_payment_order(req: PaymentOrderCreateRequest):
    receipt = f"rcpt_{req.booking_id or uuid.uuid4().hex[:8]}"
    order_info = await create_razorpay_order(req.amount, receipt)
    return order_info

@app.post("/api/payments/verify", response_model=PaymentVerifyResponse, tags=["Payments"])
def verify_payment(req: PaymentVerifyRequest, db: Session = Depends(get_db)):
    is_valid = verify_razorpay_signature(
        req.razorpay_order_id,
        req.razorpay_payment_id,
        req.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature. Verification failed."
        )

    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{req.booking_id}' not found")

    # Record payment
    payment_record = Payment(
        id=f"pay-{uuid.uuid4().hex[:10]}",
        booking_id=booking.id,
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature,
        amount=booking.advance_paid or 99,
        currency="INR",
        method=req.method or "UPI",
        status="Captured",
        created_at=datetime.now(timezone.utc)
    )
    db.add(payment_record)

    # Update booking payment status
    booking.payment_status = "Paid" if booking.balance_due == 0 else "Partial"
    booking.payment_method = req.method or "UPI"
    db.commit()

    return {
        "success": True,
        "message": "Payment verified and recorded successfully.",
        "booking_id": booking.id,
        "payment_status": booking.payment_status,
        "amount_paid": booking.advance_paid or 99
    }

# ==================== CRM & ADMIN ENDPOINTS ====================

@app.get("/api/crm/dashboard", tags=["CRM"])
def get_crm_dashboard(
    branch_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Filter by branch if requested
    base_booking_q = db.query(Booking)
    if branch_id and branch_id != "all":
        base_booking_q = base_booking_q.filter(Booking.branch_id == branch_id)

    total_appointments = base_booking_q.count()
    today_appointments = base_booking_q.filter(Booking.date == today_str).count()

    # Today revenue
    today_paid_bookings = base_booking_q.filter(
        Booking.date == today_str,
        Booking.status != "Cancelled"
    ).all()
    today_revenue = sum(b.advance_paid or 0 for b in today_paid_bookings)

    # Total revenue
    all_active = base_booking_q.filter(Booking.status != "Cancelled").all()
    total_revenue = sum(b.advance_paid or 0 for b in all_active)

    # Customers
    distinct_customers = db.query(func.count(func.distinct(Booking.customer_email))).scalar() or 0
    pending_payments = base_booking_q.filter(Booking.payment_status.in_(["Pending", "Partial"])).count()
    cancellations = base_booking_q.filter(Booking.status == "Cancelled").count()

    # Time series (last 7 days)
    revenue_trend = []
    today = datetime.now()
    for i in range(6, -1, -1):
        d = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        day_bookings = base_booking_q.filter(Booking.date == d).all()
        day_rev = sum(b.advance_paid or 0 for b in day_bookings if b.status != "Cancelled")
        day_label = (today - timedelta(days=i)).strftime("%a")
        revenue_trend.append({
            "date": d,
            "day": day_label,
            "revenue": day_rev,
            "appointments": len(day_bookings)
        })

    # Service Popularity
    services = db.query(Service).all()
    svc_map = {s.id: s.name for s in services}
    svc_counts = {}
    for b in all_active:
        svc_counts[b.service_name] = svc_counts.get(b.service_name, 0) + 1
    
    popularity = [{"name": name, "count": count} for name, count in sorted(svc_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

    return {
        "kpis": {
            "todayAppointments": today_appointments,
            "todayRevenue": today_revenue,
            "totalRevenue": total_revenue,
            "totalAppointments": total_appointments,
            "totalCustomers": distinct_customers,
            "pendingPayments": pending_payments,
            "cancellations": cancellations,
            "cancellationRate": round((cancellations / max(total_appointments, 1)) * 100, 1)
        },
        "revenueTrend": revenue_trend,
        "servicePopularity": popularity
    }

@app.get("/api/crm/customers", tags=["CRM"])
def get_crm_customers(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    # Group bookings by customer_email
    bookings = db.query(Booking).all()
    customers_map: Dict[str, Dict[str, Any]] = {}

    for b in bookings:
        email = b.customer_email.lower().strip()
        if email not in customers_map:
            customers_map[email] = {
                "email": email,
                "name": b.customer_name,
                "phone": b.customer_phone,
                "visits": 0,
                "totalSpend": 0,
                "lastVisit": b.date,
                "preferredService": b.service_name,
                "tags": [],
                "notesCount": 0
            }
        
        c = customers_map[email]
        c["visits"] += 1
        c["totalSpend"] += (b.advance_paid or 0)
        if b.date > c["lastVisit"]:
            c["lastVisit"] = b.date
            c["preferredService"] = b.service_name

    # Load tags
    all_tags = db.query(CustomerTag).all()
    for t in all_tags:
        em = t.customer_email.lower().strip()
        if em in customers_map and t.tag not in customers_map[em]["tags"]:
            customers_map[em]["tags"].append(t.tag)

    customer_list = list(customers_map.values())

    # Filter search
    if search and search.strip():
        term = search.lower().strip()
        customer_list = [
            c for c in customer_list
            if term in c["name"].lower() or term in c["email"] or term in (c["phone"] or "")
        ]

    if tag and tag.strip():
        customer_list = [c for c in customer_list if tag.strip() in c["tags"]]

    return customer_list

@app.get("/api/crm/customers/{customer_email}", tags=["CRM"])
def get_customer_360(
    customer_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    email = customer_email.lower().strip()
    bookings = db.query(Booking).filter(
        func.lower(Booking.customer_email) == email
    ).order_by(Booking.created_at.desc()).all()

    if not bookings:
        # Check if user exists
        u = db.query(User).filter(func.lower(User.email) == email).first()
        if not u:
            raise HTTPException(status_code=404, detail="Customer not found")
        cust_name = u.name
        cust_phone = u.phone or ""
    else:
        cust_name = bookings[0].customer_name
        cust_phone = bookings[0].customer_phone

    tags = [t.tag for t in db.query(CustomerTag).filter(func.lower(CustomerTag.customer_email) == email).all()]
    notes = db.query(CustomerNote).filter(
        func.lower(CustomerNote.customer_email) == email
    ).order_by(CustomerNote.created_at.desc()).all()

    total_spend = sum(b.advance_paid or 0 for b in bookings)

    return {
        "email": email,
        "name": cust_name,
        "phone": cust_phone,
        "stats": {
            "totalVisits": len(bookings),
            "totalSpend": total_spend,
            "lastVisit": bookings[0].date if bookings else None,
            "status": "VIP" if total_spend > 1500 or len(bookings) > 3 else "Regular"
        },
        "tags": tags,
        "notes": [{"id": n.id, "author": n.author_name, "note": n.note, "date": n.created_at.isoformat()} for n in notes],
        "appointments": [
            {
                "id": b.id,
                "date": b.date,
                "time": b.time_slot,
                "service": b.service_name,
                "amount": b.total_amount or b.service_price,
                "advancePaid": b.advance_paid,
                "status": b.status,
                "paymentStatus": b.payment_status
            } for b in bookings
        ]
    }

@app.post("/api/crm/customers/{customer_email}/notes", tags=["CRM"])
def add_customer_note(
    customer_email: str,
    req: CustomerNoteCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    note = CustomerNote(
        customer_email=customer_email.lower().strip(),
        author_name=current_user.name,
        note=req.note.strip(),
        created_at=datetime.now(timezone.utc)
    )
    db.add(note)
    db.commit()
    return {"message": "Note added successfully", "noteId": note.id}

@app.post("/api/crm/customers/{customer_email}/tags", tags=["CRM"])
def add_customer_tag(
    customer_email: str,
    req: CustomerTagCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    existing = db.query(CustomerTag).filter(
        func.lower(CustomerTag.customer_email) == customer_email.lower().strip(),
        CustomerTag.tag == req.tag.strip()
    ).first()
    if not existing:
        new_tag = CustomerTag(customer_email=customer_email.lower().strip(), tag=req.tag.strip())
        db.add(new_tag)
        db.commit()
    return {"message": "Tag added"}

@app.delete("/api/crm/customers/{customer_email}/tags/{tag_name}", tags=["CRM"])
def remove_customer_tag(
    customer_email: str,
    tag_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    tag = db.query(CustomerTag).filter(
        func.lower(CustomerTag.customer_email) == customer_email.lower().strip(),
        CustomerTag.tag == tag_name.strip()
    ).first()
    if tag:
        db.delete(tag)
        db.commit()
    return {"message": "Tag removed"}

@app.get("/api/crm/appointments", tags=["CRM"])
def get_crm_appointments(
    date: Optional[str] = None,
    branch_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    query = db.query(Booking).order_by(Booking.date.desc(), Booking.time_slot.asc())

    # Branch filtering
    if branch_id and branch_id != "all":
        query = query.filter(Booking.branch_id == branch_id)

    if date:
        query = query.filter(Booking.date == date)

    if status_filter and status_filter != "all":
        query = query.filter(func.lower(Booking.status) == status_filter.lower())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Booking.customer_name.ilike(term),
                Booking.customer_phone.ilike(term),
                Booking.customer_email.ilike(term),
                Booking.id.ilike(term)
            )
        )

    bookings = query.all()
    branches = {b.id: b.name for b in db.query(Branch).all()}
    staff_members = {s.id: s.name for s in db.query(Staff).all()}

    results = []
    for b in bookings:
        results.append({
            "id": b.id,
            "bookingId": b.id,
            "customerName": b.customer_name,
            "customerPhone": b.customer_phone,
            "customerEmail": b.customer_email,
            "serviceName": b.service_name,
            "branchId": b.branch_id,
            "branchName": branches.get(b.branch_id, "SmartSalon Branch"),
            "staffId": b.staff_id,
            "staffName": staff_members.get(b.staff_id, "Unassigned"),
            "date": b.date,
            "timeSlot": b.time_slot,
            "totalAmount": b.total_amount or b.service_price,
            "advancePaid": b.advance_paid or 0,
            "balanceDue": b.balance_due or 0,
            "status": b.status,
            "paymentStatus": b.payment_status or "Pending",
            "bookingType": b.booking_type or "walk_in",
            "notes": b.notes
        })
    return results

@app.patch("/api/crm/appointments/{booking_id}/status", tags=["CRM"])
def update_appointment_status(
    booking_id: str,
    req: AppointmentStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = req.status
    if req.payment_status:
        booking.payment_status = req.payment_status
    db.commit()
    return {"message": "Status updated successfully", "status": booking.status, "paymentStatus": booking.payment_status}

@app.get("/api/crm/staff", response_model=List[StaffResponse], tags=["CRM"])
def get_crm_staff(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    return db.query(Staff).all()

@app.post("/api/crm/staff", response_model=StaffResponse, tags=["CRM"])
def create_crm_staff(
    req: StaffCreateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    new_staff = Staff(
        id=f"st-{uuid.uuid4().hex[:6]}",
        name=req.name,
        phone=req.phone,
        email=req.email,
        role=req.role,
        branch_id=req.branch_id,
        specialization=req.specialization or "All-Round Stylist",
        working_hours=req.working_hours or "09:00 AM - 08:00 PM",
        status=req.status or "Available"
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@app.get("/api/crm/payments", tags=["CRM"])
def get_crm_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    bookings_map = {b.id: b for b in db.query(Booking).all()}
    
    results = []
    for p in payments:
        b = bookings_map.get(p.booking_id)
        results.append({
            "id": p.id,
            "bookingId": p.booking_id,
            "orderId": p.order_id,
            "paymentId": p.payment_id,
            "amount": p.amount,
            "method": p.method,
            "status": p.status,
            "customerName": b.customer_name if b else "Walk-in Guest",
            "date": p.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return results

@app.get("/api/crm/reports", tags=["CRM"])
def get_crm_reports(
    period: Optional[str] = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    bookings = db.query(Booking).filter(Booking.status != "Cancelled").all()
    total_rev = sum(b.advance_paid or 0 for b in bookings)
    total_bookings = len(bookings)
    avg_booking_val = round(total_rev / max(total_bookings, 1), 2)

    # Customer return rate
    cust_counts = {}
    for b in bookings:
        cust_counts[b.customer_email] = cust_counts.get(b.customer_email, 0) + 1
    
    repeat_customers = sum(1 for c in cust_counts.values() if c > 1)
    repeat_rate = round((repeat_customers / max(len(cust_counts), 1)) * 100, 1)

    return {
        "period": period,
        "totalRevenue": total_rev,
        "totalBookings": total_bookings,
        "averageBookingValue": avg_booking_val,
        "repeatCustomerRate": repeat_rate,
        "newCustomers": len(cust_counts) - repeat_customers,
        "returningCustomers": repeat_customers
    }

# ==================== DEPRECATED MANAGER & STAFF ROUTES ====================

@app.api_route("/api/manager/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], tags=["Deprecated"])
@app.api_route("/api/staff/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], tags=["Deprecated"])
def deprecated_manager_staff_routes(path: str):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Manager and Staff APIs are deprecated and forbidden."
    )

# ==================== CHATBOT ====================

@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_with_assistant(
    chat_in: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Intelligent chatbot endpoint with:
    - Intent Router (SALON_KNOWLEDGE, CRM_QUERY, OFF_TOPIC)
    - RAG Pipeline over ChromaDB + Ollama llama3.2:3b
    - Authorized SQLite CRM Query Path (customer bookings, admin stats)
    - Grounding Rule: 'I don't know because this information is not available in the current SmartSalon knowledge base.'
    - Off-Topic Rule: 'I'm here to help with SmartSalon-related questions.'
    Preserves exact {answer: str} contract for frontend.
    """
    raw_query = chat_in.message.strip() if chat_in.message else ""
    if not raw_query:
        return {"answer": "Please enter a question regarding SmartSalon services, branches, or bookings."}

    # 1. Classify query intent
    classification = classify_intent(raw_query)
    intent = classification["intent"]
    subtype = classification.get("subtype", "")

    # 2. Off-Topic Fixed Refusal
    if intent == "OFF_TOPIC":
        return {"answer": OFF_TOPIC_REFUSAL}

    # 3. Controlled, Role-Checked CRM Query Path
    if intent == "CRM_QUERY":
        ans = execute_authorized_crm_query(raw_query, subtype, current_user, db)
        return {"answer": ans}

    # 4. Salon Knowledge Path via RAG
    if intent == "SALON_KNOWLEDGE":
        if subtype == "greeting":
            return {"answer": "Greetings! I am your SmartSalon AI Stylist. How may I assist your grooming ritual or branch booking today?"}

        # ChromaDB + Ollama Grounded RAG Pipeline over Master Cutts Knowledge Document
        rag_ans = await handle_rag_pipeline(raw_query)
        if rag_ans != GROUNDING_REFUSAL:
            return {"answer": rag_ans}

        # Check core operational salon facts (opening hours, location, contact, can book)
        fast_ans = resolve_verified_salon_query(raw_query)
        if fast_ans:
            return {"answer": fast_ans}

        return {"answer": GROUNDING_REFUSAL}

    return {"answer": OFF_TOPIC_REFUSAL}


