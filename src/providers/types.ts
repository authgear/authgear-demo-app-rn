import { ColorScheme } from '@authgear/react-native';

export interface BaseProvider {
  id: string;
  kind: 'authgear' | 'oidc';
  name: string;
}

export interface AuthgearProvider extends BaseProvider {
  kind: 'authgear';
  clientID: string;
  endpoint: string;
  explicitColorScheme: ColorScheme | null;
  useTransientTokenStorage: boolean;
  shareSessionWithSystemBrowser: boolean;
  useWebkitWebView: boolean;
  allowFallbackToPasscodeInBiometric: boolean;
}

export interface OIDCProvider extends BaseProvider {
  kind: 'oidc';
  issuer: string;
  clientID: string;
  scopes: string[];
}

export type Provider = AuthgearProvider | OIDCProvider;

export function isAuthgearProvider(p: Provider): p is AuthgearProvider {
  return p.kind === 'authgear';
}

export function isOIDCProvider(p: Provider): p is OIDCProvider {
  return p.kind === 'oidc';
}
