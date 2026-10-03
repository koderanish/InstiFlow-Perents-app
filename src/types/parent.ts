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

/* ---------- Screens added after the foundation. Shapes are the API contract. ---------- */

export interface TimetableSlot {
  /** Monday = 0 … Sunday = 6 */
  dayIndex: number;
  period: string;
  start: string; // HH:MM
  end: string; // HH:MM
  isBreak: boolean;
  subject: string | null;
  teacher: string | null;
}

export interface ExamPaper {
  id: number;
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM
  endTime: string | null;
  venue: string | null;
  maxMarks: number | null;
}

export interface ExamSeries {
  id: number;
  name: string;
  type: string | null;
  startDate: string;
  endDate: string;
  papers: ExamPaper[];
}

export interface ExamsData {
  exams: ExamSeries[];
}

export interface SubjectResult {
  name: string;
  marks: number | null;
  maxMarks: number | null;
  grade: string | null;
  remarks: string | null;
}

export interface ExamResult {
  id: number;
  name: string;
  type: string | null;
  publishedAt: string | null;
  totalMarks: number | null;
  maxTotal: number | null;
  percentage: number | null;
  grade: string | null;
  passed: boolean | null;
  remarks: string | null;
  subjects: SubjectResult[];
}

export interface ResultsData {
  /** Published results only, newest first. */
  results: ExamResult[];
}

export type HomeworkStatus = 'pending' | 'submitted' | 'late' | 'graded' | 'overdue';

export interface HomeworkItem {
  id: number;
  title: string;
  description: string | null;
  subject: string | null;
  teacher: string | null;
  assignedAt: string;
  dueDate: string | null;
  maxMarks: number | null;
  status: HomeworkStatus;
  marks: number | null;
  feedback: string | null;
}

export interface HomeworkData {
  items: HomeworkItem[];
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveNote {
  id: number;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  reviewNote: string | null;
  requestedAt: string;
}

export interface LeaveData {
  notes: LeaveNote[];
}

export interface LeaveInput {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface Payment {
  id: number;
  receiptNo: string | null;
  amount: number;
  mode: string | null;
  paidOn: string;
  reference: string | null;
}

export interface InvoiceDetail extends Invoice {
  lines: { label: string; amount: number }[];
  payments: Payment[];
}

export interface ChildProfile {
  id: number;
  name: string;
  admissionNo: string | null;
  className: string | null;
  sectionName: string | null;
  rollNo: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  classTeacher: { name: string; phone: string | null } | null;
  guardians: { name: string; relation: string | null; phone: string | null; isPrimary: boolean }[];
}

export interface SchoolContact {
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
}
