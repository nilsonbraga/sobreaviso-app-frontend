// src/app/router/index.jsx
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '@/pages/RootLayout';
import PublicSchedulePage from '@/pages/PublicSchedulePage';
import LoginPage from '@/pages/LoginPage';
import RequireAuth from '@/pages/RequireAuth';
import AdminLayout from '@/pages/admin/AdminLayout';
import AboutPage from '@/pages/admin/AboutPage';
import AdminOnDutyPage from '@/pages/admin/OnDutyPage';
import AdminTeamsPage from '@/pages/admin/TeamsPage';
import AdminUsersPage from '@/pages/admin/UsersPage';
import AdminSectorsPage from '@/pages/admin/SectorsPage';
import AdminSchedulesPage from '@/pages/admin/SchedulesPage';
import AdminTimeSlotsPage from '@/pages/admin/TimeSlotsPage';
import AdminPeoplePage from '@/pages/admin/PeoplePage';
import HospitalManagement from '../../pages/admin/HospitalsPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <PublicSchedulePage /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/admin',
        element: (
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to="panel" replace /> },
          { path: 'about', element: <AboutPage /> },
          { path: 'on-duty', element: <AdminOnDutyPage /> },
          { path: 'teams', element: <AdminTeamsPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'sectors', element: <AdminSectorsPage /> },
          { path: 'schedules', element: <AdminSchedulesPage /> },
          { path: 'time-slots', element: <AdminTimeSlotsPage /> },
          { path: 'people', element: <AdminPeoplePage /> },
          { path: 'hospitals', element: <HospitalManagement /> },
          
        ],
      },
      { path: '*', element: <div style={{padding:24}}>Página não encontrada.</div> },
    ],
  },
]);
