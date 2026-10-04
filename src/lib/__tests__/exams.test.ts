import { buildExamPlan, daysToGo, nextPaperHeadline, paperNoteLine, paperTimeLine, paperWhen, seriesRange } from '../exams';
import type { ExamPaper, ExamSeries } from '@/types/parent';

const paper = (id: number, subject: string, date: string, extra: Partial<ExamPaper> = {}): ExamPaper => ({
  id,
  subject,
  date,
  startTime: '09:00',
  endTime: '09:45',
  venue: null,
  maxMarks: null,
  ...extra,
});

const series = (id: number, name: string, startDate: string, endDate: string, papers: ExamPaper[]): ExamSeries => ({
  id,
  name,
  type: null,
  startDate,
  endDate,
  papers,
});

// Friday 2 October 2026.
const now = new Date(2026, 9, 2, 10, 0);

describe('buildExamPlan', () => {
  const unit = series(1, 'Unit test 2', '2026-10-09', '2026-10-15', [
    paper(13, 'English', '2026-10-15'),
    paper(11, 'Maths', '2026-10-09'),
    paper(12, 'Science', '2026-10-12'),
  ]);
  const half = series(2, 'Half yearly', '2026-09-20', '2026-09-26', [paper(21, 'Hindi', '2026-09-20'), paper(22, 'Maths', '2026-09-22')]);

  it('puts upcoming series first and sorts papers by date', () => {
    const plan = buildExamPlan([half, unit], now);
    expect(plan.series.map((s) => s.series.name)).toEqual(['Unit test 2', 'Half yearly']);
    expect(plan.series[0]?.papers.map((p) => p.paper.subject)).toEqual(['Maths', 'Science', 'English']);
    expect(plan.series[0]?.upcoming).toBe(true);
    expect(plan.series[1]?.upcoming).toBe(false);
  });

  it('shows the most recent series on top', () => {
    const mid = series(3, 'Mid term', '2026-10-05', '2026-10-08', [paper(31, 'English', '2026-10-05')]);
    const plan = buildExamPlan([unit, half, mid], now);
    expect(plan.series.map((s) => s.series.name)).toEqual(['Unit test 2', 'Mid term', 'Half yearly']);
  });

  it('finds the next paper and its days to go', () => {
    const plan = buildExamPlan([half, unit], now);
    expect(plan.next?.paper.subject).toBe('Maths');
    expect(plan.next?.days).toBe(7);
    expect(plan.next && nextPaperHeadline(plan.next)).toBe('Maths, in 7 days');
  });

  it('counts a paper today as upcoming', () => {
    const plan = buildExamPlan([unit], new Date(2026, 9, 9, 18, 0));
    expect(plan.next?.days).toBe(0);
    expect(plan.series[0]?.papers[0]?.past).toBe(false);
  });

  it('marks earlier papers of a running series as past', () => {
    const plan = buildExamPlan([unit], new Date(2026, 9, 10, 8, 0));
    expect(plan.series[0]?.papers.map((p) => p.past)).toEqual([true, false, false]);
    expect(plan.next?.paper.subject).toBe('Science');
  });

  it('has no next paper once everything is over', () => {
    const plan = buildExamPlan([half], now);
    expect(plan.next).toBeNull();
    expect(plan.series[0]?.papers.every((p) => p.past)).toBe(true);
  });

  it('orders same-day papers by start time and handles an empty list', () => {
    const day = series(3, 'Quiz', '2026-10-05', '2026-10-05', [
      paper(32, 'Art', '2026-10-05', { startTime: null }),
      paper(31, 'Maths', '2026-10-05', { startTime: '11:00' }),
      paper(30, 'Hindi', '2026-10-05', { startTime: '08:30' }),
    ]);
    expect(buildExamPlan([day], now).series[0]?.papers.map((p) => p.paper.subject)).toEqual(['Hindi', 'Maths', 'Art']);
    expect(buildExamPlan([], now)).toEqual({ next: null, series: [] });
  });

  it('picks the earliest next paper across series', () => {
    const early = series(4, 'Practical', '2026-10-05', '2026-10-06', [paper(41, 'Computer', '2026-10-05')]);
    expect(buildExamPlan([unit, early], now).next?.paper.subject).toBe('Computer');
  });
});

describe('exam copy', () => {
  it('words days to go', () => {
    expect(daysToGo(0)).toBe('today');
    expect(daysToGo(1)).toBe('tomorrow');
    expect(daysToGo(7)).toBe('in 7 days');
  });

  it('describes when a paper is', () => {
    expect(paperWhen(paper(1, 'Maths', '2026-10-09'))).toBe('9 October, 9:00 am');
    expect(paperWhen(paper(1, 'Maths', '2026-10-09', { startTime: null }))).toBe('9 October');
  });

  it('shows time with duration', () => {
    expect(paperTimeLine(paper(1, 'Maths', '2026-10-09'))).toBe('9:00 am, 45 min');
    expect(paperTimeLine(paper(1, 'Maths', '2026-10-09', { endTime: null }))).toBe('9:00 am');
    expect(paperTimeLine(paper(1, 'Maths', '2026-10-09', { startTime: null }))).toBeNull();
  });

  it('shows venue and marks when known', () => {
    expect(paperNoteLine(paper(1, 'Maths', '2026-10-09', { venue: 'Room 12', maxMarks: 50 }))).toBe('Room 12, 50 marks');
    expect(paperNoteLine(paper(1, 'Maths', '2026-10-09', { maxMarks: 20 }))).toBe('20 marks');
    expect(paperNoteLine(paper(1, 'Maths', '2026-10-09'))).toBeNull();
  });

  it('describes a series range', () => {
    expect(seriesRange(series(1, 'A', '2026-10-09', '2026-10-15', []))).toBe('9 October to 15 October');
    expect(seriesRange(series(1, 'A', '2026-10-09', '2026-10-09', []))).toBe('9 October');
  });
});
