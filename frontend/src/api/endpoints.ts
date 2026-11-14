import axiosClient from './axiosClient';
import {
  OperatingRoom,
  Staff,
  Equipment,
  SurgeryRequest,
  ScheduleResponse,
  ScheduleVersion,
  ValidationResult,
  Disruption,
  RescheduleAlternative,
  AnalyticsData,
  AuditLogItem,
  NotificationItem,
  User,
  Priority,
  SurgeryStatus,
  StaffType,
  EquipmentStatus,
  ScheduleStatus,
  UserRole
} from '../types';

export const api = {
  auth: {
    login: (credentials: { username: string; password: string }) =>
      axiosClient.post('/auth/login', credentials),
    register: (data: { username: string; password: string; fullName: string; email: string; roles?: UserRole[] }) =>
      axiosClient.post('/auth/register', data),
    getCurrentUser: () =>
      axiosClient.get<User>('/auth/me'),
    updateProfile: (data: { fullName?: string; email?: string; password?: string }) =>
      axiosClient.put<User>('/auth/profile', data),
  },

  rooms: {
    getAll: (params?: { status?: string; search?: string; page?: number; size?: number }) =>
      axiosClient.get<{ content: OperatingRoom[]; totalElements: number }>('/rooms', { params }),
    getActive: () =>
      axiosClient.get<OperatingRoom[]>('/rooms/active'),
    getById: (id: number) =>
      axiosClient.get<OperatingRoom>(`/rooms/${id}`),
    create: (data: Partial<OperatingRoom>) =>
      axiosClient.post<OperatingRoom>('/rooms', data),
    update: (id: number, data: Partial<OperatingRoom>) =>
      axiosClient.put<OperatingRoom>(`/rooms/${id}`, data),
    delete: (id: number) =>
      axiosClient.delete(`/rooms/${id}`),
  },

  staff: {
    getAll: (params?: { staffType?: StaffType; search?: string; page?: number; size?: number }) =>
      axiosClient.get<{ content: Staff[]; totalElements: number }>('/staff', { params }),
    getActive: () =>
      axiosClient.get<Staff[]>('/staff/active'),
    getById: (id: number) =>
      axiosClient.get<Staff>(`/staff/${id}`),
    create: (data: any) =>
      axiosClient.post<Staff>('/staff', data),
    update: (id: number, data: any) =>
      axiosClient.put<Staff>(`/staff/${id}`, data),
    delete: (id: number) =>
      axiosClient.delete(`/staff/${id}`),
    getShifts: (id: number) =>
      axiosClient.get(`/staff/${id}/shifts`),
    deleteShift: (id: number, shiftId: number) =>
      axiosClient.delete(`/staff/${id}/shifts/${shiftId}`),
    reactivate: (id: number) =>
      axiosClient.post<Staff>(`/staff/${id}/reactivate`),
    getQualifications: () =>
      axiosClient.get<{ id: number; name: string; category: string }[]>('/staff/qualifications'),
    addShift: (id: number, data: any) =>
      axiosClient.post(`/staff/${id}/shifts`, data),
  },

  equipment: {
    getAll: (params?: { status?: EquipmentStatus; type?: string; search?: string; page?: number; size?: number }) =>
      axiosClient.get<{ content: Equipment[]; totalElements: number }>('/equipment', { params }),
    getAvailable: () =>
      axiosClient.get<Equipment[]>('/equipment/available'),
    getById: (id: number) =>
      axiosClient.get<Equipment>(`/equipment/${id}`),
    create: (data: any) =>
      axiosClient.post<Equipment>('/equipment', data),
    update: (id: number, data: any) =>
      axiosClient.put<Equipment>(`/equipment/${id}`, data),
    scheduleMaintenance: (id: number, data: { unavailableFrom: string; unavailableTo: string; reason: string }) =>
      axiosClient.post(`/equipment/${id}/maintenance`, data),
  },

  surgery: {
    getAll: (params?: { status?: SurgeryStatus; priority?: Priority; search?: string; page?: number; size?: number }) =>
      axiosClient.get<{ content: SurgeryRequest[]; totalElements: number }>('/surgery-requests', { params }),
    getById: (id: number) =>
      axiosClient.get<SurgeryRequest>(`/surgery-requests/${id}`),
    create: (data: any) =>
      axiosClient.post<SurgeryRequest>('/surgery-requests', data),
    updateStatus: (id: number, status: SurgeryStatus) =>
      axiosClient.patch<SurgeryRequest>(`/surgery-requests/${id}/status`, { status }),
    cancel: (id: number) =>
      axiosClient.delete(`/surgery-requests/${id}`),
  },

  schedules: {
    generate: (data: {
      scheduleDate: string;
      surgeryRequestIds?: number[];
      objectiveWeights?: {
        waitingTimePenalty?: number;
        idleTimePenalty?: number;
        overtimePenalty?: number;
        deferralPenalty?: number;
        utilizationWeight?: number;
      };
    }) => axiosClient.post<ScheduleResponse>('/schedules/generate', data),
    getAll: (params?: { date?: string; status?: ScheduleStatus; page?: number; size?: number }) =>
      axiosClient.get<{ content: ScheduleVersion[]; totalElements: number }>('/schedules', { params }),
    getActive: (date?: string) =>
      axiosClient.get<ScheduleResponse>('/schedules/active', { params: { date } }),
    getById: (id: number) =>
      axiosClient.get<ScheduleResponse>(`/schedules/${id}`),
    validate: (id: number) =>
      axiosClient.post<ValidationResult>(`/schedules/${id}/validate`),
    approve: (id: number) =>
      axiosClient.post<ScheduleResponse>(`/schedules/${id}/approve`),
    reject: (id: number, reason?: string) =>
      axiosClient.post<ScheduleResponse>(`/schedules/${id}/reject`, { reason }),
    publish: (id: number) =>
      axiosClient.post<ScheduleResponse>(`/schedules/${id}/publish`),
  },

  reschedule: {
    registerDisruption: (data: any) =>
      axiosClient.post<Disruption>('/disruptions', data),
    getDisruptions: (params?: { page?: number; size?: number }) =>
      axiosClient.get<{ content: Disruption[]; totalElements: number }>('/disruptions', { params }),
    generateAlternatives: (data: { disruptionId: number; activeScheduleVersionId: number; maxAlternatives?: number }) =>
      axiosClient.post<RescheduleAlternative[]>('/reschedule', data),
    getAlternatives: (disruptionId: number) =>
      axiosClient.get<RescheduleAlternative[]>(`/reschedule/${disruptionId}/alternatives`),
    approveAlternative: (disruptionId: number, alternativeId: number) =>
      axiosClient.post<ScheduleResponse>(`/reschedule/${disruptionId}/approve`, { alternativeId }),
  },

  analytics: {
    get: (params?: { startDate?: string; endDate?: string }) =>
      axiosClient.get<AnalyticsData>('/analytics', { params }),
    exportCsv: (params?: { startDate?: string; endDate?: string }) =>
      axiosClient.get('/analytics/export', { params, responseType: 'blob' }),
  },

  audit: {
    getAll: (params?: { page?: number; size?: number }) =>
      axiosClient.get<{ content: AuditLogItem[]; totalElements: number }>('/audit', { params }),
    getByEntity: (entityType: string, entityId: number) =>
      axiosClient.get<{ content: AuditLogItem[] }>('/audit/entity', { params: { entityType, entityId } }),
  },

  notifications: {
    getAll: () =>
      axiosClient.get<{ content: NotificationItem[] }>('/notifications'),
    markRead: (id: number) =>
      axiosClient.patch(`/notifications/${id}/read`),
  },

  users: {
    getAll: (params?: { page?: number; size?: number }) =>
      axiosClient.get<{ content: User[]; totalElements: number }>('/users', { params }),
    create: (data: any) =>
      axiosClient.post<User>('/users', data),
    update: (id: number, data: any) =>
      axiosClient.put<User>(`/users/${id}`, data),
    delete: (id: number) =>
      axiosClient.delete(`/users/${id}`),
  },
};
