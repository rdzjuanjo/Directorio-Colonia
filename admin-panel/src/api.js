// api.js — Cliente HTTP del panel admin: wrapper fetch con JWT, maneja errores HTTP y expone todos los calls a /api/admin/*
const BASE = '/api/admin';

function token() {
  return localStorage.getItem('admin_token');
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Error del servidor');
  return data;
}

export const api = {
  login: (email, password) =>
    fetch(`${BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then((r) => r.json()),
  stats: () => req('GET', '/stats'),
  orders: () => req('GET', '/orders'),
  ordersAll: (status) => req('GET', `/orders/all${status ? `?status=${status}` : ''}`),
  order: (id) => req('GET', `/orders/${id}`),
  setOrderStatus: (id, status) => req('POST', `/orders/${id}/status`, { status }),
  businesses: () => req('GET', '/businesses'),
  createBusiness: (data) => req('POST', '/businesses', data),
  updateBusiness: (id, data) => req('PUT', `/businesses/${id}`, data),
  deleteBusiness: (id) => req('DELETE', `/businesses/${id}`),
  banBusiness: (id) => req('POST', `/businesses/${id}/ban`),
  riders: () => req('GET', '/riders'),
  createRider: (data) => req('POST', '/riders', data),
  updateRider: (id, data) => req('PUT', `/riders/${id}`, data),
  banRider: (id) => req('POST', `/riders/${id}/ban`),
  assignRider: (riderId, orderId) => req('POST', `/riders/${riderId}/assign/${orderId}`),
  disputes: () => req('GET', '/disputes'),
  resolveDispute: (id) => req('POST', `/disputes/${id}/resolve`),
  config: () => req('GET', '/config'),
  updateConfig: (key, value) => req('PUT', `/config/${key}`, { value }),
  analytics: (from, to) => req('GET', `/analytics?from=${from}&to=${to}`),
  catalogAnalytics: (from, to) => req('GET', `/catalog-analytics?from=${from}&to=${to}`),
  customers: () => req('GET', '/customers'),
  customerStats: (from, to) => req('GET', `/customers/stats?from=${from}&to=${to}`),
};
