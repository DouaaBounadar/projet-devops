import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (
    token &&
    !config.url.includes('/auth/login') &&
    !config.url.includes('/auth/register') &&
    !config.url.includes('/auth/create-admin')
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (username, password) => {
  return api.post('/auth/login', { username, password });
};
export const register = (userData) => {
  return api.post('/auth/register', userData);
};
export const getAllUsers = () => {
  return api.get('/admin/users');
};
export const createUser = (userData) => {
  return api.post('/admin/users', userData);
};
export const deleteUser = (id) => {
  return api.delete(`/admin/users/${id}`);
};
export const createCreditRequest = (creditData) => {
  return api.post('/credits', creditData);
};
export const getUserCredits = () => {
  return api.get('/credits/user');
};
export const getAllCredits = () => {
  return api.get('/credits/all');
};
export const updateCreditStatus = (id, statusData) => {
  return api.put(`/credits/${id}/status`, statusData);
};
export const getStatistics = () => {
  return api.get('/credits/statistics');
};

export default api;
