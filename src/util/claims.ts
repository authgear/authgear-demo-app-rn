import { decodeJwt } from './jwt';

export function isJwt(token: string): boolean {
  if (token.split('.').length !== 3) {
    return false;
  }
  return decodeJwt(token) != null;
}

function relativeTime(deltaMillis: number): string {
  const future = deltaMillis >= 0;
  let secs = Math.floor(Math.abs(deltaMillis) / 1000);
  let value: number;
  let unit: string;
  if (secs < 60) {
    value = secs;
    unit = 's';
  } else if (secs < 3600) {
    value = Math.floor(secs / 60);
    unit = 'm';
  } else if (secs < 86400) {
    value = Math.floor(secs / 3600);
    unit = 'h';
  } else {
    value = Math.floor(secs / 86400);
    unit = 'd';
  }
  return future ? `in ${value}${unit}` : `${value}${unit} ago`;
}

export function formatClaimTimestamp(
  epochSeconds: number,
  nowMillis: number
): string {
  const iso = new Date(epochSeconds * 1000).toISOString();
  const rel = relativeTime(epochSeconds * 1000 - nowMillis);
  return `${iso} (${rel})`;
}

export function tokenValidity(
  payload: Record<string, unknown>,
  nowMillis: number
): 'valid' | 'expired' | 'unknown' {
  const exp = payload.exp;
  if (typeof exp !== 'number') {
    return 'unknown';
  }
  return nowMillis >= exp * 1000 ? 'expired' : 'valid';
}
