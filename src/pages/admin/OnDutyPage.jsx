import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Phone, Users, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const OnDutyPreview = () => {
  const [todaySchedules, setTodaySchedules] = useState([]); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const loadingRef = useRef(false);
  const lastMinuteRef = useRef(currentTime.getMinutes());

  async function loadTodaySchedules() {
    if (loadingRef.current) return; 
    try {
      loadingRef.current = true;
      setIsLoading(true);
      const res = await api.get('/public/today');
      setTodaySchedules(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      toast({
        title: 'Erro ao carregar plantões',
        description: e?.message || '',
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

  const activeTeams = todaySchedules.filter(item => (item?.onDuty?.length || 0) > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Plantão Atual</h2>
          <p className="text-gray-500">Visualização em tempo real de quem está de sobreaviso.</p>
        </div>
       <Button onClick={loadTodaySchedules} disabled={isLoading} className="flex items-center">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Atualizando...' : 'Atualizar Agora'}
        </Button>
      </div>

      <div className="text-center mb-8 bg-gray-50 p-4 rounded-lg">
        <p className="text-lg uppercase font-light text-blue-500">
          {currentTime.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p className="text-2xl font-bold text-gray-800">
          {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTeams.map((item, index) => (
          <motion.div
            key={item.team.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{item.team.name}</h3>
            </div>

            <div className="space-y-3">
              {item.onDuty.map(person => (
                <div key={person.id} className="bg-white/80 rounded-lg p-4">
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

      {activeTeams.length === 0 && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="bg-gray-50 rounded-2xl p-12 max-w-md mx-auto">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhum plantão ativo para o horário atual.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OnDutyPreview;
