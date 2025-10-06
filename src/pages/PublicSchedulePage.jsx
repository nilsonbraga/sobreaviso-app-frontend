import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Phone, Users, Clock, LogIn } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PublicSchedule = ({ onLoginClick }) => {
  const [todaySchedules, setTodaySchedules] = useState([]); // [{ team, onDuty: [{id,name,phone,timeSlot}] }]
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const handleLogin = () => {
    if (typeof onLoginClick === 'function') return onLoginClick();
    navigate('/login');
  };

  async function loadTodaySchedules() {
    try {
      // GET /api/public/today -> { now: ISOString, data: [...] }
      const res = await api.get('/public/today');
      if (res?.now) setCurrentTime(new Date(res.now));
      setTodaySchedules(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      toast({ title: 'Erro ao carregar plantões públicos', description: e?.message || '', variant: 'destructive' });
    }
  }

  useEffect(() => {
    loadTodaySchedules();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      loadTodaySchedules();
    }, 60_000); // atualiza a cada minuto
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-600 to-sky-600 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Top bar discreta com botão Entrar */}
        <div className="flex justify-end mb-4">
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
                day: 'numeric' 
              })}
            </span>
          </motion.div>
          
          <h1 className="text-5xl font-bold text-white mb-4">
            Plantões de Hoje
          </h1>
          <p className="text-xl text-white/90">
            Quem está de sobreaviso agora ({currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {todaySchedules.map((item, index) => (
            <motion.div
              key={item.team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/20 transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{item.team.name}</h3>
              </div>

              <div className="space-y-3">
                {item.onDuty.map(person => (
                  <div key={person.id} className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-lg p-4">
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
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {todaySchedules.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 max-w-md mx-auto">
              <Calendar className="w-16 h-16 text-white/70 mx-auto mb-4" />
              <p className="text-white text-lg">
                Nenhum plantão ativo para o horário atual.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PublicSchedule;
