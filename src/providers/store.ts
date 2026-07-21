import { AuthgearProvider, Provider } from './types';

export const AUTHGEAR_DEMO_PROVIDER_ID = 'authgear-demo';

export const demoAuthgearProvider: AuthgearProvider = {
  id: AUTHGEAR_DEMO_PROVIDER_ID,
  kind: 'authgear',
  name: 'Authgear (default)',
  clientID: 'cc74f4f34a4bfa07',
  endpoint: 'https://authgear-tools.authgear.cloud',
  explicitColorScheme: null,
  useTransientTokenStorage: false,
  shareSessionWithSystemBrowser: false,
  useWebkitWebView: false,
  allowFallbackToPasscodeInBiometric: false,
};

export function sortPinnedFirst(list: Provider[]): Provider[] {
  const demo = list.filter((p) => p.id === AUTHGEAR_DEMO_PROVIDER_ID);
  const rest = list.filter((p) => p.id !== AUTHGEAR_DEMO_PROVIDER_ID);
  return [...demo, ...rest];
}

export function seedProviders(existing: Provider[] | null): Provider[] {
  if (existing == null || existing.length === 0) {
    return [demoAuthgearProvider];
  }
  const hasDemo = existing.some((p) => p.id === AUTHGEAR_DEMO_PROVIDER_ID);
  const list = hasDemo ? existing : [demoAuthgearProvider, ...existing];
  return sortPinnedFirst(list);
}

export function upsertProvider(
  list: Provider[],
  provider: Provider
): Provider[] {
  const idx = list.findIndex((p) => p.id === provider.id);
  if (idx === -1) {
    return sortPinnedFirst([...list, provider]);
  }
  const next = [...list];
  next[idx] = provider;
  return sortPinnedFirst(next);
}

export function removeProvider(list: Provider[], id: string): Provider[] {
  if (id === AUTHGEAR_DEMO_PROVIDER_ID) {
    return list;
  }
  return list.filter((p) => p.id !== id);
}

export function getProvider(
  list: Provider[],
  id: string
): Provider | undefined {
  return list.find((p) => p.id === id);
}
