import axios from 'axios';
import { getAuthToken } from './auth-token';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);

export default api;

// Clients
export const clientsApi = {
  list: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  archive: (id) => api.put(`/clients/${id}/archive`),
  unarchive: (id) => api.put(`/clients/${id}/unarchive`),
  getHistory: (id) => api.get(`/clients/${id}/history`),
};

// Equipment
export const equipmentApi = {
  list: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  archive: (id) => api.put(`/equipment/${id}/archive`),
  unarchive: (id) => api.put(`/equipment/${id}/unarchive`),
};

// Orders
export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  addPayment: (id, data) => api.post(`/orders/${id}/payments`, data),
  sendWhatsApp: (id) => api.post(`/orders/${id}/whatsapp`),
  downloadPdf: (id) => api.get(`/orders/${id}/pdf`, { responseType: 'blob' }),
  archive: (id) => api.put(`/orders/${id}/archive`),
  unarchive: (id) => api.put(`/orders/${id}/unarchive`),
  delete: (id) => api.delete(`/orders/${id}`),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// Users
export const usersApi = {
  getMe: () => api.get('/users/me'),
  list: () => api.get('/users'),
};

// Auth
export const authApi = {
  changePassword: (data) => api.put('/auth/password', data),
  register: (data) => api.post('/auth/register', data),
};

// WhatsApp
export const whatsappApi = {
  getStatus: () => api.get('/whatsapp/status'),
  connect: () => api.post('/whatsapp/connect'),
};
