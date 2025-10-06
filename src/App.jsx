// [ROUTER_MODE] App.jsx não é mais o entrypoint. O app agora sobe via RouterProvider em src/main.jsx.
// src/App.jsx
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import PublicSchedule from '@/components/PublicSchedule';
import Login from '@/components/Login';
import AdminDashboard from '@/components/AdminDashboard';
import useAuth from '@/store/auth';

function App() {
  const user   = useAuth(s => s.user);
  const logout = useAuth(s => s.logout);
  const hydrate = useAuth(s => s.hydrate);

  useEffect(() => {
    hydrate(); // lê auth_user/auth_token do localStorage e agenda auto-refresh
  }, [hydrate]);

  return (
    <>
      <Helmet>
        <title>Sistema de Sobreaviso Hospitalar</title>
        <meta
          name="description"
          content="Gerencie escalas de sobreaviso do hospital de forma eficiente e organizada"
        />
      </Helmet>

      <div className="min-h-screen">
        {!user ? (
          <>
            <PublicSchedule onLoginClick={() => {}} />
            <Login />
          </>
        ) : (
          <AdminDashboard user={user} onLogout={logout} />
        )}
        <Toaster />
      </div>
    </>
  );
}

export default App;
