import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { RoomsPage } from './pages/RoomsPage';
import { StaffPage } from './pages/StaffPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { SurgeryRequestsPage } from './pages/SurgeryRequestsPage';
import { ScheduleCalendarPage } from './pages/ScheduleCalendarPage';
import { ScheduleGanttPage } from './pages/ScheduleGanttPage';
import { ScheduleGeneratePage } from './pages/ScheduleGeneratePage';
import { ScheduleApprovalPage } from './pages/ScheduleApprovalPage';
import { ReschedulingPage } from './pages/ReschedulingPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UsersPage } from './pages/UsersPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Protected Routes inside AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/surgery-requests" element={<SurgeryRequestsPage />} />
          <Route path="/schedule/calendar" element={<ScheduleCalendarPage />} />
          <Route path="/schedule/gantt" element={<ScheduleGanttPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Schedulers & Managers */}
          <Route
            element={<ProtectedRoute allowedRoles={['ADMIN', 'OR_MANAGER', 'SCHEDULER']} />}
          >
            <Route path="/schedule/generate" element={<ScheduleGeneratePage />} />
            <Route path="/reschedule" element={<ReschedulingPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          {/* OR Managers & Admin Approvals */}
          <Route
            element={<ProtectedRoute allowedRoles={['ADMIN', 'OR_MANAGER']} />}
          >
            <Route path="/schedule/approve" element={<ScheduleApprovalPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
          </Route>
        </Route>
      </Route>

      {/* Administrator only */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
