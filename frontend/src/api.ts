import axios from 'axios';

const API_URL = 'http://localhost:8000/auth'; // Update if backend URL changes

export const register = async (email: string, password: string, full_name?: string) => {
  return axios.post(`${API_URL}/register`, { email, password, full_name });
};

export const login = async (email: string, password: string) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  return axios.post(`${API_URL}/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};
