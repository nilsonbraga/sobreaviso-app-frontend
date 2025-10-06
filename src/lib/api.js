// src/lib/api.js
import {
  getToken, isNearExpiry, isExpired,
  tryRefreshToken, redirectToLogin, scheduleAutoRefresh
} from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function ensureFreshToken() {
  const token = getToken();
  if (!token) return null;

  if (isExpired(token)) {
    try { return await tryRefreshToken(); }
    catch { redirectToLogin(); return null; }
  }
  if (isNearExpiry(token)) {
    try { return await tryRefreshToken(); } catch {}
  }
  return token;
}

async function parseResponse(res) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  const text = await res.text();
  return text ? { message: text } : {};
}

function buildError(res, data) {
  const err = new Error(data?.message || data?.error || `${res.status} ${res.statusText}`);
  err.status = res.status;
  err.code = data?.code || data?.errorCode;
  err.payload = data;
  return err;
}

async function request(method, path, body, opts = {}) {
  await ensureFreshToken();
  const token = getToken();

  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const doFetch = (overrideHeaders) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: overrideHeaders || headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...opts.fetchInit,
    });

  let res = await doFetch();

  // 401 -> tenta refresh uma vez e refaz
  if (res.status === 401) {
    try {
      await tryRefreshToken();
      const retryHeaders = { ...headers, Authorization: `Bearer ${getToken()}` };
      const retry = await doFetch(retryHeaders);
      if (!retry.ok) {
        const data = await parseResponse(retry);
        throw buildError(retry, data);
      }
      scheduleAutoRefresh();
      return parseResponse(retry);
    } catch {
      redirectToLogin();
      const err = new Error('Sessão expirada. Faça login novamente.');
      err.status = 401;
      err.code = 'SESSION_EXPIRED';
      throw err;
    }
  }

  if (!res.ok) {
    const data = await parseResponse(res);
    throw buildError(res, data);
  }

  scheduleAutoRefresh();
  return parseResponse(res);
}

export const api = {
  get: (p, o) => request('GET', p, null, o),
  post: (p, b, o) => request('POST', p, b, o),
  put: (p, b, o) => request('PUT', p, b, o),
  patch: (p, b, o) => request('PATCH', p, b, o),
  del: (p, o) => request('DELETE', p, null, o),
};
