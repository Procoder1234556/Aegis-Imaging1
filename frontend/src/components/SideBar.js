import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, BarChart3, Upload, LogOut, CreditCard, Key, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const NAV = [
  { to: '/verify',    icon: Upload,    label: 'Verify Prescription' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/api-keys',  icon: Key,       label: 'API Keys' },
  { to: '/billing',   icon: CreditCard,label: 'Billing' },
];

const PLAN_STYLES = {
  free:       'bg-aegis-gray/20 text-white/50',
  pro:        'bg-aegis-blue text-white',
  enterprise: 'bg-amber-500 text-white',
};

export default function SideBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside
      className="w-[240px] h-screen flex flex-col sticky top-0 shrink-0"
      style={{ background: 'var(--color-sidebar)', boxShadow: '4px 0 24px rgba(0,0,0,0.08)' }}
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-3 border-b border-white/8">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#1B47DB,#3B67F5)', boxShadow: '0 4px 12px rgba(27,71,219,0.4)' }}>
          <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-white font-bold text-sm tracking-tight">RxGuard</span>
          <span className="text-[#6997E4] font-medium text-sm ml-1">API</span>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-6 pb-2">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Main Menu
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            data-testid={`sidebar-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-5 border-t border-white/8 mb-4" />

      {/* User info */}
      {user && (
        <div className="px-4 mb-3">
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            onClick={() => navigate('/profile')}
            data-testid="sidebar-profile-link"
          >
            {user.picture && user.picture.startsWith('http') ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: user.picture && user.picture.startsWith('#') ? user.picture : 'linear-gradient(135deg,#1B47DB,#6997E4)' }}>
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user.name || user.email?.split('@')[0]}</div>
              <div className={clsx('text-xs px-1.5 py-0.5 rounded font-semibold inline-block mt-0.5', PLAN_STYLES[user.plan || 'free'])}>
                {(user.plan || 'free').toUpperCase()}
              </div>
            </div>
            <User className="w-3.5 h-3.5 text-white/30 shrink-0" />
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          data-testid="sidebar-logout-btn"
          className="nav-item w-full hover:text-red-400"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
