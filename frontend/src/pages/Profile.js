import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Shield, BarChart3, Key, Clock, LogOut,
  Edit3, Check, Sun, Moon, FileText, Award, TrendingUp,
  Download, Share2, Twitter, Linkedin, Copy, Send, X, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const AVATAR_COLORS = [
  '#1B47DB','#22C55E','#B26552','#F59E0B','#8B5CF6','#EC4899',
  '#06B6D4','#EF4444','#6B7280','#10B981','#F97316','#3B82F6',
  '#A855F7','#14B8A6','#F43F5E','#84CC16',
];

function VerdictBadge({ verdict }) {
  const cfg = {
    APPROVE: { cls: 'chip-approve', label: 'Valid' },
    REJECT:  { cls: 'chip-reject',  label: 'Forged' },
    ESCALATE:{ cls: 'chip-escalate',label: 'Suspicious' },
  }[verdict] || { cls: 'chip-escalate', label: verdict };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [audits,    setAudits]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editName,  setEditName]  = useState(false);
  const [newName,   setNewName]   = useState(user?.name || '');
  const [copied,    setCopied]    = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [emailModal, setEmailModal] = useState(null); // audit object or 'all'
  const [emailTo,    setEmailTo]    = useState(user?.email || '');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult,  setEmailResult]  = useState('');

  const avatarColor = user?.picture && user.picture.startsWith('#') ? user.picture : '#1B47DB';
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'U';

  useEffect(() => {
    if (user === undefined) return;          // still loading, wait
    if (user === null) { navigate('/login'); return; }  // confirmed logged out
    fetch(`${API_BASE}/api/v1/audits?limit=20`)
      .then(r => r.json())
      .then(d => setAudits(d.audits || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReports = () => window.print();

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`I've verified ${audits.length}+ prescriptions with Aegis Imaging AI. Join me in fighting prescription fraud!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.origin)}`, '_blank');
  };

  const stats = {
    total: audits.length,
    valid: audits.filter(a => a.verdict === 'APPROVE').length,
    forged: audits.filter(a => a.verdict === 'REJECT').length,
    suspicious: audits.filter(a => a.verdict === 'ESCALATE').length,
  };

  const sendReportEmail = async (audit) => {
    if (!emailTo.trim()) return;
    setEmailSending(true); setEmailResult('');
    try {
      const r = await fetch(`${API_BASE}/api/email/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: emailTo.trim(),
          audit_id: audit.audit_id,
          verdict: audit.verdict,
          confidence: audit.confidence || 0,
          created_at: audit.created_at,
          pharmacy_name: user?.name || 'Your Pharmacy',
        }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.detail || 'Failed to send email');
      }
      setEmailResult('success');
      setTimeout(() => { setEmailModal(null); setEmailResult(''); }, 2000);
    } catch (err) {
      setEmailResult(err.message || 'Failed to send email');
    } finally {
      setEmailSending(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--color-muted)' }}>
          <div className="w-5 h-5 border-2 border-[#1B47DB] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto">

      {/* Email Modal */}
      <AnimatePresence>
        {emailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              className="card p-6 w-full max-w-md" data-testid="email-report-modal">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(27,71,219,0.1)' }}>
                    <Send className="w-4 h-4" style={{ color: '#1B47DB' }} />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>Email Report</h3>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Send verification summary to email</p>
                  </div>
                </div>
                <button onClick={() => setEmailModal(null)} style={{ color: 'var(--color-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {emailModal !== 'all' && (
                <div className="p-3 rounded-xl mb-4 text-xs font-mono" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Audit: </span>
                  <span style={{ color: 'var(--color-text)' }}>{emailModal.audit_id}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>Recipient Email</label>
                  <input
                    type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)}
                    className="input-field" placeholder="pharmacy@example.com"
                    data-testid="email-recipient-input" />
                </div>

                {emailResult === 'success' ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
                    <Check className="w-4 h-4" /> Report sent successfully!
                  </div>
                ) : emailResult ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" /> {emailResult}
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button onClick={() => setEmailModal(null)} className="flex-1 btn-ghost py-2.5 text-sm">Cancel</button>
                  <button
                    onClick={() => sendReportEmail(emailModal)}
                    disabled={emailSending || !emailTo.trim()}
                    className="flex-1 btn-primary py-2.5 text-sm"
                    data-testid="send-email-btn">
                    {emailSending
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      : <><Send className="w-3.5 h-3.5" /> Send Report</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost text-xs py-2 px-3">
              ← Dashboard
            </button>
            <h1 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>My Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="theme-toggle" data-testid="profile-theme-toggle">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={handleLogout} data-testid="profile-logout-btn"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ color: '#EF4444', border: '1px solid #FECACA', background: '#FEF2F2' }}>
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Profile Card ─────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-6 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black mx-auto shadow-lg transition-all"
                  style={{ background: avatarColor, boxShadow: `0 6px 24px ${avatarColor}50` }}>
                  {initials}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: '#22C55E', border: '2px solid var(--color-surface)' }}>
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Name */}
              {editName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    className="input-field text-center text-sm py-1.5" autoFocus />
                  <button onClick={() => setEditName(false)} className="text-green-500">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{user.name || 'Pharmacy User'}</h2>
                  <button onClick={() => setEditName(true)} style={{ color: 'var(--color-muted)' }}>
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>{user.email}</p>

              {/* Plan badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2"
                style={{ background: 'rgba(27,71,219,0.08)', color: '#1B47DB', border: '1px solid rgba(27,71,219,0.2)' }}>
                <Award className="w-3 h-3" />
                {(user.plan || 'free').toUpperCase()} PLAN
              </div>

              {/* Avatar colours */}
              <div className="mt-5">
                <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Avatar Colour</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {AVATAR_COLORS.map(c => (
                    <div key={c} className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center text-white text-[8px] font-bold"
                      style={{ background: c, outline: avatarColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}>
                      {avatarColor === c ? '✓' : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="card p-4 space-y-2">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>Quick Actions</p>
              {[
                { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
                { icon: Key,       label: 'API Keys',  path: '/keys' },
                { icon: FileText,  label: 'Verify Prescription', path: '/verify' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)} data-testid={`profile-action-${a.label.toLowerCase().replace(/ /g,'-')}`}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                  <a.icon className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
                  {a.label}
                </button>
              ))}
            </div>

            {/* Theme toggle card */}
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Appearance</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{isDark ? 'Dark' : 'Light'} mode active</p>
                </div>
                <button onClick={toggleTheme} className="theme-toggle" data-testid="profile-appearance-toggle">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* ── Reports & Stats ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Verified', value: stats.total, color: '#1B47DB' },
                { label: 'Valid', value: stats.valid, color: '#22C55E' },
                { label: 'Forged Detected', value: stats.forged, color: '#B26552' },
                { label: 'Under Review', value: stats.suspicious, color: '#D97706' },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Reports section */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>My Reports</h3>
                  <div className="flex gap-1">
                    {['reports'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${activeTab === tab ? 'bg-[#1B47DB] text-white' : ''}`}
                        style={activeTab !== tab ? { color: 'var(--color-muted)' } : {}}>
                        Verifications
                      </button>
                    ))}
                  </div>
                </div>

                {/* Share + Download buttons */}
                <div className="flex items-center gap-2 no-print">
                  <button onClick={downloadReports} data-testid="download-reports-btn"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button onClick={() => { setEmailTo(user?.email || ''); setEmailModal(audits[0] || null); }}
                    disabled={!audits.length}
                    data-testid="email-latest-report-btn"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                    <Send className="w-3.5 h-3.5" /> Email Report
                  </button>
                  <button onClick={shareOnTwitter} data-testid="share-twitter-btn"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ color: '#1D9BF0', border: '1px solid #BFDBFE', background: '#EFF6FF' }}>
                    <Twitter className="w-3.5 h-3.5" /> Share
                  </button>
                  <button onClick={copyProfileLink} data-testid="copy-profile-link-btn"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1B47DB] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : audits.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-gray)' }} />
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>No reports yet</p>
                  <p className="text-sm mt-1 mb-4" style={{ color: 'var(--color-muted)' }}>Start verifying prescriptions to see them here</p>
                  <button onClick={() => navigate('/verify')} className="btn-primary py-2 px-4 text-xs">
                    Upload Prescription
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                        {['Audit ID', 'Date', 'Verdict', 'Confidence', 'Action'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {audits.map((a, i) => (
                        <tr key={a.audit_id} className="border-b transition-colors hover:opacity-80"
                          style={{ borderColor: 'var(--color-border)', animationDelay: `${i * 30}ms` }}>
                          <td className="px-5 py-3.5 text-xs font-mono" style={{ color: 'var(--color-text)' }}>{a.audit_id}</td>
                          <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                            {new Date(a.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5"><VerdictBadge verdict={a.verdict} /></td>
                          <td className="px-5 py-3.5 text-xs font-mono font-semibold" style={{ color: 'var(--color-text)' }}>
                            {Math.round((a.confidence || 0) * 100)}%
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <button onClick={() => navigate(`/audit/${a.audit_id}`)}
                                className="text-xs font-medium" style={{ color: 'var(--color-blue)' }}>
                                View →
                              </button>
                              <button
                                onClick={() => { setEmailTo(user?.email || ''); setEmailModal(a); }}
                                data-testid={`email-report-${a.audit_id}`}
                                className="text-xs font-medium flex items-center gap-1"
                                style={{ color: 'var(--color-muted)' }}>
                                <Send className="w-3 h-3" /> Email
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
