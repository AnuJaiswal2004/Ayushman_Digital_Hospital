import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import PatientDashboard from './pages/patient/PatientDashboard.jsx';
import StaffDashboard from './pages/staff/StaffDashboard.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
