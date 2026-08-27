import { ColorScheme } from '@authgear/react-native';

export type UIImplementationOption =
  | 'asWebAuthenticationSession'
  | 'webkitWebView'
  | 'customWebView';

export const DEFAULT_CUSTOM_WEBVIEW_NAV_BAR_COLOR = '#f9fafb';

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
  uiImplementation: UIImplementationOption;
  customWebViewNavBarColor: string;
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
