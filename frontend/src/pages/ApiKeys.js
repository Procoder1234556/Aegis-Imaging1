import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Plus, Trash2, Copy, Check, Eye, EyeOff, AlertCircle,
  Activity, Clock, Shield, Zap, RefreshCw, ExternalLink,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

function copyText(text, setCopied) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  });
}

function KeyCard({ k, onRevoke, copiedText, setCopied }) {
  const [showKey, setShowKey] = useState(false);
  const displayKey = k.raw_key
    ? (showKey ? k.raw_key : k.raw_key.slice(0, 16) + '•'.repeat(24))
    : '••••••••••••••••••••••••••••••••';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 space-y-4"
      data-testid={`api-key-card-${k.key_id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: k.is_active ? 'rgba(27,71,219,0.1)' : 'rgba(107,114,128,0.1)' }}>
            <Key className="w-4 h-4" style={{ color: k.is_active ? '#1B47DB' : '#6B7280' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{k.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                k.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                {k.is_active ? 'Active' : 'Revoked'}
              </span>
            </div>
            {k.description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{k.description}</p>
            )}
          </div>
        </div>

        {k.is_active && (
          <button
            onClick={() => onRevoke(k.key_id)}
            data-testid={`revoke-key-${k.key_id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: '#DC2626', border: '1px solid #FECACA', background: '#FEF2F2' }}>
            <Trash2 className="w-3.5 h-3.5" /> Revoke
          </button>
        )}
      </div>

      {/* Key value */}
      <div className="flex items-center gap-2 p-3 rounded-xl font-mono text-xs"
        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
        <span className="flex-1 truncate" style={{ color: 'var(--color-text)' }}>{displayKey}</span>
        {k.raw_key && (
          <button onClick={() => setShowKey(!showKey)} className="shrink-0 transition-colors" style={{ color: 'var(--color-muted)' }}>
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
        {k.raw_key && (
          <button onClick={() => copyText(k.raw_key, setCopied)} className="shrink-0 transition-colors" style={{ color: 'var(--color-muted)' }}>
            {copiedText === k.raw_key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Calls', value: k.calls_total || 0, icon: Activity, color: '#1B47DB' },
          { label: 'Today', value: k.calls_today || 0, icon: Zap, color: '#22C55E' },
          { label: 'Last Used', value: k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never', icon: Clock, color: '#6B7280' },
        ].map(s => (
          <div key={s.label} className="p-2.5 rounded-lg text-center" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Created: {new Date(k.created_at).toLocaleDateString()} · ID: <span className="font-mono">{k.key_id}</span>
      </div>
    </motion.div>
  );
}

function CreateKeyModal({ onClose, onCreate }) {
  const [name, setName] = useState('My API Key');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await onCreate(name.trim() || 'My API Key', desc.trim()); onClose(); }
    catch (err) { setError(err.message || 'Failed to create key'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="create-key-modal"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="card p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(27,71,219,0.1)' }}>
            <Key className="w-4.5 h-4.5" style={{ color: '#1B47DB' }} />
          </div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Create API Key</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>Key Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              className="input-field" placeholder="e.g. Production Pharmacy API"
              data-testid="key-name-input" required />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>Description (optional)</label>
            <input
              value={desc} onChange={e => setDesc(e.target.value)}
              className="input-field" placeholder="e.g. Used for checkout verification"
              data-testid="key-desc-input" />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" data-testid="create-key-error"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm" data-testid="confirm-create-key-btn">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Create Key'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function NewKeyBanner({ rawKey, onDismiss }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 mb-5" data-testid="new-key-banner"
      style={{ background: '#F0FDF4', border: '2px solid #BBF7D0' }}>
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-green-800 mb-1">API Key Created — Save it now!</p>
          <p className="text-xs text-green-700 mb-3">This key will only be shown once. Copy it and store it securely.</p>
          <div className="flex items-center gap-2 p-3 rounded-lg font-mono text-xs bg-white border border-green-200">
            <span className="flex-1 truncate text-green-900 select-all">{rawKey}</span>
            <button onClick={() => { copyText(rawKey, () => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{ background: copied ? '#16A34A' : '#1B47DB', color: 'white' }}
              data-testid="copy-new-key-btn">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-green-600 hover:text-green-800 text-xs font-medium shrink-0">Dismiss</button>
      </div>
    </motion.div>
  );
}

const PLAN_LIMITS = { free: 1, pro: 5, enterprise: 20 };

export default function ApiKeys() {
  const [keys, setKeys]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [newRawKey, setNewRawKey]   = useState('');
  const [copiedText, setCopied]     = useState('');
  const [error, setError]           = useState('');
  const [userPlan, setUserPlan]     = useState('free');

  const token = localStorage.getItem('aegis_token') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchKeys = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/keys`, { headers: authHeaders });
      if (r.status === 401) { setError('Please sign in to manage API keys.'); return; }
      const d = await r.json();
      setKeys(d.keys || []);
    } catch {
      setError('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    // Get user plan
    fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders })
      .then(r => r.json()).then(u => setUserPlan(u.plan || 'free')).catch(() => {});
  }, [fetchKeys]);

  const handleCreate = async (name, description) => {
    const r = await fetch(`${API_BASE}/api/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ name, description }),
    });
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.detail || 'Failed to create key');
    }
    const data = await r.json();
    setNewRawKey(data.key);
    await fetchKeys();
  };

  const handleRevoke = async keyId => {
    if (!window.confirm('Revoke this API key? All integrations using it will stop working.')) return;
    const r = await fetch(`${API_BASE}/api/keys/${keyId}`, {
      method: 'DELETE', headers: authHeaders,
    });
    if (!r.ok) { alert('Failed to revoke key'); return; }
    await fetchKeys();
  };

  const activeCount = keys.filter(k => k.is_active).length;
  const planLimit   = PLAN_LIMITS[userPlan] || 1;
  const atLimit     = activeCount >= planLimit;

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* Header */}
      <div className="h-16 flex items-center justify-between px-8 sticky top-0 z-20"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>API Keys</h1>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {activeCount}/{planLimit} keys active · {userPlan.toUpperCase()} plan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchKeys} className="btn-ghost py-2 px-3 text-xs" data-testid="refresh-keys-btn">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => atLimit ? null : setShowModal(true)}
            disabled={atLimit}
            data-testid="create-key-btn"
            className="btn-primary py-2.5 px-4 text-sm"
            style={atLimit ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
            <Plus className="w-4 h-4" /> New API Key
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">

        {newRawKey && <NewKeyBanner rawKey={newRawKey} onDismiss={() => setNewRawKey('')} />}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl mb-5 text-sm"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Plan limit banner */}
        {atLimit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl p-4 mb-5 flex items-center justify-between gap-4"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Plan limit reached</p>
                <p className="text-xs text-orange-700">
                  {userPlan === 'free' ? 'Free plan allows 1 active API key.' : `${userPlan} plan allows ${planLimit} active keys.`} Upgrade for more.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Usage example */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>How to use your API key</h3>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4 font-mono text-xs text-[#CDD6F4] overflow-x-auto">
            <p className="text-[#546e7a]"># POST prescription image with your API key</p>
            <p className="mt-2">
              <span style={{ color: '#c792ea' }}>curl</span>
              <span style={{ color: '#CDD6F4' }}> -X POST https://api.rxguard.ai/v1/verify \</span>
            </p>
            <p>
              <span style={{ color: '#CDD6F4' }}>  -H </span>
              <span style={{ color: '#c3e88d' }}>"X-API-Key: rxg_live_your_key_here"</span>
              <span style={{ color: '#CDD6F4' }}> \</span>
            </p>
            <p>
              <span style={{ color: '#CDD6F4' }}>  -F </span>
              <span style={{ color: '#c3e88d' }}>"file=@prescription.jpg"</span>
            </p>
          </div>
        </div>

        {/* Keys list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#1B47DB] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(27,71,219,0.08)', border: '1px solid rgba(27,71,219,0.15)' }}>
              <Key className="w-6 h-6" style={{ color: '#1B47DB' }} />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>No API keys yet</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>Create your first key to start verifying prescriptions</p>
            <button onClick={() => setShowModal(true)} className="btn-primary px-5 py-2.5 text-sm" data-testid="empty-create-key-btn">
              <Plus className="w-4 h-4" /> Create First Key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map(k => (
              <KeyCard key={k.key_id} k={k} onRevoke={handleRevoke}
                copiedText={copiedText} setCopied={setCopied} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <CreateKeyModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
      </AnimatePresence>
    </div>
  );
}
