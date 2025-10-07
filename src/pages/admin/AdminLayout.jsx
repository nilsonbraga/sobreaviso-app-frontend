// src/pages/admin/AdminLayout.jsx
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Clock, UserCog, Building, ShieldCheck, LogOut,
} from 'lucide-react';

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'; // shim/local ou shadcn oficial
import { Button } from '@/components/ui/button';
import useAuth from '@/store/auth';

const routes = [
  { to: 'on-duty',    label: 'Plantonistas', icon: ShieldCheck },
  { to: 'schedules',  label: 'Escalas',      icon: Calendar },
  { to: 'people',     label: 'Pessoas',      icon: UserCog },
  { to: 'teams',      label: 'Equipes',      icon: Users },
  { to: 'time-slots', label: 'Horários',     icon: Clock },

  { to: 'hospitals',    label: 'HUF',      icon: Building },
  { to: 'sectors',    label: 'Serviços',      icon: Building },
  { to: 'users',      label: 'Usuários',     icon: Users },
  { to: 'about',      label: 'Sobre',        icon: LayoutDashboard }, // troque para 'panel' se for o primeiro
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavigationMenuItem className="min-w-fit">
      <NavLink
        to={to}
        className={({ isActive }) =>
          [
            'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200',
          ].join(' ')
        }
      >
        <NavigationMenuLink asChild>
          <span className="inline-flex items-center">
            <Icon className="w-4 h-4" />
            <span className="ml-1.5">{label}</span>
          </span>
        </NavigationMenuLink>
      </NavLink>
    </NavigationMenuItem>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const user     = useAuth((s) => s.user);
  const logout   = useAuth((s) => s.logout);

  const handleLogout = () => {
    try { localStorage.removeItem('hospital_user'); } catch {}
    logout?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          {/* Esquerda: logo/título no mesmo estilo do seu Dashboard antigo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                Gestão Sobreaviso
              </h1>
              <p className="text-sm text-gray-600">
                {user?.name ? `Olá, ${user.name}` : 'Área restrita'}
              </p>
            </div>
          </div>

          {/* Empurra o bloco direito */}
          <div className="flex-1" />

          {/* Direita: menu + Sair lado a lado, alinhados à direita */}
          <div className="hidden md:flex items-center gap-3">
            <NavigationMenu>
              <NavigationMenuList className="flex flex-wrap gap-1">
                {routes.map((r) => (
                  <NavItem key={r.to} to={r.to} label={r.label} icon={r.icon} />
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            <Button
              variant="outline"
              className="gap-2 hover:bg-blue-100 transition-colors"
              onClick={handleLogout}
              title="Encerrar sessão"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Nav compacta para mobile */}
        <div className="md:hidden border-t bg-white/70">
          <div className="px-2 py-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              {routes.map((r) => (
                <NavLink
                  key={r.to}
                  to={r.to}
                  className={({ isActive }) =>
                    [
                      'whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium',
                      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100',
                    ].join(' ')
                  }
                >
                  {r.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
