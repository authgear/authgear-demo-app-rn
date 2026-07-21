import { KJUR, KEYUTIL } from 'jsrsasign';
import { verifySignatureWithJwks } from './jwks';
import { TEST_PRIVATE_PEM, TEST_JWK } from './__fixtures__/testKey';

function signToken(payload: object, kid = 'test-key'): string {
  const prv = KEYUTIL.getKey(TEST_PRIVATE_PEM);
  const header = { alg: 'RS256', typ: 'JWT', kid };
  return KJUR.jws.JWS.sign(
    'RS256',
    JSON.stringify(header),
    JSON.stringify(payload),
    prv as any
  );
}

describe('verifySignatureWithJwks', () => {
  const jwks = { keys: [TEST_JWK] };

  it('verifies a correctly signed token', () => {
    const token = signToken({
      sub: 'user-1',
      iss: 'https://issuer.example.com',
    });
    const result = verifySignatureWithJwks(token, jwks);
    expect(result.verified).toBe(true);
    expect(result.alg).toBe('RS256');
    expect(result.kid).toBe('test-key');
  });

  it('fails a tampered token', () => {
    const token = signToken({ sub: 'user-1' });
    const tampered = token.slice(0, -4) + 'AAAA';
    expect(verifySignatureWithJwks(tampered, jwks).verified).toBe(false);
  });

  it('errors when no key matches the kid', () => {
    const token = signToken({ sub: 'user-1' }, 'other-kid');
    const result = verifySignatureWithJwks(token, { keys: [] });
    expect(result.verified).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
