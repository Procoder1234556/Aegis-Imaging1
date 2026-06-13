/* AuthCallback — handles Google OAuth return & token exchange */
import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BASE = process.env.REACT_APP_BACKEND_URL || '';

export default function AuthCallback() {
  const navigate               = useNavigate();
  const [params]               = useSearchParams();
  const { setSessionFromCallback } = useAuth();
  const ran                    = useRef(false);

  useEffect(() => {
    if (ran.current) return;   // strict-mode guard
    ran.current = true;

    const sessionId = params.get('session_id') || params.get('code') || params.get('sessionId');
    if (!sessionId) { navigate('/login'); return; }

    fetch(`${BASE}/api/auth/google/callback?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => {
        if (!r.ok) throw new Error('OAuth failed');
        return r.json();
      })
      .then(data => {
        if (data.session_token) {
          setSessionFromCallback(data.session_token, data);
        }
        navigate('/dashboard', { replace: true });
      })
      .catch(() => navigate('/login', { replace: true }));
  }, [params, navigate, setSessionFromCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#1B47DB', borderTopColor: 'transparent' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Signing you in…</p>
      </div>
    </div>
  );
}
