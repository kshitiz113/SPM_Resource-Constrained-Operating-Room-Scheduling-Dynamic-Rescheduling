import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Building2,
  Users,
  Wrench,
  FileText,
  LineChart,
  ShieldCheck,
  Activity,
  HeartPulse,
  UserCog
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth();

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'CLINICAL OPERATIONS',
      items: [
        { name: 'Operations Center', path: '/', icon: LayoutDashboard },
        { name: 'Surgery Requests', path: '/surgery-requests', icon: FileText },
        { name: 'Schedule Calendar', path: '/schedule/calendar', icon: Calendar },
        { name: 'Surgical Gantt Lanes', path: '/schedule/gantt', icon: Layers },
      ],
    },
    {
      title: 'SCHEDULING ENGINE',
      items: [
        {
          name: 'Generate Schedule',
          path: '/schedule/generate',
          icon: Sliders,
          roles: ['ADMIN', 'OR_MANAGER', 'SCHEDULER'],
          badge: 'Engine',
        },
        {
          name: 'Schedule Approvals',
          path: '/schedule/approve',
          icon: CheckCircle2,
          roles: ['ADMIN', 'OR_MANAGER'],
        },
        {
          name: 'Dynamic Reschedule',
          path: '/reschedule',
          icon: RefreshCw,
          roles: ['ADMIN', 'OR_MANAGER', 'SCHEDULER'],
          badge: 'Disruptions',
        },
      ],
    },
    {
      title: 'RESOURCE FLEET',
      items: [
        { name: 'Operating Rooms', path: '/rooms', icon: Building2 },
        { name: 'Surgical Staff', path: '/staff', icon: Users },
        { name: 'Equipment & Tech', path: '/equipment', icon: Wrench },
      ],
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
        {
          name: 'Analytics & KPIs',
          path: '/analytics',
          icon: LineChart,
          roles: ['ADMIN', 'OR_MANAGER', 'SCHEDULER'],
        },
        {
          name: 'Audit Trail',
          path: '/audit',
          icon: ShieldCheck,
          roles: ['ADMIN', 'OR_MANAGER'],
        },
        {
          name: 'User Management',
          path: '/users',
          icon: UserCog,
          roles: ['ADMIN'],
        },
      ],
    },
  ];

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-800 bg-slate-950 p-4 hidden md:flex z-40">
      <div className="space-y-6 overflow-y-auto pr-1">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 text-white shadow-lg shadow-teal-950/50">
            <HeartPulse className="h-6 w-6 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-100 text-sm">OR-SCHEDULER</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Surgical Decision Support</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-5">
          {sections.map((sec) => {
            const filteredItems = sec.items.filter(
              (item) => !item.roles || hasRole(item.roles as any)
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={sec.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {sec.title}
                </p>
                <div className="space-y-0.5 pt-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                          `group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-950/20'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-teal-400" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-mono font-medium text-teal-400 border border-teal-500/20">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-[11px]">
        <div className="flex items-center gap-2 text-slate-300">
          <Activity className="h-3.5 w-3.5 text-teal-400" />
          <span className="font-semibold">Deterministic V1.0</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 leading-normal">
          HC-01 - HC-12 constraints enforced. Zero stochastic drift.
        </p>
      </div>
    </aside>
  );
};
