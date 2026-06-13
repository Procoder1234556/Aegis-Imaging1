/* AuthCallback — handles Google OAuth return & token exchange */
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BASE = process.env.REACT_APP_BACKEND_URL || '';

export default function AuthCallback() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();

  useEffect(() => {
    const sessionId = params.get('session_id') || params.get('code') || params.get('sessionId');
    if (!sessionId) { navigate('/login'); return; }

    fetch(`${BASE}/api/auth/google/callback?session_id=${encodeURIComponent(sessionId)}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data.session_token) {
          localStorage.setItem('aegis_token', data.session_token);
        }
        navigate('/dashboard');
      })
      .catch(() => navigate('/login'));
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-aegis-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-aegis-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-aegis-muted text-sm font-medium">Signing you in…</p>
      </div>
    </div>
  );
}
