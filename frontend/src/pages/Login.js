import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Eye, EyeOff, AlertCircle, ArrowRight, Mail, Lock, User,
  Sun, Moon, CheckCircle, UploadCloud, BarChart3, Key, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ── Avatar colour palette ─────────────────────────────────── */
const AVATAR_COLORS = [
  '#1B47DB','#22C55E','#B26552','#F59E0B','#8B5CF6','#EC4899',
  '#06B6D4','#EF4444','#6B7280','#10B981','#F97316','#3B82F6',
  '#A855F7','#14B8A6','#F43F5E','#84CC16',
];

function AvatarPicker({ selected, onChange, initials }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-muted)' }}>Choose your avatar colour</p>
      <div className="flex flex-wrap gap-2">
        {AVATAR_COLORS.map(c => (
          <button key={c} type="button" onClick={() => onChange(c)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{
              background: c,
              outline: selected === c ? `3px solid ${c}` : 'none',
              outlineOffset: '2px',
              transform: selected === c ? 'scale(1.15)' : 'scale(1)',
            }}>
            {initials}
          </button>
        ))}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5.1l-6.2-5.2C29.3 35.6 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-7.9l-6.6 5.1C9.6 39.5 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.1-2.3 4-4.2 5.4l.1-.1 6.2 5.2C37 39 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  );
}

const TRUST_STATS = [
  { value: '14.8M+', label: 'Prescriptions Verified' },
  { value: '94.1%', label: 'Fraud Detection Accuracy' },
  { value: '1.2s', label: 'Avg Verification Time' },
];

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth();
  const { theme, toggle: toggleTheme, isDark } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || '/dashboard';

  const [mode,       setMode]       = useState('login');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [name,       setName]       = useState('');
  const [avatarColor,setAvatarColor]= useState('#1B47DB');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const initials = name ? name.trim().split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?';

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name, avatarColor);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try { await loginWithGoogle(); }
    catch (err) { setError(err.message || 'Google sign-in failed.'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex font-onest transition-colors duration-300" style={{ background: 'var(--color-bg)' }}>

      {/* ── LEFT PANEL (desktop) ─────────────────────────────── */}
      <div className="hidden lg:flex w-[480px] shrink-0 relative flex-col"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #1B47DB20 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 rounded-xl bg-[#1B47DB] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">RxGuard</span>
          </div>

          {/* Avatar preview (register mode) */}
          <AnimatePresence>
            {mode === 'register' && name && (
              <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
                className="flex flex-col items-center gap-3 mb-8">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-2xl transition-all"
                  style={{ background: avatarColor, boxShadow: `0 8px 32px ${avatarColor}60` }}>
                  {initials}
                </div>
                <p className="text-white/60 text-sm">{name || 'Your Name'}</p>
                <p className="text-white/40 text-xs">{email || 'email@pharmacy.com'}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero content */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white leading-tight mb-3 tracking-tight">
              The AI that stops<br/>
              <span style={{ color: '#6997E4' }}>prescription fraud</span>
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Trusted by pharmacies to verify prescriptions in under 2 seconds.
              One API key is all you need.
            </p>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-3 gap-3">
            {TRUST_STATS.map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-lg font-black text-white leading-none mb-0.5">{s.value}</div>
                <div className="text-[10px] text-white/40 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-[#1B47DB] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>RxGuard</span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="theme-toggle" data-testid="theme-toggle-btn"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => navigate('/')} className="text-xs" style={{ color: 'var(--color-muted)' }}>
              ← Back to site
            </button>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">

            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--color-text)' }}>
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {mode === 'login' ? 'Sign in to access your pharmacy dashboard' : 'Start verifying prescriptions in under 5 minutes'}
                </p>
              </div>

              {/* Mode tabs */}
              <div className="flex rounded-xl overflow-hidden mb-6"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                {['login', 'register'].map(m => (
                  <button key={m} onClick={() => { setMode(m); setError(''); }}
                    data-testid={`tab-${m}`}
                    className="flex-1 py-2.5 text-sm font-semibold transition-all"
                    style={mode === m ? { background: '#1B47DB', color: 'white' } : { color: 'var(--color-muted)' }}>
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* Google SSO */}
              <button onClick={handleGoogle} disabled={loading} data-testid="google-login-btn"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl mb-5 font-semibold text-sm transition-all"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>or with email</span>
                <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">

                {/* Register extras */}
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }}
                      className="space-y-3.5 overflow-hidden">
                      {/* Name */}
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                        <input type="text" placeholder="Full name" value={name}
                          onChange={e => setName(e.target.value)}
                          className="input-field pl-10" data-testid="name-input"
                          required={mode === 'register'} />
                      </div>
                      {/* Avatar picker */}
                      <AvatarPicker selected={avatarColor} onChange={setAvatarColor} initials={initials} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                  <input type="email" placeholder="Email address" value={email}
                    onChange={e => setEmail(e.target.value)}
                    required className="input-field pl-10" data-testid="email-input" />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required className="input-field pl-10 pr-10" data-testid="password-input"
                    minLength={mode === 'register' ? 6 : undefined} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-3.5 transition-colors" style={{ color: 'var(--color-muted)' }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm" data-testid="auth-error"
                    style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading} data-testid="auth-submit-btn"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #1B47DB, #3B67F5)', boxShadow: '0 4px 14px rgba(27,71,219,0.3)' }}>
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>

              {/* Toggle mode link */}
              <p className="text-center text-xs mt-5" style={{ color: 'var(--color-muted)' }}>
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                  className="font-semibold" style={{ color: 'var(--color-blue)' }}>
                  {mode === 'login' ? 'Sign up free' : 'Sign in'}
                </button>
              </p>

              {/* Skip */}
              <p className="text-center text-xs mt-3">
                <button onClick={() => navigate('/dashboard')} data-testid="skip-auth-btn"
                  className="transition-colors" style={{ color: 'var(--color-muted)' }}>
                  Continue without account →
                </button>
              </p>

              {/* Quick features list */}
              {mode === 'register' && (
                <div className="mt-6 rounded-xl p-4" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>What you get for free:</p>
                  {['100 prescription verifications/month', '1 API key for integration', 'Full audit trail & reports', 'Real-time fraud detection'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
