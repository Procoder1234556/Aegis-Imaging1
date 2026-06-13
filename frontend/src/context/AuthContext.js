import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const BASE = process.env.REACT_APP_BACKEND_URL || '';

async function fetchMe(token) {
  if (!token) throw new Error('no token');
  const r = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('not authenticated');
  return r.json();
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(undefined); // undefined = still loading
  const [token, setToken] = useState(() => localStorage.getItem('aegis_token') || '');

  // Hydrate user from stored token on mount / token change
  useEffect(() => {
    if (!token) { setUser(null); return; }
    fetchMe(token)
      .then(u => setUser(u))
      .catch(() => {
        localStorage.removeItem('aegis_token');
        setToken('');
        setUser(null);
      });
  }, [token]);

  const _saveSession = (sessionToken, userData) => {
    localStorage.setItem('aegis_token', sessionToken);
    setToken(sessionToken);
    setUser(userData);
  };

  const login = async (email, password) => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      let msg = 'Login failed';
      try { msg = (await r.json()).detail || msg; } catch {}
      throw new Error(msg);
    }
    const data = await r.json();
    _saveSession(data.session_token, data);
    return data;
  };

  const register = async (email, password, name, avatarColor = '') => {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, avatar_color: avatarColor }),
    });
    if (!r.ok) {
      let msg = 'Registration failed';
      try { msg = (await r.json()).detail || msg; } catch {}
      throw new Error(msg);
    }
    const data = await r.json();
    _saveSession(data.session_token, data);
    return data;
  };

  const loginWithGoogle = async () => {
    const r = await fetch(`${BASE}/api/auth/google`);
    const { url } = await r.json();
    window.location.href = url;
  };

  // Called by AuthCallback after Google OAuth exchange
  const setSessionFromCallback = (sessionToken, userData) => {
    _saveSession(sessionToken, userData);
  };

  const logout = async () => {
    try {
      await fetch(`${BASE}/api/auth/logout`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}
    localStorage.removeItem('aegis_token');
    setToken('');
    setUser(null);
  };

  const refreshUser = () =>
    fetchMe(token).then(setUser).catch(() => setUser(null));

  return (
    <AuthContext.Provider value={{
      user, token, login, register, loginWithGoogle,
      logout, refreshUser, setSessionFromCallback,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
