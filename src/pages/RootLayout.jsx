// src/pages/RootLayout.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout() {
  return (
    <>
      <Helmet>
        <title>Sobreaviso</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Outlet />
        <Toaster />
      </div>
    </>
  );
}
