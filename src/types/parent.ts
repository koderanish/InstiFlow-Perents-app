/** Wire types for /api/parent. Mirrors the backend parent-portal module. */

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'not_marked';

export interface ParentChild {
  id: number;
  name: string;
  admissionNo: string;
  classId: number | null;
  className: string;
  status: string;
  relation: string | null;
  isPrimary: boolean;
}

export interface ParentSchool {
  id: number;
  name: string;
  code: string;
  students: ParentChild[];
}

export interface ParentDashboard {
  parentId: number;
  schools: ParentSchool[];
  totalStudents: number;
  totalSchools: number;
  defaultSchoolId: number | null;
}

export type BusLeg = 'not_started' | 'on_the_bus' | 'dropped_off';

export interface BusStatus {
  leg: BusLeg;
  pickedUpAt: string | null;
  droppedOffAt: string | null;
}

export interface FeeSummary {
  dueAmount: number;
  overdue: boolean;
  nextDueDate: string | null;
  daysUntilDue: number | null;
  unpaidCount: number;
}

export interface Notice {
  id: number;
  title: string;
  content: string | null;
  category: string | null;
  priority: string | null;
  postedAt: string;
}

export interface DiaryEntry {
  subject: string;
  topic: string | null;
  chapterTitle: string | null;
  notes: string | null;
  progress: number;
  time: string | null;
}

export interface TodayBus {
  onTransport: boolean;
  status?: BusStatus;
  stopTime?: string | null;
  arrivalTime?: string | null;
}

export interface TodayData {
  child: {
    id: number;
    name: string;
    className: string | null;
    sectionName: string | null;
    school: string;
  };
  date: string;
  attendance: { today: { status: AttendanceStatus; date: string }; monthPercent: number | null } | null;
  bus: TodayBus | null;
  fees: FeeSummary | null;
  notices: Notice[] | null;
  diary: { classesDone: number; periodsToday: number; entries: DiaryEntry[] } | null;
}

export interface AttendanceMonth {
  month: string;
  days: { date: string; status: string }[];
  summary: {
    present: number;
    late: number;
    absent: number;
    leave: number;
    marked: number;
    percent: number | null;
  };
  today: { status: AttendanceStatus; date: string };
}

export interface BusStop {
  id: number;
  name: string;
  landmark: string | null;
  order: number;
  time: string | null;
  isChildStop: boolean;
}

export type BusDetails =
  | { onTransport: false }
  | {
      onTransport: true;
      route: {
        name: string;
        startTime: string | null;
        arrivalTime: string | null;
        vehicleNo: string | null;
        driverName: string | null;
        driverMobile: string | null;
      };
      stops: BusStop[];
      status: BusStatus;
    };

export interface Invoice {
  id: number;
  invoiceNo: string;
  period: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  fine: number;
  status: string;
}

export interface FeesData {
  summary: FeeSummary;
  invoices: Invoice[];
}

export interface DiaryDay {
  date: string;
  entries: DiaryEntry[];
}
