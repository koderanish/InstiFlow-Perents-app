import { passwordStrength } from '../password-strength';

describe('passwordStrength', () => {
  it('is empty for nothing typed', () => {
    expect(passwordStrength('')).toEqual({ level: 'empty', label: '', fraction: 0, points: 0 });
  });

  it('grows as more rules are met', () => {
    expect(passwordStrength('abc').level).toBe('weak');
    expect(passwordStrength('abcdefgh').level).toBe('weak');
    expect(passwordStrength('Abcdefgh').level).toBe('fair');
    expect(passwordStrength('Abcdefg1').level).toBe('good');
    expect(passwordStrength('Abcdef1!').level).toBe('strong');
  });

  it('gives a bonus point for a long password', () => {
    expect(passwordStrength('Abcdef1!').points).toBe(5);
    expect(passwordStrength('Abcdef1!ghij').points).toBe(6);
    expect(passwordStrength('Abcdef1!ghij').fraction).toBe(1);
  });
});
