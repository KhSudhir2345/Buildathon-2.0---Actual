const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const API_ORIGIN = trimTrailingSlash(
  (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')
);

export const API_BASE = `${API_ORIGIN}/api`;
