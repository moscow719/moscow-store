const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
};

export const fetchProducts = () => request('/products');
export const createOrder = (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) });
export const registerUser = (credentials) => request('/auth/register', { method: 'POST', body: JSON.stringify(credentials) });
export const loginUser = (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const adminRequest = (path, token, options = {}) => request(`/admin/${path}`, {
  ...options,
  headers: { 'X-Admin-Token': token, ...(options.headers || {}) }
});
export const fetchAdminProducts = token => adminRequest('products', token);
export const createAdminProduct = (token, product) => adminRequest('products', token, { method: 'POST', body: JSON.stringify(product) });
export const updateAdminProduct = (token, id, product) => adminRequest(`products/${id}`, token, { method: 'PATCH', body: JSON.stringify(product) });
export const deleteAdminProduct = (token, id) => adminRequest(`products/${id}`, token, { method: 'DELETE' });
export const fetchAdminOrders = token => adminRequest('orders', token);
export const updateAdminOrder = (token, id, status) => adminRequest(`orders/${id}`, token, { method: 'PATCH', body: JSON.stringify({ status }) });
export const fetchAdminUsers = token => adminRequest('users', token);
