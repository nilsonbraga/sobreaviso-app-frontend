import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Phone, Users, Clock, RefreshCw, Building, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import clsx from 'clsx';

const VIEW_MODES = {
  TEAM: 'team',
  SERVICE: 'service',
};

function prettyDateTime(d) {
  try {
    return {
      date: d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return { date: '', time: '' };
  }
}

function PersonCard({ person }) {
  return (
    <div className="bg-white/80 rounded-lg p-4 border border-slate-100">
      <p className="font-semibold text-gray-800 mb-2">{person.name}</p>
      {person.phone && (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4" />
          <span className="text-sm">{person.phone}</span>
        </div>
      )}
      {person.timeSlot && (
        <div className="flex items-center gap-2 text-gray-600 mt-1">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {person.timeSlot.description} ({person.timeSlot.startTime} - {person.timeSlot.endTime})
          </span>
        </div>
      )}
    </div>
  );
}

function TeamCard({ teamName, people }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border border-blue-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-inner">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{teamName}</h3>
      </div>
      <div className="space-y-3">
        {people.map((p) => <PersonCard key={p.id} person={p} />)}
      </div>
    </div>
  );
}

export default function OnDutyPreview() {
  const [items, setItems] = useState([]); 
  const [nowTs, setNowTs] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState(VIEW_MODES.TEAM);

  const loadingRef = useRef(false);
  const lastMinuteRef = useRef(currentTime.getMinutes());

  async function loadTodaySchedules() {
    if (loadingRef.current) return;
    try {
      loadingRef.current = true;
      setIsLoading(true);
      const res = await api.get('/public/today');
      const payload = res?.data;
      const data = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
      setItems(Array.isArray(data) ? data : []);
      setNowTs(payload?.now || null);
    } catch (e) {
      toast({
        title: 'Erro ao carregar plantões',
        description: e?.message || 'Não foi possível carregar os plantões atuais.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    loadTodaySchedules();
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const minute = now.getMinutes();
      if (minute !== lastMinuteRef.current) {
        lastMinuteRef.current = minute;
        loadTodaySchedules();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleManualRefresh = () => {
    loadTodaySchedules();
  };

  const active = useMemo(
    () => (Array.isArray(items) ? items.filter((x) => (x?.onDuty?.length || 0) > 0) : []),
    [items]
  );

  const byTeam = active; 

  const byService = useMemo(() => {
    const map = new Map();
    for (const item of active) {
      const sectorId = item?.sector?.id || 'sem_setor';
      if (!map.has(sectorId)) {
        map.set(sectorId, {
          sector: item?.sector ? { ...item.sector } : { id: 'sem_setor', name: 'Sem serviço' },
          teams: [],
        });
      }
      map.get(sectorId).teams.push({ team: item.team, onDuty: item.onDuty });
    }
    const groups = Array.from(map.values());
    groups.sort((a, b) => a.sector.name.localeCompare(b.sector.name, 'pt-BR'));
    for (const g of groups) {
      g.teams.sort((a, b) => a.team.name.localeCompare(b.team.name, 'pt-BR'));
    }
    return groups;
  }, [active]);

  const { date, time } = prettyDateTime(currentTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Plantão Atual</h2>
          <p className="text-gray-500">
            Visualização em tempo real de quem está de sobreaviso.
            {nowTs && (
              <span className="ml-2 text-xs text-gray-400">
                (servidor: {new Date(nowTs).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md flex items-center gap-1',
                viewMode === VIEW_MODES.TEAM ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              )}
              onClick={() => setViewMode(VIEW_MODES.TEAM)}
              title="Exibir agrupado por equipe"
            >
              <Users className="w-4 h-4" />
              Por equipe
            </button>
            <button
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md flex items-center gap-1',
                viewMode === VIEW_MODES.SERVICE ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              )}
              onClick={() => setViewMode(VIEW_MODES.SERVICE)}
              title="Exibir agrupado por serviço"
            >
              <Building className="w-4 h-4" />
              Por serviço
            </button>
          </div>

          <Button onClick={handleManualRefresh} disabled={isLoading} className="flex items-center">
            <RefreshCw className={clsx('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            {isLoading ? 'Atualizando...' : 'Atualizar Agora'}
          </Button>
        </div>
      </div>

      <div className="text-center mb-8 bg-gray-50 p-4 rounded-xl">
        <p className="text-lg uppercase font-light text-blue-500">{date}</p>
        <p className="text-2xl font-bold text-gray-800">{time}</p>
      </div>

      {viewMode === VIEW_MODES.TEAM && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {byTeam.map((item, index) => (
            <motion.div
              key={item.team.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <TeamCard teamName={item.team.name} people={item.onDuty} />
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === VIEW_MODES.SERVICE && (
        <div className="space-y-8">
          {byService.map((group, idx) => (
            <motion.div
              key={group.sector.id || `sector-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white rounded-t-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {group.sector.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {group.teams.length} {group.teams.length === 1 ? 'equipe' : 'equipes'} em plantão
                  </p>
                </div>
              </div>

              <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.teams.map(({ team, onDuty }) => (
                  <TeamCard key={team.id} teamName={team.name} people={onDuty} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {active.length === 0 && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="bg-gray-50 rounded-2xl p-12 max-w-md mx-auto">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhum plantão ativo para o horário atual.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
