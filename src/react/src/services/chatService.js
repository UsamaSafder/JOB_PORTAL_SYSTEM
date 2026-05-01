import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

export function authHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function apiGet(path, config = {}) {
  return axios.get(`${API_BASE}${path}`, {
    ...config,
    headers: {
      ...authHeaders(),
      ...(config.headers || {})
    }
  });
}

export function apiPost(path, data, config = {}) {
  return axios.post(`${API_BASE}${path}`, data, {
    ...config,
    headers: {
      ...authHeaders(),
      ...(config.headers || {})
    }
  });
}
