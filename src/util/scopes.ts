export function parseScopes(input: string): string[] {
  const parts = input
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== 'openid');
  const deduped = Array.from(new Set(parts));
  return ['openid', ...deduped];
}

export function serializeScopes(scopes: string[]): string {
  return scopes.join(' ');
}
