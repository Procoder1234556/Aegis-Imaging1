import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Shield, FileSearch, Eye, Stethoscope, Gavel,
  ArrowRight, ChevronRight, BarChart3, Lock,
  Zap, CheckCircle, TrendingDown, Cpu, Activity
} from 'lucide-react';

/* ─── Particle canvas ──────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLES = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      PARTICLES.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74, 158, 255, ${p.alpha})`;
        ctx.fill();
      });
      // Draw connections
      PARTICLES.forEach((a, i) => PARTICLES.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(74,158,255,${0.06 * (1 - d / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }));
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

/* ─── Animated counter ──────────────────────────────────────── */
function Counter({ to, suffix = '', prefix = '', duration = 1500 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = null;
        const step = ts => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          setVal(Math.floor(p * to));
          if (p < 1) requestAnimationFrame(step);
          else setVal(to);
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

/* ─── Orbiting shield ──────────────────────────────────────── */
function ShieldOrb() {
  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Outer glow rings */}
      {[1, 0.7, 0.45].map((opacity, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full border border-[#4a9eff] animate-ping"
          style={{ opacity, animationDuration: `${2 + i * 0.8}s`, animationDelay: `${i * 0.4}s` }}
        />
      ))}
      {/* Rotating dashed ring */}
      <div
        className="absolute inset-6 rounded-full border-2 border-dashed border-[#2E5C8A]/60"
        style={{ animation: 'spin 12s linear infinite' }}
      />
      <div
        className="absolute inset-12 rounded-full border border-[#4a9eff]/30"
        style={{ animation: 'spin 8s linear infinite reverse' }}
      />
      {/* Core orb */}
      <div
        className="absolute inset-16 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, #2E5C8A 0%, #0F2A47 60%, #040B14 100%)',
          boxShadow: '0 0 60px rgba(46,92,138,0.6), 0 0 120px rgba(46,92,138,0.2), inset 0 0 40px rgba(74,158,255,0.15)',
        }}
      >
        <Shield className="w-16 h-16 text-white" strokeWidth={1.5} />
      </div>
      {/* Orbiting dots */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-[#4a9eff]"
          style={{
            top: '50%', left: '50%',
            marginTop: -6, marginLeft: -6,
            transform: `rotate(${deg}deg) translateX(130px)`,
            opacity: 0.6,
            boxShadow: '0 0 8px #4a9eff',
            animation: `spin ${6 + i}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}

const AGENTS = [
  { icon: FileSearch,  name: 'Intake',    desc: 'Metadata & hash analysis',     color: '#4a9eff' },
  { icon: Eye,         name: 'Forensics', desc: 'AI frequency artifact scan',    color: '#a78bfa' },
  { icon: Stethoscope, name: 'Clinical',  desc: 'Anatomy plausibility check',    color: '#34d399' },
  { icon: Gavel,       name: 'Verdict',   desc: 'Weighted ensemble decision',    color: '#fbbf24' },
  { icon: Shield,      name: 'Audit',     desc: 'Tamper-proof hash chain',       color: '#f87171' },
];

const FEATURES = [
  {
    icon: Lock,
    title: 'SHA-256 Hash Chain',
    desc: 'Every verification is cryptographically chained to its predecessor. Any tampering is instantly detectable across the entire audit ledger.',
    color: '#4a9eff',
  },
  {
    icon: TrendingDown,
    title: 'IronLabs Smart Routing',
    desc: 'Automatically routes each task to the optimal LLM tier — cheap models for metadata, top-tier for critical decisions. 68.6% cost saved vs all-top-tier.',
    color: '#a78bfa',
  },
  {
    icon: Cpu,
    title: 'Multi-Signal Detection',
    desc: 'HuggingFace SDXL detector + FFT frequency analysis + vision LLM radiologist — three independent signals, one consensus verdict.',
    color: '#34d399',
  },
];

const STATS = [
  { value: 95, suffix: '%', label: 'Detection Accuracy', prefix: '' },
  { value: 686, suffix: '%', label: 'Cost Savings', prefix: '', display: '68.6%' },
  { value: 2, suffix: 's', label: 'Avg Pipeline Time', prefix: '<' },
  { value: 5, suffix: '', label: 'Specialized Agents', prefix: '' },
];

export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -80]);

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: '#040B14', color: 'white' }}>

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-16"
        style={{ background: 'rgba(4,11,20,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(74,158,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#2E5C8A,#4a9eff)', boxShadow: '0 4px 12px rgba(74,158,255,0.4)' }}>
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white">Aegis</span>
          <span className="font-light text-[#4a9eff]">Imaging</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2"
            data-testid="landing-nav-dashboard"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/verify')}
            data-testid="landing-nav-cta"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#2E5C8A,#4a9eff)', boxShadow: '0 4px 14px rgba(74,158,255,0.3)' }}
          >
            Launch App
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParticleField />

        {/* Radial glow bg */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(46,92,138,0.15) 0%, transparent 70%)',
        }} />

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(74,158,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-24 pb-16"
        >
          {/* Left: text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(74,158,255,0.1)', border: '1px solid rgba(74,158,255,0.25)', color: '#4a9eff' }}
            >
              <Zap className="w-3 h-3" />
              AI-Powered Medical Image Verification
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-bold leading-none mb-6"
              style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)' }}
            >
              <span className="text-white">Stop Fake</span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #4a9eff 0%, #a78bfa 50%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Medical Scans</span>
              <br />
              <span className="text-white">Before They</span>
              <br />
              <span className="text-white/70">Cost You Millions.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg text-white/60 mb-10 leading-relaxed max-w-lg"
            >
              A 5-agent AI pipeline detects AI-generated and manipulated medical images in under 2 seconds.
              Every verification is cryptographically audited and cost-optimized via IronLabs routing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex items-center gap-4 flex-wrap"
            >
              <button
                onClick={() => navigate('/verify')}
                data-testid="hero-cta-verify"
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg,#2E5C8A 0%,#4a9eff 100%)',
                  boxShadow: '0 8px 30px rgba(74,158,255,0.35)',
                }}
              >
                <Shield className="w-5 h-5" />
                Verify an Image Free
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                data-testid="hero-cta-dashboard"
                className="flex items-center gap-2.5 px-7 py-4 rounded-2xl font-medium text-base text-white/80 transition-all duration-300 hover:text-white hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <BarChart3 className="w-4 h-4" />
                View Live Dashboard
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6 mt-10"
            >
              {['HIPAA-Aligned', 'SHA-256 Audited', 'IronLabs Powered'].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#34d399]" />
                  <span className="text-xs text-white/40">{t}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex items-center justify-center"
          >
            <ShieldOrb />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/30">Scroll to explore</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1 h-2 rounded-full bg-[#4a9eff]"
            />
          </div>
        </motion.div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section className="relative py-20 border-y" style={{ borderColor: 'rgba(74,158,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(46,92,138,0.06) 0%, transparent 70%)',
        }} />
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="font-bold text-5xl sm:text-6xl mb-2"
                style={{
                  background: 'linear-gradient(135deg, #4a9eff, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {s.display ? s.display : <Counter to={s.value} suffix={s.suffix} prefix={s.prefix} />}
              </div>
              <div className="text-sm text-white/50">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-28 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.2)', color: '#4a9eff' }}>
              The Pipeline
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              5 Agents.{' '}
              <span style={{
                background: 'linear-gradient(135deg,#4a9eff,#a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>One Verdict.</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Each agent is a specialist. Together they run in parallel, then converge on a cryptographically-locked decision.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <React.Fragment key={agent.name}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.5 }}
                    className="relative rounded-2xl p-5 text-center group cursor-default"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s ease',
                    }}
                    whileHover={{
                      y: -6,
                      background: 'rgba(255,255,255,0.06)',
                      boxShadow: `0 16px 40px ${agent.color}25`,
                      borderColor: `${agent.color}40`,
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${agent.color}15`, boxShadow: `0 0 20px ${agent.color}20` }}>
                      <Icon className="w-6 h-6" style={{ color: agent.color }} />
                    </div>
                    <div className="text-xs font-bold text-white mb-1">{agent.name}</div>
                    <div className="text-xs text-white/40 leading-relaxed">{agent.desc}</div>
                    <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: agent.color, color: '#040B14', boxShadow: `0 0 12px ${agent.color}60` }}>
                      {i + 1}
                    </div>
                  </motion.div>
                  {i < AGENTS.length - 1 && (
                    <div className="hidden sm:flex items-center justify-center col-span-0" style={{ display: 'none' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Flow arrows */}
          <div className="hidden sm:flex items-center justify-between px-16 mt-4 text-white/20">
            {Array.from({ length: 4 }).map((_, i) => (
              <ArrowRight key={i} className="w-5 h-5" />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="py-24 px-8" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Enterprise-Grade{' '}
              <span style={{
                background: 'linear-gradient(135deg,#34d399,#4a9eff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Infrastructure.</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Built for insurance compliance teams, radiology networks, and healthtech platforms at scale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="relative rounded-2xl p-8 overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  whileHover={{ y: -4, borderColor: `${f.color}40` }}
                >
                  {/* BG glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
                    style={{ background: f.color, transform: 'translate(30%, -30%)' }} />

                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${f.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── IMAGE STRIP ────────────────────────────────────────────── */}
      <section className="py-20 px-8 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `url('https://images.unsplash.com/photo-1750969185331-e03829f72c7d?crop=entropy&cs=srgb&fm=jpg&q=30&w=1600') center/cover no-repeat`,
          opacity: 0.06,
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, #040B14 0%, transparent 20%, transparent 80%, #040B14 100%)',
        }} />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(74,158,255,0.15)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 80px rgba(46,92,138,0.15)',
            }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
              <Activity className="w-3.5 h-3.5" />
              Live Demo Available
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              See It Work In{' '}
              <span style={{
                background: 'linear-gradient(135deg,#4a9eff,#34d399)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Real Time.</span>
            </h2>
            <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Upload any medical scan and watch the 5-agent pipeline analyze it live.
              No signup. No credit card. Instant results.
            </p>
            <div className="flex items-center gap-4 justify-center flex-wrap">
              <button
                onClick={() => navigate('/verify')}
                data-testid="cta-verify-now"
                className="flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg,#2E5C8A,#4a9eff)',
                  boxShadow: '0 8px 40px rgba(74,158,255,0.4)',
                }}
              >
                <Shield className="w-5 h-5" />
                Verify an Image Now
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                data-testid="cta-dashboard"
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-medium text-base text-white/70 hover:text-white transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <BarChart3 className="w-4 h-4" />
                Open Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t py-10 px-8" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#2E5C8A,#4a9eff)' }}>
              <Shield className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-sm">Aegis</span>
            <span className="text-[#4a9eff] text-sm">Imaging</span>
          </div>
          <div className="text-xs text-white/25">
            AI-powered medical image verification · SHA-256 audited · IronLabs powered
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/30">All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
