import type { ParentChild, ParentDashboard } from '@/types/parent';

/**
 * This app is compiled for one school, so only that school's children are shown.
 * If the code does not match any school (for example a renamed code), fall back
 * to every linked child rather than showing an empty app.
 */
export const childrenForSchool = (dashboard: ParentDashboard, schoolCode: string): ParentChild[] => {
  const code = schoolCode.trim().toLowerCase();
  const matching = dashboard.schools.filter((s) => s.code.trim().toLowerCase() === code);
  const schools = matching.length > 0 ? matching : dashboard.schools;
  return schools.flatMap((s) => s.students);
};

/** Keeps the previous selection when it is still valid, otherwise the first child. */
export const pickChild = (children: ParentChild[], selectedId: number | null): ParentChild | null =>
  children.find((c) => c.id === selectedId) ?? children[0] ?? null;
