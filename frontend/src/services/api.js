// Centralized API service — auto-attaches JWT, handles errors consistently

const API_ORIGIN = import.meta.env.VITE_API_URL || '';
const API_BASE = `${API_ORIGIN}/api`;
const AUTH_BASE = `${API_ORIGIN}/auth`;

const getToken = () => localStorage.getItem('sentinel_token');

const request = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Add timeout support
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // If unauthorized on a protected route, clear token and redirect
    // BUT skip this for auth endpoints (login/register) — let their errors pass through
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (res.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('sentinel_token');
      localStorage.removeItem('sentinel_user');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    // Handle non-JSON responses (e.g., HTML error pages from reverse proxy)
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!res.ok) {
        throw new Error(`Server error (${res.status})`);
      }
      // If response is OK but not JSON, return empty object
      return {};
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw err;
  }
};

const buildQuery = (params) => { if (!params) return ''; const q = new URLSearchParams(params).toString(); return q ? '?' + q : ''; };

// ── Auth ────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    request(`${AUTH_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) =>
    request(`${AUTH_BASE}/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  me: () => request(`${AUTH_BASE}/me`),
};

// ── Stats & Dashboard ───────────────────────────────────────
export const statsAPI = {
  getStatus: () => request(`${API_BASE}/status`),
  getStats: () => request(`${API_BASE}/stats`),
  getAnalytics: () => request(`${API_BASE}/analytics`),
};

// ── Sectors ─────────────────────────────────────────────────
export const sectorsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/sectors${query ? `?${query}` : ''}`);
  },
  create: (data) =>
    request(`${API_BASE}/sectors`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`${API_BASE}/sectors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`${API_BASE}/sectors/${id}`, { method: 'DELETE' }),
};

// ── Units ───────────────────────────────────────────────────
export const unitsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/units${query ? `?${query}` : ''}`);
  },
  create: (data) =>
    request(`${API_BASE}/units`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`${API_BASE}/units/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`${API_BASE}/units/${id}`, { method: 'DELETE' }),
};

// ── Incidents ───────────────────────────────────────────────
export const incidentsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/incidents${query ? `?${query}` : ''}`);
  },
  create: (data) =>
    request(`${API_BASE}/incidents`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`${API_BASE}/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`${API_BASE}/incidents/${id}`, { method: 'DELETE' }),
};

// ── Seed ────────────────────────────────────────────────────
export const seedAPI = {
  seed: (data = {}) => request(`${API_BASE}/seed`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── Officers ────────────────────────────────────────────────
export const officersAPI = {
  getAll: (params) => request(`${API_BASE}/officers${buildQuery(params)}`),
  getById: (id) => request(`${API_BASE}/officers/${id}`),
  create: (data) => request(`${API_BASE}/officers`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`${API_BASE}/officers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`${API_BASE}/officers/${id}`, { method: 'DELETE' }),
  bulkCreate: (data) => request(`${API_BASE}/officers/bulk`, { method: 'POST', body: JSON.stringify(data) }),
  getStats: () => request(`${API_BASE}/officers/stats`),
};

// ── Zones ───────────────────────────────────────────────────
export const zonesAPI = {
  getAll: () => request(`${API_BASE}/zones`),
  create: (data) => request(`${API_BASE}/zones`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`${API_BASE}/zones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`${API_BASE}/zones/${id}`, { method: 'DELETE' }),
  triggerMassAbsence: (id, pct) => request(`${API_BASE}/zones/${id}/mass-absence`, { method: 'POST', body: JSON.stringify({ percentage: pct }) }),
};

// ── Scheduler ───────────────────────────────────────────────
export const schedulerAPI = {
  generate: (days) => request(`${API_BASE}/scheduler/generate`, { method: 'POST', body: JSON.stringify({ days }) }),
  getRoster: (params) => request(`${API_BASE}/scheduler/roster${buildQuery(params)}`),
  getShiftDetail: (id) => request(`${API_BASE}/scheduler/roster/${id}`),
};

// ── Fatigue ─────────────────────────────────────────────────
export const fatigueAPI = {
  getDashboard: () => request(`${API_BASE}/fatigue/dashboard`),
  recalculate: () => request(`${API_BASE}/fatigue/recalculate`, { method: 'POST' }),
  getHighRisk: () => request(`${API_BASE}/fatigue/high-risk`),
};

// ── Audit Logs ──────────────────────────────────────────────
export const auditAPI = {
  getAll: (params) => request(`${API_BASE}/audit-logs${buildQuery(params)}`),
  getStats: () => request(`${API_BASE}/audit-logs/stats`),
};
