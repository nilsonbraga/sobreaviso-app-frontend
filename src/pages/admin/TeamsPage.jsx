import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

const hospitalLabel = (h) => (h?.sigla || h?.name || h?.huf || h?.uo || '');

const TeamsManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [teams, setTeams] = useState([]);
  const [sectors, setSectors] = useState([]);

  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', sectorIds: [] });
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [sectorPickerOpen, setSectorPickerOpen] = useState(false);
  const [sectorQuery, setSectorQuery] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [t, s] = await Promise.all([api.get('/teams'), api.get('/sectors')]);
      setTeams(Array.isArray(t) ? t : []);
      setSectors(Array.isArray(s) ? s : []);
    } catch (e) {
      toast({
        title: 'Erro ao carregar dados',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingTeam(null);
    setFormData({ name: '', description: '', sectorIds: [] });
    setIsDialogOpen(true);
  }

  function openEdit(team) {
    setEditingTeam(team);
    setFormData({
      name: team.name || '',
      description: team.description || '',
      sectorIds: (team.sectors || []).map(s => String(s.id)),
    });
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
    const name = formData.name.trim();
    if (!name) return;

    try {
      setLoadingSubmit(true);
      const payload = {
        name,
        description: formData.description?.trim() || null,
        sectorIds: Array.from(new Set((formData.sectorIds || []).map(String))), 
      };

      if (editingTeam) {
        await api.put(`/teams/${editingTeam.id}`, payload);
        toast({ title: 'Equipe atualizada com sucesso!' });
      } else {
        await api.post('/teams', payload);
        toast({ title: 'Equipe criada com sucesso!' });
      }

      await loadAll(); 
      setIsDialogOpen(false);
      setEditingTeam(null);
      setFormData({ name: '', description: '', sectorIds: [] });
      setSectorPickerOpen(false);
      setSectorQuery('');
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
      await loadAll();
      toast({ title: 'Equipe removida com sucesso!' });
    } catch (e) {
      toast({
        title: 'Erro ao remover equipe',
        description: e?.response?.data?.message || e?.message || '',
        variant: 'destructive',
      });
    }
  }

  function handleOpenChange(open) {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTeam(null);
      setFormData({ name: '', description: '', sectorIds: [] });
      setSectorPickerOpen(false);
      setSectorQuery('');
    }
  }

  const filteredSectors = useMemo(() => {
    const q = sectorQuery.trim().toLowerCase();
    if (!q) return sectors;
    return sectors.filter(s => {
      const base = `${s.name || ''} ${hospitalLabel(s.hospital)}`.toLowerCase();
      return base.includes(q);
    });
  }, [sectorQuery, sectors]);

  const toggleSector = (id) => {
    setFormData(prev => {
      const sid = String(id);
      const exists = prev.sectorIds.includes(sid);
      return {
        ...prev,
        sectorIds: exists ? prev.sectorIds.filter(x => x !== sid) : [...prev.sectorIds, sid],
      };
    });
  };

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

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div className="space-y-2">
                <Label>Serviços (Setores) vinculados</Label>
                <Popover open={sectorPickerOpen} onOpenChange={setSectorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between">
                      {formData.sectorIds.length
                        ? `${formData.sectorIds.length} selecionado(s)`
                        : 'Selecionar serviços'}
                      <ChevronDown className="w-4 h-4 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[420px] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <Input
                        placeholder="Buscar serviço/hospital…"
                        value={sectorQuery}
                        onChange={(e) => setSectorQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                      {filteredSectors.map((s) => {
                        const checked = formData.sectorIds.includes(String(s.id));
                        return (
                          <label
                            key={String(s.id)}
                            className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleSector(String(s.id))}
                            />
                            <div className="text-sm">
                              <div className="font-medium text-gray-800">{s.name}</div>
                              <div className="text-xs text-gray-500">
                                {s.hospital ? hospitalLabel(s.hospital) : 'Sem hospital'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                      {filteredSectors.length === 0 && (
                        <div className="text-xs text-gray-500 p-2">Nenhum serviço encontrado.</div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setSectorPickerOpen(false)}>
                        Fechar
                      </Button>
                      <Button type="button" onClick={() => setSectorPickerOpen(false)}>
                        Aplicar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {formData.sectorIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {formData.sectorIds.map((sid) => {
                      const s = sectors.find(x => String(x.id) === String(sid));
                      if (!s) return null;
                      return (
                        <span
                          key={sid}
                          className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs"
                          title={s.hospital ? hospitalLabel(s.hospital) : 'Sem hospital'}
                        >
                          {s.name}
                          <button
                            type="button"
                            onClick={() => toggleSector(sid)}
                            className="hover:text-blue-900"
                            aria-label="Remover"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
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
            transition={{ delay: index * 0.06 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100 h-full flex flex-col"
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

            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500">Serviços vinculados</p>
              {Array.isArray(team.sectors) && team.sectors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {team.sectors.map((s) => (
                    <span
                      key={String(s.id)}
                      className="inline-flex items-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-full px-3 py-1 text-xs"
                      title={s.hospital ? hospitalLabel(s.hospital) : 'Sem hospital'}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Nenhum serviço vinculado</p>
              )}
            </div>

            <div className="mt-auto flex gap-2">
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
