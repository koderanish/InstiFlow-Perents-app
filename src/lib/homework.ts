import { daysFromToday } from './learn-dates';
import { dayMonth } from './format';
import type { Tone } from './status-copy';
import type { HomeworkItem } from '@/types/parent';

export type HomeworkFilter = 'todo' | 'done' | 'all';

export const isDone = (item: HomeworkItem): boolean => item.status === 'submitted' || item.status === 'late' || item.status === 'graded';

export const homeworkCounts = (items: HomeworkItem[]): Record<HomeworkFilter, number> => {
  const done = items.filter(isDone).length;
  return { todo: items.length - done, done, all: items.length };
};

const dueSort = (a: HomeworkItem, b: HomeworkItem): number => {
  if (a.dueDate === b.dueDate) return b.assignedAt.localeCompare(a.assignedAt);
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate.localeCompare(b.dueDate);
};

const newestFirst = (a: HomeworkItem, b: HomeworkItem): number => b.assignedAt.localeCompare(a.assignedAt) || b.id - a.id;

/** To do: soonest due first. Done and All: newest first. */
export const visibleHomework = (items: HomeworkItem[], filter: HomeworkFilter): HomeworkItem[] => {
  if (filter === 'todo') return items.filter((i) => !isDone(i)).sort(dueSort);
  if (filter === 'done') return items.filter(isDone).sort(newestFirst);
  return [...items].sort(newestFirst);
};

export interface HomeworkBadge {
  label: string;
  tone: Tone;
}

/** Due badge for work still to do; null once handed in. Neutral means "just show the date". */
export const dueBadge = (item: HomeworkItem, now: Date): HomeworkBadge | null => {
  if (isDone(item)) return null;
  const days = daysFromToday(item.dueDate, now);
  if (item.status === 'overdue' || (days !== null && days < 0)) return { label: 'Overdue', tone: 'bad' };
  if (days === null) return { label: 'No due date', tone: 'neutral' };
  if (days === 0) return { label: 'Due today', tone: 'warn' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'warn' };
  return { label: `Due ${dayMonth(item.dueDate) ?? item.dueDate}`, tone: 'neutral' };
};

/** Status badge for work that has been handed in. */
export const doneBadge = (item: HomeworkItem): HomeworkBadge | null => {
  if (item.status === 'graded') {
    if (item.marks === null) return { label: 'Marked', tone: 'good' };
    return { label: item.maxMarks !== null ? `Marked, ${item.marks} of ${item.maxMarks}` : `Marked, ${item.marks}`, tone: 'good' };
  }
  if (item.status === 'late') return { label: 'Handed in late', tone: 'warn' };
  if (item.status === 'submitted') return { label: 'Handed in', tone: 'good' };
  return null;
};

export const feedbackLine = (item: HomeworkItem): string | null => (item.feedback?.trim() ? `Teacher's note: ${item.feedback.trim()}` : null);

/** "Set by Mrs. Gupta on 3 October". */
export const setByLine = (item: HomeworkItem): string | null => {
  const on = dayMonth(item.assignedAt);
  if (item.teacher && on) return `Set by ${item.teacher} on ${on}`;
  if (item.teacher) return `Set by ${item.teacher}`;
  return on ? `Set on ${on}` : null;
};

export const homeworkSubtitle = (name: string, counts: Record<HomeworkFilter, number>): string => {
  if (counts.all === 0) return name;
  return counts.todo === 0 ? `${name}, all done` : `${name}, ${counts.todo} to do`;
};
