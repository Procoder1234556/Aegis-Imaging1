import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const BASE = process.env.REACT_APP_BACKEND_URL || '';

async function fetchMe(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const r = await fetch(`${BASE}/api/auth/me`, { credentials: 'include', headers });
  if (!r.ok) throw new Error('not authenticated');
  return r.json();
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [token, setToken]     = useState(() => localStorage.getItem('aegis_token') || '');

  useEffect(() => {
    fetchMe(token)
      .then(u => setUser(u))
      .catch(() => setUser(null));
  }, [token]);

  const login = async (email, password) => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Login failed'); }
    const data = await r.json();
    localStorage.setItem('aegis_token', data.session_token);
    setToken(data.session_token);
    setUser(data);
    return data;
  };

  const register = async (email, password, name, avatarColor = '') => {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name, avatar_color: avatarColor }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Registration failed'); }
    const data = await r.json();
    localStorage.setItem('aegis_token', data.session_token);
    setToken(data.session_token);
    setUser(data);
    return data;
  };

  const loginWithGoogle = async () => {
    const r = await fetch(`${BASE}/api/auth/google`);
    const { url } = await r.json();
    window.location.href = url;
  };

  const logout = async () => {
    await fetch(`${BASE}/api/auth/logout`, { method: 'POST', credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {} });
    localStorage.removeItem('aegis_token');
    setToken('');
    setUser(null);
  };

  const refreshUser = () => fetchMe(token).then(setUser).catch(() => setUser(null));

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
