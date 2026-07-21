import { randomId } from './id';

describe('randomId', () => {
  it('returns a string of the requested length', () => {
    expect(randomId(16)).toHaveLength(16);
  });
  it('produces different values on subsequent calls', () => {
    expect(randomId()).not.toBe(randomId());
  });
});
