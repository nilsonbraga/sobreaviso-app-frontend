import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {api} from '@/lib/api';
import useAuth from '@/store/auth';

export default function RequireAuth({ children }) {
  const { token, logout } = useAuth();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let alive = true;
    async function check() {
      if (!token) { setOk(false); return; }
      try {
        await api.get('/auth/me'); 
        if (alive) setOk(true);
      } catch {
        logout();
        if (alive) setOk(false);
      }
    }
    check();
    return () => { alive = false; };
  }, [token, logout]);

  if (ok === null) return null; 
  if (!ok) return <Navigate to="/login" replace />;
  return children;
}
