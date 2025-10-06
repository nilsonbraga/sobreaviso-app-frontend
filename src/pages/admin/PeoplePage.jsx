import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, User, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

const PeopleManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userTeamId = user?.teamId || '';

  const [people, setPeople] = useState([]);
  const [teams, setTeams] = useState([]);
  const [sectors, setSectors] = useState([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    sectorId: '',
    teamId: ''
  });

  const [filters, setFilters] = useState({ sectorId: 'all', teamId: isAdmin ? 'all' : (userTeamId || 'all') });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [peopleRes, teamsRes, sectorsRes] = await Promise.all([
        api.get('/people'),   // lista completa no backend
        api.get('/teams'),
        api.get('/sectors'),
      ]);

      setSectors(sectorsRes || []);

      if (isAdmin) {
        setPeople(peopleRes || []);
        setTeams(teamsRes || []);
      } else {
        setPeople((peopleRes || []).filter(p => p.teamId === userTeamId));
        setTeams((teamsRes || []).filter(t => t.id === userTeamId));
      }
    } catch (e) {
      toast({ title: 'Erro ao carregar dados', description: e?.message || '', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingPerson(null);
    setFormData({ name: '', phone: '', sectorId: '', teamId: isAdmin ? '' : userTeamId });
    setIsDialogOpen(true);
  }

  function openEdit(person) {
    setEditingPerson(person);
    setFormData({
      name: person.name || '',
      phone: person.phone || '',
      sectorId: person.sectorId || '',
      teamId: person.teamId || (isAdmin ? '' : userTeamId),
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // segurança: não-admin sempre salva na própria equipe
    const payload = {
      name: formData.name,
      phone: formData.phone,
      sectorId: formData.sectorId,
      teamId: isAdmin ? formData.teamId : userTeamId,
    };

    if (!payload.teamId) {
      toast({ title: 'Selecione a equipe', variant: 'destructive' });
      return;
    }

    try {
      if (editingPerson) {
        // PUT /people/:id
        const updated = await api.put(`/people/${editingPerson.id}`, payload);
        setPeople(prev => prev.map(p => (p.id === editingPerson.id ? updated : p)));
        toast({ title: 'Pessoa atualizada com sucesso!' });
      } else {
        // POST /people
        const created = await api.post('/people', payload);
        setPeople(prev => [...prev, created]);
        toast({ title: 'Pessoa cadastrada com sucesso!' });
      }

      setIsDialogOpen(false);
      setEditingPerson(null);
      setFormData({ name: '', phone: '', sectorId: '', teamId: isAdmin ? '' : userTeamId });
    } catch (e) {
      toast({ title: 'Erro ao salvar pessoa', description: e?.message || '', variant: 'destructive' });
    }
  }

  async function handleDelete(id) {
    try {
      await api.del(`/people/${id}`);
      setPeople(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Pessoa removida com sucesso!' });
    } catch (e) {
      toast({ title: 'Erro ao remover pessoa', description: e?.message || '', variant: 'destructive' });
    }
  }

  const filteredPeople = (people || []).filter(person => {
    const sectorMatch = filters.sectorId === 'all' || person.sectorId === filters.sectorId;
    const teamMatch = filters.teamId === 'all' || person.teamId === filters.teamId;
    return sectorMatch && teamMatch;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciar Pessoas</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            {/* Filtro por Setor */}
            <Select
              value={filters.sectorId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sectorId: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Serviços</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Equipe */}
            <Select
              value={filters.teamId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, teamId: value }))}
              disabled={!isAdmin}
            >
              <SelectTrigger className="w:[180px] md:w-[180px]">
                <SelectValue placeholder="Filtrar por equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Equipes</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openNew}>
                <Plus className="w-4 h-4" />
                Nova Pessoa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPerson ? 'Editar' : 'Nova'} Pessoa</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Serviço</Label>
                  <Select
                    value={formData.sectorId}
                    onValueChange={(value) => setFormData({ ...formData, sectorId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map(sector => (
                        <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Equipe</Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                    required
                    disabled={!isAdmin && !!userTeamId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={!formData.name.trim() || !formData.sectorId || !(isAdmin ? formData.teamId : userTeamId)}>
                  {editingPerson ? 'Atualizar' : 'Cadastrar'} Pessoa
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Carregando pessoas...</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeople.map((person, index) => {
          const team = teams.find(t => t.id === person.teamId);
          const sector = sectors.find(s => s.id === person.sectorId);
          return (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{person.name}</h3>
                    <p className="text-sm text-gray-500">{person.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600"><strong>Serviço:</strong> {sector?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Equipe:</strong> {team?.name || 'N/A'}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(person)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(person.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && filteredPeople.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma pessoa encontrada com os filtros selecionados.</p>
        </div>
      )}
    </motion.div>
  );
};

export default PeopleManagement;
