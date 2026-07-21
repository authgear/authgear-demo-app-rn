import {
  AUTHGEAR_DEMO_PROVIDER_ID,
  demoAuthgearProvider,
  seedProviders,
  upsertProvider,
  removeProvider,
  getProvider,
} from './store';
import { OIDCProvider } from './types';

const oidc: OIDCProvider = {
  id: 'p1',
  kind: 'oidc',
  name: 'Okta',
  issuer: 'https://example.okta.com',
  clientID: 'abc',
  scopes: ['openid', 'profile'],
};

describe('seedProviders', () => {
  it('seeds the demo provider when empty', () => {
    expect(seedProviders(null)).toEqual([demoAuthgearProvider]);
    expect(seedProviders([])).toEqual([demoAuthgearProvider]);
  });

  it('keeps the demo pinned first when other providers exist', () => {
    const seeded = seedProviders([oidc]);
    expect(seeded[0].id).toBe(AUTHGEAR_DEMO_PROVIDER_ID);
    expect(seeded).toHaveLength(2);
  });
});

describe('upsertProvider', () => {
  it('adds a new provider after the pinned demo', () => {
    const list = upsertProvider([demoAuthgearProvider], oidc);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(AUTHGEAR_DEMO_PROVIDER_ID);
    expect(getProvider(list, 'p1')).toEqual(oidc);
  });

  it('replaces an existing provider by id', () => {
    const list = upsertProvider([demoAuthgearProvider, oidc], {
      ...oidc,
      name: 'Renamed',
    });
    expect(list).toHaveLength(2);
    expect(getProvider(list, 'p1')!.name).toBe('Renamed');
  });
});

describe('removeProvider', () => {
  it('removes a user provider', () => {
    expect(removeProvider([demoAuthgearProvider, oidc], 'p1')).toEqual([
      demoAuthgearProvider,
    ]);
  });

  it('refuses to remove the pinned demo provider', () => {
    const list = [demoAuthgearProvider, oidc];
    expect(removeProvider(list, AUTHGEAR_DEMO_PROVIDER_ID)).toEqual(list);
  });
});
