import { doneBadge, dueBadge, feedbackLine, homeworkCounts, homeworkSubtitle, isDone, setByLine, visibleHomework } from '../homework';
import type { HomeworkItem } from '@/types/parent';

const item = (id: number, extra: Partial<HomeworkItem> = {}): HomeworkItem => ({
  id,
  title: `Task ${id}`,
  description: null,
  subject: 'Maths',
  teacher: null,
  assignedAt: '2026-10-01',
  dueDate: '2026-10-09',
  maxMarks: null,
  status: 'pending',
  marks: null,
  feedback: null,
  ...extra,
});

// Friday 2 October 2026.
const now = new Date(2026, 9, 2, 9, 0);

describe('homework filters', () => {
  const items = [
    item(1, { dueDate: '2026-10-09' }),
    item(2, { dueDate: '2026-10-03', assignedAt: '2026-09-30' }),
    item(3, { status: 'graded', marks: 8, maxMarks: 10, assignedAt: '2026-09-28' }),
    item(4, { status: 'submitted', assignedAt: '2026-10-01' }),
    item(5, { dueDate: null, status: 'overdue' }),
    item(6, { status: 'late', assignedAt: '2026-09-25' }),
  ];

  it('decides what is done', () => {
    expect(items.map(isDone)).toEqual([false, false, true, true, false, true]);
  });

  it('counts each filter', () => {
    expect(homeworkCounts(items)).toEqual({ todo: 3, done: 3, all: 6 });
    expect(homeworkCounts([])).toEqual({ todo: 0, done: 0, all: 0 });
  });

  it('lists to-do work by due date with undated last', () => {
    expect(visibleHomework(items, 'todo').map((i) => i.id)).toEqual([2, 1, 5]);
  });

  it('lists done and all work newest first', () => {
    expect(visibleHomework(items, 'done').map((i) => i.id)).toEqual([4, 3, 6]);
    expect(visibleHomework(items, 'all').map((i) => i.id)).toEqual([5, 4, 1, 2, 3, 6]);
  });

  it('does not change the original order', () => {
    const copy = [...items];
    visibleHomework(items, 'todo');
    expect(items).toEqual(copy);
  });
});

describe('badges', () => {
  it('words due dates', () => {
    expect(dueBadge(item(1, { dueDate: '2026-10-02' }), now)).toEqual({ label: 'Due today', tone: 'warn' });
    expect(dueBadge(item(1, { dueDate: '2026-10-03' }), now)).toEqual({ label: 'Due tomorrow', tone: 'warn' });
    expect(dueBadge(item(1, { dueDate: '2026-10-09' }), now)).toEqual({ label: 'Due 9 October', tone: 'neutral' });
    expect(dueBadge(item(1, { dueDate: null }), now)).toEqual({ label: 'No due date', tone: 'neutral' });
  });

  it('flags overdue work from the date or the status', () => {
    expect(dueBadge(item(1, { dueDate: '2026-10-01' }), now)).toEqual({ label: 'Overdue', tone: 'bad' });
    expect(dueBadge(item(1, { dueDate: '2026-10-20', status: 'overdue' }), now)).toEqual({ label: 'Overdue', tone: 'bad' });
  });

  it('has no due badge once handed in', () => {
    expect(dueBadge(item(1, { status: 'submitted', dueDate: '2026-09-01' }), now)).toBeNull();
  });

  it('words done states', () => {
    expect(doneBadge(item(1, { status: 'graded', marks: 8, maxMarks: 10 }))).toEqual({ label: 'Marked, 8 of 10', tone: 'good' });
    expect(doneBadge(item(1, { status: 'graded', marks: 8 }))).toEqual({ label: 'Marked, 8', tone: 'good' });
    expect(doneBadge(item(1, { status: 'graded' }))).toEqual({ label: 'Marked', tone: 'good' });
    expect(doneBadge(item(1, { status: 'late' }))).toEqual({ label: 'Handed in late', tone: 'warn' });
    expect(doneBadge(item(1, { status: 'submitted' }))).toEqual({ label: 'Handed in', tone: 'good' });
    expect(doneBadge(item(1))).toBeNull();
  });
});

describe('copy', () => {
  it('shows teacher feedback only when present', () => {
    expect(feedbackLine(item(1, { feedback: ' Good ideas. ' }))).toBe("Teacher's note: Good ideas.");
    expect(feedbackLine(item(1, { feedback: '  ' }))).toBeNull();
    expect(feedbackLine(item(1))).toBeNull();
  });

  it('says who set the work', () => {
    expect(setByLine(item(1, { teacher: 'Mrs. Gupta' }))).toBe('Set by Mrs. Gupta on 1 October');
    expect(setByLine(item(1, { teacher: 'Mrs. Gupta', assignedAt: 'unknown' }))).toBe('Set by Mrs. Gupta');
    expect(setByLine(item(1))).toBe('Set on 1 October');
    expect(setByLine(item(1, { assignedAt: 'unknown' }))).toBeNull();
  });

  it('writes the header subtitle', () => {
    expect(homeworkSubtitle('Aarav', { todo: 2, done: 1, all: 3 })).toBe('Aarav, 2 to do');
    expect(homeworkSubtitle('Aarav', { todo: 0, done: 1, all: 1 })).toBe('Aarav, all done');
    expect(homeworkSubtitle('Aarav', { todo: 0, done: 0, all: 0 })).toBe('Aarav');
  });
});
