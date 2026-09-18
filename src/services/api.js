/**
 * SmartSalon Unified Frontend API Layer
 * Luxury Salon Customer Portal & Full CRM Operations
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const VITE_API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');
const API_URL = `${VITE_API_BASE_URL}/api`;

function getAuthHeader() {
  const token = localStorage.getItem('smartsalon_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  let response;

  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options.headers,
      },
      ...options,
    });
  } catch (netErr) {
    console.error(`Network error connecting to ${url}:`, netErr);
    throw new Error("Unable to connect to the salon server. Please check your network connection or server status.");
  }

  if (response.status === 200 || response.status === 201) {
    return await response.json();
  }

  let errorDetail = '';
  try {
    const errorJson = await response.json();
    errorDetail = errorJson.detail || errorJson.message || '';
  } catch {
    errorDetail = await response.text().catch(() => '');
  }

  if (response.status === 400) {
    throw new Error(errorDetail || "Invalid request. Please check the provided information.");
  } else if (response.status === 401) {
    throw new Error(errorDetail || "Authentication required. Please log in.");
  } else if (response.status === 403) {
    throw new Error(errorDetail || "Access denied. Insufficient permissions.");
  } else if (response.status === 404) {
    throw new Error(errorDetail || "Requested resource not found.");
  } else if (response.status === 409) {
    throw new Error(errorDetail || "This time slot is already booked. Please choose another time.");
  } else if (response.status >= 500) {
    throw new Error(errorDetail || "The salon server encountered an error. Please try again later.");
  } else {
    throw new Error(errorDetail || `Request failed with HTTP status ${response.status}`);
  }
}

// ==================== BRANCHES ====================

export async function getActiveBranches() {
  const data = await apiRequest('/branches/active', { method: 'GET' });
  return Array.isArray(data) ? data : [];
}

export async function getBranches(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
  if (filters.city && filters.city !== 'All') params.append('city', filters.city);
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiRequest(`/branches${query}`, { method: 'GET' });
  return Array.isArray(data) ? data : [];
}

export async function getBranchById(id) {
  return await apiRequest(`/branches/${id}`, { method: 'GET' });
}

export async function createBranch(branchData) {
  return await apiRequest('/branches', {
    method: 'POST',
    body: JSON.stringify(branchData)
  });
}

export async function updateBranch(id, branchData) {
  return await apiRequest(`/branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(branchData)
  });
}

export async function deleteBranch(id) {
  return await apiRequest(`/branches/${id}`, {
    method: 'DELETE'
  });
}

// ==================== SERVICES ====================

export async function getServices(category = null, search = '') {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (search && search.trim()) params.append('search', search.trim());
  const query = params.toString() ? `?${params.toString()}` : '';

  const data = await apiRequest(`/services${query}`, { method: 'GET' });
  return Array.isArray(data) ? data : [];
}

// ==================== AVAILABILITY ====================

export async function getAvailability(param1, param2, param3) {
  let date = '';
  let branchId = '';
  let serviceId = '';

  if (typeof param1 === 'object' && param1 !== null) {
    date = param1.date || '';
    branchId = param1.branchId || param1.branch_id || '';
    serviceId = param1.serviceId || param1.service_id || '';
  } else if (typeof param1 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(param1)) {
    date = param1;
    branchId = param2 || '';
    serviceId = param3 || '';
  } else {
    serviceId = param1 || '';
    date = param2 || '';
    branchId = param3 || '';
  }

  if (!date) return [];

  const params = new URLSearchParams({ date });
  if (branchId) params.append('branch_id', branchId);
  if (serviceId) params.append('service_id', serviceId);

  const data = await apiRequest(`/availability?${params.toString()}`, { method: 'GET' });
  return Array.isArray(data) ? data : [];
}

// ==================== BOOKINGS ====================

export async function createBooking(bookingData) {
  const payload = {
    customerName: bookingData.customerName || bookingData.name,
    name: bookingData.customerName || bookingData.name,
    phone: bookingData.phone || bookingData.customerPhone,
    customerPhone: bookingData.phone || bookingData.customerPhone,
    email: bookingData.email || bookingData.customerEmail,
    customerEmail: bookingData.email || bookingData.customerEmail,
    notes: bookingData.notes || '',
    date: bookingData.date,
    time: bookingData.time || bookingData.timeSlot,
    timeSlot: bookingData.time || bookingData.timeSlot,
    branchId: bookingData.branchId || bookingData.branch_id,
    branch_id: bookingData.branchId || bookingData.branch_id,
    serviceIds: bookingData.serviceIds || bookingData.service_ids || (bookingData.serviceId ? [bookingData.serviceId] : []),
    serviceId: bookingData.service?.id || bookingData.serviceId,
    serviceName: bookingData.service?.name || bookingData.serviceName,
    price: bookingData.price || bookingData.service?.price,
    duration: bookingData.duration || bookingData.service?.duration,
    bookingType: bookingData.bookingType || 'walk_in',
    location: bookingData.location,
    paymentMethod: bookingData.paymentMethod || 'UPI',
    advancePaid: bookingData.advancePaid || 99
  };

  const confirmedRecord = await apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  try {
    const existing = JSON.parse(localStorage.getItem('smartsalon_bookings') || '[]');
    existing.unshift(confirmedRecord);
    localStorage.setItem('smartsalon_bookings', JSON.stringify(existing));
    localStorage.setItem('smartsalon_last_booking', JSON.stringify(confirmedRecord));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }

  return confirmedRecord;
}

export async function getBooking(bookingId) {
  return await apiRequest(`/bookings/${bookingId}`, { method: 'GET' });
}

export async function cancelBooking(bookingId) {
  return await apiRequest(`/bookings/${bookingId}`, { method: 'DELETE' });
}

export async function getMyBookings() {
  const data = await apiRequest('/bookings', { method: 'GET' });
  return Array.isArray(data) ? data : [];
}

export async function getCustomerBookings(email = '') {
  try {
    const data = await apiRequest('/bookings', { method: 'GET' });
    if (Array.isArray(data)) {
      if (email) {
        const lower = email.toLowerCase();
        return data.filter(b => ((b.email || b.customerEmail || b.customer_email || '').toLowerCase() === lower));
      }
      return data;
    }
  } catch (err) {
    console.warn('API booking load failed, checking localStorage:', err);
  }
  const saved = JSON.parse(localStorage.getItem('smartsalon_bookings') || '[]');
  return email ? saved.filter(b => (b.email || b.customerEmail || '').toLowerCase() === email.toLowerCase()) : saved;
}

// ==================== PAYMENTS ====================

export async function createPaymentOrder(amount = 99, bookingId = null) {
  return await apiRequest('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount, booking_id: bookingId })
  });
}

export async function verifyPayment(verificationData) {
  return await apiRequest('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(verificationData)
  });
}

// ==================== CRM / ADMIN ====================

export async function getCrmDashboard(branchId = '') {
  const query = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : '';
  return await apiRequest(`/crm/dashboard${query}`, { method: 'GET' });
}

export async function getCrmCustomers(search = '', tag = '') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (tag) params.append('tag', tag);
  const query = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/crm/customers${query}`, { method: 'GET' });
}

export async function getCustomer360(email) {
  return await apiRequest(`/crm/customers/${encodeURIComponent(email)}`, { method: 'GET' });
}

export async function addCustomerNote(email, note) {
  return await apiRequest(`/crm/customers/${encodeURIComponent(email)}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note })
  });
}

export async function addCustomerTag(email, tag) {
  return await apiRequest(`/crm/customers/${encodeURIComponent(email)}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tag })
  });
}

export async function removeCustomerTag(email, tag) {
  return await apiRequest(`/crm/customers/${encodeURIComponent(email)}/tags/${encodeURIComponent(tag)}`, {
    method: 'DELETE'
  });
}

export async function getCrmAppointments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.date) params.append('date', filters.date);
  if (filters.branch_id) params.append('branch_id', filters.branch_id);
  if (filters.status_filter) params.append('status_filter', filters.status_filter);
  if (filters.search) params.append('search', filters.search);
  const query = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/crm/appointments${query}`, { method: 'GET' });
}

export async function updateAppointmentStatus(bookingId, status, paymentStatus = null) {
  return await apiRequest(`/crm/appointments/${bookingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, payment_status: paymentStatus })
  });
}

export async function getCrmStaff() {
  return await apiRequest('/crm/staff', { method: 'GET' });
}

export async function createCrmStaff(staffData) {
  return await apiRequest('/crm/staff', {
    method: 'POST',
    body: JSON.stringify(staffData)
  });
}

export async function getCrmPayments() {
  return await apiRequest('/crm/payments', { method: 'GET' });
}

export async function getCrmReports(period = 'month') {
  return await apiRequest(`/crm/reports?period=${period}`, { method: 'GET' });
}

// ==================== CHATBOT ====================

export async function sendChatMessage(message) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    return { answer: "Please enter a question to ask the salon assistant." };
  }
  return await apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ message: message.trim() })
  });
}
