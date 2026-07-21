import { parseScopes, serializeScopes } from './scopes';

describe('parseScopes', () => {
  it('always includes openid first', () => {
    expect(parseScopes('')).toEqual(['openid']);
    expect(parseScopes('profile email')).toEqual([
      'openid',
      'profile',
      'email',
    ]);
  });

  it('dedupes and drops duplicate openid', () => {
    expect(parseScopes('openid profile openid')).toEqual(['openid', 'profile']);
  });

  it('ignores extra whitespace', () => {
    expect(parseScopes('  profile   email  ')).toEqual([
      'openid',
      'profile',
      'email',
    ]);
  });
});

describe('serializeScopes', () => {
  it('joins with single spaces', () => {
    expect(serializeScopes(['openid', 'profile'])).toBe('openid profile');
  });
});
