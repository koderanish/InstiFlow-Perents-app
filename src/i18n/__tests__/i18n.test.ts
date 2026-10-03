import { en } from '../en';
import { hi } from '../hi';
import { MONTHS, MONTHS_SHORT, WEEKDAYS, WEEKDAYS_SHORT } from '../names';
import { defaultT, makeT, pluralForm, translate } from '../translate';

describe('i18n', () => {
  it('Hindi has exactly the English keys and no empty strings', () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(hi)) expect(`${key}: ${value.trim() ? 'ok' : 'empty'}`).toBe(`${key}: ok`);
  });

  it('keeps the same placeholders in both languages', () => {
    const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    for (const key of Object.keys(en) as (keyof typeof en)[]) expect(`${key}=${holes(hi[key])}`).toBe(`${key}=${holes(en[key])}`);
  });

  it('fills placeholders', () => {
    expect(translate('en', 'status.title.present', { name: 'Aarav' })).toBe('Aarav is at school');
    expect(translate('hi', 'status.title.present', { name: 'आरव' })).toBe('आरव स्कूल में हैं');
    expect(defaultT('bus.droppedAt', { time: '3:10 pm' })).toBe('Dropped off at 3:10 pm');
  });

  it('chooses singular and plural', () => {
    expect(translate('en', 'diary.updated', { count: 1 })).toBe('1 class updated');
    expect(translate('en', 'diary.updated', { count: 4 })).toBe('4 classes updated');
    expect(pluralForm('hi', 0)).toBe('one');
    expect(pluralForm('en', 0)).toBe('other');
    expect(makeT('hi')('diary.updated', { count: 3 })).toContain('3');
  });

  it('has complete month and weekday tables', () => {
    for (const locale of ['en', 'hi'] as const) {
      expect(MONTHS[locale]).toHaveLength(12);
      expect(MONTHS_SHORT[locale]).toHaveLength(12);
      expect(WEEKDAYS[locale]).toHaveLength(7);
      expect(WEEKDAYS_SHORT[locale]).toHaveLength(7);
    }
  });
});
