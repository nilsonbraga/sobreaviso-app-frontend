// src/pages/admin/PanelPage.jsx
import React from 'react';
import {
  LayoutDashboard, ShieldCheck, Users, UserCog, Building, Calendar, Clock, Info,
} from 'lucide-react';
import useAuth from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

function PrimaryLinkButton({ to, icon: Icon, children }) {
  const content = (
    <Button
      className="w-full h-11 justify-start"
      // variant default = seu "primary" azul (igual ao screenshot)
      // se no seu projeto o primary for outro, troque para variant="default"
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </Button>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminPanelPage() {
  const user = useAuth((s) => s.user);

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Intro */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-medium text-slate-700">Sobre o Sistema</h2>
          </div>
          <div className="p-4 text-slate-700 leading-relaxed space-y-3">
            <p>
              Sistema para gestão de <em>plantões, equipes, pessoas, serviços e horários</em>.
              A <strong>grade pública</strong> mostra o plantonista do dia; o <strong>painel</strong> concentra cadastros e a montagem das escalas.
            </p>
            <p className="text-sm">
              <span className="inline-flex items-center gap-2 rounded-md px-2 py-1 bg-sky-50 text-sky-800 ring-1 ring-sky-100">
                <ShieldCheck className="w-4 h-4" />
                Idealizado para gerenciar as escalas de sobreaviso da <strong>EBSERH</strong> pelo <strong>SETISD do CH-UFC</strong>.
              </span>
            </p>
          </div>
        </section>

        {/* Ações rápidas — todos como PRIMARY padrão */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-medium text-slate-700">Ações rápidas</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <PrimaryLinkButton to="/admin/schedules" icon={Calendar}>
              Montar / revisar escalas
            </PrimaryLinkButton>
            <PrimaryLinkButton to="/admin/teams" icon={Users}>
              Gerenciar equipes
            </PrimaryLinkButton>
            <PrimaryLinkButton to="/admin/people" icon={UserCog}>
              Gerenciar pessoas
            </PrimaryLinkButton>
            <PrimaryLinkButton to="/admin/sectors" icon={Building}>
              Gerenciar serviços
            </PrimaryLinkButton>
            <PrimaryLinkButton to="/admin/time-slots" icon={Clock}>
              Configurar horários
            </PrimaryLinkButton>
            <PrimaryLinkButton to="/admin/on-duty" icon={ShieldCheck}>
              Ver plantonista atual
            </PrimaryLinkButton>
          </div>
        </section>

        {/* Passo a passo com azuis suaves */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-medium text-slate-700">Como funciona</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 ring-1 ring-sky-100 bg-gradient-to-br from-sky-50 to-white">
              <div className="text-xs font-medium text-sky-700">1. Cadastre</div>
              <p className="text-sm text-slate-700 mt-1">
                Registre <strong>Equipes</strong>, <strong>Pessoas</strong>, <strong>Serviços</strong> e <strong>Horários</strong>.
              </p>
            </div>
            <div className="rounded-lg p-4 ring-1 ring-blue-100 bg-gradient-to-br from-blue-50 to-white">
              <div className="text-xs font-medium text-blue-700">2. Monte a escala</div>
              <p className="text-sm text-slate-700 mt-1">
                Defina quem cobre cada período (diurno/noturno) ao longo do mês.
              </p>
            </div>
            <div className="rounded-lg p-4 ring-1 ring-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
              <div className="text-xs font-medium text-indigo-700">3. Publique</div>
              <p className="text-sm text-slate-700 mt-1">
                A grade pública exibe o <strong>plantonista do dia</strong>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
