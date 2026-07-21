# Authgear Tools — OIDC/OAuth Integration Tester

This app is an OIDC/OAuth integration tester built on React Native. It presents a list of
providers — a pinned Authgear provider showcasing the [`@authgear/react-native`](https://www.npmjs.com/package/@authgear/react-native)
SDK, plus any generic OIDC providers you add — so you can exercise the full authorization
code flow (login, tokens, decoded ID-token claims, userinfo, discovery, JWKS signature
verification, refresh, and logout) against your own OIDC-compliant identity provider.

It ships with a ready-to-use Authgear provider. Add your own from the **Add provider** screen —
start from a preset (Google, Microsoft Entra, Okta, Auth0, Keycloak) or enter an issuer and
client ID. Tokens obtained while testing are kept in memory only.

## Prerequisites

- Set up your machine for React Native development. See the official guide: [https://reactnative.dev/docs/environment-setup](https://reactnative.dev/docs/environment-setup)
- Node.js and Ruby, at the versions pinned in [`.tool-versions`](./.tool-versions) (Node 20.19.5, Ruby 3.3.7). Ruby is required for CocoaPods and Fastlane.

## Initial setup

### Install dependencies

```bash
# In root of React Native demo app
npm ci
bundle install   # Ruby gems (CocoaPods, Fastlane), used for iOS builds
```

### Start Metro server

```bash
# In root of React Native demo app
npm start
```

## Build Android app

1. By command line

    ```bash
    # In root of React Native demo app
    npm run android
    ```

2. By Android Studio

    i. Open the `android` folder using Android Studio

    ii. Select device to build the app on

    iii. Click the `Run` button (play button)

## Build iOS app

1. Install CocoaPods dependencies

    ```bash
    # In root of React Native demo app
    cd ios && bundle exec pod install && cd ..
    ```

    NOTE: make sure you have enabled the Xcode command line tools (Xcode → Settings → Locations → Command Line Tools)

2. Build by command line

    ```bash
    # In root of React Native demo app
    npm run ios
    ```

3. Build by Xcode

    i. Configure `Signing & Capabilities` in Xcode for signing the app

    ii. Click the `Build` button in Xcode (play button)

## Code quality checks

These are the checks run in CI (see the [`Makefile`](./Makefile)):

```bash
make typecheck      # tsc --noEmit
make check-format   # prettier --check
make lint           # eslint
make test           # jest
```

Run `make format` to auto-format sources with Prettier.

## Roadmap

Candidate features, not yet implemented:

- Manual endpoints & client-secret support for providers without a discovery document.
- Token introspection (RFC 7662) and a raw request/response log for the auth flow.
- Extra authorization parameters (`prompt`, `login_hint`, `acr_values`) and PKCE-method display.
- Provider import/export (JSON or QR) to share configurations across a team.
- A settings screen (theme, default scopes, clear all data).
- Explicit OAuth error surfacing (`error` / `error_description`).
