/**
 * Centralized Data Store for SmartSalon
 * Single source of truth for salon info, services, operating hours, and mock chatbot Q&A.
 */

export const SALON_INFO = {
  name: 'SmartSalon',
  tagline: 'Your Beauty, Your Time.',
  subtitle: 'Book your salon appointment easily and get instant answers to your questions.',
  about: 'SmartSalon is Kakinada’s premier contemporary beauty and hair styling destination. We combine seasoned styling artistry with seamless digital appointment booking to ensure you look and feel your absolute best.',
  phone: '+91 884 234 5678',
  phoneDisplay: '+91 884-2345678',
  email: 'appointments@smartsalon.in',
  address: 'Main Road, Near Bhanugudi Junction, Kakinada, Andhra Pradesh - 533003',
  city: 'Kakinada',
  state: 'Andhra Pradesh',
  hoursDisplay: 'Mon–Sat 10:00 AM – 8:00 PM, Sunday: Closed',
  schedule: [
    { days: 'Monday – Saturday', hours: '10:00 AM – 8:00 PM', isOpen: true },
    { days: 'Sunday', hours: 'Closed', isOpen: false }
  ]
};

export const SERVICE_CATEGORIES = [
  { id: 'All', name: 'All Services' },
  { id: 'Hair', name: 'Hair' },
  { id: 'Skin', name: 'Skin' },
  { id: 'Beauty', name: 'Beauty' },
  { id: 'Packages', name: 'Packages' }
];

export const SERVICES = [
  {
    id: 'haircut',
    name: 'Precision Haircut & Styling',
    category: 'Hair',
    price: 500,
    duration: 45, // in minutes
    featured: true,
    description: 'Expert consultation, custom shear cut, wash with botanical shampoo, and blow-dry styling.',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'hair-spa',
    name: 'Nourishing Hair Spa',
    category: 'Hair',
    price: 800,
    duration: 60,
    featured: true,
    description: 'Intense deep conditioning scalp therapy, steam rejuvenation, and relaxing head and shoulder massage.',
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'facial',
    name: 'Glow Rejuvenation Facial',
    category: 'Skin',
    price: 600,
    duration: 45,
    featured: true,
    description: 'Gentle pore cleansing, botanical exfoliation, fruit cream massage, and soothing brightening mask.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'hair-coloring',
    name: 'Global Hair Coloring & Gloss',
    category: 'Hair',
    price: 1500,
    duration: 90,
    featured: true,
    description: 'Rich, ammonia-free dimensional hair color or root touchup with UV gloss seal for brilliant shine.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'skin-detox',
    name: 'Deep Cleanse Charcoal Detox',
    category: 'Skin',
    price: 750,
    duration: 50,
    featured: false,
    description: 'Activated charcoal pore purification, steam extraction, tea tree hydration, and skin soothing mist.',
    image: 'https://images.unsplash.com/photo-1512290900672-1f4a9ce34cf0?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'mani-pedi',
    name: 'Deluxe Manicure & Pedicure',
    category: 'Beauty',
    price: 700,
    duration: 60,
    featured: false,
    description: 'Complete nail shaping, cuticle therapy, aromatic foot scrub, hot towel massage, and fresh lacquer.',
    image: 'https://images.unsplash.com/photo-1519014816548-bf7851795289?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'eyebrow-thread',
    name: 'Eyebrow Shaping & Threading',
    category: 'Beauty',
    price: 150,
    duration: 20,
    featured: false,
    description: 'Precise threading for clean arch definition, followed by soothing aloe vera cooling gel.',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'bridal-glow-package',
    name: 'Complete Bridal Glow Package',
    category: 'Packages',
    price: 3500,
    duration: 150,
    featured: false,
    description: 'Comprehensive luxury suite: Premium gold facial, full hair spa, deluxe manicure, pedicure, and threading.',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=700&q=80'
  }
];

export const MOCK_TIME_SLOTS = [
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM'
];

export const FAQS = [
  {
    q: 'How do I book an appointment?',
    a: 'Simply choose your desired service, pick an available date and time slot, enter your contact details, and confirm. Your booking reference will be generated immediately.'
  },
  {
    q: 'What are your operating hours?',
    a: 'SmartSalon is open Monday to Saturday from 10:00 AM to 8:00 PM. We are closed on Sunday.'
  },
  {
    q: 'Where is SmartSalon located?',
    a: 'We are conveniently located on Main Road, near Bhanugudi Junction, Kakinada, Andhra Pradesh - 533003.'
  },
  {
    q: 'Can I cancel or reschedule my booking?',
    a: 'Yes, cancellations and rescheduling are completely free of charge. Please reach out to our salon front desk if you need assistance.'
  }
];

export const CHATBOT_SUGGESTIONS = [
  'How much is a haircut?',
  'What are your hours?',
  'Are you open on Sunday?',
  'How much does a facial cost?',
  'What is the price of a hair spa?',
  'Where are you located?'
];

/**
 * Strict Q&A Seeds for the SmartSalon Assistant.
 * Any question that does NOT match these seeds must return the exact fallback:
 * "I don't know that yet. Please contact the salon directly for more information."
 */
export const CHATBOT_KNOWLEDGE_BASE = [
  {
    keywords: ['haircut', 'hair cut', 'cut price', 'cost of haircut', 'hair cut cost'],
    answer: 'A haircut costs ₹500 and takes approximately 45 minutes.'
  },
  {
    keywords: ['hair spa', 'spa price', 'hair spa cost', 'cost of hair spa'],
    answer: 'Our nourishing Hair Spa costs ₹800 and takes approximately 60 minutes.'
  },
  {
    keywords: ['facial', 'facial price', 'facial cost', 'glow facial'],
    answer: 'A facial costs ₹600 and takes approximately 45 minutes.'
  },
  {
    keywords: ['hair color', 'hair coloring', 'coloring', 'dye'],
    answer: 'Hair Coloring starts at ₹1,500 and takes approximately 90 minutes.'
  },
  {
    keywords: ['sunday', 'open on sunday', 'closed on sunday', 'weekend'],
    answer: 'The salon is closed on Sunday. We are open Monday to Saturday from 10:00 AM to 8:00 PM.'
  },
  {
    keywords: ['hour', 'hours', 'timing', 'timings', 'open', 'close', 'what time'],
    answer: 'We are open Monday to Saturday from 10:00 AM to 8:00 PM. The salon is closed on Sunday.'
  },
  {
    keywords: ['location', 'where', 'address', 'situated', 'kakinada', 'place'],
    answer: 'SmartSalon is located on Main Road, near Bhanugudi Junction, Kakinada, Andhra Pradesh.'
  },
  {
    keywords: ['service', 'services', 'menu', 'treatment', 'treatments', 'offer'],
    answer: 'We offer precision Haircuts (₹500), Hair Spa (₹800), Facials (₹600), Hair Coloring (₹1,500), Deluxe Manicure & Pedicure (₹700), and Bridal Packages.'
  },
  {
    keywords: ['book', 'booking', 'appointment', 'how to book', 'schedule'],
    answer: 'You can book an appointment online anytime through our Booking page. Simply select your service, date, time slot, and details.'
  }
];

export const CHATBOT_FALLBACK_ANSWER =
  "I don't know that yet. Please contact the salon directly for more information.";
