async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.message || 'Request failed');
    err.code = data?.error;       // e.g. "INSUFFICIENT_STOCK"
    err.details = data?.details;  // e.g. list of unavailable items
    err.status = res.status;
    throw err;
  }
  return data;
}

export const getProducts = () => request('/api/products');

export const placeOrder = (items) =>
  request('/api/orders', { method: 'POST', body: JSON.stringify({ items }) });

export const getOrders = (search = '', status = '') => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  return request(`/api/orders?${params}`);
};

export const getOrder = (reference) => request(`/api/orders/${reference}`);

export const changeStatus = (reference, status) =>
  request(`/api/orders/${reference}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });