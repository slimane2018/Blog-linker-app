import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Make sure these paths match your actual folder structure!
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
// Import AddSite if you have that page, otherwise delete this line and its Route below
import AddSite from './pages/AddSite'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Skip login and go straight to the Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 2. Other app routes */}
        <Route path="/add-site" element={<AddSite />} />
        
        {/* 3. Keep Login/Signup routes hidden in the background for later */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* 4. Catch-all: If they type a wrong URL, send them to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;