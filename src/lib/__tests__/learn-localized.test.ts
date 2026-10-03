import { makeT } from '@/i18n/translate';
import type { ExamPaper, ExamResult, ExamSeries, HomeworkItem, TimetableSlot } from '@/types/parent';

import { monthLabel, weekdayInitials } from '../calendar';
import { daysToGo, nextPaperHeadline, paperNoteLine, paperTimeLine, paperWhen, seriesRange } from '../exams';
import { doneBadge, dueBadge, feedbackLine, homeworkSubtitle, setByLine } from '../homework';
import { shortDateParts } from '../learn-dates';
import { marksSummary, reportCardText, resultBadge, scaleNote } from '../results';
import { periodLabel, schoolDayNames, slotTimeRange } from '../timetable';

const en = makeT('en');
const hi = makeT('hi');

const paper = (extra: Partial<ExamPaper> = {}): ExamPaper => ({
  id: 1,
  subject: 'Maths',
  date: '2026-10-09',
  startTime: '09:00',
  endTime: '09:45',
  venue: null,
  maxMarks: null,
  ...extra,
});

const series = (startDate: string, endDate: string): ExamSeries => ({ id: 1, name: 'Unit test 2', type: null, startDate, endDate, papers: [] });

const homework = (extra: Partial<HomeworkItem> = {}): HomeworkItem => ({
  id: 1,
  title: 'Task',
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
  subjects: [
    { name: 'Mathematics', marks: 86, maxMarks: 100, grade: 'A', remarks: null },
    { name: 'English', marks: 82, maxMarks: 100, grade: 'A', remarks: null },
  ],
  ...extra,
});

const slot = (extra: Partial<TimetableSlot> = {}): TimetableSlot => ({ dayIndex: 0, period: '1', start: '08:30', end: '09:15', isBreak: false, subject: 'Maths', teacher: null, ...extra });

// Friday 2 October 2026.
const now = new Date(2026, 9, 2, 9, 0);

describe('dates in Hindi', () => {
  it('uses Hindi month names for tiles, labels and ranges', () => {
    expect(shortDateParts('2026-10-09', 'hi')).toEqual({ day: '9', month: 'अक्टू॰' });
    expect(shortDateParts('2026-10-09', 'en')).toEqual({ day: '9', month: 'Oct' });
    expect(monthLabel('2026-10', 'hi')).toBe('अक्टूबर 2026');
    expect(paperWhen(paper(), 'hi')).toBe('9 अक्टूबर, 9:00 am');
    expect(seriesRange(series('2026-10-09', '2026-10-15'), hi, 'hi')).toBe('9 अक्टूबर से 15 अक्टूबर');
  });

  it('builds Monday-first weekday headers', () => {
    expect(weekdayInitials('en')).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(weekdayInitials('hi')).toEqual(['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि']);
  });

  it('names school days from a Monday-first index', () => {
    expect(schoolDayNames('en', 0)).toEqual({ short: 'Mon', long: 'Monday' });
    expect(schoolDayNames('en', 5)).toEqual({ short: 'Sat', long: 'Saturday' });
    expect(schoolDayNames('hi', 0).long).toBe('सोमवार');
    expect(schoolDayNames('hi', 5).long).toBe('शनिवार');
  });
});

describe('exam copy in Hindi', () => {
  it('words days to go with plurals', () => {
    expect(daysToGo(0, hi)).toBe('आज');
    expect(daysToGo(1, hi)).toBe('कल');
    expect(daysToGo(7, hi)).toBe('7 दिन में');
    expect(daysToGo(7, en)).toBe('in 7 days');
    expect(nextPaperHeadline({ series: series('2026-10-09', '2026-10-15'), paper: paper(), days: 7 }, hi)).toBe('Maths, 7 दिन में');
  });

  it('describes time and notes', () => {
    expect(paperTimeLine(paper(), hi)).toBe('9:00 am, 45 मिनट');
    expect(paperNoteLine(paper({ venue: 'Room 12', maxMarks: 50 }), hi)).toBe('Room 12, 50 अंक');
    expect(paperNoteLine(paper({ maxMarks: 1 }), en)).toBe('1 mark');
  });
});

describe('homework copy in Hindi', () => {
  it('words due dates and states', () => {
    expect(dueBadge(homework({ dueDate: '2026-10-02' }), now, hi, 'hi')).toEqual({ label: 'आज जमा करना है', tone: 'warn' });
    expect(dueBadge(homework({ dueDate: '2026-10-09' }), now, hi, 'hi')).toEqual({ label: 'अंतिम तिथि 9 अक्टूबर', tone: 'neutral' });
    expect(dueBadge(homework({ dueDate: '2026-10-09' }), now, en, 'en')).toEqual({ label: 'Due 9 October', tone: 'neutral' });
    expect(doneBadge(homework({ status: 'graded', marks: 8, maxMarks: 10 }), hi)).toEqual({ label: 'जाँचा गया, 10 में से 8', tone: 'good' });
    expect(doneBadge(homework({ status: 'late' }), hi)).toEqual({ label: 'देर से जमा किया', tone: 'warn' });
  });

  it('writes notes, authorship and the header subtitle', () => {
    expect(feedbackLine(homework({ feedback: ' अच्छा काम ' }), hi)).toBe('शिक्षक की टिप्पणी: अच्छा काम');
    expect(setByLine(homework({ teacher: 'श्रीमती गुप्ता' }), hi, 'hi')).toBe('श्रीमती गुप्ता ने 1 अक्टूबर को दिया');
    expect(setByLine(homework(), hi, 'hi')).toBe('1 अक्टूबर को दिया गया');
    expect(homeworkSubtitle('आरव', { todo: 2, done: 1, all: 3 }, hi)).toBe('आरव, 2 करने बाकी');
    expect(homeworkSubtitle('आरव', { todo: 0, done: 1, all: 1 }, hi)).toBe('आरव, सब पूरा');
  });
});

describe('result copy in Hindi', () => {
  it('words badges and summaries', () => {
    expect(resultBadge(result(), hi)).toEqual({ label: 'उत्तीर्ण, ग्रेड A', tone: 'good' });
    expect(resultBadge(result({ passed: false }), hi)?.label).toBe('सहयोग की ज़रूरत, ग्रेड A');
    expect(marksSummary(result(), hi)).toBe('2 विषय में कुल 400 में से 320 अंक');
    expect(marksSummary(result(), en)).toBe('320 of 400 marks across 2 subjects');
    expect(marksSummary(result({ subjects: [] }), hi)).toBe('400 में से 320 अंक');
    expect(marksSummary(result({ totalMarks: null, subjects: [] }), hi)).toBe('अंक अभी जोड़े नहीं गए');
    expect(scaleNote(result().subjects, hi)).toBe('हर विषय 100 अंक का है।');
  });

  it('translates the shared report card text', () => {
    const text = reportCardText({ schoolName: 'Sunrise School', studentName: 'Aarav', className: 'Class 6 B', result: result({ remarks: 'Steady' }) }, hi);
    const lines = text.split('\n');
    expect(lines[1]).toBe('रिपोर्ट कार्ड: Mid-term 2026');
    expect(lines).toContain('कुल 320/400, 80%, ग्रेड A, उत्तीर्ण');
    expect(lines).toContain('टिप्पणी: Steady');
  });
});

describe('timetable copy in Hindi', () => {
  it('labels periods and ranges', () => {
    expect(periodLabel('3', hi)).toBe('पीरियड 3');
    expect(periodLabel('Assembly', hi)).toBe('Assembly');
    expect(slotTimeRange(slot(), hi)).toBe('8:30 am से 9:15 am');
  });

  it('chooses plural class counts', () => {
    expect(en('learn.timetable.classes', { count: 1 })).toBe('1 class');
    expect(en('learn.timetable.classes', { count: 6 })).toBe('6 classes');
    expect(hi('learn.timetable.classes', { count: 6 })).toBe('6 कक्षाएँ');
    expect(hi('learn.timetable.classes', { count: 1 })).toBe('1 कक्षा');
  });
});
