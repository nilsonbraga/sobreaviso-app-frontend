import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

const TeamsManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => { loadTeams(); }, []);

  async function loadTeams() {
    try {
      setLoading(true);
      const data = await api.get('/teams'); // GET (livre)
      setTeams(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({
        title: 'Erro ao carregar equipes',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingTeam(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  }

  function openEdit(team) {
    setEditingTeam(team);
    setFormData({ name: team.name || '', description: team.description || '' });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: 'Sem permissão',
        description: 'Apenas administradores podem editar/criar equipes.',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.name.trim()) return;

    try {
      setLoadingSubmit(true);
      if (editingTeam) {
        await api.put(`/teams/${editingTeam.id}`, {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
        });
        toast({ title: 'Equipe atualizada com sucesso!' });
      } else {
        await api.post('/teams', {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
        });
        toast({ title: 'Equipe criada com sucesso!' });
      }
      // Garante que a lista reflete o backend
      await loadTeams();
      // Fecha e reseta
      setIsDialogOpen(false);
      setEditingTeam(null);
      setFormData({ name: '', description: '' });
    } catch (e) {
      toast({
        title: 'Erro ao salvar equipe',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    } finally {
      setLoadingSubmit(false);
    }
  }

  async function handleDelete(id) {
    if (!isAdmin) {
      toast({
        title: 'Sem permissão',
        description: 'Apenas administradores podem remover equipes.',
        variant: 'destructive',
      });
      return;
    }
    const ok = window.confirm('Tem certeza que deseja excluir esta equipe? Essa ação não pode ser desfeita.');
    if (!ok) return;

    try {
      await api.del(`/teams/${id}`);
      await loadTeams();
      toast({ title: 'Equipe removida com sucesso!' });
    } catch (e) {
      toast({
        title: 'Erro ao remover equipe',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    }
  }

  // Fecha modal e reseta form quando usuário clicar fora/ESC
  function handleOpenChange(open) {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTeam(null);
      setFormData({ name: '', description: '' });
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Você não tem permissão para gerenciar equipes.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciar Equipes</h2>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" />
              Nova Equipe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeam ? 'Editar' : 'Nova'} Equipe</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Equipe</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loadingSubmit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loadingSubmit}
                />
              </div>

              <Button type="submit" className="w-full" disabled={!formData.name.trim() || loadingSubmit}>
                {loadingSubmit ? 'Salvando...' : editingTeam ? 'Atualizar' : 'Criar'} Equipe
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <div className="text-sm text-gray-500">Carregando equipes...</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{team.name}</h3>
                  {team.description && <p className="text-sm text-gray-500">{team.description}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(team)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(team.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && teams.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma equipe cadastrada ainda</p>
        </div>
      )}
    </motion.div>
  );
};

export default TeamsManagement;
