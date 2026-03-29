import axios from 'axios';

const USERS_API = 'http://localhost:5001/api/users';
const JOBS_API = 'http://localhost:5001/api/jobs';
const APPLICATIONS_API = 'http://localhost:5001/api/applications';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getCandidateStats() {
  const { data } = await axios.get(`${USERS_API}/candidate/stats`, {
    headers: authHeaders()
  });
  return data?.stats || {};
}

export async function getCandidateApplications() {
  const { data } = await axios.get(`${APPLICATIONS_API}/my-applications`, {
    headers: authHeaders()
  });
  return Array.isArray(data) ? data : [];
}

export async function getRecommendedJobs() {
  const { data } = await axios.get(`${JOBS_API}/candidate/recommended`, {
    headers: authHeaders()
  });
  return Array.isArray(data?.jobs) ? data.jobs : [];
}

export async function getAllActiveJobs() {
  const { data } = await axios.get(JOBS_API, {
    headers: authHeaders(),
    params: { status: 'active', excludeExpired: true, limit: 500, offset: 0 }
  });
  return Array.isArray(data?.jobs) ? data.jobs : [];
}

export async function getJobById(jobId) {
  const { data } = await axios.get(`${JOBS_API}/${jobId}`, {
    headers: authHeaders()
  });
  return data || null;
}

export async function applyForJob(jobId, coverLetter = '') {
  const formData = new FormData();
  formData.append('jobId', String(jobId));
  if (coverLetter) {
    formData.append('coverLetter', coverLetter);
  }

  const { data } = await axios.post(`${APPLICATIONS_API}/`, formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}

export async function withdrawApplication(applicationId) {
  const { data } = await axios.delete(`${APPLICATIONS_API}/${applicationId}`, {
    headers: authHeaders()
  });
  return data;
}

export async function getCandidateInterviews() {
  const { data } = await axios.get(`${APPLICATIONS_API}/my-interviews`, {
    headers: authHeaders()
  });
  return Array.isArray(data?.interviews) ? data.interviews : [];
}

export async function requestInterviewReschedule(applicationId, interviewId, reason) {
  const { data } = await axios.post(
    `${APPLICATIONS_API}/${applicationId}/interview/${interviewId}/request-reschedule`,
    { reason },
    { headers: authHeaders() }
  );
  return data;
}

export async function requestApplicationReschedule(applicationId, reason) {
  const { data } = await axios.post(
    `${APPLICATIONS_API}/${applicationId}/request-reschedule`,
    { reason },
    { headers: authHeaders() }
  );
  return data;
}

export async function getCandidateProfile() {
  const { data } = await axios.get(`${USERS_API}/candidate/profile`, {
    headers: authHeaders()
  });
  return data?.candidate || null;
}

export async function updateCandidateProfile(profile) {
  const { data } = await axios.put(`${USERS_API}/candidate/profile`, profile, {
    headers: authHeaders()
  });
  return data;
}

export async function uploadCandidateProfilePicture(file) {
  const formData = new FormData();
  formData.append('profilePicture', file);

  const { data } = await axios.put(`${USERS_API}/candidate/profile`, formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}

export async function uploadCandidateResume(file, profile = {}) {
  const formData = new FormData();
  Object.entries(profile).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  formData.append('resume', file);

  const { data } = await axios.put(`${USERS_API}/candidate/profile`, formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}

export async function deleteCandidateResume(candidateId) {
  const { data } = await axios.delete(`${USERS_API}/${candidateId}/resume`, {
    headers: authHeaders()
  });
  return data;
}
