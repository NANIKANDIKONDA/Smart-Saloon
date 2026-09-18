import logging
import re
import httpx
from typing import Optional, Dict, Any

from .config import settings
from .data import (
    SALON_INFO,
    SERVICES_SEED,
    VERIFIED_SERVICE_ALIASES,
    SERVICES_OVERVIEW_ANSWER,
    CHATBOT_FALLBACK_ANSWER,
)

logger = logging.getLogger(__name__)

# Build context document for local LLM
SALON_CONTEXT = f"""
Salon Name: {SALON_INFO['name']}
Tagline: {SALON_INFO['tagline']}
Address: {SALON_INFO['address']}
City/State: {SALON_INFO['city']}, {SALON_INFO['state']}
Phone: {SALON_INFO['phone']}
Email: {SALON_INFO['email']}
Operating Hours: {SALON_INFO['hoursDisplay']}
Schedule: Monday to Saturday: 10:00 AM – 8:00 PM. Sunday: Closed.

Verified Services Catalog (Prices in Indian Rupees ₹):
""" + "\n".join([
    f"- {s['name']} ({s['category']}): ₹{s['price']}, Duration: {s['duration']} mins. {s['description']}"
    for s in SERVICES_SEED
])

SYSTEM_PROMPT = f"""You are the friendly, helpful AI virtual assistant for {SALON_INFO['name']} in Kakinada, Andhra Pradesh.

STRICT CLOSED-KNOWLEDGE POLICY:
1. Answer customer questions accurately and concisely using ONLY the verified salon facts below.
2. All pricing is in Indian Rupees (₹).
3. NEVER use outside general knowledge or training data to assume or guess salon facts.
4. NEVER return the general service list unless the customer explicitly asks for an overview of all services (e.g. "what services do you offer").
5. If the user asks about a service, facility, amenity, or person NOT in the verified salon data below, you MUST reply:
"I don't know whether SmartSalon provides [service] because this information is not available in our current salon data." (or for facilities: "I don't know whether SmartSalon has [facility]...", or for people: "I don't know who the [person] of SmartSalon is...").
6. Keep answers concise (1 to 2 sentences) and strictly factual.

VERIFIED SALON FACTS:
{SALON_CONTEXT}
"""

async def check_ollama_health() -> dict:
    """Checks if Ollama is accessible and whether the configured model is available."""
    url = f"{settings.OLLAMA_BASE_URL}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                model_loaded = any(settings.OLLAMA_MODEL in m for m in models)
                return {
                    "connected": True,
                    "model_configured": settings.OLLAMA_MODEL,
                    "model_available": model_loaded,
                    "available_models": models
                }
            return {
                "connected": False,
                "error": f"Ollama HTTP {resp.status_code}",
                "model_configured": settings.OLLAMA_MODEL
            }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "model_configured": settings.OLLAMA_MODEL
        }

# ==================== INTENT & RELEVANCE DETECTION ====================

def is_general_services_overview(query: str) -> bool:
    """
    Returns True ONLY when the user asks a broad, menu-level question
    about what services/treatments are offered in general.
    """
    q = query.lower().strip()
    q_clean = re.sub(r'[?!.,]', '', q).strip()

    overview_patterns = [
        "what services do you offer",
        "what services do you provide",
        "what services do you have",
        "what are your services",
        "what are the services",
        "what services are available",
        "list your services",
        "list of services",
        "show services",
        "show me your services",
        "show service menu",
        "service menu",
        "services menu",
        "what treatments do you offer",
        "what treatments do you have",
        "what treatments are available",
        "what can i book",
        "what can we book",
        "what do you offer",
        "what do you provide",
        "tell me your services",
        "all services",
    ]

    for p in overview_patterns:
        if q_clean == p or q_clean.startswith(p + " ") or q_clean.endswith(" " + p):
            # Guard against specific nouns appended (e.g. "what services do you offer for tattoo")
            if len(q_clean) <= len(p) + 8:
                return True

    return False

def find_matched_verified_service(query: str) -> Optional[Dict[str, Any]]:
    """
    Finds if a verified salon service is mentioned in the query.
    Uses regex word boundaries to prevent substring collision.
    """
    q_lower = query.lower()
    best_match = None
    best_len = 0

    for s in VERIFIED_SERVICE_ALIASES:
        for alias in s["aliases"]:
            pattern = r'\b' + re.escape(alias) + r'\b'
            if re.search(pattern, q_lower):
                if len(alias) > best_len:
                    best_len = len(alias)
                    best_match = s

    return best_match

def extract_unknown_concept(query: str) -> str:
    """Extracts the subject of inquiry from an unknown question."""
    clean = query.strip()
    clean = re.sub(r'[?!.]+$', '', clean).strip()

    # Pattern 1: Do you provide / offer / do / have [X]
    m_action = re.search(r'(?:do\s+you\s+(?:provide|offer|do|have)|is\s+there\s+(?:a\s+|an\s+)?)\s+(.+)', clean, re.IGNORECASE)
    if m_action:
        target = m_action.group(1).strip()
        target = re.sub(r'\s+(?:here|at\s+your\s+salon|in\s+your\s+salon|please)$', '', target, flags=re.IGNORECASE)
        return target

    # Pattern 2: Who is the [X]
    m_who = re.search(r'who\s+(?:is|are)\s+(?:the\s+)?(.+)', clean, re.IGNORECASE)
    if m_who:
        target = m_who.group(1).strip()
        target = re.sub(r'\s+(?:here|at\s+your\s+salon|in\s+your\s+salon|please)$', '', target, flags=re.IGNORECASE)
        return target

    # Pattern 3: Can I get / book [X]
    m_can = re.search(r'can\s+(?:i|we)\s+(?:get|book)\s+(?:a\s+|an\s+)?(.+)', clean, re.IGNORECASE)
    if m_can:
        target = m_can.group(1).strip()
        target = re.sub(r'\s+(?:here|at\s+your\s+salon|in\s+your\s+salon|please)$', '', target, flags=re.IGNORECASE)
        return target

    # Pattern 4: How much is/does [X] cost / price of [X]
    m_cost = re.search(r'(?:how\s+much\s+(?:is|does)|what\s+is\s+the\s+price\s+of)\s+(?:a\s+|an\s+)?(.+?)(?:\s+cost)?$', clean, re.IGNORECASE)
    if m_cost:
        target = m_cost.group(1).strip()
        target = re.sub(r'\s+(?:here|at\s+your\s+salon|in\s+your\s+salon|please)$', '', target, flags=re.IGNORECASE)
        return target

    return clean

def build_tailored_unknown_response(query: str) -> str:
    """
    Builds the required tailored fallback answer:
    'I don't know whether SmartSalon provides [X] because this information is not available in our current salon data.'
    """
    subject = extract_unknown_concept(query).strip()
    q_lower = query.lower()

    if re.search(r'\bwho\b', q_lower):
        clean_subj = re.sub(r'^(?:the\s+)', '', subject, flags=re.IGNORECASE)
        return f"I don't know who the {clean_subj} of SmartSalon is because this information is not available in our current salon data."

    if re.search(r'\b(?:have|has|is\s+there)\b', q_lower):
        clean_subj = subject
        uncountable = {"wifi", "wi-fi", "parking", "valet parking", "ac", "air conditioning", "internet", "beverages", "refreshments"}
        if clean_subj.lower() in uncountable:
            return f"I don't know whether SmartSalon has {clean_subj} because this information is not available in our current salon data."
        if clean_subj.lower().startswith("a "):
            clean_subj = clean_subj[2:]
        elif clean_subj.lower().startswith("an "):
            clean_subj = clean_subj[3:]
        return f"I don't know whether SmartSalon has a {clean_subj} because this information is not available in our current salon data."

    # Default for services / treatments / general unknown items
    clean_subj = subject
    if clean_subj.lower().startswith("a "):
        clean_subj = clean_subj[2:]
    elif clean_subj.lower().startswith("an "):
        clean_subj = clean_subj[3:]

    return f"I don't know whether SmartSalon provides {clean_subj} because this information is not available in our current salon data."

def resolve_verified_salon_query(query: str) -> Optional[str]:
    """
    Resolves the query against verified SmartSalon facts if supported.
    Returns None if the query asks about something not in verified data.
    """
    # 1. Services overview (full menu)
    if is_general_services_overview(query):
        return SERVICES_OVERVIEW_ANSWER

    q_lower = query.lower()

    # 2. Specific verified service
    svc = find_matched_verified_service(query)
    if svc:
        is_duration = any(k in q_lower for k in ["how long", "duration", "time take", "minutes", "hours take"])
        is_price = any(k in q_lower for k in ["how much", "cost", "price", "charge", "rate", "fee"])
        is_booking = any(k in q_lower for k in ["can i book", "how to book", "book a", "booking", "schedule", "appointment"])

        if is_duration and not is_price:
            return f"A {svc['name']} takes approximately {svc['duration']} minutes and costs ₹{svc['price']}."
        elif is_price and not is_duration:
            return f"A {svc['name']} costs ₹{svc['price']} and takes approximately {svc['duration']} minutes."
        elif is_booking:
            return f"Yes, you can book a {svc['name']} (₹{svc['price']}, {svc['duration']} mins) online anytime through our Booking page."
        else:
            return f"A {svc['name']} costs ₹{svc['price']} and takes approximately {svc['duration']} minutes."

    # 3. Operating hours & Sunday check
    is_hours = any(k in q_lower for k in ["hour", "hours", "timing", "timings", "what time", "open", "close", "closed", "closing", "opening", "schedule", "sunday", "weekend"])
    if is_hours:
        # Ensure not asking about unknown service/facility hours
        if not any(k in q_lower for k in ["tattoo", "laser", "swimming", "pool", "owner"]):
            if "sunday" in q_lower:
                return "The salon is closed on Sunday. We are open Monday to Saturday from 10:00 AM to 8:00 PM."
            return "SmartSalon is open Monday to Saturday from 10:00 AM to 8:00 PM. The salon is closed on Sunday."

    # 4. Location / Address check
    is_location = any(k in q_lower for k in ["location", "located", "where", "address", "situated", "kakinada", "place", "directions", "reach"])
    if is_location:
        if not any(k in q_lower for k in ["tattoo", "laser", "swimming", "pool", "owner"]):
            return "SmartSalon is located on Main Road, Near Bhanugudi Junction, Kakinada, Andhra Pradesh - 533003."

    # 5. Contact info check
    is_contact = any(k in q_lower for k in ["phone", "contact", "call", "email", "phone number", "contact number"])
    if is_contact:
        if not any(k in q_lower for k in ["tattoo", "laser", "swimming", "pool", "owner"]):
            return "You can contact SmartSalon at +91 884 234 5678 or by email at appointments@smartsalon.in."

    # 6. General booking process inquiry (without unknown service)
    is_gen_booking = any(k in q_lower for k in ["how do i book", "how to book", "book an appointment", "schedule an appointment"])
    if is_gen_booking:
        if not any(k in q_lower for k in ["tattoo", "laser", "swimming", "pool", "owner"]):
            return "You can book an appointment online anytime through our Booking page. Simply select your service, date, time slot, and details."

    # No relevant verified salon data found for this query
    return None

# ==================== MAIN CHAT GENERATION ====================

async def generate_chat_response(message: str) -> str:
    """
    Generates a response adhering strictly to the Closed-Knowledge Policy.
    Step 4 safety check: If no relevant verified data is found, returns the tailored
    'I don't know...' message directly without calling the LLM.
    """
    if not message or not message.strip():
        return CHATBOT_FALLBACK_ANSWER

    clean_message = message.strip()

    # Step 2 & 4: Server-side safety check independent of LLM
    verified_answer = resolve_verified_salon_query(clean_message)
    if verified_answer is None:
        # Unknown concept / service / facility not in SmartSalon data!
        # Return tailored "I don't know..." directly without calling LLM.
        return build_tailored_unknown_response(clean_message)

    # For queries supported by verified data:
    # We can try local Ollama to formulate a natural response, or return verified answer directly.
    # To prevent any accidental hallucinations or service dumps:
    url = f"{settings.OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": f"{SYSTEM_PROMPT}\n\nCustomer: {clean_message}\nAssistant:",
        "stream": False,
        "options": {
            "temperature": 0.1,
            "top_p": 0.9,
            "max_tokens": 120
        }
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                llm_ans = data.get("response", "").strip()
                if llm_ans:
                    # Validate that LLM didn't dump services when not asked
                    if not is_general_services_overview(clean_message) and any(w in llm_ans.lower() for w in ["we offer precision haircuts", "services catalog", "bridal packages"]):
                        return verified_answer
                    return llm_ans
    except Exception as e:
        logger.debug(f"Ollama inference ({e}); serving verified response directly.")

    # Return verified answer directly
    return verified_answer
