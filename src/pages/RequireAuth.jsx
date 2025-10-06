// src/pages/RequireAuth.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/store/auth';

export default function RequireAuth({ children }) {
  const user = useAuth(s => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
