import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* Unsplash background */
const BG = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?crop=entropy&cs=srgb&fm=jpg&q=40&w=1200';

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

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || '/dashboard';

  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') await login(email, password);
      else                   await register(email, password, name);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try { await loginWithGoogle(); }
    catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Onest', sans-serif" }}>
      {/* Left: dark hero panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden"
        style={{ background: 'var(--color-sidebar)' }}>
        <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,rgba(35,46,50,0.9),rgba(27,71,219,0.15))' }} />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1B47DB,#3B67F5)', boxShadow:'0 4px 16px rgba(27,71,219,0.5)' }}>
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-lg">Aegis <span className="text-aegis-blueSoft font-light">Imaging</span></span>
          </div>
          {/* Hero text */}
          <div>
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-5 border"
              style={{ background:'rgba(27,71,219,0.15)', borderColor:'rgba(27,71,219,0.35)', color:'#94B5E3' }}>
              AI-Powered Medical Image Verification
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Detect synthetic<br/>scans in{' '}
              <span style={{ background:'linear-gradient(135deg,#94B5E3,#1B47DB)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                under 2s
              </span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              A 5-agent pipeline using IronLabs-routed LLMs detects AI-generated fraud in medical claims.
            </p>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[['95%','Accuracy'],['68.6%','Cost saved'],['<2s','Pipeline']].map(([v,l])=>(
              <div key={l} className="p-4 rounded-2xl" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-xl font-bold text-white font-mono">{v}</div>
                <div className="text-xs text-white/40 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-aegis-bg">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            className="card p-8"
          >
            {/* Tab switch */}
            <div className="flex rounded-xl border border-aegis-border overflow-hidden mb-6">
              {['login','register'].map(m=>(
                <button key={m} onClick={()=>{ setMode(m); setError(''); }}
                  data-testid={`tab-${m}`}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                    mode===m ? 'bg-aegis-blue text-white' : 'text-aegis-muted hover:text-aegis-dark'
                  }`}>
                  {m==='login'?'Sign In':'Create Account'}
                </button>
              ))}
            </div>

            {/* Google */}
            <button onClick={handleGoogle} disabled={loading}
              data-testid="google-login-btn"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-aegis-border bg-white hover:border-aegis-blue/30 hover:bg-aegis-blueLight transition-all text-sm font-semibold text-aegis-dark mb-5">
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <hr className="flex-1 border-aegis-border" />
              <span className="text-xs text-aegis-muted">or continue with email</span>
              <hr className="flex-1 border-aegis-border" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }}>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-aegis-muted" />
                      <input type="text" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}
                        className="input-field pl-10" data-testid="name-input" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-aegis-muted" />
                <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}
                  required className="input-field pl-10" data-testid="email-input" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-aegis-muted" />
                <input type={showPw?'text':'password'} placeholder="Password" value={password}
                  onChange={e=>setPassword(e.target.value)} required className="input-field pl-10 pr-10" data-testid="password-input" />
                <button type="button" onClick={()=>setShowPw(!showPw)}
                  className="absolute right-3 top-3.5 text-aegis-muted hover:text-aegis-dark">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                  data-testid="auth-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} data-testid="auth-submit-btn"
                className="btn-blue w-full py-3 justify-center text-base">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{mode==='login'?'Sign In':'Create Account'} <ArrowRight className="w-4 h-4"/></>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-aegis-muted mt-5">
              {mode==='login' ? "Don't have an account? " : "Already have an account? "}
              <button onClick={()=>setMode(mode==='login'?'register':'login')}
                className="text-aegis-blue font-semibold hover:underline">
                {mode==='login'?'Create one':'Sign in'}
              </button>
            </p>
          </motion.div>
          {/* Skip auth */}
          <p className="text-center text-xs text-aegis-muted mt-4">
            <button onClick={()=>navigate('/dashboard')} className="hover:text-aegis-dark transition-colors">
              Continue without account →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
