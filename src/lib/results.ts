import type { Tone } from './status-copy';
import type { ExamResult, SubjectResult } from '@/types/parent';

/** 86 -> "86", 86.5 -> "86.5", 86.123 -> "86.12". */
export const formatMarks = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : String(Math.round(value * 100) / 100);

/** Percentage for a result, derived from the totals when the school did not send one. */
export const resultPercent = (result: ExamResult): number | null => {
  if (result.percentage !== null) return result.percentage;
  if (result.totalMarks !== null && result.maxTotal !== null && result.maxTotal > 0) {
    return (result.totalMarks / result.maxTotal) * 100;
  }
  return null;
};

export const percentLabel = (percent: number | null): string => (percent === null ? '—' : `${Math.round(percent)}%`);

export interface ResultBadge {
  label: string;
  tone: Tone;
}

/** "Passed, grade A"; null when the school gave neither a verdict nor a grade. */
export const resultBadge = (result: ExamResult): ResultBadge | null => {
  const grade = result.grade?.trim();
  if (result.passed === true) return { label: grade ? `Passed, grade ${grade}` : 'Passed', tone: 'good' };
  if (result.passed === false) return { label: grade ? `Needs support, grade ${grade}` : 'Needs support', tone: 'warn' };
  return grade ? { label: `Grade ${grade}`, tone: 'neutral' } : null;
};

const subjectsLabel = (count: number): string => `${count} ${count === 1 ? 'subject' : 'subjects'}`;

/** "320 of 400 marks across 4 subjects". */
export const marksSummary = (result: ExamResult): string => {
  const count = result.subjects.length;
  if (result.totalMarks === null || result.maxTotal === null) return count > 0 ? subjectsLabel(count) : 'Marks not added yet';
  const across = count > 0 ? ` across ${subjectsLabel(count)}` : '';
  return `${formatMarks(result.totalMarks)} of ${formatMarks(result.maxTotal)} marks${across}`;
};

/** Share of full marks, 0 to 1. Null when it cannot be worked out. */
export const subjectRatio = (subject: SubjectResult): number | null => {
  if (subject.marks === null || subject.maxMarks === null || subject.maxMarks <= 0) return null;
  return Math.min(1, Math.max(0, subject.marks / subject.maxMarks));
};

/** "Each subject is marked out of 100."; null when papers differ. */
export const scaleNote = (subjects: SubjectResult[]): string | null => {
  const maxes = [...new Set(subjects.map((s) => s.maxMarks).filter((m): m is number => m !== null))];
  if (maxes.length !== 1) return null;
  return `Each subject is marked out of ${formatMarks(maxes[0])}.`;
};

export interface ReportCardTextInput {
  schoolName: string;
  studentName: string;
  className: string | null;
  result: ExamResult;
}

/** Plain-text report card for the system share sheet. */
export const reportCardText = ({ schoolName, studentName, className, result }: ReportCardTextInput): string => {
  const lines = [schoolName, `Report card: ${result.name}`, [studentName, className].filter(Boolean).join(', '), ''];
  for (const s of result.subjects) {
    const marks =
      s.marks === null ? 'not marked' : s.maxMarks !== null ? `${formatMarks(s.marks)}/${formatMarks(s.maxMarks)}` : formatMarks(s.marks);
    lines.push(`${s.name}: ${marks}${s.grade ? ` (${s.grade})` : ''}`);
  }
  lines.push('');
  const total = result.totalMarks !== null && result.maxTotal !== null ? `${formatMarks(result.totalMarks)}/${formatMarks(result.maxTotal)}` : null;
  const percent = resultPercent(result);
  const summary = [
    total ? `Total ${total}` : null,
    percent !== null ? percentLabel(percent) : null,
    result.grade ? `Grade ${result.grade}` : null,
    result.passed === true ? 'Passed' : null,
  ].filter((p): p is string => !!p);
  if (summary.length > 0) lines.push(summary.join(', '));
  if (result.remarks?.trim()) lines.push(`Remarks: ${result.remarks.trim()}`);
  return lines.join('\n');
};
