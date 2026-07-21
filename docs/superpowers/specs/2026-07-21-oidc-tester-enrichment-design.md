# OIDC Tester Enrichment — Design

**Date:** 2026-07-21
**Status:** Approved (brainstorming), pending spec review
**Repo:** authgear/authgear-demo-app-rn
**Builds on:** the OIDC integration tester (docs/superpowers/specs/2026-07-21-oidc-tester-design.md)

## Problem & goal

The app is now an OIDC integration tester with a provider list (a pinned Authgear
"default" provider plus user-added generic OIDC providers). To make it read as a
complete, general-purpose developer utility (App Store Guideline 2.2 "not a demo/trial"
and 4.2 "minimum functionality") — and to be genuinely more useful — we add depth and
productization:

1. **Preset providers** — one-tap templates so it's obviously a general OIDC tool, not an
   Authgear-only app.
2. **Discovery document viewer** — inspect a provider's `/.well-known/openid-configuration`.
3. **Rich token view** — decode ID and access tokens with human-readable timestamps and a
   validity indicator.
4. **JWKS signature verification** — actually verify the ID token signature (a real
   validator, not just a decoder).
5. **About + Privacy screen** — explain what the app is and how it handles data.

Features 1–4 apply to **generic OIDC providers** (the Authgear SDK abstracts tokens and
discovery away; the Authgear side keeps its existing User Panel). Feature 5 is global.

## Constraints (carried from the base feature)

- OIDC tokens are held in memory only; never persisted.
- Generic OIDC redirect URI is exactly `authgear-oidc-tester://callback`.
- No "Demo/Trial/Sample" in user-facing strings.
- New crypto capability is pure-JS (`jsrsasign`) — no native pod/gradle changes.

## Feature 1 — Preset providers

`src/providers/presets.ts` exports a static list:

```ts
export interface ProviderPreset {
  key: string;              // 'google' | 'entra' | 'okta' | 'auth0' | 'keycloak'
  label: string;            // display label for the chip
  issuerTemplate: string;   // fixed issuer, or contains {placeholder} tokens
  issuerPlaceholder?: string; // hint shown to the user, when templated
  defaultScopes: string[];  // e.g. ['openid', 'profile', 'email']
}
```

Presets:
- Google — issuer `https://accounts.google.com` (fixed); scopes `openid email profile`.
- Microsoft Entra — issuer `https://login.microsoftonline.com/{tenant}/v2.0`.
- Okta — issuer `https://{your-domain}.okta.com`.
- Auth0 — issuer `https://{tenant}.auth0.com`.
- Keycloak — issuer `https://{host}/realms/{realm}`.

UX: on `AddEditProviderScreen`, when creating a **new** OIDC provider (not editing), a
horizontal row of preset chips appears at the top of the OIDC tab. Tapping a preset fills
`issuer` (from `issuerTemplate`), `scopes` (from `defaultScopes`), and a suggested display
name (the preset label). The user completes the client ID and replaces any `{placeholder}`
in the issuer. Presets never include a client ID (each user registers their own app with
the provider). Editing an existing provider does not show presets.

## Feature 2 — Discovery document viewer

- `src/engines/oidc.ts`: extract a shared `getDiscovery(issuer: string): Promise<Record<string, unknown>>`
  (GET `<issuer without trailing slash>/.well-known/openid-configuration`, throw with a
  clear message on non-OK). Refactor the existing inline discovery fetch inside
  `fetchUserInfo` to call `getDiscovery`. Add `fetchDiscovery(provider: OIDCProvider)`.
- `src/screens/OIDCDiscoveryScreen.tsx` (route `OIDCDiscovery { providerId }`): fetches and
  displays the discovery document. Highlights key fields when present (`issuer`,
  `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, `jwks_uri`,
  `end_session_endpoint`, `scopes_supported`, `response_types_supported`,
  `id_token_signing_alg_values_supported`), then shows the full JSON (copyable). Works
  before login (discovery is public). Reached from a "Discovery" button on `OIDCResultScreen`.

## Feature 3 — Rich token view

- `src/util/claims.ts` (pure, tested):
  - `isJwt(token: string): boolean` — 3 dot-separated segments whose first two base64url-decode
    to JSON.
  - `formatClaimTimestamp(epochSeconds: number, now: number): string` — absolute local
    datetime plus relative phrase ("expires in 59m" / "expired 2m ago"). `now` is passed in
    (millis) so it is testable.
  - `tokenValidity(payload: Record<string, unknown>, now: number): 'valid' | 'expired' | 'unknown'`
    — from `exp` (and `nbf` if present).
- `OIDCResultScreen` enhancements:
  - Decode the ID token (as today) AND the access token when `isJwt(accessToken)`; otherwise
    label it an opaque access token.
  - For `exp`/`iat`/`nbf`/`auth_time` claims, render the raw value and `formatClaimTimestamp`.
  - A validity chip driven by `tokenValidity` on the ID token.
  - Component reads `Date.now()` for the current time (allowed in app code).

## Feature 4 — JWKS signature verification

- Dependency: add `jsrsasign` and dev `@types/jsrsasign`. Pure JS; no native changes.
- `src/engines/jwks.ts`:
  - `verifyIdTokenSignature(idToken: string, issuer: string): Promise<{ verified: boolean; alg?: string; kid?: string; error?: string }>`
  - Flow: parse the JWT header (via `decodeJwt`) for `kid`/`alg` → `getDiscovery(issuer)` →
    fetch `jwks_uri` → select the JWK whose `kid` matches → build a key with
    `jsrsasign` (`KEYUTIL.getKey(jwk)`) → verify with `KJUR.jws.JWS.verify(idToken, key, [alg])`.
    Return a structured result; never throw for a normal "invalid signature" — only set
    `error` for operational failures (no matching kid, JWKS fetch failed, unsupported alg).
- `OIDCResultScreen`: a "Verify signature" button on the ID-token card → shows
  `✓ Signature valid (RS256, kid=…)`, `✗ Signature invalid`, or the error message.
- Testing: a genuine Jest unit test — generate a test RSA keypair with `jsrsasign`, sign a
  JWT, provide the matching JWK, assert `verified: true`; tamper the token → `verified: false`;
  wrong/missing kid → `error`. (jsrsasign runs in Node.)

## Feature 5 — About + Privacy screen

- `src/screens/AboutScreen.tsx` (route `About`):
  - **What it is** — "An OIDC/OAuth integration tester. Add any OIDC provider, run the
    sign-in flow, and inspect the resulting tokens, claims, and discovery metadata."
  - **How it works** — three short steps (add a provider → run login → inspect
    tokens/claims/discovery/signature).
  - **Privacy & data handling** — "Provider configurations are stored locally on your
    device. Tokens obtained while testing are kept in memory only and are never persisted or
    sent anywhere except the OIDC provider you configure. The app has no backend and collects
    no analytics."
  - **Version** — from `app.json`.
  - **Links** — Authgear docs and the OpenID Connect spec, via `Linking.openURL`.
- Reached via an ⓘ `Appbar.Action` on the `ProviderList` header.

## Navigation & dependency summary

- `RootStackParamList` gains: `About: undefined`, `OIDCDiscovery: { providerId: string }`.
  Both registered in `App.tsx`.
- New dependency: `jsrsasign` (+ dev `@types/jsrsasign`).

## Decomposition (plan slices)

One spec; the implementation plan slices into five independent, testable deliverables:

1. Presets — `presets.ts` + chips on the add form.
2. Discovery — `getDiscovery` refactor + `fetchDiscovery` + `OIDCDiscoveryScreen` + nav.
3. Rich token view — `claims.ts` (TDD) + `OIDCResultScreen` enhancements.
4. JWKS verify — `jsrsasign` dep + `jwks.ts` (TDD) + verify button.
5. About/Privacy — `AboutScreen` + info action + nav.

## Testing

Pure logic gets real TDD: `claims.ts` (`isJwt`, `formatClaimTimestamp`, `tokenValidity`),
and `jwks.ts` verification with a generated-keypair fixture. Screen/engine wiring is gated
on typecheck/lint/format/test plus a manual device pass (add a preset provider, view its
discovery doc, log in, inspect decoded ID + access tokens with readable timestamps, verify
the signature, open About).

## Out of scope (YAGNI, revisitable)

Token introspection (RFC 7662), raw request/response network log, manual endpoints /
client-secret, provider import/export & QR, a settings screen.

## Housekeeping

Remove the temporary DEV warning-interceptor from `index.js` before opening any PR.

## App Store action items (outside the repo)

- Host a privacy policy URL and add it in App Store Connect (Apple requires one); the in-app
  About screen carries the same text.
- Update Guideline 2.3.3 screenshots to include the discovery viewer and a decoded-token-
  with-verified-signature screen.
