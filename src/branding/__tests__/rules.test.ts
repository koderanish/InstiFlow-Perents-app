import { DEFAULT_BRANDING, isUsableLogo, luminance, MAX_SAVED_LOGO_LENGTH, onColour, parseBranding, parseSaved, toSaved } from '../rules';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('parseBranding', () => {
  it('takes a good response as is', () => {
    expect(parseBranding({ name: ' St Mary ', shortName: 'sm', logoUrl: PNG, accent: '#1a73e8' })).toEqual({ name: 'St Mary', shortName: 'SM', logoUrl: PNG, accent: '#1A73E8' });
  });
  it('falls back for anything odd', () => {
    expect(parseBranding(null)).toEqual(DEFAULT_BRANDING);
    expect(parseBranding({ name: '', accent: 'red', logoUrl: 'javascript:alert(1)' })).toEqual({ ...DEFAULT_BRANDING });
  });
  it('rejects svg and plain http logos', () => {
    expect(isUsableLogo('data:image/svg+xml;base64,AAAA')).toBe(false);
    expect(isUsableLogo('http://x.test/a.png')).toBe(false);
    expect(isUsableLogo('https://x.test/a.png')).toBe(true);
    expect(isUsableLogo(PNG)).toBe(true);
  });
  it('keeps only three letters for the short name', () => {
    expect(parseBranding({ shortName: 'abcdef' }).shortName).toBe('ABC');
  });
});

describe('saving', () => {
  it('round-trips a small logo', () => {
    const b = parseBranding({ name: 'A', shortName: 'A', logoUrl: PNG, accent: '#112233' });
    expect(parseSaved(toSaved(b))).toEqual(b);
  });
  it('drops a logo too big for secure storage', () => {
    const big = `data:image/png;base64,${'A'.repeat(MAX_SAVED_LOGO_LENGTH + 10)}`;
    expect(parseSaved(toSaved(parseBranding({ logoUrl: big })))?.logoUrl).toBeNull();
  });
  it('ignores a corrupt saved value', () => {
    expect(parseSaved('{oops')).toBeNull();
    expect(parseSaved(null)).toBeNull();
  });
});

describe('onColour', () => {
  it('uses dark ink on light colours and white on dark ones', () => {
    expect(onColour('#FFD400')).toBe('#1F1B18');
    expect(onColour('#0B2A5B')).toBe('#FFFFFF');
  });
  it('orders luminance', () => {
    expect(luminance('#000000')).toBeLessThan(luminance('#FFFFFF'));
  });
});
