import type { Href } from 'expo-router';

/** Report card for one published exam result. */
export const reportCardHref = (examId: number): Href => ({
  pathname: '/(app)/report-card',
  params: { examId: String(examId) },
});
