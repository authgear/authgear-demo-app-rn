# OIDC Integration Tester Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the app into an OIDC/OAuth integration tester with a unified provider list — a pinned zero-setup Authgear demo plus user-added generic OIDC providers — so it presents as a genuine developer utility for the App Store.

**Architecture:** A `ProviderList` home drives two engines behind shared screens. Authgear providers use `@authgear/react-native` and keep the existing login → UserPanel showcase. Generic OIDC providers use `react-native-app-auth` (discovery + PKCE) and render tokens/claims on a new result screen. A `ProvidersProvider` context owns the persisted provider list and the currently-active Authgear provider.

**Tech Stack:** React Native 0.80, React 19, TypeScript, react-native-paper (MD2), React Navigation native-stack, `@authgear/react-native`, `react-native-app-auth`, AsyncStorage, Jest.

## Global Constraints

- Terminology: use "Hong Kong", "Taiwan", "Macau", "China" as distinct top-level entities; never "Mainland China". (Applies to any copy/comments.)
- App display name is **"Authgear Tools"**; in-app titles use **"Authgear"** (no "Demo"). Do not reintroduce "Demo/Trial/Sample" in user-facing strings.
- Generic OIDC redirect URI is exactly `authgear-oidc-tester://callback`.
- Authgear keeps its existing redirect URI `com.authgear.example.rn://host/path` — do NOT change it.
- OIDC tokens are held in memory only; never written to AsyncStorage.
- Provider list persists under AsyncStorage key `providers.v1`. Legacy key `config` is migrated then removed.
- The pinned Authgear demo provider has id `authgear-demo` and is non-deletable.
- Preserve the distinct-container-name-per-install workaround (issue #31) for Authgear.
- Every task ends green on: `make typecheck && make lint && make check-format && make test`.

---

## File Structure

**Create:**
- `src/util/id.ts` — random id generation.
- `src/util/jwt.ts` — `decodeJwt` (display-only, unverified).
- `src/util/scopes.ts` — parse/serialize OIDC scopes.
- `src/providers/types.ts` — `Provider` union + type guards.
- `src/providers/store.ts` — pure list operations + the demo provider constant.
- `src/providers/migration.ts` — legacy `config` → Authgear provider.
- `src/context/ProvidersProvider.tsx` — persisted list + active Authgear provider (replaces `ConfigProvider`).
- `src/engines/authgear.ts` — `configureAuthgear`.
- `src/engines/oidc.ts` — `react-native-app-auth` wrappers.
- `src/screens/ProviderListScreen.tsx` — home.
- `src/screens/AddEditProviderScreen.tsx` — create/edit form (Authgear or OIDC).
- `src/screens/OIDCResultScreen.tsx` — OIDC login result (tokens/claims/userinfo).
- Tests: `src/util/jwt.test.ts`, `src/util/scopes.test.ts`, `src/providers/store.test.ts`, `src/providers/migration.test.ts`, `src/util/id.test.ts`.

**Modify:**
- `src/App.tsx` — `RootStackParamList`, provider wrapping, stack screens.
- `src/screens/AuthenticationScreen.tsx` → renamed responsibility "AuthgearLogin".
- `src/screens/UserPanelScreen.tsx`, `src/screens/UserInfoScreen.tsx` — read active Authgear provider instead of `useConfig`.
- `src/context/UserProvider.tsx` — read active Authgear provider instead of `useConfig`.
- `package.json` — add `react-native-app-auth`.
- `ios/AuthgearDemoAppRN/Info.plist`, `ios/AuthgearDemoAppRN/AppDelegate.h`, `ios/AuthgearDemoAppRN/AppDelegate.mm` — OIDC redirect scheme + AppAuth delegate.
- `android/app/build.gradle` — `appAuthRedirectScheme` manifest placeholder.

**Delete:**
- `src/context/ConfigProvider.tsx` (in the final task, once nothing imports it).

---

## Task 1: Add react-native-app-auth and native redirect configuration

**Files:**
- Modify: `package.json`
- Modify: `ios/AuthgearDemoAppRN/Info.plist:23-33`
- Modify: `ios/AuthgearDemoAppRN/AppDelegate.h`
- Modify: `ios/AuthgearDemoAppRN/AppDelegate.mm`
- Modify: `android/app/build.gradle` (defaultConfig block)

**Interfaces:**
- Produces: the `authgear-oidc-tester://callback` scheme registered natively on both platforms; the `react-native-app-auth` module available to JS.

- [ ] **Step 1: Install the dependency**

Run:
```bash
npm install react-native-app-auth
cd ios && bundle exec pod install && cd ..
```
Expected: `react-native-app-auth` added to `package.json` dependencies; pods install without error (`Pod installation complete`).

- [ ] **Step 2: Register the OIDC scheme in Info.plist**

In `ios/AuthgearDemoAppRN/Info.plist`, extend the existing `CFBundleURLTypes` array (do not remove the Authgear scheme) so it reads:

```xml
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleTypeRole</key>
			<string>Editor</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>com.authgear.example.rn</string>
			</array>
		</dict>
		<dict>
			<key>CFBundleTypeRole</key>
			<string>Editor</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>authgear-oidc-tester</string>
			</array>
		</dict>
	</array>
```

- [ ] **Step 3: Add the AppAuth flow-manager delegate to AppDelegate.h**

`react-native-app-auth` requires the app delegate to conform to `RNAppAuthAuthorizationFlowManager`. Edit `ios/AuthgearDemoAppRN/AppDelegate.h`:

```objc
#import <UIKit/UIKit.h>
#import <RCTReactNativeFactory.h>
#import <RCTDefaultReactNativeFactoryDelegate.h>
#import "RNAppAuthAuthorizationFlowManager.h"

@interface ReactNativeDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@interface AppDelegate : UIResponder <UIApplicationDelegate, RNAppAuthAuthorizationFlowManager>

@property (nonatomic, strong, nonnull) UIWindow *window;
@property (nonatomic, strong, nonnull) RCTReactNativeFactory *reactNativeFactory;
@property (nonatomic, strong, nonnull) ReactNativeDelegate *reactNativeDelegate;
@property (nonatomic, weak, nullable) id<RNAppAuthAuthorizationFlowManagerDelegate> authorizationFlowManagerDelegate;

@end
```

- [ ] **Step 4: Handle the callback URL in AppDelegate.mm**

Add the `openURL` handler to the `@implementation AppDelegate` block in `ios/AuthgearDemoAppRN/AppDelegate.mm` (after `didFinishLaunchingWithOptions`):

```objc
- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
    return YES;
  }
  return NO;
}
```

- [ ] **Step 5: Add the Android redirect scheme placeholder**

In `android/app/build.gradle`, inside `android { defaultConfig { ... } }`, add the placeholder (the `react-native-app-auth` library manifest merges its `RedirectUriReceiverActivity` using this value):

```gradle
        applicationId "com.authgear.exampleapp.reactnativeforsales"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        manifestPlaceholders = [appAuthRedirectScheme: 'authgear-oidc-tester']
```

- [ ] **Step 6: Verify typecheck/lint still pass and builds are wired**

Run:
```bash
make typecheck && make lint
npx react-native config | grep -A2 react-native-app-auth
```
Expected: typecheck/lint pass; `react-native-app-auth` appears in autolinking config.

Manual (device/simulator, do once native code lands): `npm run ios` and `npm run android` compile. Deep native verification happens in the Task 10 manual test.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json ios/ android/app/build.gradle
git commit -m "chore: add react-native-app-auth and OIDC redirect scheme"
```

---

## Task 2: JWT decode utility

**Files:**
- Create: `src/util/jwt.ts`
- Test: `src/util/jwt.test.ts`

**Interfaces:**
- Produces: `decodeJwt(token: string): { header: Record<string, unknown>; payload: Record<string, unknown> } | null`

- [ ] **Step 1: Write the failing test**

Create `src/util/jwt.test.ts`:

```ts
import { decodeJwt } from './jwt';

// header {"alg":"none","typ":"JWT"} . payload {"sub":"user-1","name":"Ada"} . sig
const SAMPLE =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiQWRhIn0.sig';

describe('decodeJwt', () => {
  it('decodes header and payload', () => {
    const result = decodeJwt(SAMPLE);
    expect(result).not.toBeNull();
    expect(result!.header).toEqual({ alg: 'none', typ: 'JWT' });
    expect(result!.payload).toEqual({ sub: 'user-1', name: 'Ada' });
  });

  it('returns null for a non-JWT string', () => {
    expect(decodeJwt('not-a-jwt')).toBeNull();
  });

  it('returns null for malformed base64 segments', () => {
    expect(decodeJwt('%%%.%%%.sig')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/util/jwt.test.ts`
Expected: FAIL — cannot find module `./jwt`.

- [ ] **Step 3: Write the implementation**

Create `src/util/jwt.ts`:

```ts
export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  const binary = atob(padded);
  // Reconstruct UTF-8 text from the decoded binary string.
  let percentEncoded = '';
  for (let i = 0; i < binary.length; i++) {
    percentEncoded += '%' + ('00' + binary.charCodeAt(i).toString(16)).slice(-2);
  }
  return decodeURIComponent(percentEncoded);
}

export function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { header, payload };
  } catch {
    return null;
  }
}
```

Note: `atob` is available in Node 18+ (Jest) and in Hermes on RN 0.80.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/util/jwt.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/util/jwt.ts src/util/jwt.test.ts
git commit -m "feat: add JWT decode utility"
```

---

## Task 3: Scopes utility

**Files:**
- Create: `src/util/scopes.ts`
- Test: `src/util/scopes.test.ts`

**Interfaces:**
- Produces: `parseScopes(input: string): string[]`, `serializeScopes(scopes: string[]): string`

- [ ] **Step 1: Write the failing test**

Create `src/util/scopes.test.ts`:

```ts
import { parseScopes, serializeScopes } from './scopes';

describe('parseScopes', () => {
  it('always includes openid first', () => {
    expect(parseScopes('')).toEqual(['openid']);
    expect(parseScopes('profile email')).toEqual(['openid', 'profile', 'email']);
  });

  it('dedupes and drops duplicate openid', () => {
    expect(parseScopes('openid profile openid')).toEqual(['openid', 'profile']);
  });

  it('ignores extra whitespace', () => {
    expect(parseScopes('  profile   email  ')).toEqual([
      'openid',
      'profile',
      'email',
    ]);
  });
});

describe('serializeScopes', () => {
  it('joins with single spaces', () => {
    expect(serializeScopes(['openid', 'profile'])).toBe('openid profile');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/util/scopes.test.ts`
Expected: FAIL — cannot find module `./scopes`.

- [ ] **Step 3: Write the implementation**

Create `src/util/scopes.ts`:

```ts
export function parseScopes(input: string): string[] {
  const parts = input
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== 'openid');
  const deduped = Array.from(new Set(parts));
  return ['openid', ...deduped];
}

export function serializeScopes(scopes: string[]): string {
  return scopes.join(' ');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/util/scopes.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/util/scopes.ts src/util/scopes.test.ts
git commit -m "feat: add OIDC scopes parse/serialize utility"
```

---

## Task 4: Provider model — types, id, store operations, migration

**Files:**
- Create: `src/util/id.ts`, `src/providers/types.ts`, `src/providers/store.ts`, `src/providers/migration.ts`
- Test: `src/util/id.test.ts`, `src/providers/store.test.ts`, `src/providers/migration.test.ts`

**Interfaces:**
- Produces:
  - `randomId(length?: number): string`
  - types `AuthgearProvider`, `OIDCProvider`, `Provider`; guards `isAuthgearProvider`, `isOIDCProvider`
  - `AUTHGEAR_DEMO_PROVIDER_ID: 'authgear-demo'`, `demoAuthgearProvider: AuthgearProvider`
  - `seedProviders(existing: Provider[] | null): Provider[]`, `sortPinnedFirst`, `upsertProvider`, `removeProvider`, `getProvider`
  - `legacyConfigToProvider(config: LegacyConfig): AuthgearProvider`

- [ ] **Step 1: Write the id test**

Create `src/util/id.test.ts`:

```ts
import { randomId } from './id';

describe('randomId', () => {
  it('returns a string of the requested length', () => {
    expect(randomId(16)).toHaveLength(16);
  });
  it('produces different values on subsequent calls', () => {
    expect(randomId()).not.toBe(randomId());
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx jest src/util/id.test.ts`
Expected: FAIL — cannot find module `./id`.

- [ ] **Step 3: Implement id util**

Create `src/util/id.ts`:

```ts
const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function randomId(length: number = 16): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}
```

- [ ] **Step 4: Create the provider types**

Create `src/providers/types.ts`:

```ts
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
```

- [ ] **Step 5: Write the store test**

Create `src/providers/store.test.ts`:

```ts
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
```

- [ ] **Step 6: Run and confirm failure**

Run: `npx jest src/providers/store.test.ts`
Expected: FAIL — cannot find module `./store`.

- [ ] **Step 7: Implement the store**

Create `src/providers/store.ts`:

```ts
import { AuthgearProvider, Provider } from './types';

export const AUTHGEAR_DEMO_PROVIDER_ID = 'authgear-demo';

export const demoAuthgearProvider: AuthgearProvider = {
  id: AUTHGEAR_DEMO_PROVIDER_ID,
  kind: 'authgear',
  name: 'Authgear (demo)',
  clientID: 'e6b2f5bad8546ee3',
  endpoint: 'https://demo-app.authgear.cloud',
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
```

- [ ] **Step 8: Write the migration test**

Create `src/providers/migration.test.ts`:

```ts
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
```

- [ ] **Step 9: Run and confirm failure**

Run: `npx jest src/providers/migration.test.ts`
Expected: FAIL — cannot find module `./migration`.

- [ ] **Step 10: Implement migration**

Create `src/providers/migration.ts`:

```ts
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

export function legacyConfigToProvider(
  config: LegacyConfig
): AuthgearProvider {
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
```

- [ ] **Step 11: Run all new tests**

Run: `npx jest src/util/id.test.ts src/providers/store.test.ts src/providers/migration.test.ts`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add src/util/id.ts src/util/id.test.ts src/providers/
git commit -m "feat: add provider model, store operations, and legacy migration"
```

---

## Task 5: ProvidersProvider context

**Files:**
- Create: `src/context/ProvidersProvider.tsx`

**Interfaces:**
- Consumes: `store.ts` (`seedProviders`, `upsertProvider`, `removeProvider`, `getProvider`, `AUTHGEAR_DEMO_PROVIDER_ID`), `migration.ts` (`legacyConfigToProvider`), `engines/authgear.ts` (`configureAuthgear` — from Task 6), `types.ts`.
- Produces: `useProviders()` returning:
  ```ts
  interface ProvidersContextValue {
    loading: boolean;
    providers: Provider[];
    activeAuthgearProvider: AuthgearProvider | null;
    addOrUpdate: (p: Provider) => Promise<void>;
    remove: (id: string) => Promise<void>;
    activateAuthgear: (p: AuthgearProvider) => Promise<void>;
  }
  ```
  and default export `ProvidersProvider`.

> Note: this task imports `configureAuthgear` from Task 6. Implement Task 6 first if executing strictly in order, or stub `configureAuthgear` as `async () => {}` and let Task 6 replace it. The plan orders Task 6 immediately after; keep both in one review if convenient.

- [ ] **Step 1: Implement the context**

Create `src/context/ProvidersProvider.tsx`:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import ShowError from '../ShowError';
import { AuthgearProvider, Provider } from '../providers/types';
import {
  seedProviders,
  upsertProvider as upsertInList,
  removeProvider as removeFromList,
} from '../providers/store';
import { legacyConfigToProvider, LegacyConfig } from '../providers/migration';
import { configureAuthgear } from '../engines/authgear';

const STORAGE_KEY = 'providers.v1';
const LEGACY_CONFIG_KEY = 'config';

interface ProvidersContextValue {
  loading: boolean;
  providers: Provider[];
  activeAuthgearProvider: AuthgearProvider | null;
  addOrUpdate: (p: Provider) => Promise<void>;
  remove: (id: string) => Promise<void>;
  activateAuthgear: (p: AuthgearProvider) => Promise<void>;
}

const ProvidersContext = createContext<ProvidersContextValue>({
  loading: true,
  providers: [],
  activeAuthgearProvider: null,
  addOrUpdate: async () => {},
  remove: async () => {},
  activateAuthgear: async () => {},
});

interface ProvidersProviderProps {
  children: React.ReactNode;
}

async function loadInitial(): Promise<Provider[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw != null) {
    return seedProviders(JSON.parse(raw) as Provider[]);
  }
  // Migrate the legacy single-config key if present.
  const legacyRaw = await AsyncStorage.getItem(LEGACY_CONFIG_KEY);
  if (legacyRaw != null) {
    const migrated = legacyConfigToProvider(JSON.parse(legacyRaw) as LegacyConfig);
    const seeded = seedProviders([migrated]);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    await AsyncStorage.removeItem(LEGACY_CONFIG_KEY);
    return seeded;
  }
  const seeded = seedProviders(null);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

const ProvidersProvider: React.FC<ProvidersProviderProps> = ({ children }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeAuthgearProvider, setActiveAuthgearProvider] =
    useState<AuthgearProvider | null>(null);

  useEffect(() => {
    loadInitial()
      .then((list) => setProviders(list))
      .catch((e) => ShowError(e))
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(async (list: Provider[]) => {
    setProviders(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const addOrUpdate = useCallback(
    async (p: Provider) => {
      await persist(upsertInList(providers, p));
    },
    [persist, providers]
  );

  const remove = useCallback(
    async (id: string) => {
      await persist(removeFromList(providers, id));
    },
    [persist, providers]
  );

  const activateAuthgear = useCallback(async (p: AuthgearProvider) => {
    await configureAuthgear(p);
    setActiveAuthgearProvider(p);
  }, []);

  return (
    <ProvidersContext.Provider
      value={{
        loading,
        providers,
        activeAuthgearProvider,
        addOrUpdate,
        remove,
        activateAuthgear,
      }}
    >
      {children}
    </ProvidersContext.Provider>
  );
};

export const useProviders = () => useContext(ProvidersContext);

export default ProvidersProvider;
```

- [ ] **Step 2: Typecheck**

Run: `make typecheck`
Expected: PASS once Task 6 provides `configureAuthgear` (or the stub is in place).

- [ ] **Step 3: Commit**

```bash
git add src/context/ProvidersProvider.tsx
git commit -m "feat: add ProvidersProvider context with persistence and migration"
```

---

## Task 6: Authgear engine module

**Files:**
- Create: `src/engines/authgear.ts`

**Interfaces:**
- Consumes: `providers/types.ts` (`AuthgearProvider`).
- Produces: `configureAuthgear(provider: AuthgearProvider): Promise<void>`.

- [ ] **Step 1: Implement the engine**

Create `src/engines/authgear.ts` (this lifts the configure + distinct-name logic out of the old `ConfigProvider`):

```ts
import authgear, {
  PersistentTokenStorage,
  TransientTokenStorage,
  WebKitWebViewUIImplementation,
} from '@authgear/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthgearProvider } from '../providers/types';
import { randomId } from '../util/id';

const CONTAINER_NAME_KEY = 'authgear.container.name';

// The anonymous-user key is tied to the container name. A fixed name across
// endpoints causes invalid-credentials errors, so we use a distinct name per
// install. See https://github.com/authgear/authgear-demo-app-rn/issues/31
async function getDistinctNamePerInstall(): Promise<string> {
  const existing = await AsyncStorage.getItem(CONTAINER_NAME_KEY);
  if (existing != null && existing !== '') {
    return existing;
  }
  const name = randomId(44);
  await AsyncStorage.setItem(CONTAINER_NAME_KEY, name);
  return name;
}

export async function configureAuthgear(
  provider: AuthgearProvider
): Promise<void> {
  const name = await getDistinctNamePerInstall();
  authgear.name = name;
  await authgear.configure({
    clientID: provider.clientID,
    endpoint: provider.endpoint,
    tokenStorage: provider.useTransientTokenStorage
      ? new TransientTokenStorage()
      : new PersistentTokenStorage(),
    isSSOEnabled: provider.shareSessionWithSystemBrowser,
    uiImplementation: provider.useWebkitWebView
      ? new WebKitWebViewUIImplementation({
          ios: { navigationBarButtonTintColor: 0xff000000 },
          android: { actionBarButtonTintColor: 0xff000000 },
        })
      : undefined,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `make typecheck`
Expected: PASS (ProvidersProvider now resolves `configureAuthgear`).

- [ ] **Step 3: Commit**

```bash
git add src/engines/authgear.ts
git commit -m "feat: add Authgear engine (configureAuthgear)"
```

---

## Task 7: OIDC engine module

**Files:**
- Create: `src/engines/oidc.ts`

**Interfaces:**
- Consumes: `react-native-app-auth`, `providers/types.ts` (`OIDCProvider`).
- Produces:
  - `OIDC_REDIRECT_URL = 'authgear-oidc-tester://callback'`
  - `oidcAuthorize(p): Promise<AuthorizeResult>`
  - `oidcRefresh(p, refreshToken): Promise<RefreshResult>`
  - `oidcEndSession(p, idToken): Promise<void>`
  - `fetchUserInfo(p, accessToken): Promise<Record<string, unknown>>`

- [ ] **Step 1: Implement the engine**

Create `src/engines/oidc.ts`:

```ts
import {
  authorize,
  refresh,
  logout,
  AuthConfiguration,
  AuthorizeResult,
  RefreshResult,
} from 'react-native-app-auth';
import { OIDCProvider } from '../providers/types';

export const OIDC_REDIRECT_URL = 'authgear-oidc-tester://callback';

function toAuthConfig(provider: OIDCProvider): AuthConfiguration {
  return {
    issuer: provider.issuer,
    clientId: provider.clientID,
    redirectUrl: OIDC_REDIRECT_URL,
    scopes: provider.scopes,
  };
}

export async function oidcAuthorize(
  provider: OIDCProvider
): Promise<AuthorizeResult> {
  return authorize(toAuthConfig(provider));
}

export async function oidcRefresh(
  provider: OIDCProvider,
  refreshToken: string
): Promise<RefreshResult> {
  return refresh(toAuthConfig(provider), { refreshToken });
}

export async function oidcEndSession(
  provider: OIDCProvider,
  idToken: string
): Promise<void> {
  await logout(toAuthConfig(provider), {
    idToken,
    postLogoutRedirectUrl: OIDC_REDIRECT_URL,
  });
}

export async function fetchUserInfo(
  provider: OIDCProvider,
  accessToken: string
): Promise<Record<string, unknown>> {
  const base = provider.issuer.replace(/\/$/, '');
  const wellKnown = await fetch(
    `${base}/.well-known/openid-configuration`
  );
  if (!wellKnown.ok) {
    throw new Error(`Discovery failed: HTTP ${wellKnown.status}`);
  }
  const doc = (await wellKnown.json()) as { userinfo_endpoint?: string };
  if (doc.userinfo_endpoint == null) {
    throw new Error('Provider has no userinfo_endpoint');
  }
  const res = await fetch(doc.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`userinfo failed: HTTP ${res.status}`);
  }
  return res.json();
}
```

- [ ] **Step 2: Typecheck**

Run: `make typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/engines/oidc.ts
git commit -m "feat: add generic OIDC engine over react-native-app-auth"
```

---

## Task 8: Refactor AuthenticationScreen into the Authgear login screen

**Files:**
- Modify: `src/screens/AuthenticationScreen.tsx`

**Interfaces:**
- Consumes: `useProviders()` (`activateAuthgear`, `providers`), route param `{ providerId: string }`, `getBiometricOptions`, `redirectURI`, `wechatRedirectURI` from `App.tsx`.
- Produces: navigates to `UserPanel` on success; reachable as stack route `AuthgearLogin`.

- [ ] **Step 1: Replace the screen implementation**

Replace the entire contents of `src/screens/AuthenticationScreen.tsx` with:

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Button, Text, Appbar, MD2Theme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getBiometricOptions,
  redirectURI,
  RootStackParamList,
  wechatRedirectURI,
} from '../App';
import { useProviders } from '../context/ProvidersProvider';
import { isAuthgearProvider } from '../providers/types';
import ShowError from '../ShowError';
import LoadingSpinner from '../LoadingSpinner';
import { useUser } from '../context/UserProvider';
import authgear from '@authgear/react-native';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  root: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 32,
  },
  headerContainer: { flexDirection: 'row', paddingTop: 16 },
  titleContainer: { flex: 1 },
  titleText: { fontSize: 34, fontWeight: '400', lineHeight: 42 },
  subTitleText: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  actionButtons: { alignItems: 'center' },
  button: { marginBottom: 20, width: '100%' },
  buttonContent: { height: 48 },
  buttonText: { fontSize: 16 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'AuthgearLogin'>;

const AuthenticationScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme<MD2Theme>();
  const { providers, activateAuthgear, activeAuthgearProvider } =
    useProviders();
  const user = useUser();

  const providerId = route.params.providerId;
  const provider = providers.find((p) => p.id === providerId);

  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchAction, setDispatchAction] = useState<(() => void) | null>(
    null
  );

  // Configure the Authgear SDK for the selected provider on mount.
  useEffect(() => {
    if (provider != null && isAuthgearProvider(provider)) {
      activateAuthgear(provider).catch((e) => ShowError(e));
    }
  }, [provider, activateAuthgear]);

  useEffect(() => {
    if (loading || dispatchAction == null) {
      return;
    }
    setTimeout(dispatchAction, 100);
    setDispatchAction(null);
  }, [dispatchAction, loading]);

  const colorScheme = activeAuthgearProvider?.explicitColorScheme ?? undefined;

  const authenticate = useCallback(
    (page: string) => {
      async function auth() {
        setLoading(true);
        try {
          const { userInfo } = await authgear.authenticate({
            redirectURI,
            wechatRedirectURI,
            page,
            colorScheme,
          });
          setDispatchAction(
            () => () => navigation.replace('UserPanel', { userInfo })
          );
        } finally {
          setLoading(false);
        }
      }
      auth().catch((e) => ShowError(e));
    },
    [colorScheme, navigation]
  );

  const onPressSignup = useCallback(() => authenticate('signup'), [
    authenticate,
  ]);
  const onPressLogin = useCallback(() => authenticate('login'), [authenticate]);

  const onPressBiometricLogin = useCallback(() => {
    async function biometricLogin() {
      setLoading(true);
      try {
        const options = getBiometricOptions({
          forEnableBiometric: false,
          allowFallbackToPasscode:
            activeAuthgearProvider?.allowFallbackToPasscodeInBiometric ?? false,
        });
        const { userInfo } = await authgear.authenticateBiometric(options);
        setDispatchAction(
          () => () => navigation.replace('UserPanel', { userInfo })
        );
      } finally {
        setLoading(false);
      }
    }
    biometricLogin().catch((e) => ShowError(e));
  }, [activeAuthgearProvider, navigation]);

  const onPressGuestLogin = useCallback(() => {
    async function guestLogin() {
      setLoading(true);
      try {
        const { userInfo } = await authgear.authenticateAnonymously();
        setDispatchAction(
          () => () => navigation.replace('UserPanel', { userInfo })
        );
      } finally {
        setLoading(false);
      }
    }
    guestLogin().catch((e) => ShowError(e));
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Authgear" />
      </Appbar.Header>
      <View style={styles.root}>
        <LoadingSpinner loading={loading} />
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{provider?.name ?? 'Authgear'}</Text>
            <Text
              style={{ ...styles.subTitleText, color: theme.colors.disabled }}
            >
              {activeAuthgearProvider?.endpoint ?? ''}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          {user.isBiometricEnabled ? (
            <Button
              mode="contained"
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonText}
              onPress={onPressBiometricLogin}
            >
              Login with biometric
            </Button>
          ) : null}
          <Button
            mode={user.isBiometricEnabled ? 'outlined' : 'contained'}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            onPress={onPressSignup}
          >
            Signup
          </Button>
          <Button
            mode="outlined"
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            onPress={onPressLogin}
          >
            Login
          </Button>
          <Button
            mode="outlined"
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            onPress={onPressGuestLogin}
          >
            Continue as guest
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AuthenticationScreen;
```

- [ ] **Step 2: Typecheck (expect failures until Task 9 & 13)**

Run: `make typecheck`
Expected: errors only about `RootStackParamList` not yet having `AuthgearLogin`, and `useConfig` removals — resolved in Tasks 9 and 13. Proceed; do not commit alone if red. If executing strictly task-by-task, defer the commit to the end of Task 9.

- [ ] **Step 3: Commit (after Task 9 makes typecheck green)**

```bash
git add src/screens/AuthenticationScreen.tsx
git commit -m "refactor: Authgear login screen reads provider from context"
```

---

## Task 9: Point UserProvider, UserPanel, and UserInfo at the active provider

**Files:**
- Modify: `src/context/UserProvider.tsx`
- Modify: `src/screens/UserPanelScreen.tsx`
- Modify: `src/screens/UserInfoScreen.tsx`

**Interfaces:**
- Consumes: `useProviders()` (`activeAuthgearProvider`).
- Produces: no new exports; removes all `useConfig` usage.

- [ ] **Step 1: Update UserProvider**

In `src/context/UserProvider.tsx`, replace the `useConfig` import and usage. Change:

```tsx
import { useConfig } from './ConfigProvider';
```
to
```tsx
import { useProviders } from './ProvidersProvider';
```

Replace `const config = useConfig();` with:
```tsx
const { activeAuthgearProvider } = useProviders();
```

Replace both reads of `config.content?.allowFallbackToPasscodeInBiometric` with `activeAuthgearProvider?.allowFallbackToPasscodeInBiometric`, and update the `useCallback` dependency array from `[config.content?.allowFallbackToPasscodeInBiometric]` to `[activeAuthgearProvider?.allowFallbackToPasscodeInBiometric]`.

- [ ] **Step 2: Update UserPanelScreen**

In `src/screens/UserPanelScreen.tsx`:
- Replace `import { useConfig } from '../context/ConfigProvider';` with `import { useProviders } from '../context/ProvidersProvider';`.
- Replace `const config = useConfig();` with `const { activeAuthgearProvider } = useProviders();`.
- Replace every `config.content?.allowFallbackToPasscodeInBiometric` with `activeAuthgearProvider?.allowFallbackToPasscodeInBiometric`.
- Replace every `config.content?.colorScheme` with `activeAuthgearProvider?.explicitColorScheme ?? undefined`.

Run this to find all occurrences to update:
```bash
grep -n "config\.content\|useConfig" src/screens/UserPanelScreen.tsx
```

- [ ] **Step 3: Update UserInfoScreen**

Run:
```bash
grep -n "config\.content\|useConfig" src/screens/UserInfoScreen.tsx
```
If any occurrences exist, apply the same replacements as Step 2. If none, no change needed.

- [ ] **Step 4: Typecheck**

Run: `make typecheck`
Expected: the only remaining errors are `RootStackParamList` route names (fixed in Task 13). If you are executing Tasks 8–13 as a group, continue; otherwise this task's own edits should introduce no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/context/UserProvider.tsx src/screens/UserPanelScreen.tsx src/screens/UserInfoScreen.tsx src/screens/AuthenticationScreen.tsx
git commit -m "refactor: consume active Authgear provider instead of ConfigProvider"
```

---

## Task 10: OIDC result screen

**Files:**
- Create: `src/screens/OIDCResultScreen.tsx`

**Interfaces:**
- Consumes: `useProviders()` (`providers`), route param `{ providerId: string }`, `engines/oidc.ts`, `util/jwt.ts`, `@react-native-clipboard/clipboard`.
- Produces: stack route `OIDCResult`.

- [ ] **Step 1: Implement the screen**

Create `src/screens/OIDCResultScreen.tsx`:

```tsx
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Card,
  Text,
  Divider,
  IconButton,
  MD2Theme,
  useTheme,
} from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useProviders } from '../context/ProvidersProvider';
import { isOIDCProvider, OIDCProvider } from '../providers/types';
import {
  oidcAuthorize,
  oidcRefresh,
  oidcEndSession,
  fetchUserInfo,
} from '../engines/oidc';
import { decodeJwt } from '../util/jwt';
import LoadingSpinner from '../LoadingSpinner';

interface TokenState {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  accessTokenExpirationDate: string;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16 },
  card: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  tokenLabel: { fontWeight: '700', marginTop: 8 },
  tokenValue: { flex: 1, fontFamily: 'Courier', fontSize: 12 },
  claim: { fontSize: 13, marginVertical: 2 },
  error: { marginBottom: 16 },
  loginButton: { marginBottom: 16 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'OIDCResult'>;

const OIDCResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme<MD2Theme>();
  const { providers } = useProviders();
  const provider = providers.find((p) => p.id === route.params.providerId);
  const oidcProvider: OIDCProvider | null =
    provider != null && isOIDCProvider(provider) ? provider : null;

  const [loading, setLoading] = useState<boolean>(false);
  const [tokens, setTokens] = useState<TokenState | null>(null);
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const claims = useMemo(() => {
    if (tokens == null) {
      return null;
    }
    return decodeJwt(tokens.idToken)?.payload ?? null;
  }, [tokens]);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setError(null);
      setLoading(true);
      try {
        await fn();
      } catch (e: any) {
        // A user-cancelled browser flow is not an error worth surfacing loudly.
        const message = String(e?.message ?? e);
        if (!/cancel/i.test(message)) {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const onLogin = useCallback(() => {
    if (oidcProvider == null) {
      return;
    }
    run(async () => {
      const result = await oidcAuthorize(oidcProvider);
      setTokens({
        accessToken: result.accessToken,
        idToken: result.idToken,
        refreshToken: result.refreshToken ?? '',
        accessTokenExpirationDate: result.accessTokenExpirationDate,
      });
      setUserInfo(null);
    });
  }, [oidcProvider, run]);

  const onRefresh = useCallback(() => {
    if (oidcProvider == null || tokens == null || tokens.refreshToken === '') {
      return;
    }
    run(async () => {
      const result = await oidcRefresh(oidcProvider, tokens.refreshToken);
      setTokens({
        accessToken: result.accessToken,
        idToken: result.idToken ?? tokens.idToken,
        refreshToken: result.refreshToken ?? tokens.refreshToken,
        accessTokenExpirationDate: result.accessTokenExpirationDate,
      });
    });
  }, [oidcProvider, tokens, run]);

  const onFetchUserInfo = useCallback(() => {
    if (oidcProvider == null || tokens == null) {
      return;
    }
    run(async () => {
      const info = await fetchUserInfo(oidcProvider, tokens.accessToken);
      setUserInfo(info);
    });
  }, [oidcProvider, tokens, run]);

  const onLogout = useCallback(() => {
    if (oidcProvider == null || tokens == null) {
      return;
    }
    run(async () => {
      await oidcEndSession(oidcProvider, tokens.idToken);
      setTokens(null);
      setUserInfo(null);
    });
  }, [oidcProvider, tokens, run]);

  const renderToken = (label: string, value: string) => (
    <View>
      <Text style={styles.tokenLabel}>{label}</Text>
      <View style={styles.row}>
        <Text style={styles.tokenValue} numberOfLines={3}>
          {value || '(none)'}
        </Text>
        {value ? (
          <IconButton
            icon="content-copy"
            size={18}
            onPress={() => Clipboard.setString(value)}
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={provider?.name ?? 'OIDC'} />
      </Appbar.Header>
      <LoadingSpinner loading={loading} />
      <ScrollView contentContainerStyle={styles.content}>
        {error != null ? (
          <Text style={{ ...styles.error, color: theme.colors.error }}>
            {error}
          </Text>
        ) : null}

        {tokens == null ? (
          <Button
            mode="contained"
            style={styles.loginButton}
            onPress={onLogin}
            disabled={oidcProvider == null}
          >
            Login
          </Button>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Title title="Tokens" />
              <Card.Content>
                {renderToken('Access token', tokens.accessToken)}
                {renderToken('ID token', tokens.idToken)}
                {renderToken('Refresh token', tokens.refreshToken)}
                <Text style={styles.tokenLabel}>Access token expires</Text>
                <Text style={styles.claim}>
                  {tokens.accessTokenExpirationDate}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="ID token claims (unverified)" />
              <Card.Content>
                {claims == null ? (
                  <Text style={styles.claim}>Could not decode ID token.</Text>
                ) : (
                  Object.entries(claims).map(([k, v]) => (
                    <Text key={k} style={styles.claim}>
                      {k}: {JSON.stringify(v)}
                    </Text>
                  ))
                )}
              </Card.Content>
            </Card>

            {userInfo != null ? (
              <Card style={styles.card}>
                <Card.Title title="UserInfo" />
                <Card.Content>
                  {Object.entries(userInfo).map(([k, v]) => (
                    <Text key={k} style={styles.claim}>
                      {k}: {JSON.stringify(v)}
                    </Text>
                  ))}
                </Card.Content>
              </Card>
            ) : null}

            <Button mode="outlined" style={styles.card} onPress={onFetchUserInfo}>
              Fetch userinfo
            </Button>
            <Button
              mode="outlined"
              style={styles.card}
              onPress={onRefresh}
              disabled={tokens.refreshToken === ''}
            >
              Refresh token
            </Button>
            <Divider />
            <Button mode="contained" style={styles.card} onPress={onLogout}>
              Logout
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OIDCResultScreen;
```

- [ ] **Step 2: Typecheck**

Run: `make typecheck`
Expected: only `RootStackParamList.OIDCResult` missing (fixed in Task 13).

- [ ] **Step 3: Commit**

```bash
git add src/screens/OIDCResultScreen.tsx
git commit -m "feat: add OIDC result screen with tokens, claims, and userinfo"
```

---

## Task 11: Add/Edit provider screen

**Files:**
- Create: `src/screens/AddEditProviderScreen.tsx`

**Interfaces:**
- Consumes: `useProviders()` (`providers`, `addOrUpdate`, `remove`), route param `{ providerId?: string }`, `util/id.ts`, `util/scopes.ts`, `engines/oidc.ts` (`OIDC_REDIRECT_URL`), `@react-native-clipboard/clipboard`.
- Produces: stack route `AddEditProvider`.

- [ ] **Step 1: Implement the screen**

Create `src/screens/AddEditProviderScreen.tsx`:

```tsx
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  TextInput,
  SegmentedButtons,
  Switch,
  Text,
  IconButton,
  MD2Theme,
  useTheme,
} from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useProviders } from '../context/ProvidersProvider';
import {
  AuthgearProvider,
  OIDCProvider,
  Provider,
  isAuthgearProvider,
  isOIDCProvider,
} from '../providers/types';
import { AUTHGEAR_DEMO_PROVIDER_ID } from '../providers/store';
import { randomId } from '../util/id';
import { parseScopes, serializeScopes } from '../util/scopes';
import { OIDC_REDIRECT_URL } from '../engines/oidc';
import ShowError from '../ShowError';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16 },
  field: { marginVertical: 8 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  redirectBox: { marginTop: 12, marginBottom: 4 },
  redirectRow: { flexDirection: 'row', alignItems: 'center' },
  redirectValue: { flex: 1, fontFamily: 'Courier', fontSize: 13 },
  hint: { fontSize: 12 },
  saveButton: { marginTop: 24 },
  deleteButton: { marginTop: 12 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditProvider'>;

const AddEditProviderScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme<MD2Theme>();
  const { providers, addOrUpdate, remove } = useProviders();

  const editingId = route.params?.providerId;
  const existing = useMemo(
    () => providers.find((p) => p.id === editingId),
    [providers, editingId]
  );
  const isDemo = editingId === AUTHGEAR_DEMO_PROVIDER_ID;

  const [kind, setKind] = useState<'authgear' | 'oidc'>(
    existing?.kind ?? 'oidc'
  );
  const [name, setName] = useState<string>(existing?.name ?? '');

  // Authgear fields
  const authgearExisting =
    existing != null && isAuthgearProvider(existing) ? existing : null;
  const [clientID, setClientID] = useState<string>(
    existing?.kind === 'oidc'
      ? existing.clientID
      : authgearExisting?.clientID ?? ''
  );
  const [endpoint, setEndpoint] = useState<string>(
    authgearExisting?.endpoint ?? ''
  );
  const [useTransient, setUseTransient] = useState<boolean>(
    authgearExisting?.useTransientTokenStorage ?? false
  );
  const [shareSSO, setShareSSO] = useState<boolean>(
    authgearExisting?.shareSessionWithSystemBrowser ?? false
  );
  const [useWebkit, setUseWebkit] = useState<boolean>(
    authgearExisting?.useWebkitWebView ?? false
  );
  const [allowPasscode, setAllowPasscode] = useState<boolean>(
    authgearExisting?.allowFallbackToPasscodeInBiometric ?? false
  );

  // OIDC fields
  const oidcExisting =
    existing != null && isOIDCProvider(existing) ? existing : null;
  const [issuer, setIssuer] = useState<string>(oidcExisting?.issuer ?? '');
  const [scopesText, setScopesText] = useState<string>(
    serializeScopes(oidcExisting?.scopes ?? ['openid', 'profile', 'email'])
  );

  const onSave = () => {
    const id = existing?.id ?? randomId();
    let provider: Provider;
    if (kind === 'authgear') {
      if (clientID.trim() === '' || endpoint.trim() === '') {
        ShowError(new Error('Client ID and endpoint are required.'));
        return;
      }
      const authgear: AuthgearProvider = {
        id,
        kind: 'authgear',
        name: name.trim() || 'Authgear',
        clientID: clientID.trim(),
        endpoint: endpoint.trim(),
        explicitColorScheme: authgearExisting?.explicitColorScheme ?? null,
        useTransientTokenStorage: useTransient,
        shareSessionWithSystemBrowser: shareSSO,
        useWebkitWebView: useWebkit,
        allowFallbackToPasscodeInBiometric: allowPasscode,
      };
      provider = authgear;
    } else {
      if (issuer.trim() === '' || clientID.trim() === '') {
        ShowError(new Error('Issuer and client ID are required.'));
        return;
      }
      const oidc: OIDCProvider = {
        id,
        kind: 'oidc',
        name: name.trim() || 'OIDC provider',
        issuer: issuer.trim(),
        clientID: clientID.trim(),
        scopes: parseScopes(scopesText),
      };
      provider = oidc;
    }
    addOrUpdate(provider)
      .then(() => navigation.goBack())
      .catch((e) => ShowError(e));
  };

  const onDelete = () => {
    if (editingId == null) {
      return;
    }
    remove(editingId)
      .then(() => navigation.goBack())
      .catch((e) => ShowError(e));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={existing ? 'Edit provider' : 'Add provider'} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        {!isDemo ? (
          <SegmentedButtons
            value={kind}
            onValueChange={(v) => setKind(v as 'authgear' | 'oidc')}
            buttons={[
              { value: 'oidc', label: 'Generic OIDC' },
              { value: 'authgear', label: 'Authgear' },
            ]}
          />
        ) : null}

        <TextInput
          style={styles.field}
          mode="outlined"
          label="Display name"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
        />

        {kind === 'authgear' ? (
          <>
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Client ID"
              value={clientID}
              onChangeText={setClientID}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Authgear Endpoint"
              value={endpoint}
              onChangeText={setEndpoint}
              autoCapitalize="none"
            />
            <View style={styles.toggleRow}>
              <Text>Transient token storage</Text>
              <Switch value={useTransient} onValueChange={setUseTransient} />
            </View>
            <View style={styles.toggleRow}>
              <Text>Share session with system browser</Text>
              <Switch value={shareSSO} onValueChange={setShareSSO} />
            </View>
            <View style={styles.toggleRow}>
              <Text>Use WebKit WebView</Text>
              <Switch value={useWebkit} onValueChange={setUseWebkit} />
            </View>
            <View style={styles.toggleRow}>
              <Text>Allow passcode fallback in biometric</Text>
              <Switch value={allowPasscode} onValueChange={setAllowPasscode} />
            </View>
          </>
        ) : (
          <>
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Issuer URL"
              value={issuer}
              onChangeText={setIssuer}
              autoCapitalize="none"
              placeholder="https://example.okta.com"
            />
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Client ID"
              value={clientID}
              onChangeText={setClientID}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Scopes (space separated)"
              value={scopesText}
              onChangeText={setScopesText}
              autoCapitalize="none"
            />
            <View style={styles.redirectBox}>
              <Text style={{ ...styles.hint, color: theme.colors.disabled }}>
                Register this redirect URI in your provider:
              </Text>
              <View style={styles.redirectRow}>
                <Text style={styles.redirectValue}>{OIDC_REDIRECT_URL}</Text>
                <IconButton
                  icon="content-copy"
                  size={18}
                  onPress={() => Clipboard.setString(OIDC_REDIRECT_URL)}
                />
              </View>
            </View>
          </>
        )}

        <Button mode="contained" style={styles.saveButton} onPress={onSave}>
          Save
        </Button>
        {existing != null && !isDemo ? (
          <Button
            mode="outlined"
            style={styles.deleteButton}
            textColor={theme.colors.error}
            onPress={onDelete}
          >
            Delete provider
          </Button>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddEditProviderScreen;
```

- [ ] **Step 2: Typecheck**

Run: `make typecheck`
Expected: only `RootStackParamList.AddEditProvider` missing (fixed in Task 13).

- [ ] **Step 3: Commit**

```bash
git add src/screens/AddEditProviderScreen.tsx
git commit -m "feat: add provider add/edit screen for Authgear and OIDC"
```

---

## Task 12: Provider list screen

**Files:**
- Create: `src/screens/ProviderListScreen.tsx`

**Interfaces:**
- Consumes: `useProviders()` (`providers`, `loading`), `providers/types.ts`, `providers/store.ts` (`AUTHGEAR_DEMO_PROVIDER_ID`).
- Produces: stack route `ProviderList` (initial route).

- [ ] **Step 1: Implement the screen**

Create `src/screens/ProviderListScreen.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, List, Button, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useProviders } from '../context/ProvidersProvider';
import { isAuthgearProvider, Provider } from '../providers/types';
import { AUTHGEAR_DEMO_PROVIDER_ID } from '../providers/store';
import LoadingSpinner from '../LoadingSpinner';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { flex: 1 },
  addButton: { margin: 16 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderList'>;

const ProviderListScreen: React.FC<Props> = ({ navigation }) => {
  const { providers, loading } = useProviders();

  const openProvider = (p: Provider) => {
    if (isAuthgearProvider(p)) {
      navigation.navigate('AuthgearLogin', { providerId: p.id });
    } else {
      navigation.navigate('OIDCResult', { providerId: p.id });
    }
  };

  const editProvider = (p: Provider) => {
    navigation.navigate('AddEditProvider', { providerId: p.id });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title="Authgear Tools" />
      </Appbar.Header>
      <LoadingSpinner loading={loading} />
      <View style={styles.list}>
        {providers.map((p) => (
          <React.Fragment key={p.id}>
            <List.Item
              title={p.name}
              description={
                isAuthgearProvider(p) ? p.endpoint : p.issuer
              }
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={
                    p.id === AUTHGEAR_DEMO_PROVIDER_ID
                      ? 'star'
                      : isAuthgearProvider(p)
                      ? 'shield-account'
                      : 'key-variant'
                  }
                />
              )}
              right={(props) => (
                <List.Icon {...props} icon="pencil" />
              )}
              onPress={() => openProvider(p)}
              onLongPress={() => editProvider(p)}
            />
            <Divider />
          </React.Fragment>
        ))}
      </View>
      <Button
        mode="contained"
        style={styles.addButton}
        icon="plus"
        onPress={() => navigation.navigate('AddEditProvider', {})}
      >
        Add provider
      </Button>
    </SafeAreaView>
  );
};

export default ProviderListScreen;
```

> Note: the right-hand pencil icon and long-press both open edit; tapping the row runs the flow. This is intentional redundancy for discoverability.

- [ ] **Step 2: Typecheck**

Run: `make typecheck`
Expected: only `RootStackParamList` route names missing (fixed in Task 13).

- [ ] **Step 3: Commit**

```bash
git add src/screens/ProviderListScreen.tsx
git commit -m "feat: add provider list home screen"
```

---

## Task 13: Wire navigation, swap providers, delete ConfigProvider

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/context/ConfigProvider.tsx`

**Interfaces:**
- Consumes: all screens and `ProvidersProvider`.
- Produces: final `RootStackParamList` and app tree.

- [ ] **Step 1: Update RootStackParamList and imports in App.tsx**

In `src/App.tsx`, replace the screen imports and `RootStackParamList` and the provider tree. Set imports:

```tsx
import ProviderListScreen from './screens/ProviderListScreen';
import AddEditProviderScreen from './screens/AddEditProviderScreen';
import AuthenticationScreen from './screens/AuthenticationScreen';
import OIDCResultScreen from './screens/OIDCResultScreen';
import UserPanelScreen from './screens/UserPanelScreen';
import UserInfoScreen from './screens/UserInfoScreen';
import ProvidersProvider from './context/ProvidersProvider';
import UserProvider from './context/UserProvider';
```

Remove the `ConfigProvider` import.

Set the param list:

```tsx
export type RootStackParamList = {
  ProviderList: undefined;
  AddEditProvider: { providerId?: string } | undefined;
  AuthgearLogin: { providerId: string };
  OIDCResult: { providerId: string };
  UserPanel: { userInfo: UserInfo | null } | undefined;
  UserInfo: { userInfo: UserInfo | null } | undefined;
};
```

- [ ] **Step 2: Update the navigator and provider tree in App.tsx**

Replace the returned tree's providers and `Stack.Navigator`:

```tsx
  return (
    <ProvidersProvider>
      <UserProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer theme={theme}>
            <Stack.Navigator
              initialRouteName="ProviderList"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="ProviderList" component={ProviderListScreen} />
              <Stack.Screen
                name="AddEditProvider"
                component={AddEditProviderScreen}
              />
              <Stack.Screen name="AuthgearLogin" component={AuthenticationScreen} />
              <Stack.Screen name="OIDCResult" component={OIDCResultScreen} />
              <Stack.Screen name="UserPanel" component={UserPanelScreen} />
              <Stack.Screen name="UserInfo" component={UserInfoScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </UserProvider>
    </ProvidersProvider>
  );
```

Keep `getBiometricOptions`, `redirectURI`, `wechatRedirectURI`, and the theme definitions unchanged.

- [ ] **Step 3: Delete ConfigProvider and confirm nothing imports it**

Run:
```bash
git rm src/context/ConfigProvider.tsx
grep -rn "ConfigProvider\|useConfig" src || echo "no references remaining"
```
Expected: `no references remaining`.

- [ ] **Step 4: Full green gate**

Run:
```bash
make typecheck && make lint && make check-format && make test
```
Expected: all pass. If `check-format` complains, run `make format` and re-run.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire provider-list navigation and remove ConfigProvider"
```

- [ ] **Step 6: Manual device test plan**

Build and run on iOS and Android (`npm run ios`, `npm run android`). Verify:

1. **Fresh install** opens on the provider list with a pinned **⭐ Authgear (demo)** entry — no configuration prompt.
2. **Authgear demo → Continue as guest** → UserPanel loads; user info, promote, reauth, and biometric enable/disable behave as before.
3. **Add provider (OIDC)** with a real issuer (e.g. an Okta/Auth0/Keycloak dev tenant) after registering `authgear-oidc-tester://callback` there → **Login** completes → access/ID/refresh tokens and decoded ID-token claims render → **Fetch userinfo** shows claims → **Refresh token** succeeds → **Logout** clears the session.
4. **Cancel** the browser mid-login → returns to the OIDC screen with no error dialog.
5. **Migration**: if a previous build's `config` existed, it appears as the demo provider and the login still works.

- [ ] **Step 7: Documentation note**

Append a short section to `CLAUDE.md` under architecture describing the provider list + two engines, and update `README.md`'s intro to describe the app as an OIDC integration tester. Commit:

```bash
git add CLAUDE.md README.md
git commit -m "docs: describe OIDC integration tester architecture"
```

---

## Self-Review

- **Spec coverage:** provider list (Task 12), Add/Edit with type toggle + copyable redirect (Task 11), OIDC discovery/PKCE/tokens/claims/userinfo/refresh/logout (Tasks 7, 10), Authgear engine + showcase preserved (Tasks 6, 8, 9), persistence + seeding + migration (Tasks 4, 5), in-memory-only OIDC tokens (Task 10 — state only, never persisted), dedicated redirect scheme with Authgear keeping its own (Tasks 1, 7), error handling (Task 10 `run` wrapper; form validation Task 11), tests for pure logic (Tasks 2–4), PR relationship + manual test (Task 13). All spec sections map to tasks.
- **Placeholder scan:** no TBD/TODO; all code steps include full code.
- **Type consistency:** `Provider`/`AuthgearProvider`/`OIDCProvider`, guards `isAuthgearProvider`/`isOIDCProvider`, `useProviders()` shape, `configureAuthgear`, `oidcAuthorize/oidcRefresh/oidcEndSession/fetchUserInfo`, `decodeJwt`, `parseScopes/serializeScopes`, `randomId`, `AUTHGEAR_DEMO_PROVIDER_ID`, `OIDC_REDIRECT_URL`, and the `RootStackParamList` route names are used consistently across tasks.

Out of scope (per spec): manual endpoint entry, client-secret support, token persistence across restarts, unifying redirect URIs.
