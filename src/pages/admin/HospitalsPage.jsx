import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ArrowUpDown, Table, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const emptyForm = { huf: '', uo: '' };

const HospitalManagement = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // ui state
  const [view, setView] = useState('cards'); // 'cards' | 'table'
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('huf'); // 'huf' | 'uo' | 'createdAt'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  async function load() {
    try {
      setLoading(true);
      const list = await api.get('/hospitals');
      setHospitals(Array.isArray(list) ? list : []);
    } catch (e) {
      toast({ title: 'Erro ao carregar hospitais', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({ huf: item.huf || '', uo: item.uo || '' });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/hospitals/${editing.id}`, form);
        toast({ title: 'Hospital atualizado!' });
      } else {
        await api.post('/hospitals', form);
        toast({ title: 'Hospital criado!' });
      }
      setIsDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: e?.message, variant: 'destructive' });
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir hospital?')) return;
    try {
      await api.del(`/hospitals/${id}`);
      toast({ title: 'Hospital removido' });
      load();
    } catch (e) {
      toast({ title: 'Erro ao remover', description: e?.message, variant: 'destructive' });
    }
  }

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? hospitals.filter(h =>
          String(h.huf || '').toLowerCase().includes(q) ||
          String(h.uo || '').toLowerCase().includes(q)
        )
      : hospitals.slice();

    base.sort((a, b) => {
      let av, bv;
      if (sortKey === 'createdAt') {
        av = new Date(a.createdAt || 0).getTime();
        bv = new Date(b.createdAt || 0).getTime();
      } else {
        av = String(a[sortKey] || '').toLowerCase();
        bv = String(b[sortKey] || '').toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return base;
  }, [hospitals, query, sortKey, sortDir]);

  const titleLabel = (h) => (h?.huf || h?.uo || h?.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gerenciar Hospitais</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Buscar por HUF ou UO..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[220px]"
          />
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="huf">HUF</SelectItem>
              <SelectItem value="uo">UO</SelectItem>
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
              <Button className="gap-2" onClick={openNew}><Plus className="w-4 h-4" /> Novo Hospital</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Hospital</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4">
                {/* Campos em coluna, full width */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>HUF</Label>
                    <Input
                      value={form.huf}
                      onChange={e => setForm(prev => ({ ...prev, huf: e.target.value }))}
                      placeholder="Ex: HUF-01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UO</Label>
                    <Input
                      value={form.uo}
                      onChange={e => setForm(prev => ({ ...prev, uo: e.target.value }))}
                      placeholder="Ex: 123456"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editing ? 'Salvar' : 'Criar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alternador de visualização */}
      <Tabs value={view} onValueChange={setView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="cards" className="gap-1"><LayoutGrid className="w-4 h-4" /> Cards</TabsTrigger>
          <TabsTrigger value="table" className="gap-1"><Table className="w-4 h-4" /> Tabela</TabsTrigger>
        </TabsList>

        {/* CARDS */}
        <TabsContent value="cards">
          {loading ? (
            <div className="text-sm text-gray-500">Carregando hospitais...</div>
          ) : filteredSorted.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSorted.map((h, index) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100 h-full flex flex-col"
                >
                  <div>
                    <h3 className="font-bold text-gray-800">{titleLabel(h)}</h3>
                    <p className="text-xs text-gray-500">{h.uo ? `UO: ${h.uo}` : 'UO: —'}</p>
                  </div>

                  {/* Botões sempre embaixo */}
                  <div className="mt-auto pt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(h)} className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(h.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-gray-600">Nenhum hospital encontrado.</p>
            </div>
          )}
        </TabsContent>

        {/* TABELA */}
        <TabsContent value="table">
          <div className="bg-white rounded-2xl shadow p-4">
            {loading ? (
              <div className="text-gray-500 text-sm">Carregando…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 px-2">HUF</th>
                      <th className="py-2 px-2">UO</th>
                      <th className="py-2 px-2 w-40 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSorted.map(h => (
                      <tr key={h.id} className="border-b last:border-0">
                        <td className="py-2 px-2">{h.huf || '—'}</td>
                        <td className="py-2 px-2">{h.uo || '—'}</td>
                        <td className="py-2 px-2">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(h)}>
                              <Edit className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(h.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredSorted.length && (
                      <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhum hospital encontrado.</td></tr>
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

export default HospitalManagement;
