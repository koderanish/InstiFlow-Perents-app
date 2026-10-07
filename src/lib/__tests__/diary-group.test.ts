import type { DiaryEntry } from '@/types/parent';

import { groupDiaryBySubject } from '../diary-group';

const entry = (over: Partial<DiaryEntry> = {}): DiaryEntry => ({
  subject: 'History',
  topic: 'Varn Vyavastha',
  homework: null,
  unitTitle: 'Unit 2',
  chapterTitle: 'Varn Vyavastha',
  notes: null,
  progress: 100,
  time: '08:00 - 08:40',
  status: 'logged',
  period: null,
  ...over,
});

describe('groupDiaryBySubject', () => {
  it('folds same-subject entries of a day into one group', () => {
    const groups = groupDiaryBySubject([
      entry({ topic: 'Harappa sabhyata', progress: 0 }),
      entry(),
      entry({ topic: 'Chandragupta Maurya', subject: 'history' }),
      entry({ subject: 'Mathematics', topic: 'Fractions' }),
    ]);
    expect(groups.map((g) => [g.subject, g.entries.length])).toEqual([
      ['History', 3],
      ['Mathematics', 1],
    ]);
  });

  it('returns no groups for no entries', () => {
    expect(groupDiaryBySubject([])).toEqual([]);
  });

  it('keeps pending entries grouped by subject like logged ones', () => {
    const groups = groupDiaryBySubject([
      entry({ subject: 'English', topic: null, homework: null, progress: 0, time: '08:40', status: 'pending', period: 'Period 2' }),
      entry({ subject: 'Maths', topic: 'Fractions' }),
    ]);
    expect(groups.map((g) => g.subject)).toEqual(['English', 'Maths']);
    expect(groups[0]?.entries[0]?.status).toBe('pending');
  });
});
