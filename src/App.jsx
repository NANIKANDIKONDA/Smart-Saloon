import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { MessageSquare, Scissors } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';

// Public Customer Pages
import Home from './pages/Home';
import Services from './pages/Services';
import Booking from './pages/Booking';
import Confirmation from './pages/Confirmation';
import CustomerProfile from './pages/CustomerProfile';
import About from './pages/About';
import Franchise from './pages/Franchise';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

// Auth Page
import Login from './pages/Login';

// Customer Role Page
import CustomerDashboard from './pages/customer/CustomerDashboard';

// Admin / Shared CRM Pages
import CrmLayout from './pages/crm/CrmLayout';
import CrmDashboard from './pages/crm/CrmDashboard';
import CrmAppointments from './pages/crm/CrmAppointments';
import CrmCustomers from './pages/crm/CrmCustomers';
import CrmStaff from './pages/crm/CrmStaff';
import CrmServicesBranches from './pages/crm/CrmServicesBranches';
import CrmPayments from './pages/crm/CrmPayments';
import CrmReports from './pages/crm/CrmReports';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Redirects legacy /crm visits to the role-appropriate dashboard (Admin -> /admin/dashboard, Customer -> /customer)
function CrmRoleRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/customer" replace />;
}

function MainApp() {
  const { pathname } = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isDedicatedPortal = (
    pathname.startsWith('/admin') ||
    pathname === '/login'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0b10] text-[#f4f0eb] font-sans selection:bg-[#c59a58] selection:text-black">
      <ScrollToTop />

      {/* Global Navbar only on customer-facing site */}
      {!isDedicatedPortal && (
        <Navbar onOpenChat={() => setIsChatOpen(true)} />
      )}

      {/* Main Routed Content */}
      <main className="flex-1">
        <Routes>
          {/* ================= PUBLIC CUSTOMER SITE ================= */}
          <Route path="/" element={<Home onOpenChat={() => setIsChatOpen(true)} />} />
          <Route path="/services" element={<Services />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/about" element={<About />} />
          <Route path="/franchise" element={<Franchise />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact onOpenChat={() => setIsChatOpen(true)} />} />

          {/* Public Auth Page */}
          <Route path="/login" element={<Login />} />

          {/* ================= CUSTOMER PORTAL ================= */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />

          {/* ================= DEPRECATED MANAGER & STAFF ROUTES (FAIL CLOSED) ================= */}
          {/* Direct visits immediately redirect to /login and never render or leak data */}
          <Route path="/manager" element={<Navigate to="/login" replace />} />
          <Route path="/manager/*" element={<Navigate to="/login" replace />} />
          <Route path="/staff" element={<Navigate to="/login" replace />} />
          <Route path="/staff/*" element={<Navigate to="/login" replace />} />

          {/* ================= ADMIN / CRM PORTAL ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CrmLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<CrmDashboard />} />
            <Route path="appointments" element={<CrmAppointments />} />
            <Route path="customers" element={<CrmCustomers />} />
            <Route path="staff" element={<CrmStaff />} />
            <Route path="branches" element={<CrmServicesBranches defaultTab="branches" />} />
            <Route path="services" element={<CrmServicesBranches defaultTab="services" />} />
            <Route path="services-branches" element={<CrmServicesBranches />} />
            <Route path="payments" element={<CrmPayments />} />
            <Route path="reports" element={<CrmReports />} />
          </Route>

          {/* Legacy /crm Route Redirect */}
          <Route path="/crm" element={<CrmRoleRedirect />} />
          <Route path="/crm/*" element={<CrmRoleRedirect />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global Floating AI Assistant & Customer Footer */}
      {!isDedicatedPortal && (
        <>
          <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

          {!isChatOpen && (
            <div className="fixed bottom-6 right-6 z-40">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="group relative p-4 rounded-full bg-[#181724] border border-[#c59a58]/40 hover:border-[#c59a58] text-[#c59a58] shadow-2xl shadow-black/80 hover:scale-105 active:scale-95 transition-all focus:outline-none"
                aria-label="Open SmartSalon AI Assistant"
              >
                <MessageSquare className="w-6 h-6 text-[#c59a58]" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#181724]" />
                </span>
              </button>
            </div>
          )}

          <Footer onOpenChat={() => setIsChatOpen(true)} />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
