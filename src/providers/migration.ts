import { ColorScheme } from '@authgear/react-native';
import {
  AuthgearProvider,
  DEFAULT_CUSTOM_WEBVIEW_NAV_BAR_COLOR,
  Provider,
  isAuthgearProvider,
} from './types';
import { AUTHGEAR_DEMO_PROVIDER_ID } from './store';

export interface LegacyConfig {
  clientID: string;
  endpoint: string;
  explicitColorScheme?: ColorScheme | null;
  useTransientTokenStorage?: boolean;
  shareSessionWithSystemBrowser?: boolean;
  useWebkitWebView?: boolean;
  allowFallbackToPasscodeInBiometric?: boolean;
}

export function legacyConfigToProvider(config: LegacyConfig): AuthgearProvider {
  return {
    id: AUTHGEAR_DEMO_PROVIDER_ID,
    kind: 'authgear',
    name: 'Authgear (default)',
    clientID: config.clientID,
    endpoint: config.endpoint,
    explicitColorScheme: config.explicitColorScheme ?? null,
    useTransientTokenStorage: config.useTransientTokenStorage ?? false,
    shareSessionWithSystemBrowser:
      config.shareSessionWithSystemBrowser ?? false,
    uiImplementation: config.useWebkitWebView
      ? 'webkitWebView'
      : 'asWebAuthenticationSession',
    customWebViewNavBarColor: DEFAULT_CUSTOM_WEBVIEW_NAV_BAR_COLOR,
    allowFallbackToPasscodeInBiometric:
      config.allowFallbackToPasscodeInBiometric ?? false,
  };
}

// Providers persisted by older app versions may carry the old useWebkitWebView
// boolean instead of uiImplementation, or lack fields added since.
export function normalizeStoredProvider(provider: Provider): Provider {
  if (!isAuthgearProvider(provider)) {
    return provider;
  }
  const legacy = provider as AuthgearProvider & { useWebkitWebView?: boolean };
  if (
    legacy.uiImplementation != null &&
    legacy.customWebViewNavBarColor != null
  ) {
    return provider;
  }
  const { useWebkitWebView, ...rest } = legacy;
  return {
    ...rest,
    uiImplementation:
      legacy.uiImplementation ??
      (useWebkitWebView ? 'webkitWebView' : 'asWebAuthenticationSession'),
    customWebViewNavBarColor:
      legacy.customWebViewNavBarColor ?? DEFAULT_CUSTOM_WEBVIEW_NAV_BAR_COLOR,
  };
}
