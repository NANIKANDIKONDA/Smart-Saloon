"""
SmartSalon Chatbot Intent Router
Classifies incoming questions into:
- SALON_KNOWLEDGE: services, prices, duration, branches, timings, booking info, policies, packages, etc.
- CRM_QUERY: customer own bookings or admin aggregate business metrics.
- OFF_TOPIC: queries unrelated to SmartSalon grooming, services, or operations.
"""

import re
from typing import Dict, Any

# Off-topic fixed refusal message per Milestone 5 specification
OFF_TOPIC_REFUSAL = "I'm here to help with SmartSalon-related questions."

# Grounding refusal message per Milestone 3 specification
GROUNDING_REFUSAL = "I don't know because this information is not available in the current SmartSalon knowledge base."

# Keywords and patterns for CRM queries
CRM_MY_BOOKINGS_PATTERNS = [
    r"\bmy\s+booking",
    r"\bmy\s+appointment",
    r"\bmy\s+reservation",
    r"\bwhen\s+is\s+my\b",
    r"\bdo\s+i\s+have\s+(?:any\s+)?booking",
    r"\bcheck\s+my\s+booking",
    r"\bshow\s+my\s+booking",
    r"\blist\s+my\s+booking",
    r"\bview\s+my\s+booking",
    r"\bstatus\s+of\s+my\b",
    r"\bdid\s+my\s+booking\s+go\s+through\b",
    r"\bbooking\s+status\b",
    r"\bss-202[0-9]-[0-9a-z]+\b",
]

CRM_ADMIN_METRICS_PATTERNS = [
    r"\btotal\s+revenue\b",
    r"\bhow\s+much\s+revenue\b",
    r"\btotal\s+bookings\b",
    r"\bhow\s+many\s+bookings\b",
    r"\bhow\s+many\s+appointments\b",
    r"\bsalon\s+statistic",
    r"\bbusiness\s+metric",
    r"\brepeat\s+customer\s+rate\b",
    r"\baverage\s+booking\s+value\b",
    r"\bsales\s+report\b",
    r"\brevenue\s+today\b",
    r"\bappointments\s+today\b",
]

# Keywords that indicate salon/grooming/SmartSalon relevance
SALON_KNOWLEDGE_KEYWORDS = [
    "hair", "haircut", "cut", "trim", "shave", "beard", "moustache", "styling", "wash",
    "shampoo", "blow dry", "combo", "colour", "color", "touch-up", "touch up", "highlights",
    "spa", "dandruff", "repair", "keratin", "smoothening", "straightening", "facial", "skin",
    "cleanup", "clean-up", "de-tan", "detan", "oil-control", "acne", "charcoal", "anti-ageing",
    "scrub", "bleach", "grooming", "eyebrow", "cheek", "neck", "ear", "nose", "wax", "waxing",
    "massage", "pedicure", "manicure", "package", "membership", "consultation", "price", "cost",
    "charge", "fee", "rate", "timing", "time", "hour", "hours", "open", "close", "closed",
    "opening", "closing", "schedule", "sunday", "branch", "branches", "location", "located", "where", "address",
    "kakinada", "phone", "contact", "email", "book", "booking", "appointment", "reserve",
    "policy", "cancel", "reschedule", "advance", "token", "master cutts", "smartsalon",
    "service", "services", "menu", "offer", "provide", "treatment", "treatments",
    "tattoo", "laser", "swimming", "pool", "owner", "wifi", "parking", "valet",
    "situated", "directions", "reach", "who", "place"
]

# Obvious off-topic indicator topics
OFF_TOPIC_PATTERNS = [
    r"\bpython\b", r"\bjavascript\b", r"\bcode\b", r"\bprogramming\b", r"\bfunction\b",
    r"\bpresident\b", r"\bprime\s+minister\b", r"\bfootball\b", r"\bcricket\b", r"\bworld\s+cup\b",
    r"\bmovie\b", r"\bweather\b", r"\bcapital\s+of\b", r"\bmath\b", r"\bphysics\b", r"\bchemistry\b",
    r"\bhistory\s+of\b", r"\bwho\s+won\b", r"\brecipe\b", r"\bcooking\b", r"\bpolitics\b",
    r"\bbitcoin\b", r"\bcrypto\b", r"\belection\b", r"\bgpt\b", r"\bai\s+model\b"
]


def classify_intent(query: str) -> Dict[str, Any]:
    """
    Classifies the user's query into:
    - CRM_QUERY (type: 'my_bookings' or 'admin_metrics')
    - SALON_KNOWLEDGE
    - OFF_TOPIC
    """
    if not query or not query.strip():
        return {
            "intent": "SALON_KNOWLEDGE",
            "subtype": "empty",
            "query": ""
        }

    q = query.strip()
    q_lower = q.lower()

    # 1. Check CRM Admin Metrics
    for pat in CRM_ADMIN_METRICS_PATTERNS:
        if re.search(pat, q_lower):
            return {
                "intent": "CRM_QUERY",
                "subtype": "admin_metrics",
                "query": q
            }

    # 2. Check CRM Customer My Bookings
    for pat in CRM_MY_BOOKINGS_PATTERNS:
        if re.search(pat, q_lower):
            return {
                "intent": "CRM_QUERY",
                "subtype": "my_bookings",
                "query": q
            }

    # 3. Check Off-Topic Patterns
    for pat in OFF_TOPIC_PATTERNS:
        if re.search(pat, q_lower):
            # Guard: ensure they aren't asking about salon grooming while mentioning a word
            has_salon_topic = any(kw in q_lower for kw in ["haircut", "salon", "smartsalon", "shave", "facial", "branch"])
            if not has_salon_topic:
                return {
                    "intent": "OFF_TOPIC",
                    "subtype": "unrelated",
                    "query": q
                }

    # 4. Check Salon Knowledge Keywords / Phrases
    has_salon_keyword = any(kw in q_lower for kw in SALON_KNOWLEDGE_KEYWORDS)
    if has_salon_keyword:
        return {
            "intent": "SALON_KNOWLEDGE",
            "subtype": "salon_facts",
            "query": q
        }

    # 5. Greeting / conversational checks for salon assistant
    greetings = ["hi", "hello", "hey", "good morning", "good evening", "greetings", "help", "who are you"]
    if any(q_lower == g or q_lower.startswith(g + " ") for g in greetings):
        return {
            "intent": "SALON_KNOWLEDGE",
            "subtype": "greeting",
            "query": q
        }

    # 6. Fallback: If completely unrecognized and not salon-related, mark OFF_TOPIC
    return {
        "intent": "OFF_TOPIC",
        "subtype": "unrelated",
        "query": q
    }
