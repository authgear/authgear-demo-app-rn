import { providerPresets } from './presets';

describe('providerPresets', () => {
  it('includes the expected providers', () => {
    const keys = providerPresets.map((p) => p.key);
    expect(keys).toEqual(
      expect.arrayContaining(['google', 'entra', 'okta', 'auth0', 'keycloak'])
    );
  });

  it('every preset has a non-empty issuer template and openid scope', () => {
    for (const p of providerPresets) {
      expect(p.issuerTemplate.length).toBeGreaterThan(0);
      expect(p.defaultScopes).toContain('openid');
      expect(p.label.length).toBeGreaterThan(0);
    }
  });
});
