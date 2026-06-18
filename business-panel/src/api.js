const BASE = '/api/business';

function token() { return localStorage.getItem('biz_token'); }
function headers() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }; }

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401) { localStorage.removeItem('biz_token'); window.location.href = '/login'; }
  return res.json();
}

export const api = {
  login: (email, password) =>
    fetch(`${BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then((r) => r.json()),
  me: () => req('GET', '/me'),
  updateMe: (data) => req('PUT', '/me', data),
  menu: () => req('GET', '/menu'),
  createCategory: (data) => req('POST', '/menu/categories', data),
  updateCategory: (id, data) => req('PUT', `/menu/categories/${id}`, data),
  deleteCategory: (id) => req('DELETE', `/menu/categories/${id}`),
  createItem: (data) => req('POST', '/menu/items', data),
  updateItem: (id, data) => req('PUT', `/menu/items/${id}`, data),
  deleteItem: (id) => req('DELETE', `/menu/items/${id}`),
  uploadPhoto: (itemId, file) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${BASE}/menu/items/${itemId}/photo`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: form }).then((r) => r.json());
  },
  orders: (status) => req('GET', `/orders${status ? `?status=${status}` : ''}`),
  order: (id) => req('GET', `/orders/${id}`),
  confirmPayment: (id) => req('POST', `/orders/${id}/confirm-payment`),
  markReady: (id) => req('POST', `/orders/${id}/ready`),
  updateOrderItems: (id, items) => req('PUT', `/orders/${id}/items`, { items }),
  analytics: (from, to) => req('GET', `/analytics?from=${from}&to=${to}`),
};
