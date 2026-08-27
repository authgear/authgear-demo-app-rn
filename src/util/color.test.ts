import { contrastingTextColor, isValidHexColor } from './color';

describe('isValidHexColor', () => {
  it('accepts 6-digit hex colors with a leading #', () => {
    expect(isValidHexColor('#e5e7eb')).toBe(true);
    expect(isValidHexColor('#000000')).toBe(true);
    expect(isValidHexColor('#ABCDEF')).toBe(true);
  });

  it('rejects other formats', () => {
    expect(isValidHexColor('e5e7eb')).toBe(false);
    expect(isValidHexColor('#fff')).toBe(false);
    expect(isValidHexColor('#e5e7eb00')).toBe(false);
    expect(isValidHexColor('red')).toBe(false);
  });
});

describe('contrastingTextColor', () => {
  it('returns black on light backgrounds', () => {
    expect(contrastingTextColor('#e5e7eb')).toBe('#000000');
    expect(contrastingTextColor('#ffffff')).toBe('#000000');
    expect(contrastingTextColor('#ffee00')).toBe('#000000');
  });

  it('returns white on dark backgrounds', () => {
    expect(contrastingTextColor('#000000')).toBe('#ffffff');
    expect(contrastingTextColor('#1d4ed8')).toBe('#ffffff');
    expect(contrastingTextColor('#0099ff')).toBe('#ffffff');
  });

  it('falls back to black on invalid input', () => {
    expect(contrastingTextColor('not-a-color')).toBe('#000000');
  });
});
