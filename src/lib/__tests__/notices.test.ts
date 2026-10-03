import { ALL_CATEGORIES, categoryLabel, filterNotices, noticeCategories, priorityInfo } from '../notices';
import type { Notice } from '@/types/parent';

const notice = (id: number, category: string | null, priority: string | null = null): Notice => ({
  id,
  title: `Notice ${id}`,
  content: null,
  category,
  priority,
  postedAt: '2026-10-03T08:15:00.000Z',
});

const list = [notice(1, 'meeting'), notice(2, 'Fees'), notice(3, 'meeting'), notice(4, null), notice(5, ' ')];

describe('notices', () => {
  it('labels categories', () => {
    expect(categoryLabel('parent_meeting')).toBe('Parent Meeting');
    expect(categoryLabel(' ')).toBeNull();
    expect(categoryLabel(null)).toBeNull();
  });

  it('lists distinct categories in order', () => {
    expect(noticeCategories(list)).toEqual(['Meeting', 'Fees']);
  });

  it('filters by category', () => {
    expect(filterNotices(list, ALL_CATEGORIES)).toHaveLength(5);
    expect(filterNotices(list, 'Meeting').map((n) => n.id)).toEqual([1, 3]);
    expect(filterNotices(list, 'Nothing')).toEqual([]);
  });

  it('only marks urgent and important priority', () => {
    expect(priorityInfo('URGENT')).toEqual({ label: 'Urgent', tone: 'bad' });
    expect(priorityInfo('high')).toEqual({ label: 'Important', tone: 'warn' });
    expect(priorityInfo('normal')).toBeNull();
    expect(priorityInfo(null)).toBeNull();
  });
});
