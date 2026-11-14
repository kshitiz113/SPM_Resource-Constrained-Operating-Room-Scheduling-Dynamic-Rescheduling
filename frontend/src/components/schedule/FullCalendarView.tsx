import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ScheduleEntryDto } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Clock, User, Wrench, MapPin } from 'lucide-react';

interface FullCalendarViewProps {
  entries: ScheduleEntryDto[];
  initialDate?: string;
}

export const FullCalendarView: React.FC<FullCalendarViewProps> = ({ entries, initialDate }) => {
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntryDto | null>(null);

  // Convert entries to FullCalendar event format
  const events = entries.map((entry) => {
    const priority = entry.surgeryRequest?.priority || 'ELECTIVE';
    let bg = '#0f766e'; // teal
    let border = '#14b8a6';

    if (priority === 'EMERGENCY') {
      bg = '#be123c'; // rose
      border = '#f43f5e';
    } else if (priority === 'URGENT') {
      bg = '#b45309'; // amber
      border = '#f59e0b';
    }

    return {
      id: String(entry.id),
      title: `${entry.surgeryRequest?.surgeryCode || 'Surgery'}: ${entry.surgeryRequest?.procedureName || 'Procedure'} (${entry.operatingRoomName})`,
      start: entry.plannedStart,
      end: entry.plannedEnd,
      backgroundColor: bg,
      borderColor: border,
      textColor: '#ffffff',
      extendedProps: {
        entry,
      },
    };
  });

  const handleEventClick = (info: any) => {
    const entry = info.event.extendedProps.entry as ScheduleEntryDto;
    setSelectedEntry(entry);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
      <div className="fullcalendar-dark-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          initialDate={initialDate || undefined}
          events={events}
          eventClick={handleEventClick}
          slotMinTime="06:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          height="auto"
          expandRows={true}
          nowIndicator={true}
        />
      </div>

      {/* Selected Entry Detail Modal */}
      {selectedEntry && (
        <Modal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          title={`Case Details: ${selectedEntry.surgeryRequest?.surgeryCode}`}
          subtitle={selectedEntry.surgeryRequest?.procedureName}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={selectedEntry.surgeryRequest?.priority || 'ELECTIVE'} />
              <StatusBadge status={selectedEntry.entryStatus} />
              <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                {selectedEntry.operatingRoomName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">Preparation Buffer:</span>
                <span className="font-mono text-slate-200">
                  {new Date(selectedEntry.prepStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(selectedEntry.plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Surgical Incision:</span>
                <span className="font-mono text-teal-300 font-semibold">
                  {new Date(selectedEntry.plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(selectedEntry.plannedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Cleanup / Turnover:</span>
                <span className="font-mono text-slate-200">
                  {new Date(selectedEntry.plannedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(selectedEntry.cleanupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Locked State:</span>
                <span className="font-mono text-slate-200">
                  {selectedEntry.isLocked ? 'Locked (In Rescheduling)' : 'Unlocked'}
                </span>
              </div>
            </div>

            {/* Assigned Staff */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" /> Assigned Surgical Team
              </h4>
              <div className="space-y-1">
                {selectedEntry.assignedStaff?.length ? (
                  selectedEntry.assignedStaff.map((s) => (
                    <div
                      key={s.staffId}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-xs"
                    >
                      <span className="font-medium text-slate-200">{s.staffName}</span>
                      <span className="font-mono text-teal-400 text-[11px] px-2 py-0.5 rounded bg-teal-500/10">
                        {s.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No staff explicitly attached</p>
                )}
              </div>
            </div>

            {/* Assigned Equipment */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-teal-400" /> Assigned Surgical Tech & Equipment
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedEntry.assignedEquipment?.length ? (
                  selectedEntry.assignedEquipment.map((eq) => (
                    <span
                      key={eq.equipmentId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono"
                    >
                      <Wrench className="w-3 h-3 text-teal-400" />
                      {eq.equipmentName}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Standard suite equipment</p>
                )}
              </div>
            </div>

            {selectedEntry.notes && (
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-slate-200 block mb-0.5">Clinical Notes:</span>
                {selectedEntry.notes}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
