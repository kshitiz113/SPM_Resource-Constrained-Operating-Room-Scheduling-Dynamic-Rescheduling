import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  GanttChartSquare,
  FilePlus2,
  Cpu,
  RefreshCw,
  DoorOpen,
  Users,
  Wrench,
  Clock,
  BarChart3,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export type NavItem =
  | 'dashboard'
  | 'calendar'
  | 'timeline'
  | 'requests'
  | 'generation'
  | 'rescheduling'
  | 'rooms'
  | 'staff'
  | 'equipment'
  | 'shifts'
  | 'analytics'
  | 'audit';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

interface MenuItem {
  id: NavItem;
  label: string;
  icon: React.ElementType;
  badge?: string;
  roles?: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { hasRole } = useAuth();

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'calendar', label: 'OR Master Calendar', icon: Calendar },
        { id: 'timeline', label: 'Resource Gantt Timeline', icon: GanttChartSquare, badge: 'Live' },
        { id: 'requests', label: 'Surgery Requests', icon: FilePlus2 },
      ],
    },
    {
      title: 'SCHEDULING ENGINE',
      items: [
        {
          id: 'generation',
          label: 'Schedule Generation',
          icon: Cpu,
          roles: ['ADMIN', 'OR_MANAGER', 'SCHEDULER'],
        },
        {
          id: 'rescheduling',
          label: 'Dynamic Rescheduling',
          icon: RefreshCw,
          badge: 'Engine',
          roles: ['ADMIN', 'OR_MANAGER', 'SCHEDULER'],
        },
      ],
    },
    {
      title: 'RESOURCE INVENTORY',
      items: [
        { id: 'rooms', label: 'Operating Rooms', icon: DoorOpen },
        { id: 'staff', label: 'Clinical Staff & Specs', icon: Users },
        { id: 'shifts', label: 'Staff Shifts & Roster', icon: Clock },
        { id: 'equipment', label: 'Equipment & Towers', icon: Wrench },
      ],
    },
    {
      title: 'MANAGEMENT & GOVERNANCE',
      items: [
        {
          id: 'analytics',
          label: 'OR Analytics & KPIs',
          icon: BarChart3,
          roles: ['ADMIN', 'OR_MANAGER', 'SCHEDULER'],
        },
        {
          id: 'audit',
          label: 'Immutable Audit Trail',
          icon: ShieldCheck,
          roles: ['ADMIN', 'OR_MANAGER'],
        },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section, idx) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.some((r) => hasRole(r))
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <h2 className="px-3 text-[10px] font-mono tracking-wider text-slate-400 font-semibold uppercase mb-2">
                {section.title}
              </h2>
              <nav className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30 shadow-sm shadow-teal-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-teal-500/30">
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-400" />}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
          <div>
            <p className="text-slate-400 font-medium">Solver Engine</p>
            <p className="text-teal-400 font-mono text-[10px]">Deterministic Greedy (HC-01 - HC-12)</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        </div>
      </div>
    </aside>
  );
};
