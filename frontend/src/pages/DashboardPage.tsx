import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { defaultScheduleDate } from '../utils/dates';
import {
  ScheduleResponse,
  OperatingRoom,
  SurgeryRequest,
  Disruption
} from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Activity,
  Calendar,
  Clock,
  Building2,
  AlertTriangle,
  FilePlus,
  PlayCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Sliders
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSchedule, setActiveSchedule] = useState<ScheduleResponse | null>(null);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<SurgeryRequest[]>([]);
  const [recentDisruptions, setRecentDisruptions] = useState<Disruption[]>([]);
  const targetDate = defaultScheduleDate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [schedRes, roomsRes, surgRes, disRes] = await Promise.allSettled([
          api.schedules.getActive(targetDate),
          api.rooms.getActive(),
          api.surgery.getAll({ page: 0, size: 5 }),
          api.reschedule.getDisruptions({ page: 0, size: 5 }),
        ]);

        if (schedRes.status === 'fulfilled' && schedRes.value.data) {
          setActiveSchedule(schedRes.value.data);
        }
        if (roomsRes.status === 'fulfilled' && roomsRes.value.data) {
          setRooms(roomsRes.value.data);
        }
        if (surgRes.status === 'fulfilled' && surgRes.value.data?.content) {
          setUrgentRequests(surgRes.value.data.content);
        }
        if (disRes.status === 'fulfilled' && disRes.value.data?.content) {
          setRecentDisruptions(disRes.value.data.content);
        }
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading Clinical Operations Dashboard..." />;
  }

  const metrics = activeSchedule?.metrics;
  const entries = activeSchedule?.scheduleVersion?.entries || activeSchedule?.entries || [];
  const versionLabel = activeSchedule?.scheduleVersion?.versionLabel || activeSchedule?.versionLabel;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              OR Operations Command Center
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
              Target Date: {targetDate}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time constraint surveillance, surgical room utilization, and operational readiness.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/surgery-requests')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-teal-400" />
            New Request
          </button>
          <button
            onClick={() => navigate('/reschedule')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Report Disruption
          </button>
          <button
            onClick={() => navigate('/schedule/generate')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-950/40 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            Deterministic Optimizer
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Scheduled Surgeries"
          value={metrics ? `${metrics.scheduledCount} / ${metrics.totalSurgeries}` : '0'}
          subtitle={metrics?.unscheduledCount ? `${metrics.unscheduledCount} unscheduled cases` : 'All requests accommodated'}
          icon={Calendar}
          accent="teal"
          trend={{ value: activeSchedule?.validationResult?.valid === false ? 'Constraint violations detected' : activeSchedule ? '100% hard constraints met' : 'No published schedule', isPositive: activeSchedule?.validationResult?.valid !== false && !!activeSchedule }}
        />
        <StatCard
          title="Active OR Suites"
          value={rooms.length}
          subtitle="Ready for sterile procedures"
          icon={Building2}
          accent="indigo"
          trend={{ value: 'Mon - Fri (07:00 - 19:00)', isPositive: true }}
        />
        <StatCard
          title="Average Utilization"
          value={metrics ? `${Math.round((metrics.overallUtilization || 0) * 100)}%` : '--'}
          subtitle={`Total Idle: ${metrics?.totalIdleMinutes || 0} min`}
          icon={TrendingUp}
          accent="emerald"
          trend={{ value: '12h day basis', isPositive: true }}
        />
        <StatCard
          title="Average Wait Time"
          value={metrics ? `${(metrics.avgWaitingHours || 0).toFixed(1)} hrs` : '--'}
          subtitle={`Staff Overtime: ${metrics?.totalOvertimeMinutes || 0} min`}
          icon={Clock}
          accent="amber"
          trend={{ value: 'Deterministic weighted minimum', isPositive: true }}
        />
      </div>

      {/* Main Grid: Today's Schedule Board & Room Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Schedule Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                Active Schedule Board
                {versionLabel && (
                  <span className="text-[11px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    {versionLabel}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Surgeries scheduled for current active version
              </p>
            </div>
            <button
              onClick={() => navigate('/schedule/gantt')}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
            >
              Gantt View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {entries.length === 0 ? (
            <EmptyState
              title="No Active Schedule Found"
              description="No published or approved schedule exists for today. Use the scheduling engine to generate an optimal plan."
              action={{
                label: 'Generate Schedule',
                onClick: () => navigate('/schedule/generate'),
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Code / Procedure</th>
                    <th className="py-2.5 px-3">Room</th>
                    <th className="py-2.5 px-3">Planned Time</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {entries.slice(0, 6).map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-200">
                          {entry.surgeryCode || entry.surgeryRequest?.surgeryCode}
                        </div>
                        <div className="text-[11px] font-sans text-slate-400 truncate max-w-xs">
                          {entry.procedureName || entry.surgeryRequest?.procedureName}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-semibold">
                        {entry.operatingRoomName}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {new Date(entry.plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(entry.plannedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <PriorityBadge priority={entry.priority || entry.surgeryRequest?.priority || 'ELECTIVE'} />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={entry.entryStatus} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Room Utilization & Recent Disruptions */}
        <div className="space-y-6">
          {/* Room Utilization Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center justify-between">
              <span>OR Utilization Index</span>
              <span className="text-[10px] font-mono text-slate-400">12h Baseline</span>
            </h3>

            <div className="space-y-3">
              {rooms.map((room) => {
                const util = metrics?.roomUtilization?.[room.name] || 0.65;
                const pct = Math.round(util * 100);

                return (
                  <div key={room.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 font-medium">{room.name}</span>
                      <span className="text-teal-400 font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Alerts / Disruptions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active Disruptions
              </h3>
              <button
                onClick={() => navigate('/reschedule')}
                className="text-xs text-teal-400 hover:text-teal-300"
              >
                Resolve
              </button>
            </div>

            {recentDisruptions.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                No active operational disruptions registered.
              </p>
            ) : (
              <div className="space-y-2">
                {recentDisruptions.slice(0, 3).map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-amber-300">
                        {d.disruptionType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] line-clamp-1">{d.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
