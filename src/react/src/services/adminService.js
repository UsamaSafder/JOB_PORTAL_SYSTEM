import axios from 'axios';

const API_URL = 'http://localhost:5001/api/users/admin';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function camelizeKey(key) {
  if (!key) return key;
  return key.charAt(0).toLowerCase() + key.slice(1);
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return record;
  }

  const next = {};
  Object.entries(record).forEach(([key, value]) => {
    const normalizedKey = camelizeKey(key);
    next[normalizedKey] = value;
  });
  return next;
}

function normalizeArray(records) {
  if (!Array.isArray(records)) return [];
  return records.map(normalizeRecord);
}

export async function getDashboardStats() {
  const { data } = await axios.get(`${API_URL}/dashboard-stats`, { headers: authHeaders() });
  return normalizeRecord(data || {});
}

export async function getSystemLogs(limit = 20) {
  const { data } = await axios.get(`${API_URL}/logs`, {
    headers: authHeaders(),
    params: { limit }
  });
  return normalizeArray(data || []);
}

export async function getAllCompanies() {
  const { data } = await axios.get(`${API_URL}/companies`, { headers: authHeaders() });
  return normalizeArray(data?.companies || []);
}

export async function getAllCandidates() {
  const { data } = await axios.get(`${API_URL}/candidates`, { headers: authHeaders() });
  return normalizeArray(data?.candidates || []);
}

export async function verifyCompany(userId, isVerified = true) {
  const { data } = await axios.put(
    `${API_URL}/${userId}/verify-company`,
    { isVerified },
    { headers: authHeaders() }
  );
  return data;
}

export async function toggleUserStatus(userId) {
  const { data } = await axios.put(
    `${API_URL}/${userId}/toggle-status`,
    {},
    { headers: authHeaders() }
  );
  return data;
}

export async function deleteCandidate(userId) {
  const { data } = await axios.delete(`${API_URL}/candidates/${userId}`, {
    headers: authHeaders()
  });
  return data;
}

export async function deleteCompany(userId) {
  const { data } = await axios.delete(`${API_URL}/companies/${userId}`, {
    headers: authHeaders()
  });
  return data;
}
