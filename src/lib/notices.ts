import type { Tone } from './status-copy';
import type { Notice } from '@/types/parent';

export const ALL_CATEGORIES = 'All';

const titleCase = (text: string): string =>
  text
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export const categoryLabel = (category: string | null | undefined): string | null => {
  const text = (category ?? '').trim();
  return text ? titleCase(text) : null;
};

/** Distinct category labels in first-seen order, for the filter row. */
export const noticeCategories = (notices: Notice[]): string[] => {
  const seen: string[] = [];
  for (const n of notices) {
    const label = categoryLabel(n.category);
    if (label && !seen.includes(label)) seen.push(label);
  }
  return seen;
};

export const filterNotices = (notices: Notice[], category: string): Notice[] =>
  category === ALL_CATEGORIES ? notices : notices.filter((n) => categoryLabel(n.category) === category);

/** Urgent and important notices get a coloured marker; everything else stays plain. */
export const priorityInfo = (priority: string | null | undefined): { label: string; tone: Tone } | null => {
  switch ((priority ?? '').trim().toLowerCase()) {
    case 'urgent':
    case 'critical':
      return { label: 'Urgent', tone: 'bad' };
    case 'high':
    case 'important':
      return { label: 'Important', tone: 'warn' };
    default:
      return null;
  }
};
