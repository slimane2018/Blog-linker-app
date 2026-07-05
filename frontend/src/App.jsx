const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    const err = new Error(error.detail || 'Request failed');
    err.response = { data: error };
    throw err;
  }

  return response.json();
}

// Sites - FIXED: Only 2 parameters (url and wpAppPassword)
export async function listSites() {
  return authFetch(`${API_BASE}/sites/`);
}

export async function addSite(url, wpAppPassword) {
  return authFetch(`${API_BASE}/sites/`, {
    method: 'POST',
    body: JSON.stringify({ url, wp_app_password: wpAppPassword }),
  });
}

export async function deleteSite(siteId) {
  return authFetch(`${API_BASE}/sites/${siteId}`, {
    method: 'DELETE',
  });
}

export async function analyzeSite(siteId) {
  return authFetch(`${API_BASE}/sites/${siteId}/analyze`, {
    method: 'POST',
  });
}

// Opportunities
export async function getOpportunities(siteId) {
  return authFetch(`${API_BASE}/opportunities?site_id=${siteId}`);
}

export async function applyOpportunity(opportunityId) {
  return authFetch(`${API_BASE}/opportunities/${opportunityId}/apply`, {
    method: 'POST',
  });
}

export async function skipOpportunity(opportunityId) {
  return authFetch(`${API_BASE}/opportunities/${opportunityId}/skip`, {
    method: 'POST',
  });
  
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AddSite from './pages/AddSite'; // ADD THIS

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-site" element={<AddSite />} /> {/* ADD THIS */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
}