import {
  authorize,
  refresh,
  logout,
  AuthConfiguration,
  AuthorizeResult,
  RefreshResult,
} from 'react-native-app-auth';
import { OIDCProvider } from '../providers/types';

export const OIDC_REDIRECT_URL = 'authgear-oidc-tester://callback';

function toAuthConfig(provider: OIDCProvider): AuthConfiguration {
  return {
    issuer: provider.issuer,
    clientId: provider.clientID,
    redirectUrl: OIDC_REDIRECT_URL,
    scopes: provider.scopes,
  };
}

export async function oidcAuthorize(
  provider: OIDCProvider
): Promise<AuthorizeResult> {
  return authorize(toAuthConfig(provider));
}

export async function oidcRefresh(
  provider: OIDCProvider,
  refreshToken: string
): Promise<RefreshResult> {
  return refresh(toAuthConfig(provider), { refreshToken });
}

export async function oidcEndSession(
  provider: OIDCProvider,
  idToken: string
): Promise<void> {
  await logout(toAuthConfig(provider), {
    idToken,
    postLogoutRedirectUrl: OIDC_REDIRECT_URL,
  });
}

export async function fetchUserInfo(
  provider: OIDCProvider,
  accessToken: string
): Promise<Record<string, unknown>> {
  const base = provider.issuer.replace(/\/$/, '');
  const wellKnown = await fetch(`${base}/.well-known/openid-configuration`);
  if (!wellKnown.ok) {
    throw new Error(`Discovery failed: HTTP ${wellKnown.status}`);
  }
  const doc = (await wellKnown.json()) as { userinfo_endpoint?: string };
  if (doc.userinfo_endpoint == null) {
    throw new Error('Provider has no userinfo_endpoint');
  }
  const res = await fetch(doc.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`userinfo failed: HTTP ${res.status}`);
  }
  return res.json();
}
