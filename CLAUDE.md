# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A React Native demo app that exercises the `@authgear/react-native` SDK. Its purpose is to demonstrate SDK features (login/logout, biometric auth, token storage modes, SSO, WeChat, UI implementation choices), not to be a production app. The default provider points at a public demo project.

## Commands

The `Makefile` is the source of truth for CI checks (`npm-ci`, `typecheck`, `check-format`, `format`, `lint`, `test`) — mirror it locally.

Run a single test: `npx jest src/placeholder.test.ts` (or `-t "<name>"` to filter by test name).

Toolchain versions are pinned in `.tool-versions`; `flake.nix` provisions Node/Ruby/Yarn but deliberately excludes the compiler so the Xcode-provided clang is used for iOS builds. CocoaPods and Fastlane run via Bundler (`cd ios && bundle exec pod install`, `bundle exec fastlane ...`).

## Architecture

The app centers on the **`authgear` default container singleton** from `@authgear/react-native`. `ProvidersProvider` (`src/context/ProvidersProvider.tsx`) owns the persisted provider list (`providers.v1` in AsyncStorage, normalized through `src/providers/migration.ts` on load) and calls `configureAuthgear` (`src/engines/authgear.ts`) when a provider is activated. Screens call SDK methods on the singleton directly and refresh session state via `useUser()`.

### Things that will bite you

- **Container name per install** — `src/engines/authgear.ts` generates a random 44-char container name stored in AsyncStorage and assigns `authgear.name` before configuring. This is a deliberate workaround (issue #31): the anonymous-user key is tied to the container name, so a fixed name across endpoints causes invalid-credentials errors. Don't "simplify" this away.
- **Theming is MD2** — react-native-paper's `MD2LightTheme`/`MD2DarkTheme` with custom color keys (`background`, `shadedBackground`); screens type the theme via `useTheme<MD2Theme>()`. Stay on MD2 APIs.
- **Paper dialogs are broken on this RN version** — react-native-paper's Portal'd `Modal`/`Dialog` renders its backdrop and content as a stacked column on the RN 0.86 new architecture. Use `src/AppDialog.tsx` (native Modal) for dialogs instead of `<Portal><Dialog>`.
- **Native redirect URIs** — `redirectURI` (`com.authgear.example.rn://host/path`) and the WeChat URIs in `src/App.tsx` must stay in sync with the native iOS/Android URL scheme configuration.

## CI / deploy

`.github/workflows/ci.yaml`: the `test` job runs the Makefile checks on every push/PR; iOS (Fastlane → TestFlight) and Android (Fastlane → Play Store) build jobs run only on the `authgear/authgear-demo-app-rn` repo, with store uploads gated on the default branch. Build/version numbers are passed as `date +%s`, but App Store uploads also require `MARKETING_VERSION` (in `ios/AuthgearDemoAppRN.xcodeproj/project.pbxproj`, plus Android `versionName` for symmetry) to be bumped above the last approved release, or the upload fails with error 90062.
