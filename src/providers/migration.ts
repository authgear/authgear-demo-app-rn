import { ColorScheme } from '@authgear/react-native';
import { AuthgearProvider } from './types';
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
    name: 'Authgear (demo)',
    clientID: config.clientID,
    endpoint: config.endpoint,
    explicitColorScheme: config.explicitColorScheme ?? null,
    useTransientTokenStorage: config.useTransientTokenStorage ?? false,
    shareSessionWithSystemBrowser:
      config.shareSessionWithSystemBrowser ?? false,
    useWebkitWebView: config.useWebkitWebView ?? false,
    allowFallbackToPasscodeInBiometric:
      config.allowFallbackToPasscodeInBiometric ?? false,
  };
}
