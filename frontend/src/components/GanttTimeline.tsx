import React, { useState } from 'react';
import { OperatingRoom, ScheduleEntry, Priority } from '../types';
import {
  Clock,
  User,
  Wrench,
  ShieldAlert,
  Sparkles,
  Info,
  CalendarDays,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface GanttTimelineProps {
  rooms: OperatingRoom[];
  entries: ScheduleEntry[];
  scheduleDate: string;
  onSelectEntry?: (entry: ScheduleEntry) => void;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  rooms,
  entries,
  scheduleDate,
  onSelectEntry,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  // Timeline configuration: 07:00 to 20:00 (13 hours = 780 minutes)
  const startHour = 7;
  const endHour = 20;
  const totalMinutes = (endHour - startHour) * 60;

  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // Convert time to percentage offset from startHour
  const getOffsetPercentage = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      const minutes = date.getHours() * 60 + date.getMinutes() - startHour * 60;
      return Math.max(0, Math.min(100, (minutes / totalMinutes) * 100));
    } catch {
      return 0;
    }
  };

  const getWidthPercentage = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);
      return Math.max(1, Math.min(100, (durationMin / totalMinutes) * 100));
    } catch {
      return 5;
    }
  };

  const priorityStyles: Record<Priority, { bg: string; border: string; text: string; badge: string }> = {
    EMERGENCY: {
      bg: 'bg-gradient-to-r from-red-600 to-rose-500',
      border: 'border-red-400',
      text: 'text-white',
      badge: 'bg-red-950 text-red-300 border-red-700',
    },
    URGENT: {
      bg: 'bg-gradient-to-r from-amber-600 to-orange-500',
      border: 'border-amber-400',
      text: 'text-white',
      badge: 'bg-amber-950 text-amber-300 border-amber-700',
    },
    ELECTIVE: {
      bg: 'bg-gradient-to-r from-teal-600 to-emerald-500',
      border: 'border-teal-400',
      text: 'text-white',
      badge: 'bg-teal-950 text-teal-300 border-teal-700',
    },
  };

  const filteredEntries = entries.filter((e) => {
    if (filterPriority === 'ALL') return true;
    return e.priority === filterPriority;
  });

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-400" />
            <span>Interactive Operating Room Resource Timeline</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic room occupancy, preparation windows, surgical execution, and decontamination buffers
          </p>
        </div>

        {/* Legend & Filter */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400/40 border border-amber-400" />
              <span className="text-slate-400">Prep (Room Only)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-500 border border-teal-400" />
              <span className="text-slate-300 font-medium">Surgery</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-600/50 border border-slate-500" />
              <span className="text-slate-400">Cleaning Buffer</span>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
            {['ALL', 'EMERGENCY', 'URGENT', 'ELECTIVE'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  filterPriority === p
                    ? 'bg-teal-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Time scale headers */}
          <div className="grid grid-cols-[160px_1fr] border-b border-slate-800 pb-2">
            <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider pl-2">
              Operating Suite
            </div>
            <div className="relative flex justify-between pr-2 text-[11px] font-mono text-slate-400">
              {hours.map((h) => (
                <div key={h} className="relative flex flex-col items-center">
                  <span>{h < 10 ? `0${h}:00` : `${h}:00`}</span>
                  <div className="w-px h-2 bg-slate-700 mt-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Room Rows */}
          <div className="divide-y divide-slate-800/60">
            {rooms.map((room) => {
              const roomEntries = filteredEntries.filter(
                (e) => e.operatingRoomId === room.id || e.operatingRoomName === room.name
              );

              return (
                <div key={room.id} className="grid grid-cols-[160px_1fr] py-3 items-center group hover:bg-slate-900/30 transition-colors">
                  {/* Room Label */}
                  <div className="pr-4 pl-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white group-hover:text-teal-300 transition-colors">
                        {room.name}
                      </span>
                      {room.status !== 'ACTIVE' && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-red-900/60 text-red-300 font-mono">
                          {room.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">{room.roomType}</p>
                    <div className="flex items-center gap-1 text-[10px] text-teal-400/80 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{roomEntries.length} scheduled</span>
                    </div>
                  </div>

                  {/* Room Track */}
                  <div className="relative h-14 bg-slate-900/40 rounded-xl border border-slate-800/50 overflow-hidden">
                    {/* Hour grid vertical dividers */}
                    <div className="absolute inset-0 flex justify-between pointer-events-none">
                      {hours.map((h) => (
                        <div key={h} className="w-px h-full bg-slate-800/40" />
                      ))}
                    </div>

                    {/* Surgeries in this room */}
                    {roomEntries.map((entry) => {
                      const prepLeft = getOffsetPercentage(entry.prepStart);
                      const prepWidth = getWidthPercentage(entry.prepStart, entry.plannedStart);

                      const surgeryLeft = getOffsetPercentage(entry.plannedStart);
                      const surgeryWidth = getWidthPercentage(entry.plannedStart, entry.plannedEnd);

                      const cleanLeft = getOffsetPercentage(entry.plannedEnd);
                      const cleanWidth = getWidthPercentage(entry.plannedEnd, entry.cleanupEnd);

                      const style = priorityStyles[entry.priority] || priorityStyles.ELECTIVE;

                      return (
                        <React.Fragment key={entry.id}>
                          {/* Preparation Buffer */}
                          <div
                            style={{ left: `${prepLeft}%`, width: `${prepWidth}%` }}
                            className="absolute top-1 bottom-1 bg-amber-500/25 border-l-2 border-y border-amber-400/40 rounded-l-lg flex items-center justify-center text-[9px] font-mono text-amber-300/80 overflow-hidden"
                            title={`Prep Buffer: ${new Date(entry.prepStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(entry.plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          >
                            <span className="hidden lg:inline">PREP</span>
                          </div>

                          {/* Surgery Main Block */}
                          <div
                            onClick={() => {
                              setSelectedEntry(entry);
                              onSelectEntry?.(entry);
                            }}
                            style={{ left: `${surgeryLeft}%`, width: `${surgeryWidth}%` }}
                            className={`absolute top-1 bottom-1 ${style.bg} border ${style.border} shadow-lg cursor-pointer transition-all hover:scale-[1.01] hover:z-20 px-2 py-1 flex flex-col justify-between overflow-hidden group/block`}
                          >
                            <div className="flex items-center justify-between text-white">
                              <span className="font-bold text-[11px] truncate tracking-tight">
                                {entry.procedureName}
                              </span>
                              <span className="text-[9px] font-mono opacity-80 pl-1 shrink-0">
                                {new Date(entry.plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-white/90">
                              <span className="font-mono text-[9px]">{entry.surgeryCode}</span>
                              {entry.locked && (
                                <span title="Locked (In-progress or completed)">
                                  <Lock className="w-2.5 h-2.5" />
                                </span>
                              )}
                              {entry.assignedStaff?.length > 0 && (
                                <span className="truncate opacity-80 text-[9px]">
                                  {entry.assignedStaff[0].staffName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Cleaning Buffer */}
                          <div
                            style={{ left: `${cleanLeft}%`, width: `${cleanWidth}%` }}
                            className="absolute top-1 bottom-1 bg-slate-700/30 border-r-2 border-y border-slate-600/50 rounded-r-lg flex items-center justify-center text-[9px] font-mono text-slate-400 overflow-hidden"
                            title={`Cleaning Buffer: ${new Date(entry.plannedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(entry.cleanupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          >
                            <span className="hidden lg:inline">CLEAN</span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Entry Detail Card */}
      {selectedEntry && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-teal-500/30 flex flex-wrap items-start justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{selectedEntry.procedureName}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${priorityStyles[selectedEntry.priority].badge}`}>
                {selectedEntry.priority}
              </span>
              <span className="text-xs text-slate-400 font-mono">[{selectedEntry.surgeryCode}]</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-4">
              <span>Suite: <strong className="text-white">{selectedEntry.operatingRoomName}</strong></span>
              <span>
                Operative Window:{' '}
                <strong className="text-teal-300">
                  {new Date(selectedEntry.plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(selectedEntry.plannedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </span>
              <span>Room Occupancy (Prep+Clean): {new Date(selectedEntry.prepStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedEntry.cleanupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>

          {/* Assigned Staff & Equipment */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedEntry.assignedStaff?.map((st, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-xs border border-slate-700">
                <User className="w-3 h-3 text-teal-400" />
                <span className="text-slate-300">{st.staffName}</span>
                <span className="text-[10px] text-slate-400 font-mono">({st.staffRole})</span>
              </div>
            ))}
            {selectedEntry.assignedEquipment?.map((eq, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-xs border border-slate-700">
                <Wrench className="w-3 h-3 text-amber-400" />
                <span className="text-slate-300">{eq.equipmentName}</span>
              </div>
            ))}
            <button
              onClick={() => setSelectedEntry(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 ml-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
