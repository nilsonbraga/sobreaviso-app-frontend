import React from 'react';
import { User, Clock, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DayCell = ({
  day,
  entries,
  people,
  timeSlots,
  isEditing,
  onAssignmentChange,
  filteredPersonIds,
}) => {
  // normaliza ids para string e remove pessoas sem id
  const normPeople = (people || [])
    .filter(p => p && p.id !== undefined && p.id !== null)
    .map(p => ({ ...p, id: String(p.id) }));

  const normSlots = (timeSlots || [])
    .filter(ts => ts && ts.id !== undefined && ts.id !== null)
    .map(ts => ({ ...ts, id: String(ts.id) }));

  const normEntries = (entries || []).map(e => ({
    day: Number(e.day),
    personId: e.personId != null ? String(e.personId) : undefined,
    timeSlotId: e.timeSlotId != null ? String(e.timeSlotId) : undefined,
  }));

  const filteredIds = (filteredPersonIds || []).map(String);

  const dayEntries = normEntries
    .filter(e => Number(e.day) === Number(day))
    .map(e => {
      const person = normPeople.find(p => p.id === e.personId);
      const slot = normSlots.find(s => s.id === e.timeSlotId);
      return {
        personId: person?.id,
        personName: person?.name || 'N/A',
        timeSlotDesc: slot?.description || 'N/A',
        timeSlotId: slot?.id,
      };
    })
    .filter(e => filteredIds.length === 0 || (e.personId && filteredIds.includes(e.personId)))
    .sort((a, b) => a.timeSlotDesc.localeCompare(b.timeSlotDesc));

  const handleSelectPerson = (timeSlotId, personId) => {
    onAssignmentChange?.(Number(day), String(timeSlotId), personId);
  };

  const handleRemoveAssignment = (timeSlotId) => {
    onAssignmentChange?.(Number(day), String(timeSlotId), null);
  };

  const EditingView = () => (
    <Popover>
      <PopoverTrigger asChild>
        <div className="border rounded-lg p-2 min-h-[120px] bg-white hover:bg-blue-50 transition-colors cursor-pointer">
          <div className="font-bold text-sm text-gray-800">{day}</div>
          <div className="mt-1 space-y-1">
            {dayEntries.map((entry, i) => (
              <div key={i} className="text-xs p-1 rounded bg-gradient-to-br from-blue-100/50 to-sky-100 text-blue-500">
                <div className="flex items-center gap-1 font-semibold">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span>{entry.personName.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{entry.timeSlotDesc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Atribuir Dia {day}</h4>
            <p className="text-sm text-muted-foreground">Selecione pessoas para cada horário.</p>
          </div>

          <div className="grid gap-2 max-h-64 overflow-y-auto p-1">
            {normSlots.map((ts) => {
              const current = dayEntries.find(de => de.timeSlotId === ts.id);
              const assignedPersonId = current?.personId; // string | undefined

              return (
                <div key={ts.id} className="grid grid-cols-[1fr,auto] items-center gap-2">
                  <Select
                    value={assignedPersonId}
                    onValueChange={(personId) => handleSelectPerson(ts.id, personId)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`${ts.description} (${ts.startTime}-${ts.endTime})`} />
                    </SelectTrigger>
                    <SelectContent>
                      {normPeople.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {assignedPersonId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveAssignment(ts.id)}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  const ReadonlyView = () => (
    <div className="border rounded-lg p-2 min-h-[120px] bg-white">
      <div className="font-bold text-sm text-gray-800">{day}</div>
      <div className="mt-1 space-y-1">
        {dayEntries.length > 0 ? (
          dayEntries.map((entry, i) => (
            <div key={i} className="text-xs p-1 rounded  bg-gradient-to-br from-blue-100/50 to-sky-100 text-blue-500">
              <div className="flex items-center gap-1 font-semibold">
                <User className="w-3 h-3 flex-shrink-0" />
                <span>{entry.personName.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{entry.timeSlotDesc}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-400 pt-2">Sem plantão</div>
        )}
      </div>
    </div>
  );

  return isEditing ? <EditingView /> : <ReadonlyView />;
};

const ScheduleCalendar = ({
  month,
  entries = [],
  people = [],
  timeSlots = [],
  isEditing = false,
  onAssignmentChange,
  filteredPersonIds = [],
}) => {
  if (!month) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
        Selecione um mês e uma equipe para ver o calendário.
      </div>
    );
  }

  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(year, monthIndex - 1, 1);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const startDayOfWeek = (date.getDay() + 6) % 7; // Monday=0

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const handleAssignment = (d, tsId, personId) => {
    onAssignmentChange?.(Number(d), String(tsId), personId ?? null);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="grid grid-cols-7 gap-2 text-center font-bold text-gray-600 mb-2">
        {weekDays.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="border rounded-lg bg-gray-50" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <DayCell
            key={d}
            day={d}
            entries={entries}
            people={people}
            timeSlots={timeSlots}
            isEditing={isEditing}
            onAssignmentChange={handleAssignment}
            filteredPersonIds={filteredPersonIds}
          />
        ))}
      </div>
    </div>
  );
};

export default ScheduleCalendar;
