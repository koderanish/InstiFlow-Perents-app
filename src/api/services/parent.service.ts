import type {
  AttendanceMonth,
  BusDetails,
  DiaryDay,
  ChildProfile,
  ExamsData,
  FeesData,
  HomeworkData,
  InvoiceDetail,
  LeaveData,
  LeaveInput,
  LeaveNote,
  ResultsData,
  SchoolContact,
  TimetableSlot,
  Notice,
  ParentDashboard,
  TodayData,
} from '@/types/parent';
import type { ApiClient } from '../client';

export function createParentService(client: ApiClient) {
  const child = (id: number) => `/parent/children/${id}`;
  return {
    dashboard: () => client.get<ParentDashboard>('/parent/dashboard'),
    today: (id: number) => client.get<TodayData>(`${child(id)}/today`),
    attendance: (id: number, month?: string) =>
      client.get<AttendanceMonth>(`${child(id)}/attendance`, { month }),
    bus: (id: number) => client.get<BusDetails>(`${child(id)}/bus`),
    fees: (id: number) => client.get<FeesData>(`${child(id)}/fees`),
    notices: (id: number, limit = 20) => client.get<Notice[]>(`${child(id)}/notices`, { limit }),
    diary: (id: number, date?: string) => client.get<DiaryDay>(`${child(id)}/diary`, { date }),
    timetable: (id: number) => client.get<TimetableSlot[]>(`${child(id)}/timetable`),
    exams: (id: number) => client.get<ExamsData>(`${child(id)}/exams`),
    results: (id: number) => client.get<ResultsData>(`${child(id)}/results`),
    homework: (id: number) => client.get<HomeworkData>(`${child(id)}/homework`),
    leave: (id: number) => client.get<LeaveData>(`${child(id)}/leave`),
    applyLeave: (id: number, input: LeaveInput) => client.post<LeaveNote>(`${child(id)}/leave`, input),
    invoice: (id: number, invoiceId: number) => client.get<InvoiceDetail>(`${child(id)}/invoices/${invoiceId}`),
    profile: (id: number) => client.get<ChildProfile>(`${child(id)}/profile`),
    school: () => client.get<SchoolContact>('/parent/school'),
  };
}
