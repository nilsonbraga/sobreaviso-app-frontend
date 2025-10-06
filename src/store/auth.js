// src/store/auth.js
import { create } from 'zustand';
import { saveAuth, clearAuth, getUser, getToken, scheduleAutoRefresh } from '@/lib/auth';

const useAuth = create((set) => ({
  user: null,
  token: null,

  hydrate: () => {
    const user = getUser();
    const token = getToken();
    if (token) scheduleAutoRefresh();
    set({ user, token });
  },

  login: (session) => {
    // session esperado: { token, user, refreshToken? }
    saveAuth(session);
    set({ user: session.user, token: session.token });
  },

  logout: () => {
    clearAuth();
    set({ user: null, token: null });
  },
}));

export default useAuth;
