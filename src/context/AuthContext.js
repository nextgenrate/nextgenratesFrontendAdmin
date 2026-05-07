import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminLogin as apiLogin } from '../services/api';

const AuthCtx = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      localStorage.setItem('admin_token', res.tokens.access);
      localStorage.setItem('admin_user', JSON.stringify(res.admin));
      setAdmin(res.admin);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdmin(null);
  };

  return <AuthCtx.Provider value={{ admin, login, logout, loading }}>{children}</AuthCtx.Provider>;
}

export const useAdmin = () => useContext(AuthCtx);
