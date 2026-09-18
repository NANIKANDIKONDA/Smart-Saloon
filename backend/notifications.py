"""
SmartSalon Notification Dispatcher
Complies with Appendix A notification message templates and dev-mode terminal logging.
Never prints passwords, API keys, or unmasked sensitive data.
"""

import os
import sys
import logging
import httpx
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Ensure root .env is loaded
root_env = Path(__file__).resolve().parent.parent / ".env"
if root_env.exists():
    load_dotenv(root_env)
else:
    load_dotenv()

logger = logging.getLogger("smartsalon.notifications")

def get_env_credentials():
    return {
        "FAST2SMS_API_KEY": os.getenv("FAST2SMS_API_KEY"),
        "TWILIO_ACCOUNT_SID": os.getenv("TWILIO_ACCOUNT_SID"),
        "TWILIO_AUTH_TOKEN": os.getenv("TWILIO_AUTH_TOKEN"),
        "TWILIO_PHONE_NUMBER": os.getenv("TWILIO_PHONE_NUMBER"),
        "GUPSHUP_API_KEY": os.getenv("GUPSHUP_API_KEY")
    }

_CACHED_TWILIO_NUMBER = None

def get_or_discover_twilio_number(account_sid: str, auth_token: str, configured_number: Optional[str] = None) -> Optional[str]:
    """Retrieves configured Twilio number or auto-discovers provisioned number from Twilio API."""
    global _CACHED_TWILIO_NUMBER
    if configured_number and configured_number.strip():
        return configured_number.strip()
    if _CACHED_TWILIO_NUMBER:
        return _CACHED_TWILIO_NUMBER

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/IncomingPhoneNumbers.json"
        with httpx.Client(timeout=5) as client:
            r = client.get(url, auth=(account_sid, auth_token))
            if r.status_code == 200:
                nums = r.json().get("incoming_phone_numbers", [])
                if nums and len(nums) > 0:
                    _CACHED_TWILIO_NUMBER = nums[0].get("phone_number")
                    logger.info("Auto-discovered active Twilio phone number: %s", _CACHED_TWILIO_NUMBER)
                    return _CACHED_TWILIO_NUMBER
    except Exception as e:
        logger.warning("Could not auto-fetch Twilio phone number: %s", e)
    return None

def dispatch_live_cellular_sms(phone: str, message: str) -> Dict[str, Any]:
    """
    Sends actual SMS to the customer's real mobile phone via configured provider.
    Supports Fast2SMS (India) and Twilio (Global).
    """
    creds = get_env_credentials()

    # 1. Fast2SMS Provider (India quick SMS)
    if creds["FAST2SMS_API_KEY"]:
        try:
            digits = "".join(c for c in phone if c.isdigit())
            if len(digits) > 10:
                digits = digits[-10:]
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": creds["FAST2SMS_API_KEY"],
                "Content-Type": "application/json"
            }
            payload = {
                "route": "q",
                "message": message,
                "language": "english",
                "flash": 0,
                "numbers": digits
            }
            with httpx.Client(timeout=10) as client:
                r = client.post(url, json=payload, headers=headers)
                data = r.json() if r.status_code == 200 else {}
                if data.get("return") is True:
                    print(f"[LIVE SMS] Successfully dispatched SMS to {mask_phone(phone)} via Fast2SMS", flush=True)
                    return {"success": True, "provider": "Fast2SMS", "phone": mask_phone(phone)}
                else:
                    logger.warning("Fast2SMS dispatch response: %s", r.text)
        except Exception as e:
            logger.error("Fast2SMS dispatch failed: %s", e)

    # 2. Twilio Provider (Global Cellular SMS)
    if creds["TWILIO_ACCOUNT_SID"] and creds["TWILIO_AUTH_TOKEN"]:
        sid = creds["TWILIO_ACCOUNT_SID"].strip()
        token = creds["TWILIO_AUTH_TOKEN"].strip()
        from_number = get_or_discover_twilio_number(sid, token, creds.get("TWILIO_PHONE_NUMBER"))

        if not from_number:
            logger.warning(
                "[TWILIO NOTICE] Account SID and Token are verified, but no Twilio sending phone number is active. "
                "Log in to https://console.twilio.com and click 'Get phone number', then save it to TWILIO_PHONE_NUMBER in .env."
            )
            return {
                "success": False,
                "provider": "Twilio",
                "phone": mask_phone(phone),
                "error": "No Twilio phone number active. Claim one at console.twilio.com ('Get phone number')."
            }

        try:
            clean = "".join(c for c in str(phone) if c.isdigit() or c == "+")
            if clean.startswith("0"):
                clean = clean.lstrip("0")
            if not clean.startswith("+"):
                if len(clean) == 10:
                    clean = f"+91{clean}"
                else:
                    clean = f"+{clean}"

            url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
            with httpx.Client(timeout=10) as client:
                r = client.post(
                    url,
                    data={
                        "From": from_number,
                        "To": clean,
                        "Body": message
                    },
                    auth=(sid, token)
                )
                if r.status_code in [200, 201]:
                    data = r.json()
                    msg_sid = data.get("sid", "")
                    print(f"[LIVE SMS] Successfully dispatched SMS to {mask_phone(phone)} via Twilio (SID: {msg_sid})", flush=True)
                    return {
                        "success": True,
                        "provider": "Twilio",
                        "phone": mask_phone(phone),
                        "sid": msg_sid,
                        "status": data.get("status")
                    }
                else:
                    err_json = {}
                    try:
                        err_json = r.json()
                    except Exception:
                        pass
                    err_msg = err_json.get("message", r.text)
                    err_code = err_json.get("code")
                    logger.warning("[TWILIO SMS ERROR] Status %s (Code %s): %s", r.status_code, err_code, err_msg)
                    return {
                        "success": False,
                        "provider": "Twilio",
                        "phone": mask_phone(phone),
                        "error": err_msg,
                        "code": err_code
                    }
        except Exception as e:
            logger.error("Twilio SMS dispatch exception: %s", e)
            return {
                "success": False,
                "provider": "Twilio",
                "phone": mask_phone(phone),
                "error": str(e)
            }

    return {"success": False, "provider": "none", "note": "No active SMS provider configured in .env"}

def mask_phone(phone: Optional[str]) -> str:
    """Masks phone number ensuring sensitive PII is never printed, e.g. ********10"""
    if not phone:
        return "********00"
    digits = "".join(c for c in str(phone) if c.isdigit())
    if len(digits) <= 2:
        return "********" + (digits if digits else "00")
    return "*" * 8 + digits[-2:]

def format_display_date(date_str: str) -> str:
    """Formats YYYY-MM-DD into display date like '23 September 2026'."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        day = dt.strftime("%d").lstrip("0")
        month_year = dt.strftime("%B %Y")
        return f"{day} {month_year}"
    except Exception:
        return date_str

def format_booking_confirmation_message(
    customer_name: str,
    booking_id: str,
    service_name: str,
    branch_name: str,
    date: str,
    time_slot: str,
    price: Optional[int] = None,
    duration: Optional[int] = None
) -> str:
    display_date = format_display_date(date)
    lines = [
        f"Hi {customer_name}, your SmartSalon appointment is confirmed.",
        f"Booking ID: {booking_id}",
        f"Service: {service_name}",
        f"Branch: {branch_name}",
        f"Date: {display_date}",
        f"Time: {time_slot}"
    ]
    if price is not None:
        lines.append(f"Price: ₹{price}")
    if duration is not None:
        lines.append(f"Duration: {duration} mins")
    lines.append("We look forward to seeing you!")
    return "\n".join(lines)

def format_appointment_reminder_message(
    service_name: str,
    date: str,
    time_slot: str,
    branch_name: str
) -> str:
    display_date = format_display_date(date)
    return (
        "Your SmartSalon appointment is coming up soon.\n"
        f"Service: {service_name}\n"
        f"Date: {display_date}\n"
        f"Time: {time_slot}\n"
        f"Branch: {branch_name}\n"
        "Please arrive on time."
    )

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def log_dev_notification(
    notification_type: str,
    customer_name: str,
    phone: str,
    booking_id: str,
    message: str
):
    """
    Dev-mode terminal log format matching Appendix A exactly:
    ================================================
    SMARTSALON NOTIFICATION
    ================================================
    TYPE: BOOKING_CONFIRMATION
    CUSTOMER: Narendra
    PHONE: ********10
    BOOKING: SS-2026-XXXXX
    MESSAGE:
    Your appointment is confirmed for 11:00 AM.
    ================================================
    """
    masked = mask_phone(phone)
    banner = (
        "\n================================================\n"
        "SMARTSALON NOTIFICATION\n"
        "================================================\n"
        f"TYPE: {notification_type}\n"
        f"CUSTOMER: {customer_name}\n"
        f"PHONE: {masked}\n"
        f"BOOKING: {booking_id}\n"
        "MESSAGE:\n"
        f"{message}\n"
        "================================================\n"
    )
    try:
        print(banner, flush=True)
    except Exception:
        try:
            safe_banner = banner.replace("₹", "Rs. ")
            print(safe_banner, flush=True)
        except Exception:
            try:
                sys.stdout.buffer.write(banner.encode("utf-8", errors="replace"))
                sys.stdout.buffer.flush()
            except Exception:
                pass
    logger.info("Notification logged: %s for %s", notification_type, booking_id)

def generate_mobile_dispatch_urls(phone: str, message: str) -> Dict[str, str]:
    """
    Generates standard deep links for WhatsApp and native Mobile SMS.
    Enables zero-cost, instant client-side delivery to the customer's phone.
    """
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) == 10:
        clean_phone = f"91{digits}"
    elif len(digits) > 10:
        clean_phone = digits
    else:
        clean_phone = digits

    import urllib.parse
    encoded_msg = urllib.parse.quote(message)
    whatsapp_url = f"https://api.whatsapp.com/send?phone={clean_phone}&text={encoded_msg}"
    sms_url = f"sms:{clean_phone}?body={encoded_msg}"

    return {
        "whatsapp_url": whatsapp_url,
        "sms_url": sms_url,
        "clean_phone": clean_phone
    }

def send_booking_confirmation_sms(
    phone: str,
    customer_name: str,
    booking_id: str,
    date: str,
    time_slot: str,
    branch_name: str = "SmartSalon",
    service_name: str = "Precision Haircut & Styling",
    price: Optional[int] = None,
    duration: Optional[int] = None
) -> Dict[str, Any]:
    message = format_booking_confirmation_message(
        customer_name=customer_name,
        booking_id=booking_id,
        service_name=service_name,
        branch_name=branch_name,
        date=date,
        time_slot=time_slot,
        price=price,
        duration=duration
    )
    log_dev_notification(
        notification_type="BOOKING_CONFIRMATION",
        customer_name=customer_name,
        phone=phone,
        booking_id=booking_id,
        message=message
    )

    # Generate mobile direct delivery links
    links = generate_mobile_dispatch_urls(phone, message)

    # Attempt real cellular SMS delivery if provider credentials are set
    live_result = dispatch_live_cellular_sms(phone, message)

    return {
        "success": True,
        "provider": live_result.get("provider", "dev_console"),
        "phone": mask_phone(phone),
        "raw_phone": phone,
        "live_dispatched": live_result.get("success", False),
        "message": message,
        "whatsapp_url": links["whatsapp_url"],
        "sms_url": links["sms_url"]
    }

def send_booking_confirmation_whatsapp(
    phone: str,
    customer_name: str,
    booking_id: str,
    date: str,
    time_slot: str,
    branch_name: str = "SmartSalon",
    service_name: str = "Precision Haircut & Styling",
    price: Optional[int] = None,
    duration: Optional[int] = None
) -> Dict[str, Any]:
    # In dev mode, SMS logger already displays the primary terminal notification banner
    return {"success": True, "provider": "dev_console", "phone": mask_phone(phone)}

def send_appointment_reminder_notification(
    phone: str,
    customer_name: str,
    booking_id: str,
    service_name: str,
    branch_name: str,
    date: str,
    time_slot: str
) -> Dict[str, Any]:
    message = format_appointment_reminder_message(
        service_name=service_name,
        date=date,
        time_slot=time_slot,
        branch_name=branch_name
    )
    log_dev_notification(
        notification_type="APPOINTMENT_REMINDER",
        customer_name=customer_name,
        phone=phone,
        booking_id=booking_id,
        message=message
    )
    links = generate_mobile_dispatch_urls(phone, message)
    live_result = dispatch_live_cellular_sms(phone, message)

    return {
        "success": True,
        "provider": live_result.get("provider", "dev_console"),
        "phone": mask_phone(phone),
        "raw_phone": phone,
        "live_dispatched": live_result.get("success", False),
        "message": message,
        "whatsapp_url": links["whatsapp_url"],
        "sms_url": links["sms_url"],
        "details": live_result
    }

