import React, { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../config';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const { user } = useAuth();
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyAdmin();
  }, [user, adminKey]);

  const verifyAdmin = async () => {
    if (!user?.firebase_uid || !adminKey) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        method: 'GET',
        headers: {
          'firebase-uid': user.firebase_uid,
          'admin-key': adminKey,
          'Content-Type': 'application/json'
        }
      });

      setIsAdmin(response.ok);
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (key) => {
    setAdminKey(key);
    localStorage.setItem('adminKey', key);
  };

  const logout = () => {
    setAdminKey('');
    setIsAdmin(false);
    localStorage.removeItem('adminKey');
  };

  const adminRequest = async (endpoint, options = {}) => {
    if (!user?.firebase_uid || !adminKey) {
      throw new Error('Admin authentication required');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'firebase-uid': user.firebase_uid,
        'admin-key': adminKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Admin access denied - Invalid credentials');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  };

  return (
    <AdminContext.Provider value={{ 
      adminKey, 
      isAdmin, 
      loading,
      login, 
      logout, 
      adminRequest,
      verifyAdmin 
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};


