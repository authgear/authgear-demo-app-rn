# Authgear React Native Demo App

This app is an OIDC/OAuth integration tester built on React Native. It presents a list of
providers — a pinned Authgear demo provider showcasing the `@authgear/react-native` SDK,
plus any generic OIDC providers you add — so you can exercise the full authorization code
flow (login, tokens, ID-token claims, userinfo, refresh, and logout) against your own
OIDC-compliant identity provider.

# Initial setup

## Environment Setup

Please read the environment setup guildlines by the official react-native team

See [https://reactnative.dev/docs/environment-setup](https://reactnative.dev/docs/environment-setup)

## Install dependencies

```bash
# In root of React Native demo app
npm ci
```

## Start Metro server

```bash
# In root of React Native demo app
npm start
```

## Build Android app

1. By command line
    
    ```bash
    # In root of React Native demo app
    npm run  android
    ```

2. By Android Studio

    i. Open the `android` folder using Android Studio

    ii. Select device to build the app on

    iii. Click the `Run` button (play button)

## Build IOS App

1. Install CocoaPods dependencies

    ```bash
    # In root of React Native demo app
    cd ios && pod install && cd ..
    ```

    NOTE: make sure you enabled XCode command line tools (XCode Preference -> Location -> Command Line Tools)

2. Build by command line

    ```bash
    # In root of React Native demo app
    npm run ios
    ```

3. Build by Xcode

    i. Configure `Signing and Capabilities` in XCode for signing the app

    ii. Click `Build` button in XCode (play button)
