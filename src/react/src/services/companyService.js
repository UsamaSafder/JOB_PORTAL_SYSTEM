import axios from 'axios';

const JOBS_API = 'http://localhost:5001/api/jobs';
const APPLICATIONS_API = 'http://localhost:5001/api/applications';
const AUTH_API = 'http://localhost:5001/api/auth';
const USERS_API = 'http://localhost:5001/api/users';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getCompanyJobs() {
  const { data } = await axios.get(`${JOBS_API}/company/my-jobs`, {
    headers: authHeaders()
  });
  return Array.isArray(data) ? data : [];
}

export async function getCompanyApplications() {
  const { data } = await axios.get(`${APPLICATIONS_API}/company/received`, {
    headers: authHeaders()
  });
  return Array.isArray(data) ? data : [];
}

export async function getApplicationsByJobId(jobId) {
  const { data } = await axios.get(`${APPLICATIONS_API}/job/${jobId}`, {
    headers: authHeaders()
  });
  return Array.isArray(data) ? data : [];
}

export async function updateApplicationStatus(applicationId, payload) {
  const { data } = await axios.patch(`${APPLICATIONS_API}/${applicationId}/status`, payload, {
    headers: authHeaders()
  });
  return data;
}

export async function getApplicationById(applicationId) {
  const { data } = await axios.get(`${APPLICATIONS_API}/${applicationId}`, {
    headers: authHeaders()
  });
  return data;
}

export async function scheduleInterview(applicationId, payload) {
  const { data } = await axios.post(`${APPLICATIONS_API}/${applicationId}/schedule-interview`, payload, {
    headers: authHeaders()
  });
  return data;
}

export async function getCompanyProfile() {
  const { data } = await axios.get(`${USERS_API}/company/profile`, {
    headers: authHeaders()
  });
  return data?.company || null;
}

export async function updateCompanyProfile(payload) {
  const { data } = await axios.put(`${USERS_API}/company/profile`, payload, {
    headers: authHeaders()
  });
  return data;
}

export async function uploadCompanyLogo(file) {
  const formData = new FormData();
  formData.append('logo', file);

  const { data } = await axios.put(`${USERS_API}/company/profile`, formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}

export async function createJob(payload) {
  const { data } = await axios.post(JOBS_API, payload, {
    headers: authHeaders()
  });
  return data;
}

export async function updateJob(jobId, payload) {
  const { data } = await axios.put(`${JOBS_API}/${jobId}`, payload, {
    headers: authHeaders()
  });
  return data;
}
