import axios from 'axios';

// Change this to your backend URL when deployed
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create an axios instance with default settings
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a token to every request if the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth ----

export const signup = (email, password) =>
  api.post('/auth/signup', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

// ---- Sites ----

export const getSites = () =>
  api.get('/sites');

export const addSite = (url, wpAppPassword) =>
  api.post('/sites', { url, wp_app_password: wpAppPassword });

export const deleteSite = (siteId) =>
  api.delete(`/sites/${siteId}`);

export const analyzeSite = (siteId) =>
  api.post(`/sites/${siteId}/analyze`);

// ---- Opportunities ----

export const getOpportunities = (siteId, status) => {
  const params = {};
  if (siteId) params.site_id = siteId;
  if (status) params.status = status;
  return api.get('/opportunities', { params });
};

export const applyOpportunity = (opportunityId) =>
  api.post(`/opportunities/${opportunityId}/apply`);

export const skipOpportunity = (opportunityId) =>
  api.post(`/opportunities/${opportunityId}/skip`);