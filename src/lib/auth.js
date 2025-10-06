// src/lib/auth.js
const TOKEN_KEY   = 'auth_token';
const USER_KEY    = 'auth_user';
const REFRESH_KEY = 'refresh_token'; // use se seu backend emitir refreshToken

let refreshTimerId = null;
const SAFE_WINDOW_SECONDS = 60; // renova 1min antes

export function saveAuth({ token, user, refreshToken }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user)  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  scheduleAutoRefresh();
}

export function getToken()        { return localStorage.getItem(TOKEN_KEY) || null; }
export function getRefreshToken() { return localStorage.getItem(REFRESH_KEY) || null; }
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_KEY);
  if (refreshTimerId) clearTimeout(refreshTimerId);
  refreshTimerId = null;
}

export function decodeJwt(token) {
  if (!token) return null;
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    try { return JSON.parse(atob(payload)); } catch { return null; }
  }
}

export function secondsToExpiry(token = getToken()) {
  const dec = decodeJwt(token);
  if (!dec?.exp) return null;
  const now = Math.floor(Date.now() / 1000);
  return dec.exp - now;
}

export function isExpired(token = getToken()) {
  const s = secondsToExpiry(token);
  if (s === null) return false;
  return s <= 0;
}
export function isNearExpiry(token = getToken(), windowSeconds = SAFE_WINDOW_SECONDS) {
  const s = secondsToExpiry(token);
  return s !== null && s <= windowSeconds && s > 0;
}

export async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('no refresh token');

  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const res = await fetch(`${base}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('refresh failed');

  const data = await res.json(); // { token, refreshToken? }
  saveAuth({ token: data.token, refreshToken: data.refreshToken ?? refreshToken, user: getUser() });
  return data.token;
}

export function scheduleAutoRefresh() {
  if (refreshTimerId) clearTimeout(refreshTimerId);
  const s = secondsToExpiry();
  if (s === null) return; // sem exp no token
  const ms = Math.max(0, (s - SAFE_WINDOW_SECONDS) * 1000);
  refreshTimerId = setTimeout(() => {
    tryRefreshToken().catch(() => redirectToLogin());
  }, ms);
}

export function redirectToLogin() {
  clearAuth();
  window.location.href = '/login';
}
