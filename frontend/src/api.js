const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper to get the auth token
function getToken() {
  return localStorage.getItem('token');
}

// Helper to make authenticated requests
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
}

// ─── Auth ─────────────────────────────────────────────
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

export async function listSites() {
  const response = await fetch(`${API_BASE}/sites/`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to list sites');
  }
  return response.json();
}

// ─── Sites ─────────────────────────────────────────────
export async function listSites() {
  return authFetch(`${API_BASE}/sites/`);
}

export async function deleteSite(siteId) {
  const response = await fetch(`${API_BASE}/sites/${siteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete site');
  }
  return response.json();
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

// ─── Opportunities ─────────────────────────────────────
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