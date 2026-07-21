export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  const binary = atob(padded);
  // Reconstruct UTF-8 text from the decoded binary string.
  let percentEncoded = '';
  for (let i = 0; i < binary.length; i++) {
    percentEncoded +=
      '%' + ('00' + binary.charCodeAt(i).toString(16)).slice(-2);
  }
  return decodeURIComponent(percentEncoded);
}

export function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { header, payload };
  } catch {
    return null;
  }
}
