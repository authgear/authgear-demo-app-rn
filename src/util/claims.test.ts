import { isJwt, formatClaimTimestamp, tokenValidity } from './claims';

// {"alg":"none"} . {"exp":2000000000} . sig
const JWT = 'eyJhbGciOiJub25lIn0.eyJleHAiOjIwMDAwMDAwMDB9.sig';

describe('isJwt', () => {
  it('recognizes a JWT', () => {
    expect(isJwt(JWT)).toBe(true);
  });
  it('rejects an opaque token', () => {
    expect(isJwt('opaque-access-token')).toBe(false);
    expect(isJwt('only.two')).toBe(false);
  });
});

describe('formatClaimTimestamp', () => {
  it('includes the UTC time and a future relative phrase', () => {
    // epoch 1700000000 = 2023-11-14T22:13:20Z; now one hour earlier
    const out = formatClaimTimestamp(
      1700000000,
      1700000000 * 1000 - 3600 * 1000
    );
    expect(out).toContain('2023-11-14T22:13:20');
    expect(out).toContain('in 1h');
  });
  it('shows a past relative phrase', () => {
    const out = formatClaimTimestamp(
      1700000000,
      1700000000 * 1000 + 120 * 1000
    );
    expect(out).toContain('2m ago');
  });
});

describe('tokenValidity', () => {
  it('is valid before exp', () => {
    expect(tokenValidity({ exp: 2000000000 }, 1000000000 * 1000)).toBe('valid');
  });
  it('is expired at/after exp', () => {
    expect(tokenValidity({ exp: 2000000000 }, 2000000001 * 1000)).toBe(
      'expired'
    );
  });
  it('is unknown without exp', () => {
    expect(tokenValidity({}, 1000000000 * 1000)).toBe('unknown');
  });
});
