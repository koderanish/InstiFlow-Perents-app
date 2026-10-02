import { childrenForSchool, pickChild } from '../children';
import type { ParentChild, ParentDashboard } from '@/types/parent';

const kid = (id: number, name: string): ParentChild => ({
  id, name, admissionNo: `A${id}`, classId: 1, className: 'Class 6', status: 'active', relation: 'mother', isPrimary: true,
});

const dash: ParentDashboard = {
  parentId: 1,
  totalSchools: 2,
  totalStudents: 3,
  defaultSchoolId: null,
  schools: [
    { id: 1, name: 'A', code: 'AAA', students: [kid(1, 'Aarav'), kid(2, 'Diya')] },
    { id: 2, name: 'B', code: 'BBB', students: [kid(3, 'Other')] },
  ],
};

describe('children', () => {
  it('keeps only this school', () => {
    expect(childrenForSchool(dash, 'aaa').map((c) => c.id)).toEqual([1, 2]);
  });
  it('falls back to all children when the code matches nothing', () => {
    expect(childrenForSchool(dash, 'zzz').map((c) => c.id)).toEqual([1, 2, 3]);
  });
  it('keeps a valid selection and otherwise picks the first', () => {
    const kids = childrenForSchool(dash, 'AAA');
    expect(pickChild(kids, 2)?.id).toBe(2);
    expect(pickChild(kids, 99)?.id).toBe(1);
    expect(pickChild(kids, null)?.id).toBe(1);
    expect(pickChild([], 1)).toBeNull();
  });
});
