# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A React Native (0.80.2, React 19, TypeScript) demo app that exercises the `@authgear/react-native` SDK. Its purpose is to demonstrate SDK features (login/logout, biometric auth, token storage modes, SSO, WeChat, WebView UI implementation), not to be a production app. The default config points at a public demo project (`https://demo-app.authgear.cloud`).

## Commands

The `Makefile` is the source of truth for CI checks — mirror it locally:

```bash
make npm-ci        # npm ci (clean install)
make typecheck     # tsc --noEmit
make check-format  # prettier --check on src/**
make format        # prettier --write on src/**
make lint          # eslint on .js,.jsx,.ts,.tsx
make test          # jest
```

Run a single test: `npx jest src/placeholder.test.ts` (or `-t "<name>"` to filter by test name).

Running the app:

```bash
npm start                          # Metro bundler
npm run ios                        # build & run iOS (needs `cd ios && bundle exec pod install` first)
npm run android                    # build & run Android
```

Toolchain versions are pinned in `.tool-versions` (Node 20.19.5, Ruby 3.3.7); `flake.nix` provisions Node/Ruby/Yarn but deliberately excludes the compiler so the Xcode-provided clang is used for iOS builds. CocoaPods and Fastlane run via Bundler (`bundle exec pod install`, `bundle exec fastlane ...`).

## Architecture

The app centers on the **`authgear` default container singleton** imported from `@authgear/react-native`. There is one shared instance; the two React context providers wrap it and expose its state to screens.

- **`ConfigProvider`** (`src/context/ConfigProvider.tsx`) owns the `Config` object (client ID, endpoint, token-storage mode, SSO, WebView UI, biometric passcode fallback). On every config change it calls `authgear.configure(...)` and persists the config to `AsyncStorage`; on mount it rehydrates from `AsyncStorage`. Switching endpoints/token-storage re-configures the singleton. Read config via `useConfig()`.
- **`UserProvider`** (`src/context/UserProvider.tsx`) tracks `sessionState` and `isBiometricEnabled`. It registers `authgear.delegate.onSessionStateChange` so session changes propagate into React state, and its `updateState(container)` is called after auth actions to refresh. Read via `useUser()`.
- **`src/App.tsx`** wires the providers and a native-stack navigator (`Authentication` → `Configuration` / `UserPanel` / `UserInfo`; routes typed by `RootStackParamList`). It also holds app-wide constants and helpers that screens import directly: `redirectURI`, `wechatRedirectURI` (platform-selected), and **`getBiometricOptions(...)`** — the single place that maps the "enable biometric" and "allow passcode fallback" intents to platform-specific iOS `BiometricAccessConstraintIOS`/`BiometricLAPolicy` and Android authenticator flags. Change biometric behavior here, not in screens.

Screens (`src/screens/`) call SDK methods on the `authgear` singleton directly (e.g. `authgear.authenticate`, `authgear.logout`, biometric enable/disable, `Page` open), then call `useUser().updateState(...)`. Errors are surfaced through `src/ShowError.tsx`.

### Things that will bite you

- **Container name per install** — `ConfigProvider` generates a random 44-char container name stored in `AsyncStorage` and assigns `authgear.name` before configuring. This is a deliberate workaround (issue #31): the anonymous-user key is tied to the container name, so a fixed name across endpoints causes invalid-credentials errors. Don't "simplify" this away.
- **Theming is MD2** — uses `react-native-paper`'s `MD2LightTheme`/`MD2DarkTheme` merged with React Navigation themes, with custom color keys (`background`, `shadedBackground`). Screens type the theme as `MD2Theme` via `useTheme<MD2Theme>()`. Stay on MD2 APIs.
- **Native redirect URIs** — `redirectURI` (`com.authgear.example.rn://host/path`) and the WeChat URIs must stay in sync with the native iOS/Android URL scheme configuration.

## CI / deploy

`.github/workflows/ci.yaml`: the `test` job runs the Makefile checks on every push/PR. iOS (Fastlane → TestFlight) and Android (Fastlane → Play Store) build jobs run only on the `authgear/authgear-demo-app-rn` repo. Store uploads are gated on the default branch. Fastlane lanes live in `fastlane/Fastfile` (`ios_build_app`, `ios_upload_app`, `build_aab`, `upload_aab`); build/version numbers are passed in as `date +%s`.

Note: some workflow conditions still reference `refs/heads/master`; the default branch is now `main`, so those upload gates need updating to fire on `main`.
