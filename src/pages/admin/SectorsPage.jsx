import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth'; // <-- para checar se está logado

const SectorManagement = () => {
  const { user } = useAuth(); // se precisar bloquear ações sem login
  const [sectors, setSectors] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSectors(); 
  }, []);

  async function loadSectors() {
    try {
      setLoading(true);
      const data = await api.get('/sectors'); // GET backend (livre)
      setSectors(data);
    } catch (e) {
      toast({ title: 'Erro ao carregar serviços', description: e?.message || '', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Sessão expirada', description: 'Faça login novamente.', variant: 'destructive' });
      return;
    }
    try {
      if (editingSector) {
        const updated = await api.put(`/sectors/${editingSector.id}`, { name: formData.name });
        setSectors(prev => prev.map(s => (s.id === editingSector.id ? updated : s)));
        toast({ title: 'Serviço atualizado com sucesso!' });
      } else {
        const created = await api.post('/sectors', { name: formData.name });
        setSectors(prev => [...prev, created]);
        toast({ title: 'Serviço criado com sucesso!' });
      }
      setIsDialogOpen(false);
      setEditingSector(null);
      setFormData({ name: '' });
    } catch (e) {
      toast({ title: 'Erro ao salvar serviço', description: e?.message || '', variant: 'destructive' });
    }
  }

  function handleEdit(sector) {
    setEditingSector(sector);
    setFormData({ name: sector.name });
    setIsDialogOpen(true);
  }

  async function handleDelete(id) {
    if (!user) {
      toast({ title: 'Sessão expirada', description: 'Faça login novamente.', variant: 'destructive' });
      return;
    }
    try {
      await api.del(`/sectors/${id}`);
      setSectors(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Serviço removido com sucesso!' });
    } catch (e) {
      toast({ title: 'Erro ao remover serviço', description: e?.message || '', variant: 'destructive' });
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciar Serviços</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                setEditingSector(null);
                setFormData({ name: '' });
              }}
            >
              <Plus className="w-4 h-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSector ? 'Editar' : 'Novo'} Serviço</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={!formData.name.trim()}>
                {editingSector ? 'Atualizar' : 'Criar'} Serviço
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <div className="text-sm text-gray-500">Carregando serviços...</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectors.map((sector, index) => (
          <motion.div
            key={sector.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-800">{sector.name}</h3>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(sector)} className="flex-1">
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(sector.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && sectors.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum serviço cadastrado ainda</p>
        </div>
      )}
    </motion.div>
  );
};

export default SectorManagement;
