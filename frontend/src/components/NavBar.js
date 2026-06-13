import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, BarChart3, Upload, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NavBar() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Verify', icon: Upload },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/10"
      style={{
        background: 'linear-gradient(135deg, #0F2A47 0%, #1a3a5c 100%)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
      }}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #2E5C8A, #4a7fad)',
                boxShadow: '0 4px 12px rgba(46,92,138,0.5)',
              }}
            >
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-aegis-blue/20 blur-lg group-hover:bg-aegis-blue/30 transition-all duration-300" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">Aegis</span>
            <span className="text-blue-300 font-light text-lg ml-1.5">Imaging</span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to ||
              (to === '/dashboard' && location.pathname.startsWith('/dashboard'));
            return (
              <Link
                key={to}
                to={to}
                data-testid={`nav-${label.toLowerCase()}`}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-white/15"
                    transition={{ type: 'spring', duration: 0.4 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-400/30">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-xs font-medium">System Active</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
