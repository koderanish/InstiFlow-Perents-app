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
});
