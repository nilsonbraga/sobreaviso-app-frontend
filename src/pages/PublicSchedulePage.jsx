import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Phone, Users, Clock, LogIn, Building } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const VIEW_MODES = {
  TEAM: 'team',
  SERVICE: 'service',
};

function PersonCard({ person }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-lg p-4">
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

function TeamCard({ title, people, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/20 transition-all hover:scale-[1.01] border border-blue-100"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-500 rounded-xl flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-3">
        {people.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>
    </motion.div>
  );
}

const PublicSchedule = ({ onLoginClick }) => {
  const [items, setItems] = useState([]); // [{ team, sector, onDuty }]
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState(VIEW_MODES.TEAM);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (typeof onLoginClick === 'function') return onLoginClick();
    navigate('/login');
  };

  async function loadTodaySchedules() {
    try {
      const res = await api.get('/public/today');
      const payload = res?.data;
      if (payload?.now) setCurrentTime(new Date(payload.now));
      const data = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      setItems(data);
    } catch (e) {
      toast({
        title: 'Erro ao carregar plantões públicos',
        description: e?.message || '',
        variant: 'destructive',
      });
    }
  }

  useEffect(() => {
    loadTodaySchedules();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      loadTodaySchedules();
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const active = useMemo(
    () => (Array.isArray(items) ? items.filter((x) => (x?.onDuty?.length || 0) > 0) : []),
    [items]
  );

  // Agrupado por serviço
  const byService = useMemo(() => {
    const map = new Map();
    for (const item of active) {
      const sid = item?.sector?.id || 'sem_setor';
      if (!map.has(sid)) {
        map.set(sid, {
          sector: item?.sector ? { ...item.sector } : { id: 'sem_setor', name: 'Sem serviço' },
          teams: [],
        });
      }
      map.get(sid).teams.push({ team: item.team, onDuty: item.onDuty });
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => a.sector.name.localeCompare(b.sector.name, 'pt-BR'));
    for (const g of arr) {
      g.teams.sort((a, b) => a.team.name.localeCompare(b.team.name, 'pt-BR'));
    }
    return arr;
  }, [active]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-600 to-sky-600 py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div />
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-white/10 backdrop-blur p-1 border border-white/20">
              <button
                className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 text-white transition ${
                  viewMode === VIEW_MODES.TEAM ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'
                }`}
                onClick={() => setViewMode(VIEW_MODES.TEAM)}
                title="Exibir agrupado por equipe"
              >
                <Users className="w-4 h-4" />
                Por equipe
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 text-white transition ${
                  viewMode === VIEW_MODES.SERVICE ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'
                }`}
                onClick={() => setViewMode(VIEW_MODES.SERVICE)}
                title="Exibir agrupado por serviço"
              >
                <Building className="w-4 h-4" />
                Por serviço
              </button>
            </div>

            <Button
              onClick={handleLogin}
              size="sm"
              variant="secondary"
              className="h-8 bg-white/15 hover:bg-white/25 text-white border-none shadow-none"
              title="Entrar na área administrativa"
            >
              <LogIn className="w-3.5 h-3.5 mr-1" />
              Entrar
            </Button>
          </div>
        </div>

        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full mb-6"
          >
            <Calendar className="w-6 h-6 text-white" />
            <span className="text-white font-semibold">
              {currentTime.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </motion.div>

          <h1 className="text-5xl font-bold text-white mb-4">Plantões de Hoje</h1>
          <p className="text-xl text-white/90">
            Quem está de sobreaviso agora (
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
          </p>
        </div>

        {/* Por equipe */}
        {viewMode === VIEW_MODES.TEAM && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((item, index) => (
              <TeamCard
                key={item.team.id}
                title={item.team.name}
                people={item.onDuty}
                delay={index * 0.08}
              />
            ))}
          </div>
        )}

        {/* Por serviço */}
        {viewMode === VIEW_MODES.SERVICE && (
          <div className="space-y-8">
            {byService.map((group, idx) => (
              <motion.div
                key={group.sector.id || `sector-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur shadow-xl"
              >
                <div className="px-6 py-4 border-b border-white/20 rounded-t-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/80 flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {group.sector.name}
                    </h3>
                    <p className="text-xs text-white/80">
                      {group.teams.length} {group.teams.length === 1 ? 'equipe' : 'equipes'} em plantão
                    </p>
                  </div>
                </div>

                <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.teams.map(({ team, onDuty }, i2) => (
                    <TeamCard key={team.id} title={team.name} people={onDuty} delay={i2 * 0.04} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {active.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 max-w-md mx-auto">
              <Calendar className="w-16 h-16 text-white/70 mx-auto mb-4" />
              <p className="text-white text-lg">Nenhum plantão ativo para o horário atual.</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PublicSchedule;
