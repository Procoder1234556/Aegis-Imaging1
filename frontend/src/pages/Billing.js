import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, ShieldCheck, ArrowRight, Star, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BASE = process.env.REACT_APP_BACKEND_URL || '';

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, period: 'forever',
    desc: 'Get started with basic verification',
    features: ['3 verifications / day','SHA-256 audit trail','Basic dashboard','Standard support'],
    icon: ShieldCheck, accent: '#7B8FA6', popular: false,
  },
  {
    id: 'pro', name: 'Pro', price: 29, period: 'month',
    desc: 'For professionals & compliance teams',
    features: ['Unlimited verifications','Heatmap export','Priority processing','Full audit trail','API access','Email support'],
    icon: Zap, accent: '#1B47DB', popular: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 99, period: 'month',
    desc: 'Full-scale deployment for enterprises',
    features: ['Everything in Pro','Team accounts (up to 20)','DICOM support','Custom webhooks','SLA guarantee','Dedicated support','White-label option'],
    icon: Building2, accent: '#D97706', popular: false,
  },
];

async function createCheckout(plan, origin, token) {
  const r = await fetch(`${BASE}/api/payments/checkout`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
    credentials: 'include',
    body: JSON.stringify({ plan, origin_url: origin }),
  });
  if (!r.ok) throw new Error('Checkout failed');
  return r.json();
}

async function pollStatus(sessionId, token) {
  const r = await fetch(`${BASE}/api/payments/status/${sessionId}`, {
    credentials: 'include',
    headers: token ? { Authorization:`Bearer ${token}` } : {},
  });
  if (!r.ok) throw new Error('Status check failed');
  return r.json();
}

export default function Billing() {
  const { user, token, refreshUser } = useAuth();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const [loading, setLoading]   = useState(null); // which plan is loading
  const [success, setSuccess]   = useState(false);
  const [polling, setPolling]   = useState(false);

  /* Handle Stripe return */
  useEffect(() => {
    const sessionId = params.get('session_id');
    if (!sessionId) return;
    setPolling(true);
    let attempts = 0;
    const iv = setInterval(async () => {
      attempts++;
      try {
        const s = await pollStatus(sessionId, token);
        if (s.payment_status === 'paid') {
          clearInterval(iv);
          setPolling(false);
          setSuccess(true);
          await refreshUser?.();
        }
      } catch {}
      if (attempts > 12) { clearInterval(iv); setPolling(false); }
    }, 2000);
    return () => clearInterval(iv);
  }, [params, token]);

  const handleUpgrade = async (planId) => {
    if (planId === 'free') return;
    setLoading(planId);
    try {
      const origin = window.location.origin;
      const { url } = await createCheckout(planId, origin, token);
      window.location.href = url;
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = user?.plan || 'free';

  if (polling) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="card p-10 text-center max-w-sm w-full">
        <Loader className="w-10 h-10 text-aegis-blue animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-bold text-aegis-dark mb-1">Processing Payment</h2>
        <p className="text-sm text-aegis-muted">Confirming your subscription…</p>
      </div>
    </div>
  );

  if (success) return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }}
        className="card p-12 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" strokeWidth={3}/>
        </div>
        <h2 className="text-2xl font-bold text-aegis-dark mb-2">Payment Successful!</h2>
        <p className="text-aegis-muted mb-6">Your plan has been upgraded. Enjoy unlimited verifications.</p>
        <button onClick={()=>navigate('/verify')} className="btn-blue mx-auto">
          Start Verifying <ArrowRight className="w-4 h-4"/>
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-aegis-bg">
      {/* Header */}
      <div className="h-16 flex items-center px-8 bg-white border-b border-aegis-border sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-aegis-dark">Billing & Plans</h1>
          <p className="text-xs text-aegis-muted">
            Current plan: <span className="font-semibold text-aegis-blue capitalize">{currentPlan}</span>
          </p>
        </div>
      </div>

      <div className="px-8 py-8 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-aegis-dark mb-2">
            Choose Your <span className="text-blue-gradient">Verification Plan</span>
          </h2>
          <p className="text-aegis-muted">Scale your fraud detection from pilot to enterprise</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: i*0.1 }}
                data-testid={`plan-card-${plan.id}`}
                className={`card p-7 relative flex flex-col card-lift ${plan.popular ? 'ring-2 ring-aegis-blue' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 gradient-blue text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3"/> Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:`${plan.accent}15` }}>
                    <Icon className="w-5 h-5" style={{ color:plan.accent }}/>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-aegis-dark">{plan.name}</div>
                    <div className="text-xs text-aegis-muted">{plan.desc}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-aegis-dark font-mono">${plan.price}</span>
                    {plan.price > 0 && <span className="text-aegis-muted text-sm mb-1">/{plan.period}</span>}
                    {plan.price === 0 && <span className="text-aegis-muted text-sm mb-1">/ {plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f=>(
                    <li key={f} className="flex items-start gap-2.5 text-sm text-aegis-muted">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" strokeWidth={2.5}/>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-aegis-bg text-aegis-muted border border-aegis-border">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={()=>handleUpgrade(plan.id)}
                    disabled={!!loading || plan.id==='free'}
                    data-testid={`upgrade-${plan.id}-btn`}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      plan.id==='free'
                        ? 'bg-aegis-bg text-aegis-muted border border-aegis-border cursor-default'
                        : 'btn-blue'
                    }`}
                  >
                    {loading===plan.id ? (
                      <Loader className="w-4 h-4 animate-spin"/>
                    ) : plan.id==='free' ? (
                      'Free forever'
                    ) : (
                      <>Upgrade to {plan.name} <ArrowRight className="w-4 h-4"/></>
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
