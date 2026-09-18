"""
SmartSalon Controlled CRM Query Service
Provides read-only, role-enforced access to SQLite data for the chatbot.
The LLM NEVER generates or executes SQL.
FastAPI dependencies verify the identity and role of current_user before calling these functions.
"""

import logging
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .models import User, Booking, Branch, Payment

logger = logging.getLogger("smartsalon.crm_query")


def execute_authorized_crm_query(query: str, subtype: str, current_user: Optional[User], db: Session) -> str:
    """
    Executes controlled, read-only CRM queries based on the caller's role.
    Denies unauthorized access strictly without data leakage.
    """
    if subtype == "admin_metrics":
        return get_admin_metrics(current_user, db)
    elif subtype == "my_bookings":
        return get_customer_bookings(current_user, db)
    else:
        # Default safety fallback
        return "I can assist you with your personal bookings or salon information."


def get_admin_metrics(current_user: Optional[User], db: Session) -> str:
    """
    Returns aggregate salon business metrics.
    Restricted strictly to users with the 'admin' role.
    """
    if not current_user:
        return "Access denied: Please log in with an administrator account to view salon business metrics."

    if current_user.role != "admin":
        return "Access denied: You do not have administrator permissions to view salon business metrics."

    try:
        all_bookings = db.query(Booking).all()
        total_bookings = len(all_bookings)
        active_bookings = sum(1 for b in all_bookings if b.status in ["Confirmed", "Booked", "Checked-in", "In Service"])
        completed_bookings = sum(1 for b in all_bookings if b.status == "Completed")
        cancelled_bookings = sum(1 for b in all_bookings if b.status == "Cancelled")
        total_revenue = sum(b.advance_paid or 0 for b in all_bookings if b.status != "Cancelled")
        registered_customers = db.query(User).filter(User.role == "customer").count()

        return (
            f"SmartSalon Administrator Live Metrics:\n"
            f"• Total Bookings: {total_bookings} ({active_bookings} active, {completed_bookings} completed, {cancelled_bookings} cancelled)\n"
            f"• Advance Revenue Collected: ₹{total_revenue}\n"
            f"• Registered Customers: {registered_customers}\n"
            f"All metrics are verified from the live SQLite database."
        )
    except Exception as e:
        logger.error("Error retrieving admin metrics: %s", e)
        return "An error occurred while retrieving salon metrics from the database."


def get_customer_bookings(current_user: Optional[User], db: Session) -> str:
    """
    Returns the authenticated customer's own appointment records.
    Requires authentication.
    """
    if not current_user:
        return "Please log in to view your bookings and appointment details."

    try:
        bookings = db.query(Booking).filter(
            or_(
                Booking.customer_email == current_user.email,
                Booking.customer_id == current_user.id
            )
        ).order_by(Booking.created_at.desc()).limit(5).all()

        if not bookings:
            return f"Hi {current_user.name}, you do not have any appointment records in SmartSalon right now. You can book an appointment anytime from our Booking page."

        lines = [f"Hi {current_user.name}, here are your appointments:"]
        for b in bookings:
            lines.append(
                f"• Booking {b.id}: {b.service_name} on {b.date} at {b.time_slot} "
                f"(Status: {b.status}, Advance Paid: ₹{b.advance_paid or 99})"
            )
        lines.append("Need to reschedule or cancel? You can manage your appointments in your Customer Profile.")
        return "\n".join(lines)
    except Exception as e:
        logger.error("Error retrieving customer bookings: %s", e)
        return "An error occurred while retrieving your bookings from the database."
