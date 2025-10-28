
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
    hydrate(); 
  }, [hydrate]);

  return (
    <>
      <Helmet>
        <title>Sistema de Plantão Hospitalar</title>
        <meta
          name="description"
          content="Gerencie escalas de plantão e sobreaviso do hospital de forma eficiente e organizada"
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
