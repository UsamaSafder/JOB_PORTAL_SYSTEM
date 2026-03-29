import axios from 'axios';

const API_URL = 'http://localhost:5001/api/auth';

export async function login(credentials) {
  const { data } = await axios.post(`${API_URL}/login`, credentials);

  if (data?.token) {
    localStorage.setItem('authToken', data.token);
  }

  if (data?.user) {
    localStorage.setItem('currentUser', JSON.stringify(data.user));

    if (data.user.role === 'company') {
      const company = {
        companyId: data.user.id,
        companyName: data.user.companyName || data.user.email,
        email: data.user.email,
        logo: data.user.logo || null,
        isActive: true
      };
      localStorage.setItem('companyToken', data.token || '');
      localStorage.setItem('currentCompany', JSON.stringify(company));
    }
  }

  return data;
}

export async function register(payload) {
  const { data } = await axios.post(`${API_URL}/register`, payload);

  if (data?.token) {
    localStorage.setItem('authToken', data.token);
  }

  if (data?.user) {
    localStorage.setItem('currentUser', JSON.stringify(data.user));
  }

  return data;
}

export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('companyToken');
  localStorage.removeItem('currentCompany');
}
