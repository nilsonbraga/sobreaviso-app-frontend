import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, User, Filter, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

const hospitalLabel = (h) => (h?.sigla || h?.name || h?.huf || h?.uo || '');

const PeopleManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userTeamId = user?.teamId || '';

  const [people, setPeople] = useState([]);
  const [teams, setTeams] = useState([]);
  const [sectors, setSectors] = useState([]);

  // modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    teamId: '',
    matricula: '',
    cargo: '',
  });

  // filtros + busca + view
  const [filters, setFilters] = useState({
    sectorId: 'all',                      // agora filtra via setores da EQUIPE da pessoa
    teamId: isAdmin ? 'all' : (userTeamId || 'all'),
  });
  const [query, setQuery] = useState('');
  const [view, setView] = useState('cards'); // 'cards' | 'table'
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [peopleRes, teamsRes, sectorsRes] = await Promise.all([
        api.get('/people'),
        api.get('/teams'),     // precisa vir com team.sectors
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
    setFormData({
      name: '',
      phone: '',
      teamId: isAdmin ? '' : userTeamId,
      matricula: '',
      cargo: '',
    });
    setIsDialogOpen(true);
  }

  function openEdit(person) {
    setEditingPerson(person);
    setFormData({
      name: person.name || '',
      phone: person.phone || '',
      teamId: person.teamId || (isAdmin ? '' : userTeamId),
      matricula: person.matricula || '',
      cargo: person.cargo || '',
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      name: formData.name,
      phone: formData.phone,
      teamId: isAdmin ? formData.teamId : userTeamId,
      matricula: formData.matricula || null,
      cargo: formData.cargo || null,
      // sectorId removido — serviço é inferido via equipe
    };

    if (!payload.teamId) {
      toast({ title: 'Selecione a equipe', variant: 'destructive' });
      return;
    }

    try {
      if (editingPerson) {
        const updated = await api.put(`/people/${editingPerson.id}`, payload);
        setPeople(prev => prev.map(p => (p.id === editingPerson.id ? updated : p)));
        toast({ title: 'Pessoa atualizada com sucesso!' });
      } else {
        const created = await api.post('/people', payload);
        setPeople(prev => [...prev, created]);
        toast({ title: 'Pessoa cadastrada com sucesso!' });
      }

      setIsDialogOpen(false);
      setEditingPerson(null);
      setFormData({
        name: '',
        phone: '',
        teamId: isAdmin ? '' : userTeamId,
        matricula: '',
        cargo: '',
      });
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

  // dicionários auxiliares
  const teamById = useMemo(
    () => Object.fromEntries((teams || []).map(t => [String(t.id), t])),
    [teams]
  );

  // serviços (setores) derivados da equipe da pessoa
  const getTeamSectors = (teamId) => {
    const t = teamById[String(teamId)];
    return Array.isArray(t?.sectors) ? t.sectors : [];
  };

  // ---- filtro por Serviço agora via setores da equipe da pessoa ----
  const visiblePeople = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (people || []).filter(person => {
      // filtro por equipe
      const teamMatch = filters.teamId === 'all' || String(person.teamId) === String(filters.teamId);
      if (!teamMatch) return false;

      // filtro por serviço (via equipe)
      if (filters.sectorId !== 'all') {
        const tSectors = getTeamSectors(person.teamId);
        const hasSector = tSectors.some(s => String(s.id) === String(filters.sectorId));
        if (!hasSector) return false;
      }

      if (!q) return true;

      const t = teamById[String(person.teamId)];
      const tSectors = getTeamSectors(person.teamId);
      const sectorsStr = tSectors.map(s => s.name).join(' ');
      const hospitalsStr = tSectors
        .map(s => (s.hospital ? hospitalLabel(s.hospital) : ''))
        .filter(Boolean)
        .join(' ');

      const haystack = [
        person.name,
        person.phone,
        person.matricula,
        person.cargo,
        t?.name,
        sectorsStr,
        hospitalsStr,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [people, filters, query, teamById]);

  const sectorOptions = sectors; // para o dropdown de filtro por serviço

  // string auxiliar para exibir serviços/hospitais do card/linha
  const servicesLabel = (teamId) => {
    const list = getTeamSectors(teamId);
    if (!list.length) return 'Sem serviço';
    return list.map(s => s.name).join(', ');
  };
  const hospitalsLabel = (teamId) => {
    const list = getTeamSectors(teamId);
    const labels = list
      .map(s => (s.hospital ? hospitalLabel(s.hospital) : null))
      .filter(Boolean);
    if (!labels.length) return '—';
    // se vários, mostra distintos
    return Array.from(new Set(labels)).join(', ');
  };

  // serviços da equipe selecionada no FORM (chips somente leitura)
  const selectedTeamServices = useMemo(() => getTeamSectors(formData.teamId), [formData.teamId, teams]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gerenciar Pessoas</h2>
          <p className="text-sm text-gray-500">Serviço é definido pela equipe vinculada.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />

            {/* Filtro por Serviço (via equipe) */}
            <Select
              value={filters.sectorId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sectorId: value }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Serviços</SelectItem>
                {sectorOptions.map(sector => (
                  <SelectItem key={String(sector.id)} value={String(sector.id)}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Equipe */}
            <Select
              value={filters.teamId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, teamId: value }))}
              disabled={!isAdmin}
            >
              <SelectTrigger className="w-[200px] md:w-[200px]">
                <SelectValue placeholder="Filtrar por equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Equipes</SelectItem>
                {teams.map(team => (
                  <SelectItem key={String(team.id)} value={String(team.id)}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Busca */}
          <Input
            placeholder="Buscar por nome, matrícula, cargo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[240px]"
          />

          {/* Novo */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                {/* Equipe */}
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
                        <SelectItem key={String(team.id)} value={String(team.id)}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Serviços da equipe (somente leitura) */}
                <div className="space-y-2">
                  <Label>Serviço(s) da equipe</Label>
                  {selectedTeamServices.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedTeamServices.map((s) => (
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
                    <p className="text-xs text-gray-500">Nenhum serviço vinculado a esta equipe.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!formData.name.trim() || !(isAdmin ? formData.teamId : userTeamId)}
                >
                  {editingPerson ? 'Atualizar' : 'Cadastrar'} Pessoa
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Carregando pessoas...</div>}

      {/* Alternador de visualização */}
      <Tabs value={view} onValueChange={setView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="cards" className="gap-1"><LayoutGrid className="w-4 h-4" /> Cards</TabsTrigger>
          <TabsTrigger value="table" className="gap-1"><TableIcon className="w-4 h-4" /> Tabela</TabsTrigger>
        </TabsList>

        {/* CARDS */}
        <TabsContent value="cards">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePeople.map((person, index) => {
              const team = teamById[String(person.teamId)];
              return (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100 h-full flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{person.name}</h3>
                      <p className="text-sm text-gray-500">{person.phone}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {person.matricula ? <span><b>Matrícula:</b> {person.matricula}</span> : null}
                        {person.matricula && person.cargo ? ' • ' : ''}
                        {person.cargo ? <span><b>Cargo:</b> {person.cargo}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Serviço:</strong> {servicesLabel(person.teamId)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Hospital:</strong> {hospitalsLabel(person.teamId)}
                    </p>
                    <p className="text-sm text-gray-600"><strong>Equipe:</strong> {team?.name || 'N/A'}</p>
                  </div>

                  <div className="mt-auto flex gap-2 pt-2">
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

          {!loading && visiblePeople.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl mt-4">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma pessoa encontrada.</p>
            </div>
          )}
        </TabsContent>

        {/* TABELA */}
        <TabsContent value="table">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 px-2">Nome</th>
                    <th className="py-2 px-2">Telefone</th>
                    <th className="py-2 px-2">Matrícula</th>
                    <th className="py-2 px-2">Cargo</th>
                    <th className="py-2 px-2">Serviço(s)</th>
                    <th className="py-2 px-2">Hospital(ais)</th>
                    <th className="py-2 px-2">Equipe</th>
                    <th className="py-2 px-2 w-40 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePeople.map(person => {
                    const team = teamById[String(person.teamId)];
                    return (
                      <tr key={person.id} className="border-b last:border-0">
                        <td className="py-2 px-2">{person.name}</td>
                        <td className="py-2 px-2">{person.phone || '—'}</td>
                        <td className="py-2 px-2">{person.matricula || '—'}</td>
                        <td className="py-2 px-2">{person.cargo || '—'}</td>
                        <td className="py-2 px-2">{servicesLabel(person.teamId)}</td>
                        <td className="py-2 px-2">{hospitalsLabel(person.teamId)}</td>
                        <td className="py-2 px-2">{team?.name || '—'}</td>
                        <td className="py-2 px-2">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(person)}>
                              <Edit className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(person.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && visiblePeople.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">Nenhuma pessoa encontrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default PeopleManagement;
