import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { parentApi } from '@/api/services';
import { SCHOOL } from '@/config/school';
import type { LeaveInput } from '@/types/parent';
import { parseBusAlerts } from '@/lib/bus-alerts';
import { parseBusLive, pollInterval, withResolvedHeading, type BusLive } from '@/lib/bus-live';
import { parseEvents } from '@/lib/events';
import { childrenForSchool, pickChild } from '@/lib/children';
import { useChildStore } from '@/stores/child-store';

export const queryKeys = {
  dashboard: ['parent', 'dashboard'] as const,
  today: (id: number) => ['parent', id, 'today'] as const,
  attendance: (id: number, month: string | undefined) => ['parent', id, 'attendance', month ?? 'current'] as const,
  bus: (id: number) => ['parent', id, 'bus'] as const,
  busAlerts: (id: number) => ['parent', id, 'bus-alerts'] as const,
  busLocation: (id: number) => ['parent', id, 'bus-location'] as const,
  fees: (id: number) => ['parent', id, 'fees'] as const,
  notices: (id: number) => ['parent', id, 'notices'] as const,
  diary: (id: number, date: string | undefined) => ['parent', id, 'diary', date ?? 'today'] as const,
  timetable: (id: number) => ['parent', id, 'timetable'] as const,
  exams: (id: number) => ['parent', id, 'exams'] as const,
  results: (id: number) => ['parent', id, 'results'] as const,
  homework: (id: number) => ['parent', id, 'homework'] as const,
  leave: (id: number) => ['parent', id, 'leave'] as const,
  invoice: (id: number, invoiceId: number) => ['parent', id, 'invoice', invoiceId] as const,
  profile: (id: number) => ['parent', id, 'profile'] as const,
  school: ['parent', 'school'] as const,
  events: (id: number | undefined) => ['parent', 'events', id ?? 'all'] as const,
};

/** All of this school's children plus the one currently selected. */
export function useChildren() {
  const query = useQuery({ queryKey: queryKeys.dashboard, queryFn: () => parentApi.dashboard() });
  const selectedId = useChildStore((s) => s.selectedId);
  const restore = useChildStore((s) => s.restore);
  useEffect(() => {
    void restore();
  }, [restore]);
  const children = useMemo(() => (query.data ? childrenForSchool(query.data, SCHOOL.code) : []), [query.data]);
  const child = pickChild(children, selectedId);
  return { ...query, children, child };
}

const enabled = (id: number | undefined) => id !== undefined;

export const useToday = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.today(id ?? 0), queryFn: () => parentApi.today(id as number), enabled: enabled(id) });

export const useAttendance = (id: number | undefined, month?: string) =>
  useQuery({ queryKey: queryKeys.attendance(id ?? 0, month), queryFn: () => parentApi.attendance(id as number, month), enabled: enabled(id) });

export const useBus = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.bus(id ?? 0), queryFn: () => parentApi.bus(id as number), enabled: enabled(id) });

export const useBusAlerts = (id: number | undefined) =>
  useQuery({
    queryKey: queryKeys.busAlerts(id ?? 0),
    queryFn: async () => parseBusAlerts(await parentApi.busAlerts(id as number)),
    enabled: enabled(id),
  });

/**
 * Live bus position from the driver app. Polls every 10 s while the bus is live (30 s otherwise) and only
 * while `active`: pass false when the screen is blurred or the app is in the background. Coming back to
 * active refreshes straight away.
 */
export const useBusLocation = (id: number | undefined, active: boolean) => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.busLocation(id ?? 0),
    queryFn: async () => {
      const next = parseBusLive(await parentApi.busLocation(id as number));
      return withResolvedHeading(next, qc.getQueryData<BusLive>(queryKeys.busLocation(id ?? 0)) ?? null);
    },
    enabled: enabled(id),
    retry: 1,
    refetchInterval: (q) => pollInterval(q.state.data?.live, active),
  });
  const { refetch } = query;
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current && id !== undefined) void refetch();
    wasActive.current = active;
  }, [active, id, refetch]);
  return query;
};

export const useFees = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.fees(id ?? 0), queryFn: () => parentApi.fees(id as number), enabled: enabled(id) });

export const useNotices = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.notices(id ?? 0), queryFn: () => parentApi.notices(id as number), enabled: enabled(id) });

export const useDiary = (id: number | undefined, date?: string) =>
  useQuery({ queryKey: queryKeys.diary(id ?? 0, date), queryFn: () => parentApi.diary(id as number, date), enabled: enabled(id) });

export const useTimetable = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.timetable(id ?? 0), queryFn: () => parentApi.timetable(id as number), enabled: enabled(id) });

export const useExams = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.exams(id ?? 0), queryFn: () => parentApi.exams(id as number), enabled: enabled(id) });

export const useResults = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.results(id ?? 0), queryFn: () => parentApi.results(id as number), enabled: enabled(id) });

export const useHomework = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.homework(id ?? 0), queryFn: () => parentApi.homework(id as number), enabled: enabled(id) });

export const useLeave = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.leave(id ?? 0), queryFn: () => parentApi.leave(id as number), enabled: enabled(id) });

export const useApplyLeave = (id: number | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveInput) => parentApi.applyLeave(id as number, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.leave(id ?? 0) });
      void qc.invalidateQueries({ queryKey: queryKeys.attendance(id ?? 0, undefined) });
    },
  });
};

export const useInvoice = (id: number | undefined, invoiceId: number | undefined) =>
  useQuery({
    queryKey: queryKeys.invoice(id ?? 0, invoiceId ?? 0),
    queryFn: () => parentApi.invoice(id as number, invoiceId as number),
    enabled: enabled(id) && invoiceId !== undefined,
  });

export const useChildProfile = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.profile(id ?? 0), queryFn: () => parentApi.profile(id as number), enabled: enabled(id) });

export const useSchoolContact = () => useQuery({ queryKey: queryKeys.school, queryFn: () => parentApi.school() });

/** School events. `id` is optional: the school-wide list still loads when no child is selected. */
export const useEvents = (id: number | undefined, ready = true) =>
  useQuery({ queryKey: queryKeys.events(id), queryFn: async () => parseEvents(await parentApi.events(id)), enabled: ready });
