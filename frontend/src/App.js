import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import SideBar from './components/SideBar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './components/AuthCallback';
import Upload from './pages/Upload';
import Verifying from './pages/Verifying';
import Approved from './pages/Approved';
import Rejected from './pages/Rejected';
import Escalated from './pages/Escalated';
import Dashboard from './pages/Dashboard';
import AuditDetail from './pages/AuditDetail';
import Processing from './pages/Processing';
import Billing from './pages/Billing';
import Profile from './pages/Profile';
import ApiKeys from './pages/ApiKeys';

/* Public routes render without sidebar */
const PUBLIC_PATHS = ['/', '/login', '/profile'];

function AppContent() {
  const location = useLocation();
  const isPublic = PUBLIC_PATHS.includes(location.pathname) ||
    location.pathname.startsWith('/auth/');

  if (isPublic) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"              element={<Landing />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/profile"       element={<Profile />} />
        </Routes>
      </AnimatePresence>
    );
  }

  /* Dashboard routes — sidebar layout */
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <SideBar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-screen">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/dashboard"               element={<Dashboard />} />
            <Route path="/api-keys"                element={<ApiKeys />} />
            <Route path="/verify"                  element={<Upload />} />
            <Route path="/verifying/:id"           element={<Verifying />} />
            <Route path="/result/approved/:id"     element={<Approved />} />
            <Route path="/result/rejected/:id"     element={<Rejected />} />
            <Route path="/result/escalated/:id"    element={<Escalated />} />
            <Route path="/processing/:id"          element={<Processing />} />
            <Route path="/audit/:id"               element={<AuditDetail />} />
            <Route path="/billing"                 element={
              <ProtectedRoute><Billing /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
