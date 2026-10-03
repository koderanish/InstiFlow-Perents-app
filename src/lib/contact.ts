import type { SchoolContact } from '@/types/parent';

/** Trimmed text, or null when there is nothing to show. */
export const present = (value: string | null | undefined): string | null => {
  const text = (value ?? '').trim();
  return text ? text : null;
};

export const telUrl = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const mailUrl = (email: string): string => `mailto:${email.trim()}`;

export const webUrl = (site: string): string => {
  const text = site.trim();
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
};

export const mapsUrl = (address: string): string => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;

export interface ContactAction {
  id: 'call' | 'email' | 'website';
  title: string;
  subtitle: string;
  url: string;
}

/** Only the ways to reach the school that actually have a value. */
export const contactActions = (school: SchoolContact): ContactAction[] => {
  const phone = present(school.phone);
  const email = present(school.email);
  const website = present(school.website);
  const out: ContactAction[] = [];
  if (phone) out.push({ id: 'call', title: 'Call the school office', subtitle: phone, url: telUrl(phone) });
  if (email) out.push({ id: 'email', title: 'Email the school', subtitle: email, url: mailUrl(email) });
  if (website) out.push({ id: 'website', title: 'Visit the website', subtitle: website.replace(/^https?:\/\//i, ''), url: webUrl(website) });
  return out;
};

export const hasContact = (school: SchoolContact): boolean => contactActions(school).length > 0 || present(school.address) !== null;
