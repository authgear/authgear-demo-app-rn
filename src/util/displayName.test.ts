import { isAutoFilledName } from './displayName';

describe('isAutoFilledName', () => {
  it('is true when the name is blank', () => {
    expect(isAutoFilledName('', null)).toBe(true);
    expect(isAutoFilledName('   ', null)).toBe(true);
  });

  it('is true when the name still equals the last preset label', () => {
    expect(isAutoFilledName('Okta', 'Okta')).toBe(true);
  });

  it('is false when the user typed a name different from the last preset', () => {
    expect(isAutoFilledName('My IdP', 'Okta')).toBe(false);
  });

  it('is false when a name was typed without applying any preset', () => {
    expect(isAutoFilledName('Okta', null)).toBe(false);
  });

  it('is false when the name differs from the last preset', () => {
    expect(isAutoFilledName('Google', 'Okta')).toBe(false);
  });
});
