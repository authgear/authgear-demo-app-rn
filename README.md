# Authgear React Native Demo App

This app demonstrates the features supported by the [`@authgear/react-native`](https://www.npmjs.com/package/@authgear/react-native) SDK — including login/logout, biometric authentication, token storage modes, SSO, WeChat login, and the WebView UI implementation.

The app ships pre-configured against a public demo project (`https://demo-app.authgear.cloud`). You can point it at your own Authgear project at runtime from the in-app **Configuration** screen (client ID, endpoint, token storage, and related options).

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
