const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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

// Auth - simplified (no username needed)
export async function signup(email, password) {
  return authFetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email, password) {
  return authFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Sites
export async function listSites() {
  return authFetch(`${API_BASE}/sites/`);
}

export async function addSite(url, wpApiUrl, wpAppPassword) {
  return authFetch(`${API_BASE}/sites/`, {
    method: 'POST',
    body: JSON.stringify({ url, wp_api_url: wpApiUrl, wp_app_password: wpAppPassword }),
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
}