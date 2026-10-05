import { defaultT, type TFunction } from '@/i18n/translate';
import type { Locale } from '@/i18n/types';

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

export interface HomeworkStats {
  total: number;
  done: number;
  pending: number;
  percentage: number;
}

/** Lifetime stats for the History page: how much homework ever came, how much got done. */
export function homeworkStats(items: readonly HomeworkItem[]): HomeworkStats {
  const total = items.length;
  const done = items.filter(isDone).length;
  const pending = total - done;
  return { total, done, pending, percentage: total > 0 ? Math.round((done / total) * 100) : 0 };
}

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

/** Due badge for work still to do; null once handed in or explicitly marked. Neutral means "just show the date". */
export const dueBadge = (item: HomeworkItem, now: Date, t: TFunction = defaultT, locale: Locale = 'en'): HomeworkBadge | null => {
  if (isDone(item) || item.status === 'not_completed') return null;
  const days = daysFromToday(item.dueDate, now);
  if (item.status === 'overdue' || (days !== null && days < 0)) return { label: t('learn.homework.overdue'), tone: 'bad' };
  if (days === null) return { label: t('learn.homework.noDueDate'), tone: 'neutral' };
  if (days === 0) return { label: t('learn.homework.dueToday'), tone: 'warn' };
  if (days === 1) return { label: t('learn.homework.dueTomorrow'), tone: 'warn' };
  return { label: t('learn.homework.dueOn', { date: dayMonth(item.dueDate, locale) ?? item.dueDate ?? '' }), tone: 'neutral' };
};

/** Status badge for work that has been handed in. */
export const doneBadge = (item: HomeworkItem, t: TFunction = defaultT): HomeworkBadge | null => {
  if (item.status === 'graded') {
    if (item.marks === null) return { label: t('learn.homework.marked'), tone: 'good' };
    return {
      label: item.maxMarks !== null ? t('learn.homework.markedOutOf', { marks: item.marks, max: item.maxMarks }) : t('learn.homework.markedMarks', { marks: item.marks }),
      tone: 'good',
    };
  }
  if (item.status === 'late') return { label: t('learn.homework.handedInLate'), tone: 'warn' };
  if (item.status === 'submitted') return { label: t('learn.homework.handedIn'), tone: 'good' };
  if (item.status === 'not_completed') return { label: t('learn.homework.notCompleted'), tone: 'bad' };
  return null;
};

export const feedbackLine = (item: HomeworkItem, t: TFunction = defaultT): string | null =>
  item.feedback?.trim() ? t('learn.homework.teacherNote', { note: item.feedback.trim() }) : null;

/** "Set by Mrs. Gupta on 3 October". */
export const setByLine = (item: HomeworkItem, t: TFunction = defaultT, locale: Locale = 'en'): string | null => {
  const on = dayMonth(item.assignedAt, locale);
  if (item.teacher && on) return t('learn.homework.setByOn', { teacher: item.teacher, date: on });
  if (item.teacher) return t('learn.homework.setBy', { teacher: item.teacher });
  return on ? t('learn.homework.setOn', { date: on }) : null;
};

export const homeworkSubtitle = (name: string, counts: Record<HomeworkFilter, number>, t: TFunction = defaultT): string => {
  if (counts.all === 0) return name;
  return counts.todo === 0 ? t('learn.homework.subtitleAllDone', { name }) : t('learn.homework.subtitleTodo', { name, count: counts.todo });
};
