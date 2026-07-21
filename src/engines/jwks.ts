import { KEYUTIL, KJUR } from 'jsrsasign';
import { decodeJwt } from '../util/jwt';
import { getDiscovery } from './oidc';

interface Jwks {
  keys: Array<Record<string, unknown>>;
}

export interface VerifyResult {
  verified: boolean;
  alg?: string;
  kid?: string;
  error?: string;
}

// Pure verification against a supplied JWKS — unit-testable without network.
export function verifySignatureWithJwks(
  idToken: string,
  jwks: Jwks
): VerifyResult {
  const decoded = decodeJwt(idToken);
  if (decoded == null) {
    return { verified: false, error: 'Could not decode token header' };
  }
  const alg = decoded.header.alg as string | undefined;
  const kid = decoded.header.kid as string | undefined;
  if (alg == null) {
    return { verified: false, error: 'Token header has no alg' };
  }
  const jwk =
    jwks.keys.find((k) => kid != null && k.kid === kid) ??
    (jwks.keys.length === 1 ? jwks.keys[0] : undefined);
  if (jwk == null) {
    return {
      verified: false,
      alg,
      kid,
      error: kid != null ? `No JWKS key matches kid "${kid}"` : 'No JWKS key',
    };
  }
  try {
    const key = KEYUTIL.getKey(jwk as any);
    const verified = KJUR.jws.JWS.verify(idToken, key as any, [alg]);
    return { verified, alg, kid };
  } catch (e: any) {
    return { verified: false, alg, kid, error: String(e?.message ?? e) };
  }
}

// Network wrapper: discover jwks_uri from the issuer, fetch it, then verify.
export async function verifyIdTokenSignature(
  idToken: string,
  issuer: string
): Promise<VerifyResult> {
  try {
    const doc = (await getDiscovery(issuer)) as { jwks_uri?: string };
    if (doc.jwks_uri == null) {
      return { verified: false, error: 'Provider has no jwks_uri' };
    }
    const res = await fetch(doc.jwks_uri);
    if (!res.ok) {
      return {
        verified: false,
        error: `JWKS fetch failed: HTTP ${res.status}`,
      };
    }
    const jwks = (await res.json()) as Jwks;
    return verifySignatureWithJwks(idToken, jwks);
  } catch (e: any) {
    return { verified: false, error: String(e?.message ?? e) };
  }
}
