import { daysFromToday } from './dates';
import { clockFromTime, dayMonth } from './format';
import type { ExamPaper, ExamSeries } from '@/types/parent';

export interface PaperView {
  paper: ExamPaper;
  /** True once the paper's day has gone by. */
  past: boolean;
  /** Days until the paper; null if the date cannot be read. */
  daysAway: number | null;
}

export interface SeriesView {
  series: ExamSeries;
  papers: PaperView[];
  /** At least one paper is still to come. */
  upcoming: boolean;
}

export interface NextPaper {
  series: ExamSeries;
  paper: ExamPaper;
  days: number;
}

export interface ExamPlan {
  next: NextPaper | null;
  series: SeriesView[];
}

const LAST = '99:99';

const comparePapers = (a: ExamPaper, b: ExamPaper): number =>
  a.date.localeCompare(b.date) || (a.startTime ?? LAST).localeCompare(b.startTime ?? LAST) || a.id - b.id;

/** Upcoming series first (soonest paper first), then finished series (most recent first). */
export const buildExamPlan = (exams: ExamSeries[], now: Date): ExamPlan => {
  const views: SeriesView[] = exams.map((series) => {
    const papers = [...series.papers].sort(comparePapers).map((paper): PaperView => {
      const daysAway = daysFromToday(paper.date, now);
      return { paper, past: daysAway !== null && daysAway < 0, daysAway };
    });
    return { series, papers, upcoming: papers.some((p) => !p.past) };
  });

  const firstUpcoming = (v: SeriesView) => v.papers.find((p) => !p.past)?.paper.date ?? '';
  const upcoming = views.filter((v) => v.upcoming).sort((a, b) => firstUpcoming(a).localeCompare(firstUpcoming(b)));
  const finished = views.filter((v) => !v.upcoming).sort((a, b) => b.series.startDate.localeCompare(a.series.startDate));

  let next: NextPaper | null = null;
  for (const view of upcoming) {
    const candidate = view.papers.find((p) => !p.past && p.daysAway !== null);
    if (!candidate || candidate.daysAway === null) continue;
    if (!next || candidate.paper.date.localeCompare(next.paper.date) < 0) {
      next = { series: view.series, paper: candidate.paper, days: candidate.daysAway };
    }
  }
  return { next, series: [...upcoming, ...finished] };
};

/** "today", "tomorrow", "in 7 days". */
export const daysToGo = (days: number): string => {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
};

export const nextPaperHeadline = (next: NextPaper): string => `${next.paper.subject}, ${daysToGo(next.days)}`;

/** "9 October, 9:00 am". */
export const paperWhen = (paper: ExamPaper): string => {
  const day = dayMonth(paper.date) ?? paper.date;
  const time = clockFromTime(paper.startTime);
  return time ? `${day}, ${time}` : day;
};

const minutesOf = (time: string | null): number | null => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

/** "9:00 am, 45 min" or just the start time; null when no time is set. */
export const paperTimeLine = (paper: ExamPaper): string | null => {
  const start = clockFromTime(paper.startTime);
  if (!start) return null;
  const from = minutesOf(paper.startTime);
  const to = minutesOf(paper.endTime);
  if (from !== null && to !== null && to > from) return `${start}, ${to - from} min`;
  return start;
};

/** "Room 12, 50 marks"; null when there is nothing to add. */
export const paperNoteLine = (paper: ExamPaper): string | null => {
  const parts = [paper.venue, paper.maxMarks !== null ? `${paper.maxMarks} marks` : null].filter((p): p is string => !!p);
  return parts.length > 0 ? parts.join(', ') : null;
};

/** "5 October to 15 October". */
export const seriesRange = (series: ExamSeries): string | null => {
  const from = dayMonth(series.startDate);
  const to = dayMonth(series.endDate);
  if (!from) return null;
  return to && to !== from ? `${from} to ${to}` : from;
};
