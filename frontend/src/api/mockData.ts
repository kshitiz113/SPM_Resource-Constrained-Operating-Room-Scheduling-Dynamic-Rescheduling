import {
  OperatingRoom,
  Staff,
  Equipment,
  SurgeryRequest,
  ScheduleResponse,
  Disruption,
  User,
  AnalyticsData,
  AuditLogItem,
  UserRole,
} from '../types';

// Default Seed Users
const DEFAULT_USERS: (User & { password?: string })[] = [
  {
    id: 1,
    username: 'admin',
    password: 'password123',
    fullName: 'System Administrator',
    email: 'admin@hospital.org',
    roles: ['ADMIN'],
    active: true,
  },
  {
    id: 2,
    username: 'ormanager',
    password: 'password123',
    fullName: 'Dr. Karen Vance, MD (OR Director)',
    email: 'karen.vance@hospital.org',
    roles: ['OR_MANAGER'],
    active: true,
  },
  {
    id: 3,
    username: 'scheduler1',
    password: 'password123',
    fullName: 'Elena Rostova (Lead Scheduler)',
    email: 'elena.rostova@hospital.org',
    roles: ['SCHEDULER'],
    active: true,
  },
  {
    id: 4,
    username: 'dr.alice',
    password: 'password123',
    fullName: 'Dr. Alice Johnson, MD (Chief Surgeon)',
    email: 'alice.johnson@hospital.org',
    roles: ['CLINICAL_STAFF'],
    active: true,
  },
];

// Seed Operating Rooms
const DEFAULT_ROOMS: OperatingRoom[] = [
  {
    id: 1,
    name: 'OR-1 (General Surgery)',
    roomType: 'GENERAL',
    status: 'ACTIVE',
    capacity: 1,
    description: 'Primary general surgery suite equipped for laparoscopic and open surgery',
  },
  {
    id: 2,
    name: 'OR-2 (Orthopedic Suite)',
    roomType: 'ORTHOPEDIC',
    status: 'ACTIVE',
    capacity: 1,
    description: 'Orthopedic suite with laminar airflow, traction table, and lead shielding for fluoroscopy',
  },
  {
    id: 3,
    name: 'OR-3 (Cardiac Hybrid)',
    roomType: 'CARDIOVASCULAR',
    status: 'ACTIVE',
    capacity: 1,
    description: 'Cardiovascular hybrid operating theater with perfusion hookups and robotic arm',
  },
  {
    id: 4,
    name: 'OR-4 (Neurosurgery)',
    roomType: 'NEUROSURGERY',
    status: 'ACTIVE',
    capacity: 1,
    description: 'Dedicated neurosurgical suite with Zeiss surgical microscope and neuronavigation',
  },
  {
    id: 5,
    name: 'OR-5 (Ambulatory Daycare)',
    roomType: 'AMBULATORY',
    status: 'ACTIVE',
    capacity: 1,
    description: 'Fast-turnaround daycare and minimally invasive procedural room',
  },
];

// Seed Staff
const DEFAULT_STAFF: Staff[] = [
  {
    id: 1,
    employeeId: 'SURG-001',
    fullName: 'Dr. Alice Johnson, MD',
    staffType: 'SURGEON',
    email: 'alice.johnson@hospital.org',
    phone: '555-0101',
    active: true,
    qualifications: [
      { id: 1, name: 'General Surgery Board Certified', category: 'SURGICAL_SPECIALTY' },
    ],
  },
  {
    id: 2,
    employeeId: 'SURG-002',
    fullName: 'Dr. David Smith, MD',
    staffType: 'SURGEON',
    email: 'david.smith@hospital.org',
    phone: '555-0102',
    active: true,
    qualifications: [
      { id: 2, name: 'Orthopedic Surgery Board Certified', category: 'SURGICAL_SPECIALTY' },
    ],
  },
  {
    id: 3,
    employeeId: 'SURG-003',
    fullName: 'Dr. Marcus Brody, MD',
    staffType: 'SURGEON',
    email: 'marcus.brody@hospital.org',
    phone: '555-0103',
    active: true,
    qualifications: [
      { id: 4, name: 'Neurosurgery Board Certified', category: 'SURGICAL_SPECIALTY' },
    ],
  },
  {
    id: 4,
    employeeId: 'ANES-001',
    fullName: 'Dr. Bob Chen, MD',
    staffType: 'ANESTHETIST',
    email: 'bob.chen@hospital.org',
    phone: '555-0201',
    active: true,
    qualifications: [
      { id: 5, name: 'General Anesthesiology Certified', category: 'ANESTHESIA' },
    ],
  },
  {
    id: 5,
    employeeId: 'ANES-002',
    fullName: 'Dr. Sarah Miller, MD',
    staffType: 'ANESTHETIST',
    email: 'sarah.miller@hospital.org',
    phone: '555-0202',
    active: true,
    qualifications: [
      { id: 5, name: 'General Anesthesiology Certified', category: 'ANESTHESIA' },
    ],
  },
  {
    id: 6,
    employeeId: 'NURS-001',
    fullName: 'Emily Clark, RN, CNOR',
    staffType: 'NURSE',
    email: 'emily.clark@hospital.org',
    phone: '555-0301',
    active: true,
    qualifications: [
      { id: 7, name: 'Certified Perioperative Nurse (CNOR)', category: 'NURSING' },
    ],
  },
  {
    id: 7,
    employeeId: 'NURS-002',
    fullName: 'James Wilson, RN',
    staffType: 'NURSE',
    email: 'james.wilson@hospital.org',
    phone: '555-0302',
    active: true,
    qualifications: [],
  },
  {
    id: 8,
    employeeId: 'TECH-001',
    fullName: 'Sam Taylor, CST',
    staffType: 'TECHNICIAN',
    email: 'sam.taylor@hospital.org',
    phone: '555-0401',
    active: true,
    qualifications: [],
  },
];

// Seed Equipment
const DEFAULT_EQUIPMENT: Equipment[] = [
  {
    id: 1,
    name: 'Laparoscopic Tower HD-1',
    equipmentType: 'LAPAROSCOPIC_TOWER',
    serialNumber: 'LAP-001-2024',
    status: 'AVAILABLE',
    model: 'Olympus Visera Elite II',
  },
  {
    id: 2,
    name: 'C-Arm Fluoroscopy Unit',
    equipmentType: 'C_ARM_FLUOROSCOPY',
    serialNumber: 'CARM-002-2023',
    status: 'AVAILABLE',
    model: 'GE OEC One CFD',
  },
  {
    id: 3,
    name: 'Zeiss Kinevo 900 Surgical Microscope',
    equipmentType: 'SURGICAL_MICROSCOPE',
    serialNumber: 'MIC-001-2022',
    status: 'AVAILABLE',
    model: 'Zeiss Kinevo 900',
  },
  {
    id: 4,
    name: 'Anesthesia Workstation Fabius',
    equipmentType: 'ANESTHESIA_MACHINE',
    serialNumber: 'ANES-001-2024',
    status: 'AVAILABLE',
    model: 'Dräger Fabius GS Premium',
  },
  {
    id: 5,
    name: 'Electrosurgical Generator ForceTriad',
    equipmentType: 'ELECTROSURGICAL_UNIT',
    serialNumber: 'ESU-001-2023',
    status: 'AVAILABLE',
    model: 'Medtronic ForceTriad',
  },
];

// Seed Surgery Requests
const DEFAULT_SURGERIES: SurgeryRequest[] = [
  {
    id: 1,
    surgeryCode: 'SURG-REQ-001',
    procedureName: 'Laparoscopic Cholecystectomy',
    priority: 'ELECTIVE',
    status: 'SCHEDULED',
    estimatedDurationMinutes: 90,
    preparationTimeMinutes: 20,
    cleaningTimeMinutes: 20,
    earliestStart: '2026-10-23T08:00:00',
    schedulingDeadline: '2026-10-23T17:00:00',
    requestedAt: '2026-10-22T08:00:00Z',
    preferredSurgeonName: 'Dr. Alice Johnson, MD',
    notes: 'Symptomatic cholelithiasis',
  },
  {
    id: 2,
    surgeryCode: 'SURG-REQ-002',
    procedureName: 'Total Hip Arthroplasty (Right)',
    priority: 'ELECTIVE',
    status: 'SCHEDULED',
    estimatedDurationMinutes: 120,
    preparationTimeMinutes: 30,
    cleaningTimeMinutes: 25,
    earliestStart: '2026-10-23T08:30:00',
    schedulingDeadline: '2026-10-23T16:00:00',
    requestedAt: '2026-10-22T08:30:00Z',
    preferredSurgeonName: 'Dr. David Smith, MD',
    notes: 'Severe osteoarthritis right hip',
  },
  {
    id: 3,
    surgeryCode: 'SURG-REQ-003',
    procedureName: 'Craniotomy for Meningioma Resection',
    priority: 'URGENT',
    status: 'SCHEDULED',
    estimatedDurationMinutes: 180,
    preparationTimeMinutes: 30,
    cleaningTimeMinutes: 30,
    earliestStart: '2026-10-23T08:00:00',
    schedulingDeadline: '2026-10-23T15:00:00',
    requestedAt: '2026-10-22T09:00:00Z',
    preferredSurgeonName: 'Dr. Marcus Brody, MD',
    notes: 'Right frontal convexity meningioma',
  },
  {
    id: 4,
    surgeryCode: 'SURG-REQ-004',
    procedureName: 'Emergency Exploratory Laparotomy',
    priority: 'EMERGENCY',
    status: 'SCHEDULED',
    estimatedDurationMinutes: 110,
    preparationTimeMinutes: 15,
    cleaningTimeMinutes: 20,
    earliestStart: '2026-10-23T07:30:00',
    schedulingDeadline: '2026-10-23T20:00:00',
    requestedAt: '2026-10-22T09:30:00Z',
    preferredSurgeonName: 'Dr. Alice Johnson, MD',
    notes: 'Acute abdomen, suspected bowel perforation',
  },
];

// Seed Active Schedule
const DEFAULT_SCHEDULE: ScheduleResponse = {
  scheduleVersion: {
    id: 1,
    versionLabel: 'v1.0 (CP-SAT Baseline)',
    scheduleDate: '2026-10-23',
    status: 'PUBLISHED',
    versionNumber: 1,
    createdAt: '2026-10-22T08:00:00Z',
    publishedAt: '2026-10-22T08:15:00Z',
    totalScore: 94.5,
    entries: [
      {
        id: 101,
        scheduleVersionId: 1,
        surgeryRequestId: 1,
        surgeryCode: 'SURG-REQ-001',
        procedureName: 'Laparoscopic Cholecystectomy',
        priority: 'ELECTIVE',
        operatingRoomId: 1,
        operatingRoomName: 'OR-1 (General Surgery)',
        prepStart: '2026-10-23T07:40:00',
        plannedStart: '2026-10-23T08:00:00',
        plannedEnd: '2026-10-23T09:30:00',
        cleanupEnd: '2026-10-23T09:50:00',
        entryStatus: 'SCHEDULED',
        locked: false,
        assignedStaff: [
          { staffId: 1, staffName: 'Dr. Alice Johnson, MD', role: 'SURGEON' },
          { staffId: 4, staffName: 'Dr. Bob Chen, MD', role: 'ANESTHETIST' },
          { staffId: 6, staffName: 'Emily Clark, RN', role: 'NURSE' },
        ],
        assignedEquipment: [
          { equipmentId: 1, equipmentName: 'Laparoscopic Tower HD-1' },
        ],
      },
      {
        id: 102,
        scheduleVersionId: 1,
        surgeryRequestId: 4,
        surgeryCode: 'SURG-REQ-004',
        procedureName: 'Emergency Exploratory Laparotomy',
        priority: 'EMERGENCY',
        operatingRoomId: 1,
        operatingRoomName: 'OR-1 (General Surgery)',
        prepStart: '2026-10-23T09:55:00',
        plannedStart: '2026-10-23T10:10:00',
        plannedEnd: '2026-10-23T12:00:00',
        cleanupEnd: '2026-10-23T12:20:00',
        entryStatus: 'SCHEDULED',
        locked: true,
        assignedStaff: [
          { staffId: 1, staffName: 'Dr. Alice Johnson, MD', role: 'SURGEON' },
          { staffId: 5, staffName: 'Dr. Sarah Miller, MD', role: 'ANESTHETIST' },
          { staffId: 7, staffName: 'James Wilson, RN', role: 'NURSE' },
        ],
        assignedEquipment: [
          { equipmentId: 5, equipmentName: 'Electrosurgical Generator ForceTriad' },
        ],
      },
      {
        id: 103,
        scheduleVersionId: 1,
        surgeryRequestId: 2,
        surgeryCode: 'SURG-REQ-002',
        procedureName: 'Total Hip Arthroplasty (Right)',
        priority: 'ELECTIVE',
        operatingRoomId: 2,
        operatingRoomName: 'OR-2 (Orthopedic Suite)',
        prepStart: '2026-10-23T08:00:00',
        plannedStart: '2026-10-23T08:30:00',
        plannedEnd: '2026-10-23T10:30:00',
        cleanupEnd: '2026-10-23T10:55:00',
        entryStatus: 'SCHEDULED',
        locked: false,
        assignedStaff: [
          { staffId: 2, staffName: 'Dr. David Smith, MD', role: 'SURGEON' },
          { staffId: 5, staffName: 'Dr. Sarah Miller, MD', role: 'ANESTHETIST' },
          { staffId: 8, staffName: 'Sam Taylor, CST', role: 'TECHNICIAN' },
        ],
        assignedEquipment: [
          { equipmentId: 2, equipmentName: 'C-Arm Fluoroscopy Unit' },
        ],
      },
      {
        id: 104,
        scheduleVersionId: 1,
        surgeryRequestId: 3,
        surgeryCode: 'SURG-REQ-003',
        procedureName: 'Craniotomy for Meningioma Resection',
        priority: 'URGENT',
        operatingRoomId: 4,
        operatingRoomName: 'OR-4 (Neurosurgery)',
        prepStart: '2026-10-23T07:30:00',
        plannedStart: '2026-10-23T08:00:00',
        plannedEnd: '2026-10-23T11:00:00',
        cleanupEnd: '2026-10-23T11:30:00',
        entryStatus: 'SCHEDULED',
        locked: false,
        assignedStaff: [
          { staffId: 3, staffName: 'Dr. Marcus Brody, MD', role: 'SURGEON' },
          { staffId: 4, staffName: 'Dr. Bob Chen, MD', role: 'ANESTHETIST' },
          { staffId: 6, staffName: 'Emily Clark, RN', role: 'NURSE' },
        ],
        assignedEquipment: [
          { equipmentId: 3, equipmentName: 'Zeiss Kinevo 900 Surgical Microscope' },
        ],
      },
    ],
  },
  unscheduledCases: [],
  validationResult: {
    valid: true,
    violations: [],
    warnings: [],
  },
  metrics: {
    totalSurgeries: 4,
    scheduledCount: 4,
    unscheduledCount: 0,
    avgWaitingHours: 1.2,
    totalIdleMinutes: 45,
    totalOvertimeMinutes: 0,
    roomUtilization: {
      'OR-1 (General Surgery)': 0.88,
      'OR-2 (Orthopedic Suite)': 0.82,
      'OR-3 (Cardiac Hybrid)': 0.74,
      'OR-4 (Neurosurgery)': 0.92,
      'OR-5 (Ambulatory Daycare)': 0.86,
    },
    overallUtilization: 0.846,
  },
};

// Seed Disruptions
const DEFAULT_DISRUPTIONS: Disruption[] = [
  {
    id: 1,
    disruptionType: 'EMERGENCY_ARRIVAL',
    status: 'RESOLVED',
    affectedRoomName: 'OR-1 (General Surgery)',
    description: 'Inbound polytrauma victim requires emergency laparotomy immediately',
    occurredAt: '2026-10-22T07:15:00Z',
    reportedAt: '2026-10-22T07:20:00Z',
  },
  {
    id: 2,
    disruptionType: 'EQUIPMENT_FAILURE',
    status: 'ACTIVE',
    affectedEquipmentName: 'C-Arm Fluoroscopy Unit',
    affectedRoomName: 'OR-2 (Orthopedic Suite)',
    description: 'Fluoroscopy sensor calibration error during pre-op diagnostic checklist',
    occurredAt: '2026-10-22T08:10:00Z',
    reportedAt: '2026-10-22T08:12:00Z',
  },
];

// Seed Analytics
const DEFAULT_ANALYTICS: AnalyticsData = {
  startDate: '2026-10-16',
  endDate: '2026-10-23',
  roomUtilizations: [
    {
      roomId: 1,
      roomName: 'OR-1 (General)',
      roomType: 'GENERAL',
      totalOperatingHours: 60,
      totalOccupiedHours: 53.1,
      utilizationRate: 88.5,
      totalSurgeriesScheduled: 24,
      avgIdleMinutesBetweenSurgeries: 18,
    },
    {
      roomId: 2,
      roomName: 'OR-2 (Orthopedic)',
      roomType: 'ORTHOPEDIC',
      totalOperatingHours: 60,
      totalOccupiedHours: 49.2,
      utilizationRate: 82.0,
      totalSurgeriesScheduled: 18,
      avgIdleMinutesBetweenSurgeries: 24,
    },
    {
      roomId: 3,
      roomName: 'OR-3 (Cardiac Hybrid)',
      roomType: 'CARDIOVASCULAR',
      totalOperatingHours: 60,
      totalOccupiedHours: 44.4,
      utilizationRate: 74.0,
      totalSurgeriesScheduled: 12,
      avgIdleMinutesBetweenSurgeries: 35,
    },
    {
      roomId: 4,
      roomName: 'OR-4 (Neurosurgery)',
      roomType: 'NEUROSURGERY',
      totalOperatingHours: 60,
      totalOccupiedHours: 55.2,
      utilizationRate: 92.0,
      totalSurgeriesScheduled: 16,
      avgIdleMinutesBetweenSurgeries: 15,
    },
    {
      roomId: 5,
      roomName: 'OR-5 (Ambulatory)',
      roomType: 'AMBULATORY',
      totalOperatingHours: 60,
      totalOccupiedHours: 51.9,
      utilizationRate: 86.5,
      totalSurgeriesScheduled: 35,
      avgIdleMinutesBetweenSurgeries: 12,
    },
  ],
  waitingTimeStats: {
    avgWaitingHoursEmergency: 0.8,
    avgWaitingHoursUrgent: 3.4,
    avgWaitingHoursElective: 18.2,
    overallAvgWaitingHours: 11.5,
    totalSurgeriesAnalyzed: 105,
  },
  overtimeStats: {
    totalOvertimeMinutes: 108,
    staffWithOvertimeCount: 2,
    overtimePerStaffMember: {
      'Dr. Alice Johnson': 45,
      'Emily Clark': 63,
    },
  },
  deferralStats: {
    totalUnscheduledCases: 1,
    deferralsByDisruption: 1,
    reasonCounts: {
      'Disruption Preemption': 1,
    },
  },
  summaryStats: {
    totalSurgeriesRequested: 108,
    totalSurgeriesScheduled: 105,
    totalSurgeriesCompleted: 98,
    totalSurgeriesCancelled: 2,
    totalDisruptionsRecorded: 4,
    averageScheduleScore: 93.8,
    averageRoomUtilization: 84.6,
  },
};

// Seed Audit Logs
const DEFAULT_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 1,
    action: 'USER_REGISTERED',
    username: 'dr.alice',
    entityType: 'User',
    entityId: 4,
    details: 'Clinical staff account registered with credentials for Dr. Alice Johnson, MD',
    timestamp: '2026-10-22T07:00:00Z',
  },
  {
    id: 2,
    action: 'SCHEDULE_GENERATED',
    username: 'scheduler1',
    entityType: 'Schedule',
    entityId: 1,
    details: 'Deterministic CP-SAT optimization schedule computed for 2026-10-23 (utilization 82.4%)',
    timestamp: '2026-10-22T07:30:00Z',
  },
  {
    id: 3,
    action: 'SCHEDULE_PUBLISHED',
    username: 'ormanager',
    entityType: 'Schedule',
    entityId: 1,
    details: 'OR Director approved and published operating schedule for 2026-10-23',
    timestamp: '2026-10-22T08:00:00Z',
  },
];

// Helper to get or initialize localStorage store
function getStore<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (_) {
    return defaultVal;
  }
}

function setStore<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {}
}

export const mockBackend = {
  // Auth
  register(data: { username: string; password: string; fullName: string; email: string; roles?: UserRole[] }) {
    const users = getStore<(User & { password?: string })[]>('app_users', DEFAULT_USERS);
    const existing = users.find(u => u.username.toLowerCase() === data.username.toLowerCase());
    if (existing) {
      throw new Error(`Username "${data.username}" is already taken. Please choose another username.`);
    }

    const newUser: User & { password?: string } = {
      id: Date.now(),
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      roles: data.roles && data.roles.length ? data.roles : ['CLINICAL_STAFF'],
      active: true,
      password: data.password,
    };

    users.push(newUser);
    setStore('app_users', users);

    const token = `offline_jwt_${Date.now()}_${btoa(data.username)}`;
    const userSafe: User = {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      roles: newUser.roles,
      active: newUser.active,
    };

    return { token, user: userSafe };
  },

  login(credentials: { username: string; password: string }) {
    const users = getStore<(User & { password?: string })[]>('app_users', DEFAULT_USERS);
    const user = users.find(
      u => u.username.toLowerCase() === credentials.username.toLowerCase()
    );

    if (!user) {
      throw new Error('Invalid credentials. Staff username not found.');
    }

    if (user.password && user.password !== credentials.password) {
      throw new Error('Invalid credentials. Incorrect password.');
    }

    const token = `offline_jwt_${Date.now()}_${btoa(user.username)}`;
    const userSafe: User = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      active: user.active,
    };

    return { token, user: userSafe };
  },

  updateProfile(data: { fullName?: string; email?: string; password?: string }) {
    const users = getStore<(User & { password?: string })[]>('app_users', DEFAULT_USERS);
    const currentRaw = localStorage.getItem('user');
    const currentUser: User | null = currentRaw ? JSON.parse(currentRaw) : null;

    if (!currentUser) {
      throw new Error('Authentication required.');
    }

    const idx = users.findIndex(u => u.id === currentUser.id || u.username === currentUser.username);
    if (idx !== -1) {
      if (data.fullName) users[idx].fullName = data.fullName;
      if (data.email) users[idx].email = data.email;
      if (data.password) users[idx].password = data.password;
      setStore('app_users', users);
    }

    const updatedUser: User = {
      ...currentUser,
      fullName: data.fullName || currentUser.fullName,
      email: data.email || currentUser.email,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  getCurrentUser() {
    const currentRaw = localStorage.getItem('user');
    if (!currentRaw) throw new Error('Not authenticated');
    return JSON.parse(currentRaw) as User;
  },

  // Rooms
  getRooms() {
    return {
      content: getStore<OperatingRoom[]>('app_rooms', DEFAULT_ROOMS),
      totalElements: DEFAULT_ROOMS.length,
    };
  },

  getActiveRooms() {
    const rooms = getStore<OperatingRoom[]>('app_rooms', DEFAULT_ROOMS);
    return rooms.filter(r => r.status === 'ACTIVE');
  },

  getRoomById(id: number) {
    const rooms = getStore<OperatingRoom[]>('app_rooms', DEFAULT_ROOMS);
    const room = rooms.find(r => r.id === id);
    if (!room) throw new Error(`Room #${id} not found`);
    return room;
  },

  createRoom(data: Partial<OperatingRoom>) {
    const rooms = getStore<OperatingRoom[]>('app_rooms', DEFAULT_ROOMS);
    const newRoom: OperatingRoom = {
      id: Date.now(),
      name: data.name || 'New Suite',
      roomType: data.roomType || 'GENERAL',
      status: data.status || 'ACTIVE',
      capacity: data.capacity || 1,
      description: data.description || '',
    };
    rooms.push(newRoom);
    setStore('app_rooms', rooms);
    return newRoom;
  },

  updateRoom(id: number, data: Partial<OperatingRoom>) {
    const rooms = getStore<OperatingRoom[]>('app_rooms', DEFAULT_ROOMS);
    const idx = rooms.findIndex(r => r.id === id);
    if (idx !== -1) {
      rooms[idx] = { ...rooms[idx], ...data };
      setStore('app_rooms', rooms);
      return rooms[idx];
    }
    return { ...data, id } as OperatingRoom;
  },

  deleteRoom(id: number) {
    let rooms = getStore<OperatingRoom[]>('app_rooms', DEFAULT_ROOMS);
    rooms = rooms.filter(r => r.id !== id);
    setStore('app_rooms', rooms);
    return { success: true };
  },

  // Staff
  getStaff() {
    return {
      content: getStore<Staff[]>('app_staff', DEFAULT_STAFF),
      totalElements: DEFAULT_STAFF.length,
    };
  },

  getActiveStaff() {
    const staff = getStore<Staff[]>('app_staff', DEFAULT_STAFF);
    return staff.filter(s => s.active);
  },

  getStaffById(id: number) {
    const staff = getStore<Staff[]>('app_staff', DEFAULT_STAFF);
    const s = staff.find(st => st.id === id);
    if (!s) throw new Error(`Staff #${id} not found`);
    return s;
  },

  createStaff(data: any) {
    const staff = getStore<Staff[]>('app_staff', DEFAULT_STAFF);
    const newStaff: Staff = {
      id: Date.now(),
      employeeId: data.employeeId || `STAFF-${Date.now().toString().slice(-4)}`,
      fullName: data.fullName,
      staffType: data.staffType || 'SURGEON',
      email: data.email,
      phone: data.phone,
      active: true,
      qualifications: [],
    };
    staff.push(newStaff);
    setStore('app_staff', staff);
    return newStaff;
  },

  updateStaff(id: number, data: any) {
    const staff = getStore<Staff[]>('app_staff', DEFAULT_STAFF);
    const idx = staff.findIndex(s => s.id === id);
    if (idx !== -1) {
      staff[idx] = { ...staff[idx], ...data };
      setStore('app_staff', staff);
      return staff[idx];
    }
    return { ...data, id } as Staff;
  },

  deleteStaff(id: number) {
    let staff = getStore<Staff[]>('app_staff', DEFAULT_STAFF);
    staff = staff.filter(s => s.id !== id);
    setStore('app_staff', staff);
    return { success: true };
  },

  getStaffShifts(id: number) {
    return [
      { id: 1, staffId: id, dayOfWeek: 1, startTime: '07:00:00', endTime: '19:00:00', recurring: true, leave: false },
      { id: 2, staffId: id, dayOfWeek: 2, startTime: '07:00:00', endTime: '19:00:00', recurring: true, leave: false },
      { id: 3, staffId: id, dayOfWeek: 3, startTime: '07:00:00', endTime: '19:00:00', recurring: true, leave: false },
      { id: 4, staffId: id, dayOfWeek: 4, startTime: '07:00:00', endTime: '19:00:00', recurring: true, leave: false },
      { id: 5, staffId: id, dayOfWeek: 5, startTime: '07:00:00', endTime: '19:00:00', recurring: true, leave: false },
    ];
  },

  addStaffShift(id: number, data: any) {
    return { id: Date.now(), staffId: id, ...data };
  },

  // Equipment
  getEquipment() {
    return {
      content: getStore<Equipment[]>('app_equipment', DEFAULT_EQUIPMENT),
      totalElements: DEFAULT_EQUIPMENT.length,
    };
  },

  getAvailableEquipment() {
    const eq = getStore<Equipment[]>('app_equipment', DEFAULT_EQUIPMENT);
    return eq.filter(e => e.status === 'AVAILABLE');
  },

  getEquipmentById(id: number) {
    const eq = getStore<Equipment[]>('app_equipment', DEFAULT_EQUIPMENT);
    const item = eq.find(e => e.id === id);
    if (!item) throw new Error(`Equipment #${id} not found`);
    return item;
  },

  createEquipment(data: any) {
    const eq = getStore<Equipment[]>('app_equipment', DEFAULT_EQUIPMENT);
    const newEq: Equipment = {
      id: Date.now(),
      name: data.name,
      equipmentType: data.equipmentType || 'SURGICAL_UNIT',
      serialNumber: data.serialNumber || `SN-${Date.now().toString().slice(-4)}`,
      status: data.status || 'AVAILABLE',
      model: data.model,
      description: data.description,
    };
    eq.push(newEq);
    setStore('app_equipment', eq);
    return newEq;
  },

  updateEquipment(id: number, data: any) {
    const eq = getStore<Equipment[]>('app_equipment', DEFAULT_EQUIPMENT);
    const idx = eq.findIndex(e => e.id === id);
    if (idx !== -1) {
      eq[idx] = { ...eq[idx], ...data };
      setStore('app_equipment', eq);
      return eq[idx];
    }
    return { ...data, id } as Equipment;
  },

  scheduleMaintenance(id: number, data: any) {
    const eq = getStore<Equipment[]>('app_equipment', DEFAULT_EQUIPMENT);
    const idx = eq.findIndex(e => e.id === id);
    if (idx !== -1) {
      eq[idx].status = 'MAINTENANCE';
      setStore('app_equipment', eq);
    }
    return { success: true, equipmentId: id, ...data };
  },

  // Surgery Requests
  getSurgeryRequests() {
    return {
      content: getStore<SurgeryRequest[]>('app_surgeries', DEFAULT_SURGERIES),
      totalElements: DEFAULT_SURGERIES.length,
    };
  },

  getSurgeryById(id: number) {
    const surgeries = getStore<SurgeryRequest[]>('app_surgeries', DEFAULT_SURGERIES);
    const s = surgeries.find(sr => sr.id === id);
    if (!s) throw new Error(`Surgery request #${id} not found`);
    return s;
  },

  createSurgeryRequest(data: any) {
    const surgeries = getStore<SurgeryRequest[]>('app_surgeries', DEFAULT_SURGERIES);
    const newReq: SurgeryRequest = {
      id: Date.now(),
      surgeryCode: `SURG-REQ-${String(surgeries.length + 1).padStart(3, '0')}`,
      status: 'REQUESTED',
      estimatedDurationMinutes: data.estimatedDurationMinutes || 90,
      preparationTimeMinutes: data.preparationTimeMinutes || 20,
      cleaningTimeMinutes: data.cleaningTimeMinutes || 20,
      earliestStart: data.earliestStart || new Date().toISOString(),
      schedulingDeadline: data.schedulingDeadline || new Date().toISOString(),
      requestedAt: new Date().toISOString(),
      priority: data.priority || 'ELECTIVE',
      procedureName: data.procedureName || 'Elective Procedure',
      ...data,
    };
    surgeries.unshift(newReq);
    setStore('app_surgeries', surgeries);
    return newReq;
  },

  updateSurgeryStatus(id: number, status: string) {
    const surgeries = getStore<SurgeryRequest[]>('app_surgeries', DEFAULT_SURGERIES);
    const idx = surgeries.findIndex(s => s.id === id);
    if (idx !== -1) {
      surgeries[idx].status = status as any;
      setStore('app_surgeries', surgeries);
      return surgeries[idx];
    }
    return { id, status } as any;
  },

  cancelSurgery(id: number) {
    let surgeries = getStore<SurgeryRequest[]>('app_surgeries', DEFAULT_SURGERIES);
    const idx = surgeries.findIndex(s => s.id === id);
    if (idx !== -1) {
      surgeries[idx].status = 'CANCELLED';
      setStore('app_surgeries', surgeries);
    }
    return { success: true };
  },

  // Schedules
  getActiveSchedule(date?: string) {
    return getStore<ScheduleResponse>('app_active_schedule', DEFAULT_SCHEDULE);
  },

  getAllSchedules() {
    const sched = getStore<ScheduleResponse>('app_active_schedule', DEFAULT_SCHEDULE);
    return {
      content: [sched.scheduleVersion],
      totalElements: 1,
    };
  },

  getScheduleById(id: number) {
    return getStore<ScheduleResponse>('app_active_schedule', DEFAULT_SCHEDULE);
  },

  generateSchedule(data: any) {
    const active = getStore<ScheduleResponse>('app_active_schedule', DEFAULT_SCHEDULE);
    const newSched: ScheduleResponse = {
      ...active,
      scheduleVersion: {
        ...active.scheduleVersion,
        id: Date.now(),
        versionNumber: active.scheduleVersion.versionNumber + 1,
        versionLabel: `v${active.scheduleVersion.versionNumber + 1}.0 (CP-SAT Solved)`,
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
        generationNotes: 'Optimized via CP-SAT solver with 0 hard constraint violations',
      },
    };
    setStore('app_active_schedule', newSched);
    return newSched;
  },

  validateSchedule(id: number) {
    return {
      valid: true,
      violations: [],
      hardViolations: [],
      warnings: [],
      softObjectiveBreakdown: {
        waitingTimePenalty: 12.5,
        idleTimePenalty: 5.0,
        overtimePenalty: 0.0,
      },
    };
  },

  approveSchedule(id: number) {
    const sched = getStore<ScheduleResponse>('app_active_schedule', DEFAULT_SCHEDULE);
    sched.scheduleVersion.status = 'APPROVED';
    sched.scheduleVersion.approvedAt = new Date().toISOString();
    setStore('app_active_schedule', sched);
    return sched;
  },

  publishSchedule(id: number) {
    const sched = getStore<ScheduleResponse>('app_active_schedule', DEFAULT_SCHEDULE);
    sched.scheduleVersion.status = 'PUBLISHED';
    sched.scheduleVersion.publishedAt = new Date().toISOString();
    setStore('app_active_schedule', sched);
    return sched;
  },

  rejectSchedule(id: number, reason?: string) {
    const sched = getStore<ScheduleResponse>('app_active_schedule', DEFAULT_SCHEDULE);
    sched.scheduleVersion.status = 'REJECTED';
    setStore('app_active_schedule', sched);
    return sched;
  },

  // Disruptions & Rescheduling
  getDisruptions() {
    return {
      content: getStore<Disruption[]>('app_disruptions', DEFAULT_DISRUPTIONS),
      totalElements: DEFAULT_DISRUPTIONS.length,
    };
  },

  registerDisruption(data: any) {
    const disruptions = getStore<Disruption[]>('app_disruptions', DEFAULT_DISRUPTIONS);
    const newDis: Disruption = {
      id: Date.now(),
      disruptionType: data.disruptionType || 'EMERGENCY_ARRIVAL',
      status: 'ACTIVE',
      description: data.description || 'Reported hospital operational disruption',
      occurredAt: data.occurredAt || new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      affectedRoomName: data.affectedRoomName,
      affectedStaffName: data.affectedStaffName,
      affectedEquipmentName: data.affectedEquipmentName,
    };
    disruptions.unshift(newDis);
    setStore('app_disruptions', disruptions);
    return newDis;
  },

  generateAlternatives(data: any) {
    const sched = getStore<ScheduleResponse>('app_active_schedule', DEFAULT_SCHEDULE);
    return [
      {
        alternativeId: 1,
        label: 'Alternative A (Minimal Disruption & Lowest Delay)',
        description: 'Relocates delayed surgical case to adjacent open room. Zero cancellations with 15 min turnover buffer.',
        totalScore: 92.4,
        schedule: sched.scheduleVersion,
        diff: {
          added: [],
          moved: [
            {
              surgeryCode: 'SURG-REQ-002',
              procedureName: 'Total Hip Arthroplasty (Right)',
              originalRoom: 'OR-2 (Orthopedic Suite)',
              newRoom: 'OR-5 (Ambulatory Daycare)',
              originalStart: '2026-10-23T08:30:00',
              originalEnd: '2026-10-23T10:30:00',
              newStart: '2026-10-23T09:00:00',
              newEnd: '2026-10-23T11:00:00',
              shiftMinutes: 30,
            },
          ],
          deferred: [],
          cancelled: [],
          unchanged: [
            { surgeryCode: 'SURG-REQ-001', procedureName: 'Laparoscopic Cholecystectomy' },
            { surgeryCode: 'SURG-REQ-003', procedureName: 'Craniotomy for Meningioma Resection' },
            { surgeryCode: 'SURG-REQ-004', procedureName: 'Emergency Exploratory Laparotomy' },
          ],
        },
        metrics: {
          affectedCases: 1,
          movedCases: 1,
          deferredCases: 0,
          waitingTimeIncreaseHours: 0.5,
          overtimeMinutes: 0,
          roomUtilization: 83.5,
        },
        validationResult: {
          valid: true,
          violations: [],
          warnings: [],
        },
      },
      {
        alternativeId: 2,
        label: 'Alternative B (Priority Preserve & Strict Shift Hours)',
        description: 'Delays elective case start by 45 minutes within OR-2 after equipment re-calibration.',
        totalScore: 89.1,
        schedule: sched.scheduleVersion,
        diff: {
          added: [],
          moved: [
            {
              surgeryCode: 'SURG-REQ-002',
              procedureName: 'Total Hip Arthroplasty (Right)',
              originalRoom: 'OR-2 (Orthopedic Suite)',
              newRoom: 'OR-2 (Orthopedic Suite)',
              originalStart: '2026-10-23T08:30:00',
              originalEnd: '2026-10-23T10:30:00',
              newStart: '2026-10-23T09:15:00',
              newEnd: '2026-10-23T11:15:00',
              shiftMinutes: 45,
            },
          ],
          deferred: [],
          cancelled: [],
          unchanged: [
            { surgeryCode: 'SURG-REQ-001', procedureName: 'Laparoscopic Cholecystectomy' },
            { surgeryCode: 'SURG-REQ-003', procedureName: 'Craniotomy for Meningioma Resection' },
            { surgeryCode: 'SURG-REQ-004', procedureName: 'Emergency Exploratory Laparotomy' },
          ],
        },
        metrics: {
          affectedCases: 1,
          movedCases: 1,
          deferredCases: 0,
          waitingTimeIncreaseHours: 0.75,
          overtimeMinutes: 15,
          roomUtilization: 82.0,
        },
        validationResult: {
          valid: true,
          violations: [],
          warnings: [],
        },
      },
    ];
  },

  approveAlternative(disruptionId: number, alternativeId: number) {
    const sched = getStore<ScheduleResponse>('app_active_schedule', DEFAULT_SCHEDULE);
    const disruptions = getStore<Disruption[]>('app_disruptions', DEFAULT_DISRUPTIONS);
    const dIdx = disruptions.findIndex(d => d.id === disruptionId);
    if (dIdx !== -1) {
      disruptions[dIdx].status = 'RESOLVED';
      setStore('app_disruptions', disruptions);
    }
    return sched;
  },

  // Analytics
  getAnalytics() {
    return DEFAULT_ANALYTICS;
  },

  // Audit Logs
  getAuditLogs() {
    return {
      content: getStore<AuditLogItem[]>('app_audit_logs', DEFAULT_AUDIT_LOGS),
      totalElements: DEFAULT_AUDIT_LOGS.length,
    };
  },

  // Notifications
  getNotifications() {
    return {
      content: [
        {
          id: 1,
          userId: 1,
          notificationType: 'SCHEDULE_PUBLISHED',
          title: 'Schedule Published',
          message: 'Operating room schedule for tomorrow has been published and approved by Dr. Karen Vance.',
          read: false,
          createdAt: '2026-10-22T08:15:00Z',
        },
        {
          id: 2,
          userId: 1,
          notificationType: 'DISRUPTION_ALERT',
          title: 'New Disruption Registered',
          message: 'C-Arm Fluoroscopy Unit calibration error in OR-2. Rescheduling alternative proposed.',
          read: false,
          createdAt: '2026-10-22T08:12:00Z',
        },
        {
          id: 3,
          userId: 1,
          notificationType: 'URGENT_SURGERY',
          title: 'Urgent Case Added',
          message: 'Emergency Exploratory Laparotomy booked for OR-1 by Dr. Alice Johnson.',
          read: true,
          createdAt: '2026-10-22T09:30:00Z',
        },
      ],
      totalElements: 3,
    };
  },

  markNotificationRead(id: number) {
    return { success: true, id };
  },

  // Users
  getUsers() {
    const users = getStore<(User & { password?: string })[]>('app_users', DEFAULT_USERS);
    return {
      content: users.map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        roles: u.roles,
        active: u.active,
      })),
      totalElements: users.length,
    };
  },
};
