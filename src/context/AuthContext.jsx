import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const API_BASE = rawBaseUrl.replace(/\/+$/, '');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartsalon_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('smartsalon_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync token to user info on initial load
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Token expired or invalid');
        })
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('smartsalon_user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed. Please check your credentials.');
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('smartsalon_token', data.access_token);
    localStorage.setItem('smartsalon_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (name, email, password, phone = '', role = 'customer') => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, role })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed.');
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('smartsalon_token', data.access_token);
    localStorage.setItem('smartsalon_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smartsalon_token');
    localStorage.removeItem('smartsalon_user');
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isCustomer,
        // Legacy compatibility: map to isAdmin so any un-migrated guard fails closed for non-admins
        isStaffOrManager: isAdmin,
        isManager: false,
        isStaff: false,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
