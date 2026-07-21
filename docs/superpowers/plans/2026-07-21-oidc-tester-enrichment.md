# OIDC Tester Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the OIDC integration tester with preset providers, a discovery-document viewer, richer token inspection, JWKS signature verification, and an About/Privacy screen — so it reads as a complete, general-purpose developer utility.

**Architecture:** Features 1–4 extend the existing generic-OIDC flow (`OIDCResultScreen`, `src/engines/oidc.ts`). A pure-JS crypto dependency (`jsrsasign`) powers signature verification. Feature 5 adds a global About screen. New logic lives in small, tested helper modules; screens are thin.

**Tech Stack:** React Native 0.80, React 19, TypeScript, react-native-paper (MD2), React Navigation native-stack, jsrsasign, Jest.

## Global Constraints

- OIDC tokens are held in memory only; never persisted.
- Generic OIDC redirect URI stays exactly `authgear-oidc-tester://callback`.
- No "Demo/Trial/Sample" in user-facing strings.
- Signature verification uses `jsrsasign` (pure JS) only — no native pod/gradle changes.
- Preset providers never include a client ID (each user registers their own app).
- Features 1–4 apply to generic OIDC providers only (the Authgear flow is unchanged).
- Every task ends green on: `make typecheck && make lint && make check-format && make test`.

---

## File Structure

**Create:**
- `src/providers/presets.ts` (+ `src/providers/presets.test.ts`) — static preset list.
- `src/util/claims.ts` (+ `src/util/claims.test.ts`) — `isJwt`, `formatClaimTimestamp`, `tokenValidity`.
- `src/engines/jwks.ts` (+ `src/engines/jwks.test.ts`) — `verifyIdTokenSignature`.
- `src/screens/OIDCDiscoveryScreen.tsx` — discovery document viewer.
- `src/screens/AboutScreen.tsx` — about + privacy.

**Modify:**
- `index.js` — remove the temporary DEV warning-interceptor (Task 1).
- `src/engines/oidc.ts` — extract `getDiscovery`, add `fetchDiscovery`.
- `src/screens/AddEditProviderScreen.tsx` — preset chips on the new-OIDC form.
- `src/screens/OIDCResultScreen.tsx` — Discovery button, rich token view, verify button.
- `src/screens/ProviderListScreen.tsx` — ⓘ header action → About.
- `src/App.tsx` — add `OIDCDiscovery` and `About` routes + register screens.
- `package.json` — add `jsrsasign` + dev `@types/jsrsasign`.

---

## Task 1: Remove the temporary DEV warning-interceptor

**Files:**
- Modify: `index.js`

**Interfaces:** none.

- [ ] **Step 1: Restore index.js to its clean form**

Replace the entire contents of `index.js` with:

```js
/**
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';

export default function Main() {
  return <App />;
}

AppRegistry.registerComponent(appName, () => Main);
```

- [ ] **Step 2: Verify gate**

Run: `make typecheck && make lint && make check-format && make test`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add index.js
git commit -m "chore: remove temporary DEV warning interceptor"
```

---

## Task 2: Preset providers

**Files:**
- Create: `src/providers/presets.ts`, `src/providers/presets.test.ts`
- Modify: `src/screens/AddEditProviderScreen.tsx`

**Interfaces:**
- Produces: `ProviderPreset` type and `providerPresets: ProviderPreset[]`.

- [ ] **Step 1: Write the failing test**

Create `src/providers/presets.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/providers/presets.test.ts`
Expected: FAIL — cannot find module `./presets`.

- [ ] **Step 3: Implement presets.ts**

Create `src/providers/presets.ts`:

```ts
export interface ProviderPreset {
  key: string;
  label: string;
  issuerTemplate: string;
  issuerPlaceholder?: string;
  defaultScopes: string[];
}

export const providerPresets: ProviderPreset[] = [
  {
    key: 'google',
    label: 'Google',
    issuerTemplate: 'https://accounts.google.com',
    defaultScopes: ['openid', 'email', 'profile'],
  },
  {
    key: 'entra',
    label: 'Microsoft Entra',
    issuerTemplate: 'https://login.microsoftonline.com/{tenant}/v2.0',
    issuerPlaceholder: 'Replace {tenant} with your tenant ID',
    defaultScopes: ['openid', 'profile', 'email'],
  },
  {
    key: 'okta',
    label: 'Okta',
    issuerTemplate: 'https://{your-domain}.okta.com',
    issuerPlaceholder: 'Replace {your-domain} with your Okta domain',
    defaultScopes: ['openid', 'profile', 'email'],
  },
  {
    key: 'auth0',
    label: 'Auth0',
    issuerTemplate: 'https://{tenant}.auth0.com',
    issuerPlaceholder: 'Replace {tenant} with your Auth0 tenant',
    defaultScopes: ['openid', 'profile', 'email'],
  },
  {
    key: 'keycloak',
    label: 'Keycloak',
    issuerTemplate: 'https://{host}/realms/{realm}',
    issuerPlaceholder: 'Replace {host} and {realm}',
    defaultScopes: ['openid', 'profile', 'email'],
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/providers/presets.test.ts`
Expected: PASS.

- [ ] **Step 5: Add preset chips to the new-OIDC form**

In `src/screens/AddEditProviderScreen.tsx`:

Add imports:
```tsx
import { Chip } from 'react-native-paper';
import { providerPresets, ProviderPreset } from '../providers/presets';
```
(Add `Chip` to the existing `react-native-paper` import list rather than a duplicate import.)

Add these styles to the `StyleSheet.create({...})` block:
```tsx
  presetLabel: { marginTop: 8, marginBottom: 4 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  presetChip: { marginRight: 8, marginBottom: 8 },
```

Add a handler inside the component (near `onSave`):
```tsx
  const applyPreset = (preset: ProviderPreset) => {
    if (name.trim() === '') {
      setName(preset.label);
    }
    setIssuer(preset.issuerTemplate);
    setScopesText(serializeScopes(preset.scopes ?? preset.defaultScopes));
  };
```
Note: `serializeScopes` is already imported. `preset.scopes` does not exist — use
`preset.defaultScopes`; the final handler is:
```tsx
  const applyPreset = (preset: ProviderPreset) => {
    if (name.trim() === '') {
      setName(preset.label);
    }
    setIssuer(preset.issuerTemplate);
    setScopesText(serializeScopes(preset.defaultScopes));
  };
```

In the OIDC branch JSX (the `else` block that renders Issuer/Client ID/Scopes), at the very
top — before the "Issuer URL" `TextInput` — insert the preset picker, shown only when
creating a new provider:
```tsx
            {existing == null ? (
              <>
                <Text
                  style={{ ...styles.presetLabel, color: theme.colors.disabled }}
                >
                  Start from a preset:
                </Text>
                <View style={styles.presetRow}>
                  {providerPresets.map((preset) => (
                    <Chip
                      key={preset.key}
                      style={styles.presetChip}
                      onPress={() => applyPreset(preset)}
                    >
                      {preset.label}
                    </Chip>
                  ))}
                </View>
              </>
            ) : null}
```

- [ ] **Step 6: Verify gate**

Run: `make typecheck && make lint && make check-format && make test`
Expected: all pass (run `make format` if check-format complains, then re-run).

- [ ] **Step 7: Commit**

```bash
git add src/providers/presets.ts src/providers/presets.test.ts src/screens/AddEditProviderScreen.tsx
git commit -m "feat: add OIDC provider presets to the add form"
```

---

## Task 3: Discovery document viewer

**Files:**
- Modify: `src/engines/oidc.ts`, `src/App.tsx`, `src/screens/OIDCResultScreen.tsx`
- Create: `src/screens/OIDCDiscoveryScreen.tsx`

**Interfaces:**
- Consumes: `OIDCProvider`, `useProviders`.
- Produces: `getDiscovery(issuer)`, `fetchDiscovery(provider)`; route `OIDCDiscovery { providerId }`.

- [ ] **Step 1: Extract `getDiscovery` and add `fetchDiscovery` in oidc.ts**

In `src/engines/oidc.ts`, add these exported functions (and refactor `fetchUserInfo` to use
`getDiscovery` in place of its inline discovery fetch):

```ts
export async function getDiscovery(
  issuer: string
): Promise<Record<string, unknown>> {
  const base = issuer.replace(/\/+$/, '');
  const res = await fetch(`${base}/.well-known/openid-configuration`);
  if (!res.ok) {
    throw new Error(`Discovery failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchDiscovery(
  provider: OIDCProvider
): Promise<Record<string, unknown>> {
  return getDiscovery(provider.issuer);
}
```

Then in `fetchUserInfo`, replace the block that fetches `.well-known/openid-configuration`
and parses `doc` with:
```ts
  const doc = (await getDiscovery(provider.issuer)) as {
    userinfo_endpoint?: string;
  };
```
(Keep the rest of `fetchUserInfo` — the `userinfo_endpoint` null check and the bearer GET —
unchanged.)

- [ ] **Step 2: Create the discovery screen**

Create `src/screens/OIDCDiscoveryScreen.tsx`:

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Card,
  Text,
  IconButton,
  MD2Theme,
  useTheme,
} from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useProviders } from '../context/ProvidersProvider';
import { isOIDCProvider } from '../providers/types';
import { fetchDiscovery } from '../engines/oidc';
import LoadingSpinner from '../LoadingSpinner';

const KEY_FIELDS = [
  'issuer',
  'authorization_endpoint',
  'token_endpoint',
  'userinfo_endpoint',
  'jwks_uri',
  'end_session_endpoint',
  'scopes_supported',
  'response_types_supported',
  'id_token_signing_alg_values_supported',
];

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16 },
  card: { marginBottom: 16 },
  label: { fontWeight: '700', marginTop: 8 },
  value: { fontFamily: 'Courier', fontSize: 12 },
  error: { marginBottom: 16 },
  jsonRow: { flexDirection: 'row', alignItems: 'flex-start' },
  json: { flex: 1, fontFamily: 'Courier', fontSize: 11 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'OIDCDiscovery'>;

const OIDCDiscoveryScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme<MD2Theme>();
  const { providers } = useProviders();
  const provider = providers.find((p) => p.id === route.params.providerId);

  const [loading, setLoading] = useState<boolean>(false);
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (provider == null || !isOIDCProvider(provider)) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      setDoc(await fetchDiscovery(provider));
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    load();
  }, [load]);

  const fullJson = doc == null ? '' : JSON.stringify(doc, null, 2);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Discovery" subtitle={provider?.name} />
      </Appbar.Header>
      <LoadingSpinner loading={loading} />
      <ScrollView contentContainerStyle={styles.content}>
        {error != null ? (
          <Text style={{ ...styles.error, color: theme.colors.error }}>
            {error}
          </Text>
        ) : null}
        {doc != null ? (
          <>
            <Card style={styles.card}>
              <Card.Title title="Key fields" />
              <Card.Content>
                {KEY_FIELDS.filter((k) => doc[k] != null).map((k) => (
                  <View key={k}>
                    <Text style={styles.label}>{k}</Text>
                    <Text style={styles.value}>{JSON.stringify(doc[k])}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
            <Card style={styles.card}>
              <Card.Title title="Full document" />
              <Card.Content>
                <View style={styles.jsonRow}>
                  <Text style={styles.json}>{fullJson}</Text>
                  <IconButton
                    icon="content-copy"
                    size={18}
                    onPress={() => Clipboard.setString(fullJson)}
                  />
                </View>
              </Card.Content>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OIDCDiscoveryScreen;
```

- [ ] **Step 3: Register the route in App.tsx**

In `src/App.tsx`: add to `RootStackParamList`:
```tsx
  OIDCDiscovery: { providerId: string };
```
Add the import:
```tsx
import OIDCDiscoveryScreen from './screens/OIDCDiscoveryScreen';
```
Register the screen inside `<Stack.Navigator>`:
```tsx
              <Stack.Screen name="OIDCDiscovery" component={OIDCDiscoveryScreen} />
```

- [ ] **Step 4: Add a Discovery button on OIDCResultScreen (visible pre-login)**

In `src/screens/OIDCResultScreen.tsx`, inside the `ScrollView` and BEFORE the
`tokens == null ? (Login button) : (...)` conditional, add a button that navigates to the
discovery screen regardless of login state:
```tsx
        <Button
          mode="text"
          style={styles.loginButton}
          onPress={() =>
            navigation.navigate('OIDCDiscovery', {
              providerId: route.params.providerId,
            })
          }
        >
          View discovery document
        </Button>
```
(`Button`, `navigation`, and `route` are already in scope.)

- [ ] **Step 5: Verify gate**

Run: `make typecheck && make lint && make check-format && make test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/engines/oidc.ts src/screens/OIDCDiscoveryScreen.tsx src/App.tsx src/screens/OIDCResultScreen.tsx
git commit -m "feat: add OIDC discovery document viewer"
```

---

## Task 4: Rich token view

**Files:**
- Create: `src/util/claims.ts`, `src/util/claims.test.ts`
- Modify: `src/screens/OIDCResultScreen.tsx`

**Interfaces:**
- Consumes: `decodeJwt` from `../util/jwt`.
- Produces: `isJwt(token)`, `formatClaimTimestamp(epochSeconds, nowMillis)`, `tokenValidity(payload, nowMillis)`.

- [ ] **Step 1: Write the failing test**

Create `src/util/claims.test.ts`:

```ts
import { isJwt, formatClaimTimestamp, tokenValidity } from './claims';

// {"alg":"none"} . {"exp":2000000000} . sig
const JWT =
  'eyJhbGciOiJub25lIn0.eyJleHAiOjIwMDAwMDAwMDB9.sig';

describe('isJwt', () => {
  it('recognizes a JWT', () => {
    expect(isJwt(JWT)).toBe(true);
  });
  it('rejects an opaque token', () => {
    expect(isJwt('opaque-access-token')).toBe(false);
    expect(isJwt('only.two')).toBe(false);
  });
});

describe('formatClaimTimestamp', () => {
  it('includes the UTC time and a future relative phrase', () => {
    // epoch 1700000000 = 2023-11-14T22:13:20Z; now one hour earlier
    const out = formatClaimTimestamp(1700000000, 1700000000 * 1000 - 3600 * 1000);
    expect(out).toContain('2023-11-14T22:13:20');
    expect(out).toContain('in 1h');
  });
  it('shows a past relative phrase', () => {
    const out = formatClaimTimestamp(1700000000, 1700000000 * 1000 + 120 * 1000);
    expect(out).toContain('2m ago');
  });
});

describe('tokenValidity', () => {
  it('is valid before exp', () => {
    expect(tokenValidity({ exp: 2000000000 }, 1000000000 * 1000)).toBe('valid');
  });
  it('is expired at/after exp', () => {
    expect(tokenValidity({ exp: 2000000000 }, 2000000001 * 1000)).toBe('expired');
  });
  it('is unknown without exp', () => {
    expect(tokenValidity({}, 1000000000 * 1000)).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/util/claims.test.ts`
Expected: FAIL — cannot find module `./claims`.

- [ ] **Step 3: Implement claims.ts**

Create `src/util/claims.ts`:

```ts
import { decodeJwt } from './jwt';

export function isJwt(token: string): boolean {
  if (token.split('.').length !== 3) {
    return false;
  }
  return decodeJwt(token) != null;
}

function relativeTime(deltaMillis: number): string {
  const future = deltaMillis >= 0;
  let secs = Math.floor(Math.abs(deltaMillis) / 1000);
  let value: number;
  let unit: string;
  if (secs < 60) {
    value = secs;
    unit = 's';
  } else if (secs < 3600) {
    value = Math.floor(secs / 60);
    unit = 'm';
  } else if (secs < 86400) {
    value = Math.floor(secs / 3600);
    unit = 'h';
  } else {
    value = Math.floor(secs / 86400);
    unit = 'd';
  }
  return future ? `in ${value}${unit}` : `${value}${unit} ago`;
}

export function formatClaimTimestamp(
  epochSeconds: number,
  nowMillis: number
): string {
  const iso = new Date(epochSeconds * 1000).toISOString();
  const rel = relativeTime(epochSeconds * 1000 - nowMillis);
  return `${iso} (${rel})`;
}

export function tokenValidity(
  payload: Record<string, unknown>,
  nowMillis: number
): 'valid' | 'expired' | 'unknown' {
  const exp = payload.exp;
  if (typeof exp !== 'number') {
    return 'unknown';
  }
  return nowMillis >= exp * 1000 ? 'expired' : 'valid';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/util/claims.test.ts`
Expected: PASS.

- [ ] **Step 5: Use the helpers in OIDCResultScreen**

In `src/screens/OIDCResultScreen.tsx`:

Add imports:
```tsx
import { Chip } from 'react-native-paper';
import { isJwt, formatClaimTimestamp, tokenValidity } from '../util/claims';
```
(Add `Chip` to the existing `react-native-paper` import list.)

The screen already computes `claims` (the decoded ID-token payload). Add a decoded
access-token payload and a validity value. Near the existing `claims` `useMemo`, add:
```tsx
  const accessClaims = useMemo(() => {
    if (tokens == null || !isJwt(tokens.accessToken)) {
      return null;
    }
    return decodeJwt(tokens.accessToken)?.payload ?? null;
  }, [tokens]);

  const idValidity = useMemo(() => {
    if (claims == null) {
      return 'unknown' as const;
    }
    return tokenValidity(claims, Date.now());
  }, [claims]);
```
(`decodeJwt` is already imported in this screen; if not, add
`import { decodeJwt } from '../util/jwt';`.)

Add a helper inside the component to render a claim value, formatting timestamp claims:
```tsx
  const renderClaimValue = (key: string, value: unknown) => {
    if (
      typeof value === 'number' &&
      ['exp', 'iat', 'nbf', 'auth_time'].includes(key)
    ) {
      return `${value} — ${formatClaimTimestamp(value, Date.now())}`;
    }
    return JSON.stringify(value);
  };
```

In the "ID token claims (unverified)" card, change the claims map to use `renderClaimValue`
and add the validity chip to the card title area. Replace the claims-rendering block:
```tsx
                {claims == null ? (
                  <Text style={styles.claim}>Could not decode ID token.</Text>
                ) : (
                  <>
                    <Chip
                      style={{ alignSelf: 'flex-start', marginBottom: 8 }}
                      icon={idValidity === 'valid' ? 'check' : 'alert'}
                    >
                      {idValidity}
                    </Chip>
                    {Object.entries(claims).map(([k, v]) => (
                      <Text key={k} style={styles.claim}>
                        {k}: {renderClaimValue(k, v)}
                      </Text>
                    ))}
                  </>
                )}
```

After the ID-token claims card, add an access-token claims card (only when the access token
is a JWT):
```tsx
            {accessClaims != null ? (
              <Card style={styles.card}>
                <Card.Title title="Access token claims (unverified)" />
                <Card.Content>
                  {Object.entries(accessClaims).map(([k, v]) => (
                    <Text key={k} style={styles.claim}>
                      {k}: {renderClaimValue(k, v)}
                    </Text>
                  ))}
                </Card.Content>
              </Card>
            ) : null}
```

- [ ] **Step 6: Verify gate**

Run: `make typecheck && make lint && make check-format && make test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/util/claims.ts src/util/claims.test.ts src/screens/OIDCResultScreen.tsx
git commit -m "feat: richer token view with decoded access token and readable timestamps"
```

---

## Task 5: JWKS signature verification

**Files:**
- Modify: `package.json`, `src/screens/OIDCResultScreen.tsx`
- Create: `src/engines/jwks.ts`, `src/engines/jwks.test.ts`

**Interfaces:**
- Consumes: `decodeJwt`, `getDiscovery`.
- Produces: `verifyIdTokenSignature(idToken, issuer): Promise<{ verified: boolean; alg?: string; kid?: string; error?: string }>`.

- [ ] **Step 1: Install jsrsasign**

Run:
```bash
npm install jsrsasign
npm install --save-dev @types/jsrsasign
```
Expected: both added to `package.json`.

- [ ] **Step 2: Write the failing test (real keypair)**

Create `src/engines/jwks.test.ts`:

```ts
import { KEYUTIL, KJUR, RSAKey } from 'jsrsasign';
import { verifySignatureWithJwks } from './jwks';

function makeTokenAndJwk() {
  const kp = KEYUTIL.generateKeypair('RSA', 2048);
  const prv = kp.prvKeyObj;
  const pub = kp.pubKeyObj as RSAKey;
  const header = { alg: 'RS256', typ: 'JWT', kid: 'test-key' };
  const payload = { sub: 'user-1', iss: 'https://issuer.example.com' };
  const token = KJUR.jws.JWS.sign(
    'RS256',
    JSON.stringify(header),
    JSON.stringify(payload),
    prv
  );
  const jwk = KEYUTIL.getJWKFromKey(pub) as any;
  jwk.kid = 'test-key';
  jwk.alg = 'RS256';
  jwk.use = 'sig';
  return { token, jwks: { keys: [jwk] } };
}

describe('verifySignatureWithJwks', () => {
  it('verifies a correctly signed token', () => {
    const { token, jwks } = makeTokenAndJwk();
    const result = verifySignatureWithJwks(token, jwks);
    expect(result.verified).toBe(true);
    expect(result.alg).toBe('RS256');
    expect(result.kid).toBe('test-key');
  });

  it('fails a tampered token', () => {
    const { token, jwks } = makeTokenAndJwk();
    const tampered = token.slice(0, -4) + 'AAAA';
    expect(verifySignatureWithJwks(tampered, jwks).verified).toBe(false);
  });

  it('errors when no key matches the kid', () => {
    const { token } = makeTokenAndJwk();
    const result = verifySignatureWithJwks(token, { keys: [] });
    expect(result.verified).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/engines/jwks.test.ts`
Expected: FAIL — cannot find module `./jwks`.

- [ ] **Step 4: Implement jwks.ts**

Create `src/engines/jwks.ts`:

```ts
import { KEYUTIL, KJUR } from 'jsrsasign';
import { decodeJwt } from '../util/jwt';
import { getDiscovery } from './oidc';

interface Jwks {
  keys: Array<Record<string, unknown>>;
}

export interface VerifyResult {
  verified: boolean;
  alg?: string;
  kid?: string;
  error?: string;
}

// Pure verification against a supplied JWKS — unit-testable without network.
export function verifySignatureWithJwks(
  idToken: string,
  jwks: Jwks
): VerifyResult {
  const decoded = decodeJwt(idToken);
  if (decoded == null) {
    return { verified: false, error: 'Could not decode token header' };
  }
  const alg = decoded.header.alg as string | undefined;
  const kid = decoded.header.kid as string | undefined;
  if (alg == null) {
    return { verified: false, error: 'Token header has no alg' };
  }
  const jwk =
    jwks.keys.find((k) => kid != null && k.kid === kid) ??
    (jwks.keys.length === 1 ? jwks.keys[0] : undefined);
  if (jwk == null) {
    return {
      verified: false,
      alg,
      kid,
      error: kid != null ? `No JWKS key matches kid "${kid}"` : 'No JWKS key',
    };
  }
  try {
    const key = KEYUTIL.getKey(jwk as any);
    const verified = KJUR.jws.JWS.verify(idToken, key as any, [alg]);
    return { verified, alg, kid };
  } catch (e: any) {
    return { verified: false, alg, kid, error: String(e?.message ?? e) };
  }
}

// Network wrapper: discover jwks_uri from the issuer, fetch it, then verify.
export async function verifyIdTokenSignature(
  idToken: string,
  issuer: string
): Promise<VerifyResult> {
  try {
    const doc = (await getDiscovery(issuer)) as { jwks_uri?: string };
    if (doc.jwks_uri == null) {
      return { verified: false, error: 'Provider has no jwks_uri' };
    }
    const res = await fetch(doc.jwks_uri);
    if (!res.ok) {
      return { verified: false, error: `JWKS fetch failed: HTTP ${res.status}` };
    }
    const jwks = (await res.json()) as Jwks;
    return verifySignatureWithJwks(idToken, jwks);
  } catch (e: any) {
    return { verified: false, error: String(e?.message ?? e) };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/engines/jwks.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Add a Verify-signature button to OIDCResultScreen**

In `src/screens/OIDCResultScreen.tsx`:

Add imports:
```tsx
import { verifyIdTokenSignature, VerifyResult } from '../engines/jwks';
import { isOIDCProvider } from '../providers/types';
```
(`isOIDCProvider` may already be imported; do not duplicate.)

Add state near the other `useState` hooks:
```tsx
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
```

Add a handler (uses the existing `run` wrapper and `oidcProvider`):
```tsx
  const onVerify = useCallback(() => {
    if (oidcProvider == null || tokens == null) {
      return;
    }
    run(async () => {
      setVerifyResult(await verifyIdTokenSignature(tokens.idToken, oidcProvider.issuer));
    });
  }, [oidcProvider, tokens, run]);
```

Inside the ID-token claims `Card` (after the claims list, still within `Card.Content`), add
the verify button and result:
```tsx
                <Button
                  mode="outlined"
                  style={{ marginTop: 12 }}
                  onPress={onVerify}
                >
                  Verify signature
                </Button>
                {verifyResult != null ? (
                  <Text
                    style={{
                      ...styles.claim,
                      color: verifyResult.verified
                        ? theme.colors.primary
                        : theme.colors.error,
                    }}
                  >
                    {verifyResult.error
                      ? `Error: ${verifyResult.error}`
                      : verifyResult.verified
                      ? `✓ Signature valid (${verifyResult.alg}, kid=${verifyResult.kid ?? 'n/a'})`
                      : '✗ Signature invalid'}
                  </Text>
                ) : null}
```

Also clear `verifyResult` when a new login/refresh happens: in `onLogin` and `onRefresh`,
after updating tokens, call `setVerifyResult(null)`.

- [ ] **Step 7: Verify gate**

Run: `make typecheck && make lint && make check-format && make test`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/engines/jwks.ts src/engines/jwks.test.ts src/screens/OIDCResultScreen.tsx
git commit -m "feat: verify OIDC ID token signature against JWKS"
```

---

## Task 6: About + Privacy screen

**Files:**
- Create: `src/screens/AboutScreen.tsx`
- Modify: `src/App.tsx`, `src/screens/ProviderListScreen.tsx`

**Interfaces:**
- Produces: route `About`.

- [ ] **Step 1: Create the About screen**

Create `src/screens/AboutScreen.tsx`:

```tsx
import React from 'react';
import { ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Text, Button, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import appInfo from '../../app.json';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16 },
  heading: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  divider: { marginVertical: 16 },
  link: { alignSelf: 'flex-start' },
  version: { marginTop: 24, fontSize: 13 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

const AboutScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="About" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>What it is</Text>
        <Text style={styles.body}>
          An OIDC/OAuth integration tester. Add any OpenID Connect provider, run
          the sign-in flow, and inspect the resulting tokens, claims, and
          discovery metadata.
        </Text>

        <Text style={styles.heading}>How it works</Text>
        <Text style={styles.body}>
          1. Add a provider (start from a preset or enter an issuer and client
          ID).{'\n'}
          2. Run the login flow.{'\n'}
          3. Inspect the tokens, decoded claims, discovery document, and verify
          the ID token signature.
        </Text>

        <Text style={styles.heading}>Privacy &amp; data handling</Text>
        <Text style={styles.body}>
          Provider configurations are stored locally on your device. Tokens
          obtained while testing are kept in memory only and are never persisted
          or sent anywhere except the OIDC provider you configure. The app has
          no backend and collects no analytics.
        </Text>

        <Divider style={styles.divider} />

        <Button
          style={styles.link}
          onPress={() => Linking.openURL('https://docs.authgear.com')}
        >
          Authgear documentation
        </Button>
        <Button
          style={styles.link}
          onPress={() =>
            Linking.openURL('https://openid.net/developers/how-connect-works/')
          }
        >
          How OpenID Connect works
        </Button>

        <Text style={styles.version}>Version {appInfo.displayName} • {require('../../package.json').version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;
```

Note: if the `require('../../package.json')` inline import triggers a lint error, add
`import pkg from '../../package.json';` at the top and use `pkg.version`.

- [ ] **Step 2: Register the route in App.tsx**

In `src/App.tsx`: add to `RootStackParamList`:
```tsx
  About: undefined;
```
Add the import:
```tsx
import AboutScreen from './screens/AboutScreen';
```
Register inside `<Stack.Navigator>`:
```tsx
              <Stack.Screen name="About" component={AboutScreen} />
```

- [ ] **Step 3: Add the ⓘ action to the provider list header**

In `src/screens/ProviderListScreen.tsx`, add an `Appbar.Action` to the header:
```tsx
      <Appbar.Header>
        <Appbar.Content
          title="Authgear Tools"
          subtitle="OIDC integration tester"
        />
        <Appbar.Action icon="information" onPress={() => navigation.navigate('About')} />
      </Appbar.Header>
```

- [ ] **Step 4: Verify gate**

Run: `make typecheck && make lint && make check-format && make test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/screens/AboutScreen.tsx src/App.tsx src/screens/ProviderListScreen.tsx
git commit -m "feat: add About and privacy screen"
```

---

## Self-Review

- **Spec coverage:** presets (Task 2), discovery viewer + `getDiscovery`/`fetchDiscovery` (Task 3), rich token view via `claims.ts` (Task 4), JWKS verification via `jsrsasign` (Task 5), About/Privacy (Task 6), DEV-interceptor removal housekeeping (Task 1). All spec sections map to a task.
- **Placeholder scan:** no TBD/TODO; every code step has full code. The two "note" clarifications (preset `defaultScopes` vs `scopes`, and the `package.json` version import) resolve to concrete final code inline.
- **Type consistency:** `ProviderPreset`/`providerPresets`, `getDiscovery`/`fetchDiscovery`, `isJwt`/`formatClaimTimestamp`/`tokenValidity`, `verifySignatureWithJwks`/`verifyIdTokenSignature`/`VerifyResult`, and the new routes `OIDCDiscovery { providerId }` and `About` are used consistently across tasks. Features 1–4 touch only the generic-OIDC path; the Authgear flow is untouched.

## Notes for execution

- Tasks 3, 4, and 5 each modify `src/screens/OIDCResultScreen.tsx`; run them in order (they add
  a Discovery button, then token-view enhancements, then the verify button — non-overlapping
  regions, but sequential execution avoids conflicts).
- Tasks 3 and 6 both modify `src/App.tsx` (additive route registrations) — sequential.
- Device/pod builds are out of scope for the sandbox; verify on-device separately.
