import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Trash2, Edit, Filter, FileDown, Users, Clock, FileText, FileSpreadsheet, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import ScheduleMatrixEditor from '@/components/ScheduleMatrixEditor';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import { api } from '@/lib/api';
import useAuth from '@/store/auth';

/* ======================= helpers ======================= */
const getMonthName = (monthString) => {
  const [year, month] = monthString.split('-');
  const date = new Date(year, month - 1, 15);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};
const weekInitial = (y, m, d) => ['D','S','T','Q','Q','S','S'][new Date(y, m - 1, d).getDay()];
const isWeekend = (y, m, d) => {
  const wd = new Date(y, m - 1, d).getDay();
  return wd === 0 || wd === 6;
};

// Sigla
const shortCode = (desc) => {
  if (!desc) return '';
  const parts = String(desc).trim().split(/\s+|[/\-–—]+/g);
  const filtered = parts.filter(w => w && !/^e$/i.test(w) && w !== '&');
  const letters = filtered.map(w => w[0]?.toUpperCase()).join('');
  return (letters || String(desc)[0]?.toUpperCase() || '').slice(0, 3);
};
const firstName = (full) => String(full || '').trim().split(/\s+/)[0] || '';

const parseHHMM = (s) => {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (isNaN(h) || isNaN(min)) return null;
  return h + min / 60;
};
const slotDurationHours = (slot) => {
  const a = parseHHMM(slot?.startTime);
  const b = parseHHMM(slot?.endTime);
  if (a == null || b == null) return 0;
  let dur = b - a;
  if (dur <= 0) dur += 24;
  return Math.round(dur * 100) / 100;
};

// Paleta (para PDF/XLSX)
const COLOR_MAP = {
  SN: { hex: '#DBEAFE', rgb: [219, 234, 254], text: [29, 78, 216] },     // azul claro
  SD: { hex: '#FEF3C7', rgb: [254, 243, 199], text: [180, 83, 9] },      // âmbar claro
  SDN: { hex: '#EDE9FE', rgb: [237, 233, 254], text: [91, 33, 182] },    // violeta claro
  DEFAULT: { hex: '#F1F5F9', rgb: [241, 245, 249], text: [30, 41, 59] }, // slate claro
};

/* ======================= CARD ======================= */
const ScheduleCard = ({ schedule, teams, people, timeSlots, onEdit, onDelete }) => {
  const [filteredPersonIds, setFilteredPersonIds] = useState([]);
  const [chooseExportOpen, setChooseExportOpen] = useState(false);

  const team = teams.find(t => String(t.id) === String(schedule.teamId));
  const teamPeople = useMemo(
    () => people.filter(p => String(p.teamId) === String(schedule.teamId)),
    [people, schedule.teamId]
  );

  // resumo
  const peopleInSchedule = new Set((schedule.entries || []).map(e => String(e.personId))).size;
  const totalShifts = (schedule.entries || []).length;
  const totalHours = useMemo(() => {
    const slotById = new Map(timeSlots.map(s => [String(s.id), s]));
    let sum = 0;
    for (const e of (schedule.entries || [])) {
      const slot = slotById.get(String(e.timeSlotId));
      if (slot) sum += slotDurationHours(slot);
    }
    return Math.round(sum * 100) / 100;
  }, [schedule.entries, timeSlots]);

  /* ---------- EXPORT: MATRIZ (PDF) ---------- */
  const exportMatrixPDF = () => {
    const [year, monthIndex] = schedule.month.split('-').map(Number);
    const daysInMonth = new Date(year, monthIndex, 0).getDate();

    const normPeople = teamPeople
      .map(p => ({ ...p, id: String(p.id) }))
      .filter(p => filteredPersonIds.length === 0 || filteredPersonIds.includes(String(p.id)));

    const normSlots = timeSlots.map(ts => ({ ...ts, id: String(ts.id), description: ts.description, startTime: ts.startTime, endTime: ts.endTime }));
    const slotById = new Map(normSlots.map(s => [String(s.id), s]));

    const pdf = new jsPDF('landscape', 'pt', 'a4');
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    const margin = 40;
    const topTitle = margin;
    const contentTop = topTitle + 46;
    const bottom = ph - margin;

    // títulos
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.setTextColor(0,0,0);
    pdf.text('Escala de Sobreaviso', pw / 2, topTitle + 8, { align: 'center' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11);
    const subtitle = `${team?.name || 'Equipe'} - ${getMonthName(schedule.month)} • Matriz`;
    pdf.text(subtitle, pw / 2, topTitle + 24, { align: 'center' });

    // dimensões
    const contentWidth = pw - margin * 2;
    const nameColWidth = Math.max(150, Math.min(210, contentWidth * 0.22));
    const extraCols = 2; // P, H
    const gridWidth = contentWidth - nameColWidth;
    const dayColWidth = gridWidth / (daysInMonth + extraCols);

    const headerHeight = 26;
    const rowHeight = 14;

    let x = margin;
    let y = contentTop;

    pdf.setDrawColor(185);
    pdf.setLineWidth(0.6);

    // header
    pdf.rect(x, y, nameColWidth, headerHeight, 'S');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
    pdf.text('Nome', x + 4, y + 10);

    for (let d = 1; d <= daysInMonth; d++) {
      const colX = x + nameColWidth + (d - 1) * dayColWidth;
      const weekend = isWeekend(year, monthIndex, d);

      if (weekend) {
        pdf.setFillColor(244);
        pdf.rect(colX, y, dayColWidth, headerHeight, 'F');
        pdf.setDrawColor(200); pdf.rect(colX, y, dayColWidth, headerHeight, 'S'); pdf.setDrawColor(185);
      } else {
        pdf.rect(colX, y, dayColWidth, headerHeight, 'S');
      }

      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
      pdf.text(String(d), colX + dayColWidth / 2, y + 10, { align: 'center' });
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
      pdf.text(weekInitial(year, monthIndex, d), colX + dayColWidth / 2, y + 19, { align: 'center' });
    }

    const idxPlant = daysInMonth;
    const idxHoras = daysInMonth + 1;
    const cxPlant = x + nameColWidth + idxPlant * dayColWidth;
    const cxHoras = x + nameColWidth + idxHoras * dayColWidth;
    pdf.rect(cxPlant, y, dayColWidth, headerHeight, 'S');
    pdf.rect(cxHoras, y, dayColWidth, headerHeight, 'S');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
    pdf.text('P', cxPlant + dayColWidth / 2, y + 10, { align: 'center' });
    pdf.text('H', cxHoras + dayColWidth / 2, y + 10, { align: 'center' });

    // linhas
    y += headerHeight;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);

    const getSlotFor = (pid, d) => {
      for (const e of (schedule.entries || [])) {
        if (Number(e.day) === d && String(e.personId) === String(pid)) return String(e.timeSlotId);
      }
      return null;
    };

    for (const p of normPeople) {
      pdf.rect(x, y, nameColWidth, rowHeight, 'S');
      pdf.text(p.name, x + 4, y + 9.5);

      let plant = 0, horas = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const colX = x + nameColWidth + (d - 1) * dayColWidth;
        const weekend = isWeekend(year, monthIndex, d);

        if (weekend) {
          pdf.setFillColor(244);
          pdf.rect(colX, y, dayColWidth, rowHeight, 'F');
          pdf.setDrawColor(200); pdf.rect(colX, y, dayColWidth, rowHeight, 'S'); pdf.setDrawColor(185);
        } else {
          pdf.rect(colX, y, dayColWidth, rowHeight, 'S');
        }

        const sid = getSlotFor(p.id, d);
        const slot = sid ? slotById.get(String(sid)) : null;
        const code = slot ? shortCode(slot.description) : '—';

        pdf.text(code, colX + dayColWidth / 2, y + 9.5, { align: 'center' });

        if (slot) { plant += 1; horas += slotDurationHours(slot); }
      }

      const hoursFmt = Number.isInteger(horas) ? String(horas) : horas.toFixed(1);
      pdf.rect(cxPlant, y, dayColWidth, rowHeight, 'S');
      pdf.text(String(plant), cxPlant + dayColWidth / 2, y + 9.5, { align: 'center' });
      pdf.rect(cxHoras, y, dayColWidth, rowHeight, 'S');
      pdf.text(hoursFmt, cxHoras + dayColWidth / 2, y + 9.5, { align: 'center' });

      y += rowHeight;

      if (y + rowHeight > bottom - 60) {
        printLegend(pdf, margin, bottom - 28, normSlots);
        pdf.addPage('a4', 'landscape');
        y = contentTop;

        pdf.setDrawColor(185); pdf.setLineWidth(0.6);
        pdf.rect(x, y, nameColWidth, headerHeight, 'S');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
        pdf.text('Nome', x + 4, y + 10);
        for (let d = 1; d <= daysInMonth; d++) {
          const colX = x + nameColWidth + (d - 1) * dayColWidth;
          const weekend = isWeekend(year, monthIndex, d);
          if (weekend) {
            pdf.setFillColor(244);
            pdf.rect(colX, y, dayColWidth, headerHeight, 'F');
            pdf.setDrawColor(200); pdf.rect(colX, y, dayColWidth, headerHeight, 'S'); pdf.setDrawColor(185);
          } else {
            pdf.rect(colX, y, dayColWidth, headerHeight, 'S');
          }
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
          pdf.text(String(d), colX + dayColWidth / 2, y + 10, { align: 'center' });
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
          pdf.text(weekInitial(year, monthIndex, d), colX + dayColWidth / 2, y + 19, { align: 'center' });
        }
        pdf.rect(cxPlant, y, dayColWidth, headerHeight, 'S');
        pdf.rect(cxHoras, y, dayColWidth, headerHeight, 'S');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
        pdf.text('P', cxPlant + dayColWidth / 2, y + 10, { align: 'center' });
        pdf.text('H', cxHoras + dayColWidth / 2, y + 10, { align: 'center' });

        y += headerHeight;
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
      }
    }

    // Rodapé + legenda
    printLegend(pdf, margin, bottom - 28, normSlots);
    pdf.setFontSize(8);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, bottom);
    pdf.text('Sistema de Sobreaviso Hospitalar', pw - margin, bottom, { align: 'right' });

    const base = team?.name?.toLowerCase().replace(/\s/g, '_') || 'equipe';
    pdf.save(`escala-${base}-${schedule.month}-tabela.pdf`);

    function printLegend(pdfDoc, lx, ly, slots) {
      const items = Array.from(new Set(slots.map(s => shortCode(s.description))));
      let cx = lx, cy = ly;
      for (const code of items) {
        const color = COLOR_MAP[code] || COLOR_MAP.DEFAULT;
        // quadradinho colorido
        pdfDoc.setFillColor(...color.rgb);
        pdfDoc.rect(cx, cy - 8, 10, 10, 'F');
        pdfDoc.setTextColor(...(color.text));
        pdfDoc.setFont('helvetica', 'bold'); pdfDoc.setFontSize(9);
        pdfDoc.text(code, cx + 14, cy);
        pdfDoc.setTextColor(0,0,0);
        cx += 14 + pdfDoc.getTextWidth(code) + 28;
        if (cx > (pw - lx)) { cx = lx; cy -= 16; }
      }
    }
  };

  /* ---------- EXPORT: MATRIZ (XLSX) ---------- */
  const exportMatrixXLSX = () => {
    const [year, monthIndex] = schedule.month.split('-').map(Number);
    const daysInMonth = new Date(year, monthIndex, 0).getDate();

    const normPeople = teamPeople
      .map(p => ({ ...p, id: String(p.id) }))
      .filter(p => filteredPersonIds.length === 0 || filteredPersonIds.includes(String(p.id)));

    const normSlots = timeSlots.map(ts => ({ ...ts, id: String(ts.id), description: ts.description, startTime: ts.startTime, endTime: ts.endTime }));
    const slotById = new Map(normSlots.map(s => [String(s.id), s]));

    const getSlotFor = (pid, d) => {
      for (const e of (schedule.entries || [])) {
        if (Number(e.day) === d && String(e.personId) === String(pid)) return String(e.timeSlotId);
      }
      return null;
    };

    const header1 = ['Nome', ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1)), 'Qtd Plantões', 'Qtd Horas'];
    const header2 = ['', ...Array.from({ length: daysInMonth }, (_, i) => weekInitial(year, monthIndex, i + 1)), '', ''];

    const data = [header1, header2];

    normPeople.forEach((p) => {
      const row = [p.name];
      let plant = 0, horas = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const sid = getSlotFor(p.id, d);
        const slot = sid ? slotById.get(String(sid)) : null;
        row.push(slot ? shortCode(slot.description) : '');
        if (slot) { plant += 1; horas += slotDurationHours(slot); }
      }
      row.push(plant);
      row.push(Number.isInteger(horas) ? horas : Number(horas.toFixed(1)));
      data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 28 }, ...Array.from({ length: daysInMonth }, () => ({ wch: 4 })), { wch: 12 }, { wch: 10 }];

    // Aba de legenda com cores (HEX)
    const legendRows = [['Código', 'Descrição', 'Cor (HEX)']];
    const seen = new Set();
    for (const s of normSlots) {
      const code = shortCode(s.description);
      if (seen.has(code)) continue;
      seen.add(code);
      const hex = (COLOR_MAP[code]?.hex) || COLOR_MAP.DEFAULT.hex;
      legendRows.push([code, s.description, hex]);
    }
    const wsLegend = XLSX.utils.aoa_to_sheet(legendRows);
    wsLegend['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 12 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz');
    XLSX.utils.book_append_sheet(wb, wsLegend, 'Legenda');

    const base = team?.name?.toLowerCase().replace(/\s/g, '_') || 'equipe';
    XLSX.writeFile(wb, `escala-${base}-${schedule.month}-matriz.xlsx`);
  };

  /* ---------- EXPORT: CALENDÁRIO (PDF) ---------- */
  const exportCalendarPDF = () => {
    const [year, monthIndex] = schedule.month.split('-').map(Number);
    const firstDay = new Date(year, monthIndex - 1, 1);
    const daysInMonth = new Date(year, monthIndex, 0).getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const rows = Math.ceil((startDayOfWeek + daysInMonth) / 7);

    const normPeople = teamPeople
      .map(p => ({ ...p, id: String(p.id) }))
      .filter(p => filteredPersonIds.length === 0 || filteredPersonIds.includes(String(p.id)));
    const normSlots = timeSlots.map(ts => ({ ...ts, id: String(ts.id), description: ts.description }));

    const byDay = new Map(); for (let d = 1; d <= daysInMonth; d++) byDay.set(d, []);
    for (const e of (schedule.entries || [])) {
      if (!e.day || !e.timeSlotId || !e.personId) continue;
      if (filteredPersonIds.length && !filteredPersonIds.includes(String(e.personId))) continue;
      const slot = normSlots.find(s => s.id === e.timeSlotId);
      const person = normPeople.find(p => String(p.id) === String(e.personId));
      if (!slot || !person) continue;
      byDay.get(Number(e.day)).push({ code: shortCode(slot.description), name: person.name.split(' ')[0], desc: slot.description });
    }
    for (let d = 1; d <= daysInMonth; d++) byDay.get(d).sort((a,b)=>a.desc.localeCompare(b.desc));

    const pdf = new jsPDF('landscape', 'pt', 'a4');
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    const margin = 40;
    const topTitle = margin;
    const contentTop = topTitle + 50;
    const bottom = ph - margin;

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(24);
    pdf.text('Escala de Sobreaviso', pw / 2, topTitle + 10, { align: 'center' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(12);
    pdf.text(`${team?.name || 'Equipe'} - ${getMonthName(schedule.month)} • Calendário`, pw / 2, topTitle + 28, { align: 'center' });

    const contentWidth = pw - margin * 2;
    const contentHeight = ph - margin - contentTop - 30;
    const colWidth = contentWidth / 7;
    const rowHeight = contentHeight / rows;

    const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
    for (let c = 0; c < 7; c++) {
      const x = margin + c * colWidth;
      pdf.setDrawColor(180); pdf.setLineWidth(0.8);
      pdf.rect(x, contentTop, colWidth, 20, 'S');
      pdf.text(weekDays[c], x + colWidth / 2, contentTop + 13, { align: 'center' });
    }

    let dayNum = 1 - startDayOfWeek;
    let y = contentTop + 20;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 7; c++) {
        const x = margin + c * colWidth;
        pdf.setDrawColor(200); pdf.setLineWidth(0.6);
        pdf.rect(x, y, colWidth, rowHeight, 'S');

        const curDay = dayNum++;
        if (curDay >= 1 && curDay <= daysInMonth) {
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
          pdf.text(String(curDay), x + 6, y + 12);

          const items = byDay.get(curDay);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
          let ty = y + 26;
          const lineH = 12;
          for (const it of items) {
            const text = `${it.code} ${firstName(it.name)}`;
            const maxChars = Math.floor((colWidth - 12) / 5.2);
            const clipped = text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
            pdf.text(clipped, x + 6, ty);
            ty += lineH;
            if (ty > y + rowHeight - 6) break;
          }
        }
      }
      y += rowHeight;
    }

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, bottom);
    pdf.text('Sistema de Sobreaviso Hospitalar', pw - margin, bottom, { align: 'right' });

    const base = team?.name?.toLowerCase().replace(/\s/g, '_') || 'equipe';
    pdf.save(`escala-${base}-${schedule.month}-calendario.pdf`);
  };

  // ===================== render =====================
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      <div className="flex flex-wrap items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-xl">{team?.name}</h3>
            <p className="text-sm text-gray-500">{getMonthName(schedule.month)}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{peopleInSchedule} {peopleInSchedule === 1 ? 'colaborador' : 'colaboradores'}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                <span>{totalShifts} {totalShifts === 1 ? 'plantão' : 'plantões'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)} h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" /> Filtrar Pessoa
                {filteredPersonIds.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2">
                    {filteredPersonIds.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {teamPeople.map(person => (
                  <div key={String(person.id)} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                    <Checkbox
                      id={`filter-${schedule.id}-${String(person.id)}`}
                      checked={filteredPersonIds.includes(String(person.id))}
                      onCheckedChange={() => {
                        const id = String(person.id);
                        setFilteredPersonIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                      }}
                    />
                    <label htmlFor={`filter-${schedule.id}-${String(person.id)}`} className="text-sm font-medium leading-none cursor-pointer">
                      {person.name}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Botão Exportar com 3 opções */}
          <Dialog open={chooseExportOpen} onOpenChange={setChooseExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileDown className="w-4 h-4" /> Exportar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Exportar</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <Button
                  variant="secondary"
                  onClick={() => { setChooseExportOpen(false); toast({ title: 'Gerando PDF...' }); exportCalendarPDF(); }}
                  className="justify-start gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Baixar Calendário (.pdf)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setChooseExportOpen(false); toast({ title: 'Gerando PDF...' }); exportMatrixPDF(); }}
                  className="justify-start gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Baixar Matriz (.pdf)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setChooseExportOpen(false); exportMatrixXLSX(); }}
                  className="justify-start gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Baixar Matriz (.xlsx)
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={() => onEdit(schedule)}>
            <Edit className="w-4 h-4 mr-1" /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(schedule.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white p-2">
        <ScheduleCalendar
          month={schedule.month}
          entries={schedule.entries}
          people={teamPeople.map(p => ({ ...p, id: String(p.id) }))}
          timeSlots={timeSlots.map(ts => ({ ...ts, id: String(ts.id) }))}
          filteredPersonIds={filteredPersonIds}
        />
      </div>
    </motion.div>
  );
};

/* ======================= PAGE (criar/editar) ======================= */
const ScheduleManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userTeamId = user?.teamId != null ? String(userTeamId) : null;

  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({ month: '', teamId: '', entries: [] });
  const [filters, setFilters] = useState({
    month: new Date().toISOString().substring(0, 7),
    teamId: isAdmin ? 'all' : (userTeamId || 'all'),
  });

  const [editorView, setEditorView] = useState('matrix');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); /* eslint-disable-line */ }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [schedRes, teamsRes, peopleRes, slotsRes] = await Promise.all([
        api.get('/schedules'), api.get('/teams'), api.get('/people'), api.get('/timeslots'),
      ]);
      const t = Array.isArray(teamsRes) ? teamsRes : [];
      const p = Array.isArray(peopleRes) ? peopleRes : [];
      const s = Array.isArray(schedRes) ? schedRes : [];
      const ts = Array.isArray(slotsRes) ? slotsRes : [];

      const teamFiltered = isAdmin ? t : t.filter(tt => String(tt.id) === userTeamId);
      const peopleFiltered = isAdmin ? p : p.filter(pp => String(pp.teamId) === userTeamId);
      const schedFiltered = isAdmin ? s : s.filter(ss => String(ss.teamId) === userTeamId);

      setTeams(teamFiltered);
      setPeople(peopleFiltered);
      setTimeSlots(ts);
      setSchedules(schedFiltered);

      if (!isAdmin) setFilters(prev => ({ ...prev, teamId: userTeamId || 'all' }));
    } catch (e) {
      toast({ title: 'Erro ao carregar dados', description: e?.message || '', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const sanitizeEntries = (entries) =>
    (entries || []).map(e => ({
      day: Number(e.day),
      timeSlotId: String(e.timeSlotId),
      personId: e.personId != null ? String(e.personId) : null,
    }));

  const handleOpenDialog = (schedule = null) => {
    setEditingSchedule(schedule);
    setEditorView('matrix'); // já abre na matriz
    if (schedule) {
      setFormData({
        id: schedule.id,
        month: schedule.month,
        teamId: String(schedule.teamId),
        entries: sanitizeEntries(schedule.entries),
      });
    } else {
      setFormData({
        month: new Date().toISOString().substring(0, 7),
        teamId: !isAdmin && userTeamId ? userTeamId : '',
        entries: [],
      });
    }
    setIsDialogOpen(true);
  };

  function existsDuplicate(month, teamId, exceptId = null) {
    return schedules.some(s =>
      String(s.teamId) === String(teamId) &&
      s.month === month &&
      String(s.id) !== String(exceptId)
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      month: formData.month,
      teamId: isAdmin ? formData.teamId : userTeamId,
      entries: sanitizeEntries(formData.entries),
    };

    if (!payload.teamId) {
      toast({ title: 'Selecione a equipe', variant: 'destructive' });
      return;
    }

    if (existsDuplicate(payload.month, payload.teamId, editingSchedule?.id)) {
      toast({
        title: 'Escala duplicada',
        description: 'Já existe escala neste mês para essa equipe.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingSchedule) {
        const updated = await api.put(`/schedules/${editingSchedule.id}`, payload);
        setSchedules(prev => prev.map(s => (s.id === editingSchedule.id ? updated : s)));
        toast({ title: 'Escala atualizada com sucesso!' });
      } else {
        const created = await api.post('/schedules', payload);
        setSchedules(prev => [...prev, created]);
        toast({ title: 'Escala criada com sucesso!' });
      }

      setIsDialogOpen(false);
      setEditingSchedule(null);
    } catch (e) {
      toast({
        title: 'Erro ao salvar escala',
        description: e?.message || 'Falha na requisição',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(id) {
    try {
      await api.del(`/schedules/${id}`);
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Escala removida com sucesso!' });
    } catch (e) {
      toast({ title: 'Erro ao remover escala', description: e?.message || '', variant: 'destructive' });
    }
  }

  const handleAssignment = (day, timeSlotId, personId) => {
    setFormData(prev => {
      const d = Number(day);
      const tsId = String(timeSlotId);
      const pId = personId != null ? String(personId) : null;

      const next = [...prev.entries];
      const idx = next.findIndex(e => Number(e.day) === d && String(e.timeSlotId) === tsId);

      if (pId) {
        if (idx > -1) next[idx] = { ...next[idx], personId: pId };
        else next.push({ day: d, timeSlotId: tsId, personId: pId });
      } else if (idx > -1) {
        next.splice(idx, 1);
      }
      return { ...prev, entries: next };
    });
  };

  // remover atribuições se a pessoa for ocultada
  const handlePeopleVisibleChange = (selectedIds) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.filter(e => selectedIds.includes(String(e.personId)))
    }));
  };

  const filteredPeople = people.filter(p => String(p.teamId) === (isAdmin ? String(formData.teamId) : String(userTeamId)));
  const monthOptions = [...new Set(schedules.map(s => s.month))].sort().reverse();

  const filteredSchedules = schedules.filter(schedule => {
    const monthMatch = filters.month === 'all' || schedule.month === filters.month;
    const teamMatch = filters.teamId === 'all' || String(schedule.teamId) === String(filters.teamId);
    return monthMatch && teamMatch;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciar Escalas</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {monthOptions.map(month => <SelectItem key={month} value={month}>{getMonthName(month)}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={filters.teamId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, teamId: value }))}
              disabled={!isAdmin}
            >
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por equipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Equipes</SelectItem>
                {teams.map(team => <SelectItem key={String(team.id)} value={String(team.id)}>{team.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4" /> Nova Escala
              </Button>
            </DialogTrigger>
            {/* MODAL MAIOR */}
            <DialogContent className="max-w-[98vw] w-[1600px] max-h-[92vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingSchedule ? 'Editar' : 'Nova'} Escala</DialogTitle></DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Mês</Label>
                    <input
                      type="month"
                      id="month"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value, entries: [] })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team">Equipe</Label>
                    <Select
                      value={formData.teamId}
                      onValueChange={(value) => setFormData({ ...formData, teamId: value, entries: [] })}
                      required
                      disabled={!isAdmin && !!userTeamId}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione uma equipe" /></SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={String(team.id)} value={String(team.id)}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Tabs value={editorView} onValueChange={setEditorView} className="space-y-3">
                  <TabsList>
                    <TabsTrigger value="calendar">Calendário</TabsTrigger>
                    <TabsTrigger value="matrix">Matriz</TabsTrigger>
                  </TabsList>

                  <TabsContent value="calendar" className="space-y-4">
                    <p className="text-sm text-gray-500">Clique em um dia para atribuir pessoas aos horários.</p>
                    <ScheduleCalendar
                      month={formData.month}
                      entries={formData.entries}
                      people={filteredPeople.map(p => ({ ...p, id: String(p.id) }))}
                      timeSlots={timeSlots.map(ts => ({ ...ts, id: String(ts.id) }))}
                      isEditing={true}
                      onAssignmentChange={handleAssignment}
                    />
                  </TabsContent>

                  <TabsContent value="matrix" className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Atribua horários por pessoa/dia. Clique na célula para escolher o horário. Use “Selecionar pessoas” para adicionar/remover linhas.
                    </p>
                    <ScheduleMatrixEditor
                      month={formData.month}
                      entries={formData.entries}
                      people={filteredPeople.map(p => ({ ...p, id: String(p.id) }))}
                      timeSlots={timeSlots.map(ts => ({ ...ts, id: String(ts.id) }))}
                      onAssignmentChange={handleAssignment}
                      onPeopleVisibleChange={handlePeopleVisibleChange}
                      dense
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="w-full md:w-auto">
                    {editingSchedule ? 'Atualizar' : 'Criar'} Escala
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Carregando escalas...</div>}

      <div className="space-y-6">
        {filteredSchedules.map((schedule) => (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            teams={teams}
            people={people}
            timeSlots={timeSlots}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {!loading && filteredSchedules.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma escala encontrada com os filtros selecionados.</p>
        </div>
      )}
    </motion.div>
  );
};

export default ScheduleManagement;
