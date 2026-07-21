import { legacyConfigToProvider } from './migration';
import { AUTHGEAR_DEMO_PROVIDER_ID } from './store';

describe('legacyConfigToProvider', () => {
  it('maps a legacy config onto the demo provider id', () => {
    const provider = legacyConfigToProvider({
      clientID: 'legacy-client',
      endpoint: 'https://legacy.example.com',
      explicitColorScheme: null,
      useTransientTokenStorage: true,
      shareSessionWithSystemBrowser: false,
      useWebkitWebView: false,
      allowFallbackToPasscodeInBiometric: true,
    });
    expect(provider.id).toBe(AUTHGEAR_DEMO_PROVIDER_ID);
    expect(provider.kind).toBe('authgear');
    expect(provider.clientID).toBe('legacy-client');
    expect(provider.useTransientTokenStorage).toBe(true);
    expect(provider.allowFallbackToPasscodeInBiometric).toBe(true);
  });

  it('applies defaults for missing optional fields', () => {
    const provider = legacyConfigToProvider({
      clientID: 'c',
      endpoint: 'https://e.example.com',
    } as any);
    expect(provider.useTransientTokenStorage).toBe(false);
    expect(provider.explicitColorScheme).toBeNull();
  });
});
