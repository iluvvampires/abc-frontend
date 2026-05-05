import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ClinicSelection from './pages/ClinicSelection';
import TermsAndConditions from './pages/TermsAndConditions';
import PatientRegistration from './pages/PatientRegistration';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminSignup from './pages/AdminSignup';
import './index.css';

function App() {
  return (
    <Router>
      <div className="page-container">
        <nav className="nav-bar glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
          <a href="/" className="logo text-gradient">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#60a5fa' }}>
              <path d="M12 2a3 3 0 0 0-3 3c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3zm-5.5 3a2.5 2.5 0 0 0-2.5 2.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm11 0a2.5 2.5 0 0 0-2.5 2.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zM12 10c-3.5 0-6.5 2-6.5 5.5 0 2 1.5 3.5 3.5 3.5 1 0 2-.5 3-1 1 .5 2 1 3 1 2 0 3.5-1.5 3.5-3.5C18.5 12 15.5 10 12 10z"/>
            </svg>
            ABC Registration
          </a>
        </nav>
        
        <main style={{ flex: 1, padding: '2rem 0' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/select-clinic" element={<ClinicSelection />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/register" element={<PatientRegistration />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-signup" element={<AdminSignup />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;