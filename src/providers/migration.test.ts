import { legacyConfigToProvider, normalizeStoredProvider } from './migration';
import { AUTHGEAR_DEMO_PROVIDER_ID } from './store';
import { AuthgearProvider, OIDCProvider } from './types';

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
    expect(provider.uiImplementation).toBe('asWebAuthenticationSession');
    expect(provider.customWebViewNavBarColor).toBe('#f9fafb');
  });

  it('maps useWebkitWebView to the webkitWebView option', () => {
    const provider = legacyConfigToProvider({
      clientID: 'c',
      endpoint: 'https://e.example.com',
      useWebkitWebView: true,
    });
    expect(provider.uiImplementation).toBe('webkitWebView');
  });

  it('applies defaults for missing optional fields', () => {
    const provider = legacyConfigToProvider({
      clientID: 'c',
      endpoint: 'https://e.example.com',
    } as any);
    expect(provider.useTransientTokenStorage).toBe(false);
    expect(provider.explicitColorScheme).toBeNull();
    expect(provider.uiImplementation).toBe('asWebAuthenticationSession');
  });
});

describe('normalizeStoredProvider', () => {
  const base = {
    id: 'p1',
    kind: 'authgear' as const,
    name: 'Test',
    clientID: 'c',
    endpoint: 'https://e.example.com',
    explicitColorScheme: null,
    useTransientTokenStorage: false,
    shareSessionWithSystemBrowser: false,
    allowFallbackToPasscodeInBiometric: false,
  };

  it('converts a stored useWebkitWebView boolean into uiImplementation', () => {
    const stored = { ...base, useWebkitWebView: true };
    const normalized = normalizeStoredProvider(
      stored as unknown as AuthgearProvider
    ) as AuthgearProvider;
    expect(normalized.uiImplementation).toBe('webkitWebView');
    expect('useWebkitWebView' in normalized).toBe(false);

    const storedFalse = { ...base, useWebkitWebView: false };
    const normalizedFalse = normalizeStoredProvider(
      storedFalse as unknown as AuthgearProvider
    ) as AuthgearProvider;
    expect(normalizedFalse.uiImplementation).toBe('asWebAuthenticationSession');
  });

  it('fills in a default nav bar color when missing', () => {
    const stored = { ...base, uiImplementation: 'customWebView' };
    const normalized = normalizeStoredProvider(
      stored as unknown as AuthgearProvider
    ) as AuthgearProvider;
    expect(normalized.uiImplementation).toBe('customWebView');
    expect(normalized.customWebViewNavBarColor).toBe('#f9fafb');
  });

  it('leaves a fully populated provider untouched', () => {
    const provider: AuthgearProvider = {
      ...base,
      uiImplementation: 'customWebView',
      customWebViewNavBarColor: '#123456',
    };
    expect(normalizeStoredProvider(provider)).toBe(provider);
  });

  it('leaves OIDC providers untouched', () => {
    const oidc: OIDCProvider = {
      id: 'o1',
      kind: 'oidc',
      name: 'OIDC',
      issuer: 'https://issuer.example.com',
      clientID: 'c',
      scopes: ['openid'],
    };
    expect(normalizeStoredProvider(oidc)).toBe(oidc);
  });
});
