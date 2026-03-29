import axios from 'axios';

const JOBS_API = 'http://localhost:5001/api/jobs';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAllJobs() {
  const { data } = await axios.get(JOBS_API, {
    headers: authHeaders(),
    params: {
      status: 'all',
      limit: 500,
      offset: 0
    }
  });
  return Array.isArray(data?.jobs) ? data.jobs : [];
}

export async function getJobById(jobId) {
  const { data } = await axios.get(`${JOBS_API}/${jobId}`, {
    headers: authHeaders()
  });
  return data;
}

export async function toggleJobStatus(jobId) {
  const { data } = await axios.patch(
    `${JOBS_API}/${jobId}/toggle-status`,
    {},
    { headers: authHeaders() }
  );
  return data;
}

export async function deleteJob(jobId) {
  const { data } = await axios.delete(`${JOBS_API}/${jobId}`, { headers: authHeaders() });
  return data;
}
