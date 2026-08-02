import axios from 'axios';

const AUTH_URL    = import.meta.env.VITE_AUTH_URL    || 'http://localhost:5001';
const CORE_URL    = import.meta.env.VITE_CORE_URL    || 'http://localhost:5002';
const ROUTING_URL = import.meta.env.VITE_ROUTING_URL || 'http://localhost:5003';

/** Returns Authorization header from localStorage token */
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth Service ──────────────────────────────────────────────────────────
export const authApi = {
  login:    (data) => axios.post(`${AUTH_URL}/api/auth/login`, data),
  register: (data) => axios.post(`${AUTH_URL}/api/auth/register`, data),
};

// ── Core Service ──────────────────────────────────────────────────────────
const core = (path, opts = {}) =>
  axios({ url: `${CORE_URL}/api/core${path}`, headers: authHeaders(), ...opts });

export const ordersApi = {
  list:   ()           => core('/orders'),
  get:    (id)         => core(`/orders/${id}`),
  create: (data)       => core('/orders', { method: 'POST', data }),
  update: (id, data)   => core(`/orders/${id}`, { method: 'PUT', data }),
  remove: (id)         => core(`/orders/${id}`, { method: 'DELETE' }),
};

export const agentsApi = {
  list:   ()           => core('/agents'),
  get:    (id)         => core(`/agents/${id}`),
  create: (data)       => core('/agents', { method: 'POST', data }),
  update: (id, data)   => core(`/agents/${id}`, { method: 'PUT', data }),
};

export const zonesApi = {
  list:   ()     => core('/zones'),
};

export const clusterApi = {
  run: (thresholdKm = 3) => core('/clusters/run',    { method: 'POST', data: { thresholdKm } }),
};

export const assignApi = {
  run: (thresholdKm = 3) => core('/assignments/run', { method: 'POST', data: { thresholdKm } }),
};

export const slaApi = {
  stats:    ()  => core('/sla/stats'),
  breaches: ()  => core('/sla/breaches'),
};

// ── Routing Service ───────────────────────────────────────────────────────
const routing = (path, data) =>
  axios.post(`${ROUTING_URL}/api/routing${path}`, data, { headers: authHeaders() });

export const routingApi = {
  shortestPath: (payload) => routing('/shortest-path', payload),
  optimizeTSP:  (payload) => routing('/optimize-tsp',  payload),
  queueJob:     (payload) => routing('/queue-job',      payload),
};
