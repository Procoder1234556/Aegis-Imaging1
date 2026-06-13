import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import NavBar from './components/NavBar';
import Landing from './pages/Landing';
import Upload from './pages/Upload';
import Verifying from './pages/Verifying';
import Approved from './pages/Approved';
import Rejected from './pages/Rejected';
import Escalated from './pages/Escalated';
import Dashboard from './pages/Dashboard';
import AuditDetail from './pages/AuditDetail';
import Processing from './pages/Processing';

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className={`min-h-screen flex flex-col ${isLanding ? '' : 'bg-aegis-bg'}`}>
      {!isLanding && <NavBar />}
      <main className={isLanding ? '' : 'flex-1'}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"                        element={<Landing />} />
            <Route path="/verify"                  element={<Upload />} />
            <Route path="/verifying/:id"           element={<Verifying />} />
            <Route path="/result/approved/:id"     element={<Approved />} />
            <Route path="/result/rejected/:id"     element={<Rejected />} />
            <Route path="/result/escalated/:id"    element={<Escalated />} />
            <Route path="/processing/:id"          element={<Processing />} />
            <Route path="/dashboard"               element={<Dashboard />} />
            <Route path="/audit/:id"               element={<AuditDetail />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
