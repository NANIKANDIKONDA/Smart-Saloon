import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scissors } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0b10] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1c1a26] border border-[#c59a58]/40 flex items-center justify-center text-[#c59a58] mx-auto animate-pulse">
            <Scissors className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-condensed uppercase tracking-widest text-stone-400">
            Verifying Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role mismatch: redirect to their own dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/customer" replace />;
  }

  return children;
}
