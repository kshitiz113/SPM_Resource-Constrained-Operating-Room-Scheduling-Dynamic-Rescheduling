import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { defaultScheduleDate } from '../utils/dates';
import { ScheduleResponse, OperatingRoom } from '../types';
import { ScheduleGanttView } from '../components/schedule/ScheduleGanttView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Layers, Calendar, Sliders } from 'lucide-react';

export const ScheduleGanttPage: React.FC = () => {
  const [scheduleDate, setScheduleDate] = useState(defaultScheduleDate());
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async (date: string) => {
    setLoading(true);
    try {
      const [schedRes, roomsRes] = await Promise.allSettled([
        api.schedules.getActive(date),
        api.rooms.getActive(),
      ]);

      if (schedRes.status === 'fulfilled' && schedRes.value.data) {
        setScheduleData(schedRes.value.data);
      } else {
        setScheduleData(null);
      }

      if (roomsRes.status === 'fulfilled' && roomsRes.value.data) {
        setRooms(roomsRes.value.data);
      }
    } catch {
      setScheduleData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(scheduleDate);
  }, [scheduleDate]);

  return (
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            Surgical Gantt Resource Lanes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual verification of room occupancy, prep buffers, and non-overlapping turnover constraints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-xs font-mono text-slate-400">Date:</span>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-transparent text-xs font-mono text-teal-300 focus:outline-none"
            />
          </div>

          <button
            onClick={() => navigate('/schedule/calendar')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            Switch to Calendar
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading Resource Timeline Lanes..." />
      ) : scheduleData && ((scheduleData.scheduleVersion?.entries?.length || 0) > 0 || (scheduleData.entries?.length || 0) > 0) ? (
        <ScheduleGanttView
          rooms={rooms}
          entries={scheduleData.scheduleVersion?.entries || scheduleData.entries || []}
          scheduleDate={scheduleDate}
        />
      ) : (
        <EmptyState
          title="No Published Schedule for this Date"
          description={`There is no active schedule version for ${scheduleDate}. Generate an optimal plan using the deterministic scheduling engine.`}
          action={{
            label: 'Open Optimizer',
            onClick: () => navigate('/schedule/generate'),
          }}
        />
      )}
    </div>
  );
};
