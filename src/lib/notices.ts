import { defaultT, type TFunction } from '@/i18n/translate';
import type { Notice } from '@/types/parent';

import type { Tone } from './status-copy';

/** Filter value for "everything". It is a key, not a label: show it with `t('account.inbox.all')`. */
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
export const priorityInfo = (priority: string | null | undefined, t: TFunction = defaultT): { label: string; tone: Tone } | null => {
  switch ((priority ?? '').trim().toLowerCase()) {
    case 'urgent':
    case 'critical':
      return { label: t('account.notice.urgent'), tone: 'bad' };
    case 'high':
    case 'important':
      return { label: t('account.notice.important'), tone: 'warn' };
    default:
      return null;
  }
};
