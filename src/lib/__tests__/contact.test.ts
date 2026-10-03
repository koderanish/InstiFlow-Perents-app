import { contactActions, hasContact, mailUrl, mapsUrl, present, telUrl, webUrl } from '../contact';
import type { SchoolContact } from '@/types/parent';

const school = (over: Partial<SchoolContact> = {}): SchoolContact => ({
  name: 'Sample Public School',
  phone: null,
  email: null,
  website: null,
  address: null,
  ...over,
});

describe('contact', () => {
  it('builds links', () => {
    expect(telUrl('+91 20 1234 5678')).toBe('tel:+912012345678');
    expect(mailUrl(' office@school.in ')).toBe('mailto:office@school.in');
    expect(webUrl('school.in')).toBe('https://school.in');
    expect(webUrl('http://school.in')).toBe('http://school.in');
    expect(mapsUrl('12 Gandhi Road, Pune')).toContain('query=12%20Gandhi%20Road%2C%20Pune');
  });

  it('hides rows without a value', () => {
    expect(contactActions(school())).toEqual([]);
    expect(contactActions(school({ phone: '  ', email: 'a@b.in' })).map((a) => a.id)).toEqual(['email']);
    const all = contactActions(school({ phone: '123', email: 'a@b.in', website: 'https://b.in' }));
    expect(all.map((a) => a.id)).toEqual(['call', 'email', 'website']);
    expect(all[2]?.subtitle).toBe('b.in');
  });

  it('knows when there is nothing to show', () => {
    expect(hasContact(school())).toBe(false);
    expect(hasContact(school({ address: '12 Road' }))).toBe(true);
    expect(present(' x ')).toBe('x');
    expect(present(null)).toBeNull();
  });
});
