export type UserRole = 'ADMIN' | 'OR_MANAGER' | 'SCHEDULER' | 'CLINICAL_STAFF';

export type Priority = 'EMERGENCY' | 'URGENT' | 'ELECTIVE';

export type SurgeryStatus = 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED';

export type ScheduleStatus = 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'PUBLISHED' | 'SUPERSEDED' | 'REJECTED';

export type DisruptionType =
  | 'EMERGENCY_ARRIVAL'
  | 'CANCELLATION'
  | 'STAFF_ABSENCE'
  | 'EQUIPMENT_FAILURE'
  | 'ROOM_CLOSURE'
  | 'DURATION_OVERRUN';

export type StaffType = 'SURGEON' | 'ANESTHETIST' | 'NURSE' | 'TECHNICIAN';

export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: UserRole[];
  active: boolean;
}

export interface OperatingRoom {
  id: number;
  name: string;
  roomType: string;
  status: 'ACTIVE' | 'CLOSED' | 'MAINTENANCE';
  capacity: number;
  description?: string;
  operatingHours?: RoomOperatingHours[];
}

export interface RoomOperatingHours {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isException?: boolean;
}

export interface Qualification {
  id: number;
  name: string;
  category: string;
  description?: string;
}

export interface Staff {
  id: number;
  employeeId: string;
  fullName: string;
  staffType: StaffType;
  email?: string;
  phone?: string;
  active: boolean;
  qualifications?: Qualification[];
}

export interface StaffShift {
  id: number;
  staffId: number;
  staffName?: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  recurring: boolean;
  leave: boolean;
  leaveReason?: string;
}

export interface Equipment {
  id: number;
  name: string;
  equipmentType: string;
  serialNumber: string;
  status: EquipmentStatus;
  description?: string;
  model?: string;
}

export interface SurgeryRequest {
  id: number;
  surgeryCode: string;
  procedureName: string;
  priority: Priority;
  status: SurgeryStatus;
  estimatedDurationMinutes: number;
  preparationTimeMinutes: number;
  cleaningTimeMinutes: number;
  prepDurationMinutes?: number;
  cleanupDurationMinutes?: number;
  earliestStart: string;
  schedulingDeadline: string;
  earliestEligibleTime?: string;
  deadlineTime?: string;
  requestedAt: string;
  patientId?: string;
  preferredRoomId?: number;
  preferredRoomName?: string;
  preferredSurgeonId?: number;
  preferredSurgeonName?: string;
  notes?: string;
  waitingDurationHours?: number;
  requiredStaff?: {
    id?: number;
    staffRole: StaffType;
    specificStaffId?: number;
    specificStaffName?: string;
    mandatory: boolean;
  }[];
  requiredEquipment?: {
    id?: number;
    equipmentId: number;
    equipmentName?: string;
    equipmentType?: string;
    mandatory: boolean;
  }[];
  requiredQualifications?: Qualification[];
}

export interface ScheduleEntry {
  id: number;
  scheduleVersionId: number;
  surgeryRequestId: number;
  surgeryCode: string;
  procedureName: string;
  priority: Priority;
  operatingRoomId: number;
  operatingRoomName: string;
  prepStart: string;
  plannedStart: string;
  plannedEnd: string;
  cleanupEnd: string;
  entryStatus: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED';
  locked: boolean;
  isLocked?: boolean;
  actualStart?: string;
  actualEnd?: string;
  notes?: string;
  surgeryRequest?: {
    surgeryCode?: string;
    procedureName?: string;
    priority?: Priority;
  };
  assignedStaff: {
    id?: number;
    staffId: number;
    staffName: string;
    staffRole?: StaffType;
    role?: string;
  }[];
  assignedEquipment: {
    id?: number;
    equipmentId: number;
    equipmentName: string;
    equipmentType?: string;
  }[];
}

export type ScheduleEntryDto = ScheduleEntry;

export interface ScheduleVersion {
  id: number;
  versionLabel: string;
  scheduleDate: string;
  status: ScheduleStatus;
  createdById?: number;
  createdByName?: string;
  approvedById?: number;
  approvedByName?: string;
  createdAt: string;
  approvedAt?: string;
  publishedAt?: string;
  parentVersionId?: number;
  disruptionId?: number;
  versionNumber: number;
  totalScore?: number;
  generationNotes?: string;
  entries: ScheduleEntry[];
}

export interface ValidationResult {
  valid: boolean;
  violations: {
    constraintId: string;
    message: string;
    entityType?: string;
    entityId?: number;
    severity?: string;
  }[];
  hardViolations?: {
    constraintId: string;
    message: string;
    entityType?: string;
    entityId?: number;
    severity?: string;
  }[];
  warnings: string[];
  softObjectiveBreakdown?: Record<string, number>;
}

export interface ScheduleResponse {
  scheduleVersion: ScheduleVersion;
  entries?: ScheduleEntry[];
  versionLabel?: string;
  status?: ScheduleStatus;
  totalScore?: number;
  generationNotes?: string;
  unscheduledCases: {
    id: number;
    surgeryRequestId: number;
    surgeryCode: string;
    procedureName: string;
    priority: Priority;
    reason: string;
  }[];
  validationResult: ValidationResult;
  metrics: {
    totalSurgeries: number;
    scheduledCount: number;
    unscheduledCount: number;
    avgWaitingHours: number;
    totalIdleMinutes: number;
    totalOvertimeMinutes: number;
    roomUtilization: Record<string, number>;
    overallUtilization: number;
  };
}

export interface Disruption {
  id: number;
  disruptionType: DisruptionType;
  description: string;
  occurredAt: string;
  reportedAt: string;
  reportedByName?: string;
  affectedRoomName?: string;
  affectedStaffName?: string;
  affectedEquipmentName?: string;
  affectedScheduleVersionId?: number;
  status: string;
  affectedSurgeries?: string[];
  preservedSurgeries?: string[];
}

export interface RescheduleAlternative {
  alternativeId: number;
  label: string;
  name?: string;
  strategy?: string;
  description: string;
  schedule: ScheduleVersion;
  displacedSurgeriesCount?: number;
  averageDelayMinutes?: number;
  unscheduledCount?: number;
  diffs?: any[];
  diff?: {
    added: {
      surgeryCode: string;
      procedureName: string;
      roomName: string;
      start: string;
      end: string;
      reason?: string;
    }[];
    moved: {
      surgeryCode: string;
      procedureName: string;
      originalRoom: string;
      newRoom: string;
      originalStart: string;
      originalEnd: string;
      newStart: string;
      newEnd: string;
      shiftMinutes: number;
    }[];
    deferred: {
      surgeryCode: string;
      procedureName: string;
      reason: string;
    }[];
    cancelled: {
      surgeryCode: string;
      procedureName: string;
      reason?: string;
    }[];
    unchanged: {
      surgeryCode: string;
      procedureName: string;
    }[];
  };
  metrics?: {
    affectedCases: number;
    movedCases: number;
    deferredCases: number;
    waitingTimeIncreaseHours: number;
    overtimeMinutes: number;
    roomUtilization: number;
  };
  validationResult?: ValidationResult;
  totalScore: number;
}

export interface AnalyticsData {
  startDate: string;
  endDate: string;
  roomUtilizations: {
    roomId: number;
    roomName: string;
    roomType: string;
    totalOperatingHours: number;
    totalOccupiedHours: number;
    utilizationRate: number;
    totalSurgeriesScheduled: number;
    surgeriesScheduled?: number;
    avgIdleMinutesBetweenSurgeries: number;
  }[];
  waitingTimeStats: {
    avgWaitingHoursEmergency: number;
    avgWaitingHoursUrgent: number;
    avgWaitingHoursElective: number;
    overallAvgWaitingHours: number;
    averageWaitingHours?: number;
    averageEmergencyWaitingHours?: number;
    totalSurgeriesAnalyzed: number;
  };
  overtimeStats: {
    totalOvertimeMinutes: number;
    staffWithOvertimeCount: number;
    overtimePerStaffMember: Record<string, number>;
  };
  deferralStats: {
    totalUnscheduledCases: number;
    deferralsByDisruption: number;
    reasonCounts: Record<string, number>;
  };
  summaryStats: {
    totalSurgeriesRequested: number;
    totalSurgeriesScheduled: number;
    totalSurgeriesCompleted: number;
    totalSurgeriesCancelled: number;
    totalDisruptionsRecorded: number;
    averageScheduleScore: number;
    averageRoomUtilization: number;
  };
}

export interface AuditLogItem {
  id: number;
  userId?: number;
  username: string;
  userFullName?: string;
  action: string;
  entityType: string;
  entityId: number;
  beforeValue?: string;
  afterValue?: string;
  timestamp: string;
  performedAt?: string;
  details?: string;
  ipAddress?: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  notificationType: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  referenceEntityId?: number;
  referenceEntityType?: string;
  referenceId?: number;
  referenceType?: string;
}
