import type {
  AttendanceMonth,
  BusDetails,
  DiaryDay,
  FeesData,
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
  };
}
