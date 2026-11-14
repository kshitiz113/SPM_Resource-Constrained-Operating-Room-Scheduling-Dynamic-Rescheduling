import React, { useState } from 'react';
import { ScheduleEntryDto, OperatingRoom } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { User, Wrench, Clock, ShieldAlert } from 'lucide-react';

interface ScheduleGanttViewProps {
  rooms: OperatingRoom[];
  entries: ScheduleEntryDto[];
  scheduleDate?: string;
}

export const ScheduleGanttView: React.FC<ScheduleGanttViewProps> = ({
  rooms,
  entries,
  scheduleDate,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntryDto | null>(null);

  // Operating window: 07:00 to 19:00 (12 hours = 720 minutes)
  const START_HOUR = 7;
  const END_HOUR = 19;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const TOTAL_MINUTES = TOTAL_HOURS * 60;

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  // Group entries by room
  const entriesByRoom: Record<string, ScheduleEntryDto[]> = {};
  rooms.forEach((r) => {
    entriesByRoom[r.name] = [];
  });
  entries.forEach((e) => {
    const roomName = e.operatingRoomName;
    if (!entriesByRoom[roomName]) {
      entriesByRoom[roomName] = [];
    }
    entriesByRoom[roomName].push(e);
  });

  const getMinuteOffset = (timeStr: string) => {
    const d = new Date(timeStr);
    const hour = d.getHours();
    const min = d.getMinutes();
    return (hour - START_HOUR) * 60 + min;
  };

  const getPositionPercent = (minOffset: number) => {
    return Math.max(0, Math.min(100, (minOffset / TOTAL_MINUTES) * 100));
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
      {/* Header and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            Operating Suite Resource Lanes
            <span className="text-xs font-mono font-normal text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              {scheduleDate}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized surgical timeline showing preparation, incision, and room decontamination buffers.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" />
            <span>Emergency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-teal-500" />
            <span>Elective</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span className="w-2.5 h-2.5 rounded bg-slate-700 border border-dashed border-slate-500" />
            <span>Prep / Cleanup</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Time scale Header */}
          <div className="flex border-b border-slate-800 pb-2 text-[11px] font-mono text-slate-400">
            <div className="w-32 shrink-0 font-semibold text-slate-300">OPERATING ROOM</div>
            <div className="relative flex-1 flex justify-between pr-2">
              {hours.map((h) => (
                <div key={h} className="text-center w-12 -ml-6">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Room Rows */}
          <div className="divide-y divide-slate-800/60">
            {rooms.map((room) => {
              const roomEntries = entriesByRoom[room.name] || [];

              return (
                <div key={room.id} className="group flex items-stretch py-3.5 hover:bg-slate-800/20 transition-colors">
                  {/* Room Name & Info */}
                  <div className="w-32 shrink-0 pr-4">
                    <div className="font-semibold text-sm text-slate-200">{room.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{room.roomType}</div>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                        room.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  {/* Timeline Lane */}
                  <div className="relative flex-1 h-14 bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
                    {/* Hour grid lines */}
                    {hours.map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-r border-slate-800/40 pointer-events-none"
                        style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}
                      />
                    ))}

                    {/* Surgeries in this room */}
                    {roomEntries.map((e) => {
                      const prepOffset = getMinuteOffset(e.prepStart);
                      const startOffset = getMinuteOffset(e.plannedStart);
                      const endOffset = getMinuteOffset(e.plannedEnd);
                      const cleanOffset = getMinuteOffset(e.cleanupEnd);

                      const totalLeft = getPositionPercent(prepOffset);
                      const totalWidth = getPositionPercent(cleanOffset) - totalLeft;

                      const prepWidthPct =
                        cleanOffset > prepOffset
                          ? ((startOffset - prepOffset) / (cleanOffset - prepOffset)) * 100
                          : 0;
                      const surgWidthPct =
                        cleanOffset > prepOffset
                          ? ((endOffset - startOffset) / (cleanOffset - prepOffset)) * 100
                          : 0;
                      const cleanWidthPct =
                        cleanOffset > prepOffset
                          ? ((cleanOffset - endOffset) / (cleanOffset - prepOffset)) * 100
                          : 0;

                      const priority = e.surgeryRequest?.priority || 'ELECTIVE';
                      const surgeryColorClass =
                        priority === 'EMERGENCY'
                          ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 border-rose-400/40'
                          : priority === 'URGENT'
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-400/40'
                          : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 border-teal-400/40';

                      return (
                        <div
                          key={e.id}
                          onClick={() => setSelectedEntry(e)}
                          className="absolute top-1 bottom-1 flex cursor-pointer rounded-lg overflow-hidden border border-slate-700 shadow-md transition-all hover:scale-[1.01] hover:z-20 group/case"
                          style={{
                            left: `${totalLeft}%`,
                            width: `${Math.max(2, totalWidth)}%`,
                          }}
                          title={`${e.surgeryRequest?.surgeryCode}: ${e.surgeryRequest?.procedureName}`}
                        >
                          {/* Prep segment */}
                          {prepWidthPct > 0 && (
                            <div
                              style={{ width: `${prepWidthPct}%` }}
                              className="h-full bg-slate-800/80 border-r border-slate-700/60 flex items-center justify-center text-[9px] font-mono text-slate-400"
                              title="Prep buffer"
                            >
                              <span className="opacity-0 group-hover/case:opacity-100">P</span>
                            </div>
                          )}

                          {/* Main surgery segment */}
                          <div
                            style={{ width: `${surgWidthPct}%` }}
                            className={`h-full flex flex-col justify-center px-2 text-white font-mono border-x ${surgeryColorClass}`}
                          >
                            <div className="text-[11px] font-bold truncate leading-tight flex items-center gap-1">
                              {e.surgeryRequest?.surgeryCode || 'SURG'}
                              {e.isLocked && <ShieldAlert className="w-3 h-3 text-white/80 shrink-0" />}
                            </div>
                            <div className="text-[9px] truncate opacity-90 leading-tight">
                              {e.surgeryRequest?.procedureName}
                            </div>
                          </div>

                          {/* Cleanup segment */}
                          {cleanWidthPct > 0 && (
                            <div
                              style={{ width: `${cleanWidthPct}%` }}
                              className="h-full bg-slate-800/80 border-l border-slate-700/60 flex items-center justify-center text-[9px] font-mono text-slate-400"
                              title="Cleanup turnover"
                            >
                              <span className="opacity-0 group-hover/case:opacity-100">C</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Entry Modal */}
      {selectedEntry && (
        <Modal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          title={`Surgical Case: ${selectedEntry.surgeryRequest?.surgeryCode}`}
          subtitle={selectedEntry.surgeryRequest?.procedureName}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={selectedEntry.surgeryRequest?.priority || 'ELECTIVE'} />
              <StatusBadge status={selectedEntry.entryStatus} />
              <span className="px-2.5 py-1 text-xs font-mono rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                {selectedEntry.operatingRoomName}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">PREP START</span>
                <span className="font-mono text-slate-200">
                  {new Date(selectedEntry.prepStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-teal-400 font-semibold block text-[10px]">SURGERY TIME</span>
                <span className="font-mono text-teal-300 font-bold">
                  {new Date(selectedEntry.plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(selectedEntry.plannedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CLEANUP FINISH</span>
                <span className="font-mono text-slate-200">
                  {new Date(selectedEntry.cleanupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Staff list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" /> Assigned Clinical Staff
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedEntry.assignedStaff?.map((s) => (
                  <div
                    key={s.staffId}
                    className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs flex justify-between"
                  >
                    <span className="font-medium text-slate-200">{s.staffName}</span>
                    <span className="font-mono text-teal-400 text-[10px]">{s.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            {selectedEntry.assignedEquipment?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-teal-400" /> Equipment Allocation
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.assignedEquipment.map((eq) => (
                    <span
                      key={eq.equipmentId}
                      className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300"
                    >
                      {eq.equipmentName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
