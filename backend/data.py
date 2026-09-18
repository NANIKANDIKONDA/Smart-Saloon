"""
SmartSalon Verified Data & Knowledge Base
Central source of truth for database seeding, RAG context, and strict closed-knowledge rules.
"""

SALON_INFO = {
    "name": "SmartSalon",
    "brand": "SmartSalon Luxury",
    "tagline": "Your Beauty, Your Time.",
    "subtitle": "Book your salon appointment easily and get instant answers to your questions.",
    "about": "SmartSalon is Kakinada’s premier contemporary beauty and hair styling destination. We combine seasoned styling artistry with seamless digital appointment booking to ensure you look and feel your absolute best.",
    "phone": "+91 884 234 5678",
    "email": "appointments@smartsalon.in",
    "address": "Main Road, Near Bhanugudi Junction, Kakinada, Andhra Pradesh - 533003",
    "city": "Kakinada",
    "state": "Andhra Pradesh",
    "hoursDisplay": "Mon–Sat 10:00 AM – 8:00 PM, Sunday: Closed",
    "advance_booking_fee": 99,
    "schedule": [
        {"days": "Monday – Saturday", "hours": "10:00 AM – 8:00 PM", "isOpen": True},
        {"days": "Sunday", "hours": "Closed", "isOpen": False}
    ]
}

BRANCHES_SEED = [
    {
        "id": "badvel-1",
        "name": "BADVEL-1",
        "code": "BDV-01",
        "address": "Opp: CSI Church, Badvel",
        "city": "Badvel",
        "phone": "+91 91234 56701",
        "status": "Open",
        "opening_time": "10:00 AM",
        "closing_time": "08:00 PM",
        "image": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "badvel-2",
        "name": "BADVEL-2",
        "code": "BDV-02",
        "address": "Mydukur Road, Badvel",
        "city": "Badvel",
        "phone": "+91 91234 56702",
        "status": "Open",
        "opening_time": "10:00 AM",
        "closing_time": "08:00 PM",
        "image": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "kadapa-1",
        "name": "KADAPA-1",
        "code": "KDP-01",
        "address": "Co-opp Colony, Kadapa",
        "city": "Kadapa",
        "phone": "+91 91234 56703",
        "status": "Open",
        "opening_time": "10:00 AM",
        "closing_time": "08:00 PM",
        "image": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "kadapa-2",
        "name": "KADAPA-2",
        "code": "KDP-02",
        "address": "Chinna chowk, Kadapa",
        "city": "Kadapa",
        "phone": "+91 91234 56704",
        "status": "Open",
        "opening_time": "10:00 AM",
        "closing_time": "08:00 PM",
        "image": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "kadapa-3",
        "name": "KADAPA-3",
        "code": "KDP-03",
        "address": "Yerramukkapalli, Kadapa",
        "city": "Kadapa",
        "phone": "+91 91234 56705",
        "status": "Open",
        "opening_time": "10:00 AM",
        "closing_time": "08:00 PM",
        "image": "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "kodur",
        "name": "KODUR",
        "code": "KDR-01",
        "address": "Tirupathi Road, Kodur",
        "city": "Kodur",
        "phone": "+91 91234 56706",
        "status": "Open",
        "opening_time": "10:00 AM",
        "closing_time": "08:00 PM",
        "image": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "kakinada-main",
        "name": "KAKINADA MAIN",
        "code": "KKD-01",
        "address": "Main Road, Near Bhanugudi Junction, Kakinada",
        "city": "Kakinada",
        "phone": "+91 884 234 5678",
        "status": "Open",
        "opening_time": "10:00 AM",
        "closing_time": "08:00 PM",
        "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80"
    }
]

STAFF_SEED = [
    {
        "id": "st-101",
        "name": "Rahul Sharma",
        "phone": "+91 98765 43211",
        "email": "rahul.sharma@smartsalon.in",
        "role": "Barber",
        "branch_id": "badvel-1",
        "specialization": "Master Shaving & Fade Cuts",
        "working_hours": "10:00 AM - 08:00 PM",
        "status": "Available"
    },
    {
        "id": "st-102",
        "name": "Priya Rao",
        "phone": "+91 98765 43212",
        "email": "priya.rao@smartsalon.in",
        "role": "Therapist",
        "branch_id": "badvel-1",
        "specialization": "Skin Rejuvenation & Fruit Facials",
        "working_hours": "10:00 AM - 07:00 PM",
        "status": "Available"
    },
    {
        "id": "st-103",
        "name": "Vikram Verma",
        "phone": "+91 98765 43213",
        "email": "vikram.verma@smartsalon.in",
        "role": "Stylist",
        "branch_id": "kadapa-1",
        "specialization": "Global Hair Color & Keratin",
        "working_hours": "10:00 AM - 08:00 PM",
        "status": "Available"
    },
    {
        "id": "st-104",
        "name": "Sneha Reddy",
        "phone": "+91 98765 43214",
        "email": "sneha.reddy@smartsalon.in",
        "role": "Therapist",
        "branch_id": "kadapa-1",
        "specialization": "Pedicure, Manicure & Body Therapy",
        "working_hours": "10:00 AM - 08:00 PM",
        "status": "Available"
    },
    {
        "id": "st-105",
        "name": "Arjun Das",
        "phone": "+91 98765 43215",
        "email": "arjun.das@smartsalon.in",
        "role": "Stylist",
        "branch_id": "kakinada-main",
        "specialization": "Precision Haircuts & Texture",
        "working_hours": "10:00 AM - 08:00 PM",
        "status": "Available"
    },
    {
        "id": "st-106",
        "name": "Ravi Kumar",
        "phone": "+91 98765 43216",
        "email": "manager@smartsalon.in",
        "role": "Manager",
        "branch_id": "kakinada-main",
        "specialization": "Salon Operations & Concierge",
        "working_hours": "10:00 AM - 08:00 PM",
        "status": "Available"
    },
    {
        "id": "st-107",
        "name": "Meera Kapoor",
        "phone": "+91 98765 43217",
        "email": "meera.kapoor@smartsalon.in",
        "role": "Stylist",
        "branch_id": "badvel-2",
        "specialization": "Creative Color & Blowouts",
        "working_hours": "10:00 AM - 08:00 PM",
        "status": "Available"
    },
    {
        "id": "st-108",
        "name": "Suresh Nair",
        "phone": "+91 98765 43218",
        "email": "suresh.nair@smartsalon.in",
        "role": "Barber",
        "branch_id": "kadapa-2",
        "specialization": "Traditional Shaves & Beard Art",
        "working_hours": "10:00 AM - 08:00 PM",
        "status": "Available"
    },
    {
        "id": "st-109",
        "name": "Ananya Joshi",
        "phone": "+91 98765 43219",
        "email": "ananya.joshi@smartsalon.in",
        "role": "Therapist",
        "branch_id": "kadapa-3",
        "specialization": "Aromatherapy & Facial Aesthetics",
        "working_hours": "10:00 AM - 08:00 PM",
        "status": "Available"
    },
    {
        "id": "st-110",
        "name": "Karthik Raja",
        "phone": "+91 98765 43220",
        "email": "karthik.raja@smartsalon.in",
        "role": "Stylist",
        "branch_id": "kodur",
        "specialization": "Modern Men's & Women's Styling",
        "working_hours": "10:00 AM - 08:00 PM",
        "status": "Available"
    }
]

SERVICES_SEED = [
    {
        "id": "haircut",
        "name": "Precision Haircut & Styling",
        "category": "Hair",
        "price": 500,
        "duration": 45,
        "featured": True,
        "description": "Expert consultation, custom shear cut, wash with botanical shampoo, and blow-dry styling.",
        "image": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "hair-spa",
        "name": "Nourishing Hair Spa",
        "category": "Hair",
        "price": 800,
        "duration": 60,
        "featured": True,
        "description": "Intense deep conditioning scalp therapy, steam rejuvenation, and relaxing head and shoulder massage.",
        "image": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "facial",
        "name": "Glow Rejuvenation Facial",
        "category": "Skin",
        "price": 600,
        "duration": 45,
        "featured": True,
        "description": "Gentle pore cleansing, botanical exfoliation, fruit cream massage, and soothing brightening mask.",
        "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "hair-coloring",
        "name": "Global Hair Coloring & Gloss",
        "category": "Hair",
        "price": 1500,
        "duration": 90,
        "featured": True,
        "description": "Rich, ammonia-free dimensional hair color or root touchup with UV gloss seal for brilliant shine.",
        "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "skin-detox",
        "name": "Deep Cleanse Charcoal Detox",
        "category": "Skin",
        "price": 750,
        "duration": 50,
        "featured": False,
        "description": "Activated charcoal pore purification, steam extraction, tea tree hydration, and skin soothing mist.",
        "image": "https://images.unsplash.com/photo-1512290900672-1f4a9ce34cf0?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "mani-pedi",
        "name": "Deluxe Manicure & Pedicure",
        "category": "Beauty",
        "price": 700,
        "duration": 60,
        "featured": False,
        "description": "Complete nail shaping, cuticle therapy, aromatic foot scrub, hot towel massage, and fresh lacquer.",
        "image": "https://images.unsplash.com/photo-1519014816548-bf7851795289?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "eyebrow-thread",
        "name": "Eyebrow Shaping & Threading",
        "category": "Beauty",
        "price": 150,
        "duration": 20,
        "featured": False,
        "description": "Precise threading for clean arch definition, followed by soothing aloe vera cooling gel.",
        "image": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "bridal-glow-package",
        "name": "Complete Bridal Glow Package",
        "category": "Packages",
        "price": 3500,
        "duration": 150,
        "featured": False,
        "description": "Comprehensive luxury suite: Premium gold facial, full hair spa, deluxe manicure, pedicure, and threading.",
        "image": "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=700&q=80"
    },
    # Reference UI Luxury additions
    {
        "id": "clean-shave",
        "name": "CLEAN SHAVE",
        "category": "Hair",
        "price": 49,
        "duration": 25,
        "featured": True,
        "description": "Hot towel prep, precision straight-razor shave with soothing sandalwood balm and cold compress.",
        "image": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "haircut-classic",
        "name": "HAIR CUT",
        "category": "Hair",
        "price": 99,
        "duration": 35,
        "featured": True,
        "description": "Classic scissor and clipper taper cut tailored to facial structure with styling finish.",
        "image": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "body-massage-dry",
        "name": "BODY MASSAGE - DRY (15 MIN)",
        "category": "Therapy",
        "price": 199,
        "duration": 15,
        "featured": True,
        "description": "Rapid acupressure upper body and neck tension release dry massage.",
        "image": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "fruit-facial",
        "name": "FRUIT FACIAL (NATURE'S)",
        "category": "Skin",
        "price": 499,
        "duration": 54,
        "featured": True,
        "description": "Organic antioxidant fruit pulp scrub, papaya cream massage, and soothing brightening face pack.",
        "image": "https://images.unsplash.com/photo-1512290900672-1f4a9ce34cf0?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "tawacha-pedicure",
        "name": "TAWACHA PEDICURE",
        "category": "Beauty",
        "price": 599,
        "duration": 45,
        "featured": True,
        "description": "Deep detoxifying foot soak, cuticle refinement, heel smoothing scrub, and massage cream.",
        "image": "https://images.unsplash.com/photo-1519014816548-bf785179c5e4?auto=format&fit=crop&w=700&q=80"
    },
    {
        "id": "foot-massage",
        "name": "FOOT MASSAGE (15 MIN)",
        "category": "Therapy",
        "price": 199,
        "duration": 15,
        "featured": False,
        "description": "Invigorating pressure-point reflexology foot and calf massage with aromatic herbal oil.",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=700&q=80"
    }
]

SALON_TIME_SLOTS = [
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM"
]

VERIFIED_SERVICE_ALIASES = [
    {
        "service_id": "haircut",
        "name": "Precision Haircut & Styling",
        "aliases": ["haircut", "hair cut", "hair cutting", "shear cut"],
        "price": 500,
        "duration": 45,
    },
    {
        "service_id": "hair-spa",
        "name": "Nourishing Hair Spa",
        "aliases": ["hair spa", "scalp therapy", "spa treatment", "hair treatment"],
        "price": 800,
        "duration": 60,
    },
    {
        "service_id": "facial",
        "name": "Glow Rejuvenation Facial",
        "aliases": ["glow rejuvenation facial", "glow facial", "facial", "brightening mask", "face glow"],
        "price": 600,
        "duration": 45,
    },
    {
        "service_id": "hair-coloring",
        "name": "Global Hair Coloring & Gloss",
        "aliases": ["global hair coloring", "hair coloring", "hair color", "hair dye", "coloring", "root touchup"],
        "price": 1500,
        "duration": 90,
    },
    {
        "service_id": "skin-detox",
        "name": "Deep Cleanse Charcoal Detox",
        "aliases": ["deep cleanse charcoal detox", "charcoal detox", "skin detox", "deep cleanse"],
        "price": 750,
        "duration": 50,
    },
    {
        "service_id": "mani-pedi",
        "name": "Deluxe Manicure & Pedicure",
        "aliases": ["deluxe manicure & pedicure", "manicure & pedicure", "manicure", "pedicure", "mani-pedi", "mani pedi"],
        "price": 700,
        "duration": 60,
    },
    {
        "service_id": "eyebrow-thread",
        "name": "Eyebrow Shaping & Threading",
        "aliases": ["eyebrow shaping & threading", "eyebrow threading", "eyebrow shaping", "eyebrow", "threading"],
        "price": 150,
        "duration": 20,
    },
    {
        "service_id": "bridal-glow-package",
        "name": "Complete Bridal Glow Package",
        "aliases": ["complete bridal glow package", "bridal glow package", "bridal package", "bridal glow", "wedding package"],
        "price": 3500,
        "duration": 150,
    }
]

SERVICES_OVERVIEW_ANSWER = (
    "We offer precision Haircuts (Rs 500), Hair Spa (Rs 800), Facials (Rs 600), "
    "Hair Coloring (Rs 1,500), Deep Cleanse Charcoal Detox (Rs 750), "
    "Deluxe Manicure & Pedicure (Rs 700), Eyebrow Shaping (Rs 150), and Complete Bridal Glow Packages (Rs 3,500)."
)

CHATBOT_FALLBACK_ANSWER = "I don't know because this information is not available in our current salon data."
