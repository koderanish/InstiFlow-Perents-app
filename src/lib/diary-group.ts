import type { DiaryEntry } from '@/types/parent';

export interface DiarySubjectGroup {
  subject: string;
  entries: DiaryEntry[];
}

/**
 * One card per subject per day: diary entries of the same subject fold into
 * a single group so a twice-logged period never shows two cards. Order
 * follows the input (API returns time-ordered rows).
 */
export function groupDiaryBySubject(entries: readonly DiaryEntry[]): DiarySubjectGroup[] {
  const groups: DiarySubjectGroup[] = [];
  const index = new Map<string, DiarySubjectGroup>();
  for (const entry of entries) {
    const key = entry.subject.trim().toLowerCase();
    let group = index.get(key);
    if (!group) {
      group = { subject: entry.subject, entries: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
}
