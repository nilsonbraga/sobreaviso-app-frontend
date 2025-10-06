import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

const UsersManagement = () => {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',       // obrigatório só no create
    role: 'team_admin', // padrão
    teamId: '',         // obrigatório se role === 'team_admin'
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [usersRes, teamsRes] = await Promise.all([
        api.get('/users'),
        api.get('/teams'),
      ]);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setTeams(Array.isArray(teamsRes) ? teamsRes : []);
    } catch (e) {
      toast({
        title: 'Erro ao carregar usuários/equipes',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'team_admin',
      teamId: '',
    });
    setIsDialogOpen(true);
  }

  function openEdit(u) {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '', // ao editar deixamos vazio (opcional)
      role: u.role || 'team_admin',
      teamId: u.teamId || '',
    });
    setIsDialogOpen(true);
  }

  function handleOpenChange(open) {
    setIsDialogOpen(open);
    if (!open) {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'team_admin',
        teamId: '',
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: 'Sem permissão',
        description: 'Apenas administradores podem criar/editar usuários.',
        variant: 'destructive',
      });
      return;
    }

    // validação simples
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({ title: 'Preencha nome e e-mail', variant: 'destructive' });
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      toast({ title: 'Defina uma senha para o novo usuário', variant: 'destructive' });
      return;
    }
    if (formData.role === 'team_admin' && !formData.teamId) {
      toast({ title: 'Selecione uma equipe para o Admin de Equipe', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        // PUT /users/:id (senha opcional)
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          teamId: formData.role === 'team_admin' ? formData.teamId : null,
        };
        if (formData.password.trim()) payload.password = formData.password.trim();

        await api.put(`/users/${editingUser.id}`, payload);
        toast({ title: 'Usuário atualizado com sucesso!' });
      } else {
        // POST /users (senha obrigatória)
        await api.post('/users', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: formData.role,
          teamId: formData.role === 'team_admin' ? formData.teamId : null,
        });
        toast({ title: 'Usuário criado com sucesso!' });
      }

      await loadData();
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'team_admin', teamId: '' });
    } catch (e) {
      toast({
        title: 'Erro ao salvar usuário',
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
        description: 'Apenas administradores podem remover usuários.',
        variant: 'destructive',
      });
      return;
    }
    if (id === me?.id) {
      toast({
        title: 'Operação bloqueada',
        description: 'Você não pode excluir a si mesmo.',
        variant: 'destructive',
      });
      return;
    }
    const ok = window.confirm('Tem certeza que deseja excluir este usuário?');
    if (!ok) return;

    try {
      await api.del(`/users/${id}`);
      await loadData();
      toast({ title: 'Usuário removido com sucesso!' });
    } catch (e) {
      toast({
        title: 'Erro ao remover usuário',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Você não tem permissão para gerenciar usuários.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciar Usuários</h2>

        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar' : 'Novo'} Usuário</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{editingUser ? 'Senha (opcional)' : 'Senha'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Deixe em branco para manter' : ''}
                  required={!editingUser}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Perfil</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value, teamId: value === 'admin' ? '' : formData.teamId })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador Geral</SelectItem>
                    <SelectItem value="team_admin">Administrador de Equipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === 'team_admin' && (
                <div className="space-y-2">
                  <Label htmlFor="team">Equipe</Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'} Usuário
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <div className="text-sm text-gray-500">Carregando usuários...</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u, index) => {
          const team = teams.find(t => t.id === u.teamId);
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${u.role === 'admin' ? 'from-red-500 to-orange-500' : 'from-blue-500 to-sky-500'} rounded-xl flex items-center justify-center`}>
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{u.name}</h3>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Perfil:</strong> {u.role === 'admin' ? 'Admin Geral' : 'Admin de Equipe'}
                </p>
                {u.teamId && (
                  <p className="text-sm text-gray-600">
                    <strong>Equipe:</strong> {team?.name || 'N/A'}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(u)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(u.id)}
                  disabled={u.id === me?.id}
                  title={u.id === me?.id ? 'Você não pode excluir a si mesmo' : 'Excluir'}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && users.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum usuário cadastrado ainda</p>
        </div>
      )}
    </motion.div>
  );
};

export default UsersManagement;
