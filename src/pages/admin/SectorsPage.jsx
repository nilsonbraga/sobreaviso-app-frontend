import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building, ArrowUpDown, Table, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

const NONE = '__none__';
const emptyForm = { name: '', hospitalId: NONE };

const SectorManagement = () => {
  const { user } = useAuth();

  const [sectors, setSectors] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('cards'); 
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('name'); 
  const [sortDir, setSortDir] = useState('asc');   

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [sectorsRes, hospitalsRes] = await Promise.all([
        api.get('/sectors'),
        api.get('/hospitals'),
      ]);
      setSectors(Array.isArray(sectorsRes) ? sectorsRes : []);
      setHospitals(Array.isArray(hospitalsRes) ? hospitalsRes : []);
    } catch (e) {
      toast({ title: 'Erro ao carregar serviços', description: e?.message || '', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const hospitalLabel = (h) =>
    (h?.sigla || h?.name || h?.huf || h?.uo || '')?.toString() || '';

  const findHospitalFor = (sector) => {
    if (sector?.hospital) return sector.hospital;
    if (!sector?.hospitalId) return null;
    return hospitals.find(h => String(h.id) === String(sector.hospitalId)) || null;
  };

  function openNew() {
    setEditingSector(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  }

  function handleEdit(sector) {
    setEditingSector(sector);
    setFormData({
      name: sector?.name || '',
      hospitalId: sector?.hospitalId ? String(sector.hospitalId) : NONE,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Sessão expirada', description: 'Faça login novamente.', variant: 'destructive' });
      return;
    }

    const payload = {
      name: formData.name,
      hospitalId: formData.hospitalId === NONE ? null : formData.hospitalId,
    };

    try {
      if (editingSector) {
        const updated = await api.put(`/sectors/${editingSector.id}`, payload);
        setSectors(prev => prev.map(s => (s.id === editingSector.id ? updated : s)));
        toast({ title: 'Serviço atualizado com sucesso!' });
      } else {
        const created = await api.post('/sectors', payload);
        setSectors(prev => [...prev, created]);
        toast({ title: 'Serviço criado com sucesso!' });
      }
      setIsDialogOpen(false);
      setEditingSector(null);
      setFormData(emptyForm);
    } catch (e) {
      toast({ title: 'Erro ao salvar serviço', description: e?.message || '', variant: 'destructive' });
    }
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

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    const base = (sectors || []).filter((s) => {
      const hosp = findHospitalFor(s);
      const text =
        `${s?.name || ''} ${hospitalLabel(hosp)}`.toLowerCase();
      return q ? text.includes(q) : true;
    });

    base.sort((a, b) => {
      let av, bv;
      if (sortKey === 'createdAt') {
        av = new Date(a.createdAt || 0).getTime();
        bv = new Date(b.createdAt || 0).getTime();
      } else if (sortKey === 'hospital') {
        av = hospitalLabel(findHospitalFor(a)).toLowerCase();
        bv = hospitalLabel(findHospitalFor(b)).toLowerCase();
      } else {
        av = String(a?.name || '').toLowerCase();
        bv = String(b?.name || '').toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return base;
  }, [sectors, hospitals, query, sortKey, sortDir]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gerenciar Serviços</h2>
          <p className="text-sm text-gray-500">Cadastre serviços e relacione (opcionalmente) a um hospital.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Buscar por nome ou hospital..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[240px]"
          />
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="createdAt">Data de criação</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            title={`Ordem ${sortDir === 'asc' ? 'ascendente' : 'descendente'}`}
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openNew}>
                <Plus className="w-4 h-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSector ? 'Editar' : 'Novo'} Serviço</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hospital (opcional)</Label>
                  <Select
                    value={formData.hospitalId}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, hospitalId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um hospital (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Sem hospital —</SelectItem>
                      {hospitals.map(h => (
                        <SelectItem key={String(h.id)} value={String(h.id)}>
                          {hospitalLabel(h) || h.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!formData.name.trim()}>
                    {editingSector ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={view} onValueChange={setView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="cards" className="gap-1"><LayoutGrid className="w-4 h-4" /> Cards</TabsTrigger>
          <TabsTrigger value="table" className="gap-1"><Table className="w-4 h-4" /> Tabela</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          {loading ? (
            <div className="text-sm text-gray-500">Carregando serviços...</div>
          ) : filteredSorted.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSorted.map((sector, index) => {
                const hosp = findHospitalFor(sector);
                return (
                  <motion.div
                    key={sector.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100 h-full flex flex-col"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{sector.name}</h3>
                          <p className="text-xs text-gray-500">
                            {hosp ? `Hospital: ${hospitalLabel(hosp)}` : 'Sem hospital'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botões no rodapé */}
                    <div className="mt-auto pt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(sector)} className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(sector.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-gray-600">Nenhum serviço cadastrado ainda</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <div className="bg-white rounded-2xl shadow p-4">
            {loading ? (
              <div className="text-gray-500 text-sm">Carregando…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 px-2">Serviço</th>
                      <th className="py-2 px-2">Hospital</th>
                      <th className="py-2 px-2 w-40 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSorted.map((sector) => {
                      const hosp = findHospitalFor(sector);
                      return (
                        <tr key={sector.id} className="border-b last:border-0">
                          <td className="py-2 px-2">{sector.name}</td>
                          <td className="py-2 px-2">{hospitalLabel(hosp) || '—'}</td>
                          <td className="py-2 px-2">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(sector)}>
                                <Edit className="w-4 h-4 mr-1" /> Editar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(sector.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredSorted.length && (
                      <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhum serviço cadastrado ainda</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SectorManagement;
