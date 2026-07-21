# OIDC Integration Tester — Design

**Date:** 2026-07-21
**Status:** Approved (brainstorming), pending spec review
**Repo:** authgear/authgear-demo-app-rn

## Problem & goal

The app was rejected from the App Store under Guideline 2.2 (Beta Testing) because it
reads as a demo/trial/configuration tool. We want an app that:

1. Is a **genuine, complete developer utility** — an OIDC/OAuth *integration tester* —
   so the configuration UI becomes the product's core feature rather than a red flag.
2. Still **showcases Authgear in action** (guest login, biometric, promote, reauth,
   user settings) for sales and developers.
3. Can be distributed **unlisted** (public but unsearchable App Store link) so sales and
   developers can install it via a link without TestFlight's expiry and tester caps.

The app therefore supports **two kinds of connection in one unified list**:

- **Authgear providers** — driven by `@authgear/react-native`, retaining the full
  Authgear showcase flow.
- **Generic OIDC providers** — driven by `react-native-app-auth`, letting anyone test
  their own OIDC provider (Okta, Auth0, Keycloak, Entra, …).

## Chosen approach

Approach A: a provider-list home with two engines behind shared screens. This preserves
the Authgear showcase while making generic OIDC a first-class, standards-based feature.

## Navigation & screens

Root stack (`RootStackParamList`):

- **`ProviderList`** *(initial)* — home. A list of saved connections. A pinned,
  non-deletable **⭐ Authgear (demo)** entry sits on top; user-added providers follow.
  A **+ Add provider** action at the bottom. Tapping an entry launches its flow; an
  edit affordance (swipe or long-press) opens `AddEditProvider` for user providers.
- **`AddEditProvider { providerId?: string }`** — create/edit form with a
  **type toggle (Authgear | Generic OIDC)** that swaps the field set.
- **`AuthgearLogin { providerId }`** — the existing `AuthenticationScreen` UI
  (Signup / Login / Continue as guest / Login with biometric), minus the forced-config
  redirect. Reached by tapping an Authgear provider.
- **`UserPanel { userInfo }` / `UserInfo { userInfo }`** — unchanged Authgear showcase.
- **`OIDCResult { providerId }`** — new. A Login button runs the OIDC flow, then shows
  tokens, decoded ID-token claims, and userinfo, with Refresh / Logout / Copy actions.

The Authgear branch keeps its own rich `AuthgearLogin → UserPanel` flow; the OIDC branch
is a parallel, simpler flow. Both launch from the one unified list.

## Data model (`src/providers/types.ts`)

```ts
type BaseProvider = { id: string; kind: 'authgear' | 'oidc'; name: string };

type AuthgearProvider = BaseProvider & {
  kind: 'authgear';
  clientID: string;
  endpoint: string;
  explicitColorScheme: ColorScheme | null;
  useTransientTokenStorage: boolean;
  shareSessionWithSystemBrowser: boolean;
  useWebkitWebView: boolean;
  allowFallbackToPasscodeInBiometric: boolean;
};

type OIDCProvider = BaseProvider & {
  kind: 'oidc';
  issuer: string;        // used for discovery: <issuer>/.well-known/openid-configuration
  clientID: string;
  scopes: string[];      // default ['openid', 'profile', 'email']; always includes 'openid'
};

type Provider = AuthgearProvider | OIDCProvider;
```

## Persistence & seeding (`ProvidersProvider` replaces `ConfigProvider`)

- The provider **list** persists under AsyncStorage key `providers.v1`.
- **First launch:** seed the pinned Authgear demo provider from the current bundled
  defaults (`clientID: e6b2f5bad8546ee3`, `endpoint: https://demo-app.authgear.cloud`).
- **Migration:** if the legacy single `config` key exists, convert it to an Authgear
  provider and remove the old key.
- **Result:** the zero-setup Authgear demo is always present — an App Store reviewer can
  tap it and use guest login with no configuration.
- The distinct-container-name-per-install workaround (issue #31) is preserved and applied
  when activating an Authgear provider.

## Engine modules (thin, testable boundaries)

- **`src/engines/authgear.ts`** — `configureAuthgear(p: AuthgearProvider): Promise<void>`
  wraps `authgear.name = <distinct-name>` + `authgear.configure(...)` (token storage, SSO,
  WebView UI as today). The existing `UserProvider` (session state via
  `authgear.delegate.onSessionStateChange`) stays, keyed to the active Authgear provider.
  Authgear continues to use its existing redirect URI `com.authgear.example.rn://host/path`.
- **`src/engines/oidc.ts`** — wraps `react-native-app-auth`:
  - `authorize(p: OIDCProvider)` — discovery from `issuer` + Authorization Code + PKCE.
  - `refresh(p, refreshToken)`
  - `endSession(p, idToken)`
  - `fetchUserInfo(p, accessToken)` — GET the discovered `userinfo_endpoint`.
  - `decodeJwt(token)` — pure base64url payload decode for the claims table
    (display only; signature is **not** verified — labeled as such in the UI).

## OIDC session/token handling

- Token results are held **in memory for the session only — never persisted at rest.**
  It is a testing tool handling live credentials; not persisting keeps the review posture
  clean and is safer by default.
- Provider **configs** persist; **tokens** do not survive an app restart.
- Refresh / logout operate on the in-memory result.

## Library & native configuration

- Add dependency **`react-native-app-auth`** (standard AppAuth wrapper: discovery, PKCE,
  refresh, end-session).
- **iOS:** `cd ios && bundle exec pod install`; register the callback scheme in
  `Info.plist` `CFBundleURLTypes`.
- **Android:** add `appAuthRedirectScheme` to `defaultConfig.manifestPlaceholders` in
  `android/app/build.gradle` (AppAuth's `RedirectUriReceiverActivity` reads it).
- **Redirect URI:** `authgear-oidc-tester://callback`, shown with a Copy button on the
  OIDC add form, alongside a one-line "register this redirect URI in your provider" hint.

### Redirect URI caveat

Reusing the new scheme for the **Authgear** demo would require adding it to the Authgear
demo project's server-side redirect-URI allowlist, which we may not control. To avoid
breaking the working demo, **Authgear keeps its existing
`com.authgear.example.rn://host/path` redirect**, and the new
`authgear-oidc-tester://callback` scheme is used only for generic OIDC. Both schemes are
registered natively. Unifying them is a possible follow-up if the demo project's allowlist
can be edited — not a blocker.

## Error handling

- **Discovery failure** (bad issuer / missing `.well-known`) → inline error on the OIDC
  flow screen; no crash.
- **User cancels** the browser auth → AppAuth's cancellation error is caught and the user
  returns quietly to the provider screen.
- **Refresh / userinfo / network errors** → inline message on `OIDCResult`.
- **Form validation** → issuer and client ID required; scopes always coerced to include
  `openid`.
- **Authgear branch** → keeps the existing `ShowError` modal pattern unchanged.

## Testing

Native auth flows cannot be meaningfully unit-tested under Jest, so logic is kept out of
them in pure, tested helpers:

- `decodeJwt` — base64url payload decode; handles malformed tokens.
- Provider serialization + legacy `config` → Authgear-provider migration.
- Scopes parsing — space-separated string ↔ array, dedup, force `openid`.

Plus a **manual device test plan**:

1. Authgear demo → Continue as guest → UserPanel loads; user info, promote, reauth,
   biometric enable/disable work.
2. Add an Okta/Keycloak/Auth0 provider → Login → tokens + decoded claims + userinfo shown
   → Refresh succeeds → Logout ends the session.

## Relationship to PR #40 and distribution

- PR #40 is scoped to the **rename** (Demo → "Authgear Tools" / "Authgear") only; its
  earlier hide-config commit has been removed, because this direction re-exposes
  configuration as a legitimate first-class feature.
- This work lands as a **new PR** built on top of the rename.
- App Store framing: an **OIDC/OAuth integration tester** (a genuine developer utility),
  distributed **unlisted**. Guideline 2.3.3 screenshots should show the provider list, an
  OIDC login result with decoded claims, and the Authgear UserPanel — an App Store Connect
  action, not code.

## Out of scope (YAGNI)

- Manual endpoint entry / client-secret support for providers without a discovery document
  (can be added later if a target provider needs it).
- Persisting OIDC tokens across app restarts.
- Unifying the Authgear and generic redirect URIs.
