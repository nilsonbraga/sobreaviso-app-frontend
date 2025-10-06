import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Users } from 'lucide-react';

/**
 * Editor em TABELA/MATRIZ (compacto) para atribuir horários:
 * - Linhas: pessoas da equipe (selecionáveis)
 * - Colunas: dias do mês (sábado/domingo/feriado com fundo cinza claro)
 *
 * Props:
 *   month: 'YYYY-MM'
 *   entries: [{ day:number, timeSlotId:string, personId:string }]
 *   people: [{ id, name, role?, teamId? }]
 *   timeSlots: [{ id, description, startTime, endTime }]
 *   onAssignmentChange(day:number, timeSlotId:string, personId:string|null)
 *   onPeopleVisibleChange?(selectedIds:string[])
 *   holidayDates?: string[] // 'YYYY-MM-DD'
 *   dense?: boolean // força modo compacto (mantido aqui sempre true por padrão de UI)
 */
const ScheduleMatrixEditor = ({
  month,
  entries = [],
  people = [],
  timeSlots = [],
  onAssignmentChange,
  onPeopleVisibleChange,
  holidayDates = [],
  dense = true,
}) => {
  if (!month) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
        Selecione um mês e uma equipe para ver a tabela.
      </div>
    );
  }

  // ===== Normalizações =====
  const normPeopleAll = (people || [])
    .filter(p => p && p.id != null)
    .map(p => ({ ...p, id: String(p.id), name: String(p.name || '') }));

  const normSlots = (timeSlots || [])
    .filter(ts => ts && ts.id != null)
    .map(ts => ({ ...ts, id: String(ts.id), description: String(ts.description || '') }));

  const normEntries = (entries || []).map(e => ({
    day: Number(e.day),
    personId: e.personId != null ? String(e.personId) : undefined,
    timeSlotId: e.timeSlotId != null ? String(e.timeSlotId) : undefined,
  }));

  // ===== Datas e auxiliares =====
  const [year, monthIndex] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const weekInitial = (d) => ['D','S','T','Q','Q','S','S'][new Date(year, monthIndex - 1, d).getDay()];
  const isWeekend = (d) => {
    const wd = new Date(year, monthIndex - 1, d).getDay();
    return wd === 0 || wd === 6; // Dom ou Sáb
  };
  const holidaySet = new Set((holidayDates || []).map(String));
  const isHoliday = (d) => {
    const mm = String(monthIndex).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return holidaySet.has(`${year}-${mm}-${dd}`);
  };

  // Sigla ignorando "e"/"&"
  const shortCode = (desc) => {
    const parts = String(desc).trim().split(/\s+|[/\-–—]+/g);
    const filtered = parts.filter(w => w && !/^e$/i.test(w) && w !== '&');
    const letters = filtered.map(w => w[0]?.toUpperCase()).join('');
    return (letters || desc || '').slice(0, 3);
  };

  // ===== Paleta (usar idêntica ao PDF/XLSX) =====
  const COLOR_MAP = {
    SN: { badge: 'bg-blue-100 text-blue-800', cell: 'bg-blue-100/90 text-blue-800', border: 'border-blue-200' },
    SD: { badge: 'bg-amber-100 text-amber-800', cell: 'bg-amber-100/90 text-amber-800', border: 'border-amber-200' },
    SDN:{ badge: 'bg-violet-100 text-violet-800', cell: 'bg-violet-100/90 text-violet-800', border: 'border-violet-200' },
    DEFAULT: { badge: 'bg-slate-100 text-slate-800', cell: 'bg-slate-100/80 text-slate-800', border: 'border-slate-200' },
  };
  const colorFor = (code) => COLOR_MAP[code] || COLOR_MAP.DEFAULT;

  // ===== Índices rápidos =====
  const byDaySlot = useMemo(() => {
    const m = new Map();
    for (const e of normEntries) {
      if (!e.timeSlotId) continue;
      m.set(`${e.day}:${e.timeSlotId}`, e.personId || null);
    }
    return m;
  }, [normEntries]);

  const getPersonSlotForDay = (personId, day) => {
    for (const e of normEntries) {
      if (e.day === Number(day) && e.personId === String(personId)) {
        return e.timeSlotId || null;
      }
    }
    return null;
  };

  const slotStatusForDay = (day) => {
    const res = {};
    for (const s of normSlots) {
      const key = `${day}:${s.id}`;
      res[s.id] = byDaySlot.get(key) || null;
    }
    return res;
  };

  const handleChoose = (day, personId, slotId) => {
    onAssignmentChange?.(Number(day), String(slotId), String(personId));
  };

  const handleClear = (day, personId) => {
    const currentSlot = getPersonSlotForDay(personId, day);
    if (currentSlot) onAssignmentChange?.(Number(day), String(currentSlot), null);
  };

  // ===== Seleção de linhas (pessoas) =====
  const [selectedIds, setSelectedIds] = useState(() => normPeopleAll.map(p => p.id));
  const togglePerson = (id) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      onPeopleVisibleChange?.(next);
      return next;
    });
  };
  const normPeople = normPeopleAll.filter(p => selectedIds.includes(p.id));

  // ===== Dimensões compactas =====
  const nameColMin = 210; // coluna de nomes
  const dayColMin = 36;   // minimizar pra caber sem scroll
  const cellH = 28;

  return (
    <div className="w-full rounded-xl border border-gray-200 overflow-hidden">
      {/* Controle de linhas */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <Users className="w-4 h-4" />
          {normPeople.length} {normPeople.length === 1 ? 'colaborador' : 'colaboradores'} exibido(s)
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">Selecionar pessoas</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {normPeopleAll.map(p => {
                const checked = selectedIds.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={() => togglePerson(p.id)} />
                    <span className="text-sm">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full ${dense ? 'text-[12px]' : 'text-sm'}`}>
          <thead className="bg-gray-50">
            <tr>
              <th
                className="sticky left-0 z-10 bg-gray-50 px-2 pt-1 pb-1 text-left font-semibold border-b border-gray-200"
                style={{ minWidth: nameColMin }}
              >
                Nome
                <span className="block text-[10px] text-gray-400 font-normal">Cargo/Especialidade (opcional)</span>
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const highlight = isWeekend(d) || isHoliday(d);
                return (
                  <th
                    key={d}
                    className={
                      "px-1 pt-1 pb-1 text-center font-semibold border-b border-gray-200" +
                      (highlight ? " bg-gray-50" : "")
                    }
                    style={{ minWidth: dayColMin }}
                    title={`Dia ${d}`}
                  >
                    <div className="leading-3">{d}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{weekInitial(d)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {normPeople.map((person) => (
              <tr key={person.id} className="odd:bg-white even:bg-gray-50">
                <td
                  className="sticky left-0 z-10 bg-inherit border-b border-gray-200 px-2 py-1"
                  style={{ minWidth: nameColMin }}
                >
                  <div className="font-medium text-gray-800 leading-tight">{person.name}</div>
                  {person.role && (
                    <div className="text-[10px] text-gray-500">{person.role}</div>
                  )}
                </td>

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const slotsMap = slotStatusForDay(d);
                  const currentSlot = getPersonSlotForDay(person.id, d);
                  const code = currentSlot
                    ? shortCode(normSlots.find(s => s.id === currentSlot)?.description || '')
                    : '';

                  const highlight = isWeekend(d) || isHoliday(d);
                  const palette = colorFor(code);

                  return (
                    <td
                      key={`${person.id}-${d}`}
                      className={
                        "border-b border-gray-200 px-1 py-1 text-center align-middle" +
                        (highlight ? " bg-gray-50" : "")
                      }
                      style={{ minWidth: dayColMin }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={[
                              "w-full",
                              "rounded-md border text-[0.7rem] leading-none",
                              "transition-colors",
                              "h-7", // 28px
                              code
                                ? `${palette.cell} ${palette.border} font-semibold`
                                : "bg-white text-gray-500 border-slate-200 hover:border-blue-300"
                            ].join(' ')}
                            title={currentSlot ? 'Clique para alterar/remover' : 'Clique para atribuir'}
                          >
                            {currentSlot ? code : '—'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                          <div className="space-y-3">
                            <div className="text-sm font-medium">
                              {person.name} — Dia {d}
                            </div>

                            <Select
                              value={currentSlot || undefined}
                              onValueChange={(slotId) => onAssignmentChange?.(Number(d), String(slotId), String(person.id))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um horário" />
                              </SelectTrigger>
                              <SelectContent>
                                {normSlots.map((s) => {
                                  const occupiedBy = slotsMap[s.id]; // personId ou null
                                  const isTakenByOther = occupiedBy && String(occupiedBy) !== String(person.id);
                                  return (
                                    <SelectItem
                                      key={s.id}
                                      value={s.id}
                                      disabled={isTakenByOther}
                                    >
                                      {shortCode(s.description)} — {s.description}
                                      {isTakenByOther && ' (ocupado)'}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>

                            {currentSlot && (
                              <div className="pt-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => handleClear(d, person.id)}
                                  className="gap-2 text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                  Remover deste dia
                                </Button>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda — mesmas cores das células */}
      <div className="border-t bg-white px-3 py-2 text-[12px] text-gray-600 flex flex-wrap gap-3">
        <span className="font-medium">Legenda:</span>
        {normSlots
          .filter((s, idx, arr) => idx === arr.findIndex(t => shortCode(t.description) === shortCode(s.description)))
          .map(s => {
            const code = shortCode(s.description);
            const palette = colorFor(code);
            return (
              <span key={s.id} className="inline-flex items-center gap-1">
                <span className={`inline-flex items-center justify-center min-w-6 h-5 px-1 rounded font-semibold ${palette.badge}`}>
                  {code}
                </span>
                {s.description}
              </span>
            );
          })}
      </div>
    </div>
  );
};

export default ScheduleMatrixEditor;
