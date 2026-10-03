import { formatMarks, marksSummary, percentLabel, reportCardText, resultBadge, resultPercent, scaleNote, subjectRatio } from '../results';
import type { ExamResult, SubjectResult } from '@/types/parent';

const subject = (name: string, marks: number | null, maxMarks: number | null, grade: string | null = null): SubjectResult => ({
  name,
  marks,
  maxMarks,
  grade,
  remarks: null,
});

const result = (extra: Partial<ExamResult> = {}): ExamResult => ({
  id: 1,
  name: 'Mid-term 2026',
  type: null,
  publishedAt: '2026-10-01',
  totalMarks: 320,
  maxTotal: 400,
  percentage: 80,
  grade: 'A',
  passed: true,
  remarks: null,
  subjects: [subject('Mathematics', 86, 100, 'A'), subject('English', 82, 100, 'A'), subject('Science', 74, 100, 'B'), subject('Hindi', 78, 100, 'B+')],
  ...extra,
});

describe('numbers', () => {
  it('trims marks', () => {
    expect(formatMarks(86)).toBe('86');
    expect(formatMarks(86.5)).toBe('86.5');
    expect(formatMarks(86.123)).toBe('86.12');
    expect(formatMarks(null)).toBe('—');
  });

  it('uses the sent percentage, else derives it', () => {
    expect(resultPercent(result())).toBe(80);
    expect(resultPercent(result({ percentage: null }))).toBe(80);
    expect(resultPercent(result({ percentage: null, totalMarks: null }))).toBeNull();
    expect(resultPercent(result({ percentage: null, maxTotal: 0 }))).toBeNull();
  });

  it('rounds percentages for display', () => {
    expect(percentLabel(79.6)).toBe('80%');
    expect(percentLabel(null)).toBe('—');
  });
});

describe('badge and summary', () => {
  it('words the verdict', () => {
    expect(resultBadge(result())).toEqual({ label: 'Passed, grade A', tone: 'good' });
    expect(resultBadge(result({ grade: null }))).toEqual({ label: 'Passed', tone: 'good' });
    expect(resultBadge(result({ passed: false, grade: 'D' }))).toEqual({ label: 'Needs support, grade D', tone: 'warn' });
    expect(resultBadge(result({ passed: null }))).toEqual({ label: 'Grade A', tone: 'neutral' });
    expect(resultBadge(result({ passed: null, grade: null }))).toBeNull();
  });

  it('summarises marks', () => {
    expect(marksSummary(result())).toBe('320 of 400 marks across 4 subjects');
    expect(marksSummary(result({ subjects: [subject('Maths', 9, 10)] }))).toBe('320 of 400 marks across 1 subject');
    expect(marksSummary(result({ totalMarks: null }))).toBe('4 subjects');
    expect(marksSummary(result({ totalMarks: null, subjects: [] }))).toBe('Marks not added yet');
  });
});

describe('subjects', () => {
  it('works out bar length', () => {
    expect(subjectRatio(subject('Maths', 86, 100))).toBeCloseTo(0.86);
    expect(subjectRatio(subject('Maths', 120, 100))).toBe(1);
    expect(subjectRatio(subject('Maths', null, 100))).toBeNull();
    expect(subjectRatio(subject('Maths', 5, 0))).toBeNull();
    expect(subjectRatio(subject('Maths', 5, null))).toBeNull();
  });

  it('notes a common scale only when papers match', () => {
    expect(scaleNote(result().subjects)).toBe('Each subject is marked out of 100.');
    expect(scaleNote([subject('A', 1, 50), subject('B', 1, 100)])).toBeNull();
    expect(scaleNote([])).toBeNull();
  });
});

describe('reportCardText', () => {
  it('builds a readable summary', () => {
    const text = reportCardText({ schoolName: 'Sunrise School', studentName: 'Aarav Sharma', className: 'Class 6 B', result: result({ remarks: ' Steady work. ' }) });
    expect(text.split('\n')).toEqual([
      'Sunrise School',
      'Report card: Mid-term 2026',
      'Aarav Sharma, Class 6 B',
      '',
      'Mathematics: 86/100 (A)',
      'English: 82/100 (A)',
      'Science: 74/100 (B)',
      'Hindi: 78/100 (B+)',
      '',
      'Total 320/400, 80%, Grade A, Passed',
      'Remarks: Steady work.',
    ]);
  });

  it('copes with missing data', () => {
    const text = reportCardText({
      schoolName: 'Sunrise School',
      studentName: 'Aarav',
      className: null,
      result: result({ totalMarks: null, percentage: null, grade: null, passed: null, subjects: [subject('Art', null, null)] }),
    });
    expect(text).toContain('Art: not marked');
    expect(text).toContain('\nAarav\n');
    expect(text).not.toContain('Total');
    expect(text).not.toContain('Remarks');
  });
});
