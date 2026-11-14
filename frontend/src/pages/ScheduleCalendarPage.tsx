import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { defaultScheduleDate } from '../utils/dates';
import { ScheduleResponse } from '../types';
import { FullCalendarView } from '../components/schedule/FullCalendarView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Calendar, Sliders, Layers } from 'lucide-react';

export const ScheduleCalendarPage: React.FC = () => {
  const [scheduleDate, setScheduleDate] = useState(defaultScheduleDate());
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSchedule = async (date: string) => {
    setLoading(true);
    try {
      const res = await api.schedules.getActive(date);
      setScheduleData(res.data);
    } catch {
      setScheduleData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(scheduleDate);
  }, [scheduleDate]);

  return (
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            Operating Suite Calendar Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Synchronized surgical events, anesthesia induction, and surgical incisions by room.
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
            onClick={() => navigate('/schedule/gantt')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            Switch to Gantt Lanes
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading Calendar Schedule..." />
      ) : scheduleData && ((scheduleData.scheduleVersion?.entries?.length || 0) > 0 || (scheduleData.entries?.length || 0) > 0) ? (
        <FullCalendarView
          entries={scheduleData.scheduleVersion?.entries || scheduleData.entries || []}
          initialDate={scheduleDate}
        />
      ) : (
        <EmptyState
          title="No Published Schedule for this Date"
          description={`There is no active or published schedule version for ${scheduleDate}. You can generate a deterministic schedule with the optimization engine.`}
          action={{
            label: 'Open Optimizer',
            onClick: () => navigate('/schedule/generate'),
          }}
        />
      )}
    </div>
  );
};
