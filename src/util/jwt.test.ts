import { decodeJwt } from './jwt';

// header {"alg":"none","typ":"JWT"} . payload {"sub":"user-1","name":"Ada"} . sig
const SAMPLE =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiQWRhIn0.sig';

describe('decodeJwt', () => {
  it('decodes header and payload', () => {
    const result = decodeJwt(SAMPLE);
    expect(result).not.toBeNull();
    expect(result!.header).toEqual({ alg: 'none', typ: 'JWT' });
    expect(result!.payload).toEqual({ sub: 'user-1', name: 'Ada' });
  });

  it('returns null for a non-JWT string', () => {
    expect(decodeJwt('not-a-jwt')).toBeNull();
  });

  it('returns null for malformed base64 segments', () => {
    expect(decodeJwt('%%%.%%%.sig')).toBeNull();
  });
});
