import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

const TimeSlotManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    startTime: '',
    endTime: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTimeSlots(); }, []);

  async function loadTimeSlots() {
    try {
      setLoading(true);
      const data = await api.get('/timeslots'); 
      setTimeSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({
        title: 'Erro ao carregar horários',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingSlot(null);
    setFormData({ description: '', startTime: '', endTime: '' });
    setIsDialogOpen(true);
  }

  function openEdit(slot) {
    setEditingSlot(slot);
    setFormData({
      description: slot.description || '',
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
    });
    setIsDialogOpen(true);
  }

  function handleOpenChange(open) {
    setIsDialogOpen(open);
    if (!open) {
      setEditingSlot(null);
      setFormData({ description: '', startTime: '', endTime: '' });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: 'Sem permissão',
        description: 'Apenas administradores podem criar/editar horários.',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.description.trim() || !formData.startTime || !formData.endTime) return;

    try {
      setSaving(true);

      const payload = {
        description: formData.description.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      if (editingSlot) {
        await api.put(`/timeslots/${editingSlot.id}`, payload);
        toast({ title: 'Horário atualizado com sucesso!' });
      } else {
        await api.post('/timeslots', payload);
        toast({ title: 'Horário criado com sucesso!' });
      }

      await loadTimeSlots();
      setIsDialogOpen(false);
      setEditingSlot(null);
      setFormData({ description: '', startTime: '', endTime: '' });
    } catch (e) {
      toast({
        title: 'Erro ao salvar horário',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!isAdmin) {
      toast({
        title: 'Sem permissão',
        description: 'Apenas administradores podem remover horários.',
        variant: 'destructive',
      });
      return;
    }
    const ok = window.confirm('Tem certeza que deseja excluir este horário?');
    if (!ok) return;

    try {
      await api.del(`/timeslots/${id}`);
      await loadTimeSlots();
      toast({ title: 'Horário removido com sucesso!' });
    } catch (e) {
      toast({
        title: 'Erro ao remover horário',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Você não tem permissão para gerenciar horários.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciar Horários</h2>

        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" />
              Novo Horário
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSlot ? 'Editar' : 'Novo'} Horário</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Ex: Sobreaviso Diurno"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Hora de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de Término</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving || !formData.description.trim()}>
                {saving ? 'Salvando...' : editingSlot ? 'Atualizar' : 'Criar'} Horário
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <div className="text-sm text-gray-500">Carregando horários...</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timeSlots.map((slot, index) => (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{slot.description}</h3>
                  <p className="text-sm text-gray-500">
                    {slot.startTime} - {slot.endTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(slot)} className="flex-1">
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(slot.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && timeSlots.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum horário cadastrado ainda</p>
        </div>
      )}
    </motion.div>
  );
};

export default TimeSlotManagement;
