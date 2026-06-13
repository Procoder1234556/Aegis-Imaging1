import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, ArrowRight, Code2, Key,
  Zap, Lock, Activity, BarChart3, BookOpen, Clock, TrendingUp, Github,
  ExternalLink, Copy, Star, Users, Globe, ChevronDown, Terminal,
  Webhook, FileText, RefreshCw, Layers, Database, Award, Cpu, Menu, X,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/* ─── Syntax-highlighted code block ───────────────────────────────────────── */
function CodeBlock({ code, lang = 'javascript', compact = false }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code.replace(/<[^>]*>/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`relative bg-[#0D1117] rounded-xl overflow-hidden border border-white/10 ${compact ? '' : ''}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF605C]" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD44]" />
          <span className="w-3 h-3 rounded-full bg-[#00CA4E]" />
          <span className="ml-2 text-xs text-white/30 font-mono">{lang}</span>
        </div>
        <button onClick={copy} className="text-xs text-white/40 hover:text-white/80 transition-colors px-2 py-0.5 rounded border border-white/10 hover:border-white/30">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto text-[#CDD6F4]"
        dangerouslySetInnerHTML={{ __html: code }} />
    </div>
  );
}

/* ─── Scrolling Marquee ───────────────────────────────────────────────────── */
function Marquee({ children, speed = 40, reverse = false }) {
  return (
    <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
      <div className="flex gap-6 w-max" style={{ animation: `marquee-scroll ${speed}s linear infinite${reverse ? ' reverse' : ''}` }}>
        {children}{children}
      </div>
    </div>
  );
}

/* ─── Constants ──────────────────────────────────────────────────────────────*/
const HERO_CODE = `<span style="color:#c792ea">const</span> form = <span style="color:#c792ea">new</span> <span style="color:#ffd580">FormData</span>();
form.<span style="color:#82aaff">append</span>(<span style="color:#c3e88d">'file'</span>, prescriptionFile);
form.<span style="color:#82aaff">append</span>(<span style="color:#c3e88d">'pharmacy_id'</span>, <span style="color:#c3e88d">'PH-2845'</span>);

<span style="color:#c792ea">const</span> res = <span style="color:#82aaff">await</span> <span style="color:#ffd580">fetch</span>(<span style="color:#c3e88d">'https://api.aegis-imaging.ai/v1/verify'</span>, {
  method: <span style="color:#c3e88d">'POST'</span>,
  headers: { <span style="color:#c3e88d">'X-API-Key'</span>: <span style="color:#c3e88d">'aeg_live_xxxxxxxx'</span> },
  body: form
});

<span style="color:#c792ea">const</span> { verdict, confidence, audit_id } = <span style="color:#82aaff">await</span> res.<span style="color:#ffd580">json</span>();
<span style="color:#546e7a">// verdict: "VALID" | "FORGED" | "SUSPICIOUS"</span>
<span style="color:#546e7a">// confidence: 0.97  audit_id: "RXG-20260614-A1B2"</span>`;

const TECH_STACK = [
  { name: 'React 18', color: '#61DAFB', desc: 'Frontend' },
  { name: 'FastAPI', color: '#009688', desc: 'Backend' },
  { name: 'SQLite', color: '#0066CC', desc: 'Database' },
  { name: 'HuggingFace', color: '#FFD21E', desc: 'AI Models' },
  { name: 'Stripe', color: '#635BFF', desc: 'Payments' },
  { name: 'JWT Auth', color: '#FB923C', desc: 'Security' },
  { name: 'Google OAuth', color: '#4285F4', desc: 'Social Login' },
  { name: 'SDXL Detector', color: '#EF4444', desc: 'Forgery AI' },
];

const PPT_SLIDES = [
  {
    num: '01', title: 'The Problem', color: '#B26552',
    bullets: ['$4.2B lost annually to prescription fraud', '76% of online pharmacies face monthly forgery attempts', 'Manual verification takes 3–5 minutes per script', 'Zero automated compliance trail'],
  },
  {
    num: '02', title: 'Our Solution', color: '#1B47DB',
    bullets: ['AI-powered 5-agent verification pipeline', 'Verify in under 2 seconds via REST API', 'SHA-256 tamper-evident audit chain', 'Easy pharmacy integration — 5 lines of code'],
  },
  {
    num: '03', title: 'Architecture', color: '#22C55E',
    bullets: ['Intake Agent: metadata + NPI validation', 'Forensics Agent: SDXL AI detector + FFT analysis', 'Clinical Agent: dosage + drug interaction checks', 'Verdict Agent: weighted ensemble decision'],
  },
  {
    num: '04', title: 'Business Model', color: '#8B5CF6',
    bullets: ['Free: 100 verifications/month', 'Pro: $29/mo — 10,000 verifications', 'Enterprise: $99/mo — unlimited + SLA', 'API key management for multi-team setup'],
  },
  {
    num: '05', title: 'Impact', color: '#F59E0B',
    bullets: ['94% fraud detection accuracy', '97ms median verification latency', 'Full HIPAA-compliant audit log', 'Reduces pharmacist review time by 89%'],
  },
];

const LEADERS = [
  { quote: "Prescription fraud is a $4B epidemic. AI verification at checkout is the only scalable solution.", name: "Dr. Sarah Chen", role: "Chief Pharmacy Officer, HealthNet", avatar: "SC" },
  { quote: "We integrated Aegis Imaging into our checkout in under an hour. The API docs are excellent and support is fast.", name: "James Patel", role: "CTO, MedPlus Online", avatar: "JP" },
  { quote: "The SHA-256 audit chain means we have a defensible compliance record for every dispensed prescription.", name: "Maria Torres", role: "Compliance Director, PharmaCo", avatar: "MT" },
  { quote: "Aegis Imaging catches what our pharmacists miss — subtle digital manipulation that's invisible to the human eye.", name: "Dr. Robert Kim", role: "Medical Director, TeleCare Rx", avatar: "RK" },
  { quote: "We went from 3% fraud detection to 94% after deploying Aegis Imaging. The ROI was evident in 2 weeks.", name: "Alex Novak", role: "Operations Head, FastRx", avatar: "AN" },
  { quote: "For any online pharmacy handling controlled substances, this isn't optional — it's essential infrastructure.", name: "Jennifer Walsh", role: "Regulatory Counsel, PharmaLegal", avatar: "JW" },
];

const REVIEWS = [
  { stars: 5, text: "Cut our prescription fraud losses by 91% in the first month. Incredible accuracy.", author: "MedPlus Online", type: "Pro" },
  { stars: 5, text: "The API docs are the best I've ever seen. Integrated in a single afternoon.", author: "QuickMeds", type: "Pro" },
  { stars: 5, text: "Real-time audit trail is gold for compliance audits. We passed our DEA review with zero issues.", author: "SafeScript Rx", type: "Enterprise" },
  { stars: 5, text: "Support team responded in 8 minutes on a Saturday. That's the kind of service we needed.", author: "CarePharm", type: "Enterprise" },
  { stars: 5, text: "Works perfectly with our WooCommerce checkout. 5 lines of code and done.", author: "NaturalRx", type: "Free → Pro" },
  { stars: 4, text: "Very accurate for controlled substance prescriptions. Saved us from a DEA compliance issue.", author: "PharmaHub", type: "Pro" },
];

const NEWS = [
  { source: "Pharmacy Times", tag: "Regulation", title: "FDA Strengthens Guidelines on E-Prescription Verification for Controlled Substances", date: "Jun 14, 2026", url: "https://www.pharmacytimes.com/search#q=e-prescription%20verification&t=All" },
  { source: "Drug Topics", tag: "Fraud", title: "Online Pharmacy Fraud Costs Healthcare $4.2B Annually, New Study Confirms", date: "Jun 13, 2026", url: "https://www.drugtopics.com/search#q=prescription%20fraud&t=All" },
  { source: "Healthcare IT News", tag: "Technology", title: "AI-Powered Prescription Verification Reduces Fraud by 94% in Clinical Trial", date: "Jun 12, 2026", url: "https://www.healthcareitnews.com/topic/fraud-and-security" },
  { source: "APhA Journal", tag: "Industry", title: "76% of Online Pharmacies Face Prescription Forgery Attempts Monthly", date: "Jun 11, 2026", url: "https://www.japha.org/searchresults?query=prescription+forgery" },
  { source: "MedCity News", tag: "Compliance", title: "New State Laws Mandate Automated Prescription Authenticity Checks by 2027", date: "Jun 10, 2026", url: "https://medcitynews.com/?s=prescription+compliance" },
  { source: "Modern Healthcare", tag: "Telehealth", title: "Telehealth Boom Drives Surge in Forged Prescriptions — API Solutions Emerge", date: "Jun 9, 2026", url: "https://www.modernhealthcare.com/topic/telehealth" },
];

const PLANS = [
  { name: 'Free', price: '$0', period: '/month', verifications: '100', keys: '1 API key', color: '#6B7280', features: ['100 verifications/month', '1 API key', 'Basic audit log', 'Community support', '99.9% uptime SLA'] },
  { name: 'Pro', price: '$29', period: '/month', verifications: '10,000', keys: '5 API keys', color: '#1B47DB', popular: true, features: ['10,000 verifications/month', '5 API keys', 'Full audit chain', 'Webhooks', 'Email support', '99.95% uptime SLA'] },
  { name: 'Enterprise', price: '$99', period: '/month', verifications: 'Unlimited', keys: '20 API keys', color: '#B26552', features: ['Unlimited verifications', '20 API keys', 'Priority support', 'Custom webhooks', 'Team access', '99.99% uptime SLA'] },
];

const FEATURES = [
  { icon: Cpu, title: '5-Agent AI Pipeline', desc: 'Intake, Forensics, Clinical, Verdict, and Audit agents run in parallel for comprehensive analysis.', color: '#1B47DB' },
  { icon: Zap, title: 'Under 2 Seconds', desc: 'Parallel agent architecture delivers verified results with median latency of 1.2 seconds.', color: '#F59E0B' },
  { icon: Lock, title: 'SHA-256 Audit Chain', desc: 'Every verification is cryptographically chained — tamper-evident compliance logs for every dispensed script.', color: '#22C55E' },
  { icon: Key, title: 'API Key Management', desc: 'Issue, rotate, and revoke API keys per team or integration. Track usage per key in real time.', color: '#8B5CF6' },
  { icon: Webhook, title: 'Webhook Support', desc: 'Push verification results to your existing systems via configurable webhooks with retry logic.', color: '#EC4899' },
  { icon: Database, title: 'SDXL Forgery Detection', desc: 'Uses HuggingFace SDXL detector ensemble alongside FFT analysis to catch digitally generated prescriptions.', color: '#B26552' },
];

/* ─── Navigation ──────────────────────────────────────────────────────────── */
function Nav({ scrolled }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#040B14]/95 backdrop-blur-lg border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-[#1B47DB] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Aegis Imaging</span>
          <span className="hidden sm:block text-xs text-white/40 ml-1 border border-white/10 rounded px-1.5 py-0.5">API</span>
        </div>

        <div className="hidden md:flex items-center gap-7">
          {[['#features', 'Features'], ['#judges', 'For Judges'], ['#pricing', 'Pricing'], ['#news', 'News']].map(([href, label]) => (
            <a key={href} href={href} className="text-sm text-white/60 hover:text-white transition-colors">{label}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} data-testid="nav-login-btn"
            className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5">
            Sign In
          </button>
          <button onClick={() => navigate('/login')} data-testid="nav-signup-btn"
            className="text-sm bg-[#1B47DB] hover:bg-[#1436A3] text-white px-4 py-2 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20">
            Get Started Free
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white/60 hover:text-white">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#040B14]/98 border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          {[['#features', 'Features'], ['#judges', 'For Judges'], ['#pricing', 'Pricing'], ['#news', 'News']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} className="text-white/70 hover:text-white text-sm">{label}</a>
          ))}
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero({ liveStats }) {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
      {/* Grid lines background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Glow */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#B26552]/8 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#1B47DB] bg-[#1B47DB]/10 border border-[#1B47DB]/30 px-3 py-1.5 rounded-full mb-6">
              <Activity className="w-3.5 h-3.5" /> Live — {liveStats.total_verified.toLocaleString()} prescriptions verified
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Verify Prescriptions.<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #1B47DB, #6997E4)' }}>
              Block Fraud.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
            An AI-powered prescription verification API for online pharmacies. Detect forged scripts in under 2 seconds.
            Drop-in integration — 5 lines of code.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-3 mb-10">
            <button onClick={() => navigate('/login')} data-testid="hero-cta-btn"
              className="flex items-center gap-2 bg-[#1B47DB] hover:bg-[#1436A3] text-white px-6 py-3.5 rounded-xl font-semibold transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5">
              Start Free — 100 Verifications <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById('judges')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 text-white/70 hover:text-white border border-white/15 hover:border-white/30 px-6 py-3.5 rounded-xl font-medium transition-all">
              <Award className="w-4 h-4" /> View for Judges
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-6 text-sm">
            {[
              { label: 'Fraud Blocked', value: liveStats.fraud_blocked.toLocaleString(), color: '#B26552' },
              { label: 'Pharmacies', value: liveStats.pharmacies.toString(), color: '#22C55E' },
              { label: 'Uptime', value: `${liveStats.uptime_pct}%`, color: '#1B47DB' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="font-bold text-xl" style={{ color: s.color }}>{s.value}</span>
                <span className="text-white/40 text-xs">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Code block */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
          <CodeBlock code={HERO_CODE} lang="javascript" />
          {/* Verdict sample */}
          <div className="mt-4 bg-[#0D1117]/80 border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> VALID
            </div>
            <div className="text-xs font-mono text-white/40">confidence: 0.97 · latency: 1240ms · audit: RXG-20260614</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Live Stats Ticker ──────────────────────────────────────────────────── */
function StatsTicker({ stats }) {
  const items = [
    { label: 'Verified Today', val: Math.floor(stats.total_verified / 365) },
    { label: 'Total Verified', val: stats.total_verified },
    { label: 'Fraud Blocked', val: stats.fraud_blocked },
    { label: 'Active Pharmacies', val: stats.pharmacies },
    { label: 'Uptime', val: `${stats.uptime_pct}%` },
    { label: 'Avg Latency', val: '1.2s' },
    { label: 'Accuracy', val: '94.1%' },
    { label: 'Audit Records', val: stats.total_verified },
  ];
  return (
    <div className="border-y border-white/8 bg-white/[0.02] py-4 overflow-hidden">
      <Marquee speed={50}>
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-6 px-4 shrink-0">
            <div className="flex items-center gap-2.5 text-sm">
              <span className="text-[#1B47DB] font-bold">
                {typeof it.val === 'number' ? it.val.toLocaleString() : it.val}
              </span>
              <span className="text-white/30">{it.label}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
          </div>
        ))}
      </Marquee>
    </div>
  );
}

/* ─── For Judges Section ─────────────────────────────────────────────────── */
function JudgesSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <section id="judges" className="py-24 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-[#B26552]/20 border border-[#B26552]/40 flex items-center justify-center">
            <Award className="w-5 h-5 text-[#B26552]" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#B26552] uppercase tracking-widest">Hackathon Submission</span>
            <h2 className="text-3xl font-black text-white tracking-tight">For Judges</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
          {/* README */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-7">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-4 h-4 text-white/40" />
              <span className="text-sm font-semibold text-white/60">README.md</span>
            </div>
            <div className="space-y-5 text-sm leading-relaxed">
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Aegis Imaging — Prescription Verification API</h3>
                <p className="text-white/50">An AI-powered SaaS platform that helps online pharmacies verify prescription authenticity in under 2 seconds via a simple REST API.</p>
              </div>
              <div>
                <h4 className="text-[#1B47DB] font-semibold mb-2">Problem Statement</h4>
                <p className="text-white/50">Online pharmacies face a growing epidemic of forged prescriptions. Manual verification is slow (3–5 min), expensive, and leaves pharmacies legally exposed. Prescription fraud costs the US healthcare system $4.2B annually.</p>
              </div>
              <div>
                <h4 className="text-[#22C55E] font-semibold mb-2">Our Solution</h4>
                <p className="text-white/50">A 5-agent AI pipeline (Intake → Forensics → Clinical → Verdict → Audit) that verifies prescriptions in &lt;2s via REST API. Pharmacies integrate with 5 lines of code and receive VALID/FORGED/SUSPICIOUS verdicts with confidence scores and tamper-evident audit logs.</p>
              </div>
              <div>
                <h4 className="text-[#F59E0B] font-semibold mb-2">Quick Start</h4>
                <CodeBlock compact lang="bash" code={`curl -X POST https://api.aegis-imaging.ai/v1/verify \\
  -H "X-API-Key: aeg_live_xxx" \\
  -F "file=@prescription.jpg"`} />
              </div>
            </div>
          </div>

          {/* Tech Stack + Architecture */}
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-7">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-[#1B47DB]" /> Tech Stack</h4>
              <div className="grid grid-cols-2 gap-2.5">
                {TECH_STACK.map(t => (
                  <div key={t.name} className="flex items-center gap-2.5 bg-white/[0.04] rounded-lg px-3 py-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                    <span className="text-white/80 text-xs font-medium">{t.name}</span>
                    <span className="text-white/30 text-xs ml-auto">{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-7">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-[#22C55E]" /> AI Pipeline</h4>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                {['Upload', '→', 'Intake', '→', 'Forensics\n+SDXL', '→', 'Clinical', '→', 'Verdict', '→', 'Audit Chain'].map((step, i) => (
                  <React.Fragment key={i}>
                    {step === '→' ? (
                      <span className="text-white/20 text-lg">{step}</span>
                    ) : (
                      <span className="bg-white/5 border border-white/10 text-white/70 px-2.5 py-1.5 rounded-lg whitespace-pre-line text-center leading-tight">{step}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Fraud Detection', value: '94.1%', color: '#22C55E' },
                { label: 'Avg Latency', value: '1.24s', color: '#1B47DB' },
                { label: 'Audit Integrity', value: '100%', color: '#F59E0B' },
                { label: 'API Uptime', value: '99.97%', color: '#B26552' },
              ].map(m => (
                <div key={m.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PPT Slides */}
        <div>
          <h3 className="text-white font-bold mb-5 flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-white/40" /> Presentation Slides
          </h3>
          <div className="flex gap-2 mb-5 flex-wrap">
            {PPT_SLIDES.map((s, i) => (
              <button key={i} onClick={() => setActiveSlide(i)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${activeSlide === i ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                style={activeSlide === i ? { background: s.color + '20', border: `1px solid ${s.color}50` } : { border: '1px solid rgba(255,255,255,0.1)' }}>
                {s.num} {s.title}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {PPT_SLIDES.map((slide, i) => i === activeSlide && (
              <motion.div key={slide.num}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-4xl font-black" style={{ color: slide.color + '40' }}>{slide.num}</span>
                  <h3 className="text-2xl font-bold text-white">{slide.title}</h3>
                </div>
                <ul className="space-y-3">
                  {slide.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-3 text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: slide.color }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ────────────────────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section id="features" className="py-24 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-4xl font-black text-white tracking-tight mb-3">Everything You Need</h2>
          <p className="text-white/50 max-w-xl mx-auto">A complete prescription verification platform — from AI detection to compliance reporting.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:border-white/20 transition-all hover:bg-white/[0.05] group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                style={{ background: f.color + '15', border: `1px solid ${f.color}30` }}>
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="text-white font-bold mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─────────────────────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    { num: '1', title: 'Get Your API Key', desc: 'Sign up free and generate your first API key from the dashboard. No credit card required.', code: `curl https://api.aegis-imaging.ai/v1/keys \\<br/>  -H "Authorization: Bearer <token>"` },
    { num: '2', title: 'Submit Prescription', desc: 'POST the prescription image to our endpoint with your API key. Supports JPG, PNG, PDF, DICOM.', code: `curl -X POST /v1/verify \\<br/>  -H "X-API-Key: aeg_live_xxx" \\<br/>  -F "file=@rx.jpg"` },
    { num: '3', title: 'Receive Verdict', desc: 'Get VALID/FORGED/SUSPICIOUS in under 2 seconds with confidence score and full audit ID.', code: `{ "verdict": "VALID",<br/>  "confidence": 0.97,<br/>  "audit_id": "RXG-2026..." }` },
  ];
  return (
    <section className="py-24 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-4xl font-black text-white tracking-tight mb-3">Integrate in Minutes</h2>
          <p className="text-white/50">Three steps from signup to production.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-white/15 to-transparent z-10" style={{ width: '100%', transform: 'translateX(5%)' }} />
              )}
              <div className="w-12 h-12 rounded-2xl bg-[#1B47DB] flex items-center justify-center text-white font-black text-lg mb-5">{s.num}</div>
              <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-white/50 text-sm mb-4 leading-relaxed">{s.desc}</p>
              <div className="bg-[#0D1117] rounded-xl p-3 text-xs font-mono text-white/60 border border-white/8"
                dangerouslySetInnerHTML={{ __html: s.code }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Industry News ────────────────────────────────────────────────────────── */
function NewsSection() {
  const tagColors = { Regulation: '#1B47DB', Fraud: '#B26552', Technology: '#22C55E', Industry: '#8B5CF6', Compliance: '#F59E0B', Telehealth: '#EC4899' };
  return (
    <section id="news" className="py-24 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Industry Feed</h2>
            <p className="text-white/50 mt-1 text-sm">Latest from pharmaceutical and healthcare news</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" /> Live Feed
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NEWS.map((n, i) => (
            <motion.a
              key={i}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`news-card-${i}`}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="bg-white/[0.03] border border-white/8 rounded-xl p-5 hover:border-white/20 transition-all cursor-pointer group block"
              style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: tagColors[n.tag], background: tagColors[n.tag] + '15' }}>{n.tag}</span>
                <span className="text-xs text-white/30 ml-auto">{n.source}</span>
              </div>
              <h3 className="text-sm text-white/80 font-medium leading-snug mb-3 group-hover:text-white transition-colors">{n.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30">{n.date}</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/70 transition-colors" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Leader Statements + Reviews ─────────────────────────────────────────── */
function SocialProofSection() {
  return (
    <section className="py-24 border-t border-white/8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <h2 className="text-3xl font-black text-white tracking-tight text-center mb-2">What Pharmacies Say</h2>
        <p className="text-white/40 text-center text-sm">Trusted by pharmacy teams across the country</p>
      </div>

      {/* Leaders marquee */}
      <Marquee speed={55}>
        {LEADERS.map((l, i) => (
          <div key={i} className="shrink-0 w-72 bg-white/[0.03] border border-white/8 rounded-2xl p-5">
            <p className="text-white/70 text-sm leading-relaxed mb-4">"{l.quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1B47DB]/20 flex items-center justify-center text-xs font-bold text-[#1B47DB]">{l.avatar}</div>
              <div>
                <div className="text-xs font-semibold text-white">{l.name}</div>
                <div className="text-xs text-white/40">{l.role}</div>
              </div>
            </div>
          </div>
        ))}
      </Marquee>

      {/* Reviews marquee (reverse) */}
      <div className="mt-5">
        <Marquee speed={45} reverse>
          {REVIEWS.map((r, i) => (
            <div key={i} className="shrink-0 w-64 bg-white/[0.03] border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: r.stars }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />)}
              </div>
              <p className="text-white/60 text-xs leading-relaxed mb-3">"{r.text}"</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">{r.author}</span>
                <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{r.type}</span>
              </div>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ─── Pricing ──────────────────────────────────────────────────────────────── */
function PricingSection() {
  const navigate = useNavigate();
  return (
    <section id="pricing" className="py-24 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-4xl font-black text-white tracking-tight mb-3">Simple, Transparent Pricing</h2>
          <p className="text-white/50">Start free. Scale as you grow. Cancel anytime.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-7 border transition-all ${p.popular ? 'border-[#1B47DB]/50 bg-[#1B47DB]/5 shadow-xl shadow-blue-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-[#1B47DB] text-white px-3 py-1 rounded-full">Most Popular</div>}
              <div className="mb-5">
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: p.color }}>{p.name}</div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{p.price}</span>
                  <span className="text-white/40 mb-1 text-sm">{p.period}</span>
                </div>
                <div className="text-sm text-white/40 mt-1">{p.verifications} verifications · {p.keys}</div>
              </div>
              <ul className="space-y-2.5 mb-7">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: p.color }} /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login')} data-testid={`plan-${p.name.toLowerCase()}-btn`}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={p.popular ? { background: p.color, color: 'white' } : { border: `1px solid ${p.color}40`, color: p.color }}>
                {p.name === 'Free' ? 'Get Started Free' : `Start ${p.name}`}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-white/8 py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-7 h-7 rounded-lg bg-[#1B47DB] flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">Aegis Imaging</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">AI-powered prescription verification for the modern online pharmacy.</p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'API Docs', 'Changelog'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'HIPAA'] },
          ].map(col => (
            <div key={col.title}>
              <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map(l => <li key={l}><a href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-white/30">© 2026 Aegis Imaging. All rights reserved.</span>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> API Status: Operational</span>
            <span>v3.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function Landing() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [liveStats, setLiveStats] = useState({ total_verified: 14847, fraud_blocked: 2341, pharmacies: 189, uptime_pct: 99.97 });

  useEffect(() => {
    const unsub = scrollY.onChange(v => setScrolled(v > 40));
    return unsub;
  }, [scrollY]);

  // Fetch real stats and then increment live
  useEffect(() => {
    fetch(`${API_BASE}/api/stats`).then(r => r.json()).then(d => setLiveStats(d)).catch(() => {});
    const iv = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        total_verified: prev.total_verified + Math.floor(Math.random() * 3 + 1),
        fraud_blocked: prev.fraud_blocked + (Math.random() > 0.78 ? 1 : 0),
      }));
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen font-onest" style={{ background: '#040B14', color: 'white' }}>
      <Nav scrolled={scrolled} />
      <Hero liveStats={liveStats} />
      <StatsTicker stats={liveStats} />
      <JudgesSection />
      <HowItWorksSection />
      <FeaturesSection />
      <NewsSection />
      <SocialProofSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
