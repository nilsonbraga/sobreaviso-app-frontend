// src/pages/admin/AdminLayout.jsx
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Clock, UserCog, Building, ShieldCheck, LogOut, Settings2,
} from 'lucide-react';

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';
import useAuth from '@/store/auth';
import clsx from 'clsx';

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavigationMenuItem className="min-w-fit">
      <NavLink
        to={to}
        className={({ isActive }) =>
          clsx(
            'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
          )
        }
      >
        <NavigationMenuLink asChild>
          <span className="inline-flex items-center">
            {Icon && <Icon className="w-4 h-4" />}
            <span className="ml-1.5">{label}</span>
          </span>
        </NavigationMenuLink>
      </NavLink>
    </NavigationMenuItem>
  );
}

/** =========================
 *  Helpers de autorização
 *  ========================= */
function normalize(str) {
  return String(str || '').trim().toLowerCase();
}
function hasRole(user, target) {
  const t = normalize(target);
  const roleStrs = [
    normalize(user?.role),
    normalize(user?.perfil),
  ].filter(Boolean);

  const arrays = [
    user?.roles,
    user?.profiles,
    user?.perfis,
    user?.authorities,
    user?.scopes,
  ].filter(Array.isArray);

  const bools = {
    admin: user?.isAdmin === true,
    team_admin: user?.isTeamAdmin === true,
  };

  if (t === 'admin' || t === 'general_admin') {
    if (bools.admin) return true;
  }
  if (t === 'team_admin') {
    if (bools.team_admin) return true;
  }

  if (roleStrs.some((r) => r === t)) return true;
  if (arrays.some((arr) => arr.map(normalize).includes(t))) return true;

  // compat: admin == general_admin
  if (t === 'general_admin' && (roleStrs.includes('admin') || arrays.some((arr) => arr.map(normalize).includes('admin')))) {
    return true;
  }
  return false;
}

function CadastrosDropdown({ showPeople, showTeams, showTimeSlots, showHospitals, showSectors }) {
  const hasAny = showPeople || showTeams || showTimeSlots || showHospitals || showSectors;
  if (!hasAny) return null;

  return (
    <NavigationMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="transparent" className="h-9 gap-2">
            <Settings2 className="w-4 h-4" />
            Cadastros
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-60">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Cadastros
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {showPeople && (
            <DropdownMenuItem asChild>
              <NavLink
                to="people"
                className={({ isActive }) =>
                  clsx(
                    'w-full rounded-sm px-2 py-2 flex items-center gap-2 text-sm',
                    isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Pessoas
                </span>
              </NavLink>
            </DropdownMenuItem>
          )}

          {showTeams && (
            <DropdownMenuItem asChild>
              <NavLink
                to="teams"
                className={({ isActive }) =>
                  clsx(
                    'w-full rounded-sm px-2 py-2 flex items-center gap-2 text-sm',
                    isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Equipes
                </span>
              </NavLink>
            </DropdownMenuItem>
          )}

          {showTimeSlots && (
            <DropdownMenuItem asChild>
              <NavLink
                to="time-slots"
                className={({ isActive }) =>
                  clsx(
                    'w-full rounded-sm px-2 py-2 flex items-center gap-2 text-sm',
                    isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horários
                </span>
              </NavLink>
            </DropdownMenuItem>
          )}

          {showHospitals && (
            <DropdownMenuItem asChild>
              <NavLink
                to="hospitals"
                className={({ isActive }) =>
                  clsx(
                    'w-full rounded-sm px-2 py-2 flex items-center gap-2 text-sm',
                    isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  HUF
                </span>
              </NavLink>
            </DropdownMenuItem>
          )}

          {showSectors && (
            <DropdownMenuItem asChild>
              <NavLink
                to="sectors"
                className={({ isActive }) =>
                  clsx(
                    'w-full rounded-sm px-2 py-2 flex items-center gap-2 text-sm',
                    isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Serviços
                </span>
              </NavLink>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </NavigationMenuItem>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const user     = useAuth((s) => s.user);
  const logout   = useAuth((s) => s.logout);

  const isGeneralAdmin = hasRole(user, 'general_admin') || hasRole(user, 'admin');
  const isTeamAdmin    = hasRole(user, 'team_admin');

  const canSeeUsersTop      = isGeneralAdmin;                  
  const canSeeTeams         = isGeneralAdmin;                  
  const canSeeTimeSlots     = isGeneralAdmin;                   
  const canSeeHospitals     = isGeneralAdmin;                   
  const canSeeSectors       = isGeneralAdmin;                  
  const canSeePeople        = isGeneralAdmin || isTeamAdmin;    
  const showCadastros       = canSeePeople || canSeeTeams || canSeeTimeSlots || canSeeHospitals || canSeeSectors;

  const handleLogout = () => {
    try { localStorage.removeItem('hospital_user'); } catch {}
    logout?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                Plantão Certo
              </h1>
              <p className="text-sm text-gray-600">
                {user?.name ? `Olá, ${user.name}` : 'Área restrita'}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-3">
            <NavigationMenu>
              <NavigationMenuList className="flex flex-wrap gap-2">
                <NavItem to="on-duty"   label="Plantonistas" icon={ShieldCheck} />
                <NavItem to="schedules" label="Escalas"      icon={Calendar} />

                {canSeeUsersTop && (
                  <NavItem to="users"   label="Usuários"     icon={Users} />
                )}

                <CadastrosDropdown
                  showPeople={canSeePeople}
                  showTeams={canSeeTeams}
                  showTimeSlots={canSeeTimeSlots}
                  showHospitals={canSeeHospitals}
                  showSectors={canSeeSectors}
                />

                <NavItem to="about" label="Sobre" icon={LayoutDashboard} />
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

        <div className="md:hidden border-t bg-white/70">
          <div className="px-2 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <NavLink
              to="on-duty"
              className={({ isActive }) =>
                clsx(
                  'whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium',
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
                )
              }
            >
              Plantonistas
            </NavLink>

            <NavLink
              to="schedules"
              className={({ isActive }) =>
                clsx(
                  'whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium',
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
                )
              }
            >
              Escalas
            </NavLink>

            {canSeeUsersTop && (
              <NavLink
                to="users"
                className={({ isActive }) =>
                  clsx(
                    'whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
                  )
                }
              >
                Usuários
              </NavLink>
            )}

            <NavLink
              to="about"
              className={({ isActive }) =>
                clsx(
                  'whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium',
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
                )
              }
            >
              Sobre
            </NavLink>

            {showCadastros && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 whitespace-nowrap">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Cadastros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-56">
                  <DropdownMenuLabel>Cadastros</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {canSeePeople && (
                    <DropdownMenuItem asChild>
                      <NavLink to="people" className="w-full rounded-sm px-2 py-1.5">
                        Pessoas
                      </NavLink>
                    </DropdownMenuItem>
                  )}
                  {canSeeTeams && (
                    <DropdownMenuItem asChild>
                      <NavLink to="teams" className="w-full rounded-sm px-2 py-1.5">
                        Equipes
                      </NavLink>
                    </DropdownMenuItem>
                  )}
                  {canSeeTimeSlots && (
                    <DropdownMenuItem asChild>
                      <NavLink to="time-slots" className="w-full rounded-sm px-2 py-1.5">
                        Horários
                      </NavLink>
                    </DropdownMenuItem>
                  )}
                  {canSeeHospitals && (
                    <DropdownMenuItem asChild>
                      <NavLink to="hospitals" className="w-full rounded-sm px-2 py-1.5">
                        HUF
                      </NavLink>
                    </DropdownMenuItem>
                  )}
                  {canSeeSectors && (
                    <DropdownMenuItem asChild>
                      <NavLink to="sectors" className="w-full rounded-sm px-2 py-1.5">
                        Serviços
                      </NavLink>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="outline"
              size="sm"
              className="ml-auto flex-shrink-0"
              onClick={handleLogout}
              title="Encerrar sessão"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
