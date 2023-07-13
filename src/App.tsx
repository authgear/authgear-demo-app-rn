/**
 * @format
 */

import React from 'react';
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import {
  DarkTheme as PaperDarkTheme,
  DefaultTheme as PaperDefaultTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthenticationScreen from './screens/AuthenticationScreen';
import ConfigurationScreen from './screens/ConfigurationScreen';
import ConfigProvider from './context/ConfigProvider';
import UserPanelScreen from './screens/UserPanelScreen';
import UserInfoScreen from './screens/UserInfoScreen';
import { Platform, useColorScheme } from 'react-native';
import UserProvider from './context/UserProvider';
import {
  UserInfo,
  BiometricOptions,
  BiometricAccessConstraintIOS,
  BiometricLAPolicy,
  BiometricAccessConstraintAndroid,
} from '@authgear/react-native';

export type RootStackParamList = {
  Authentication: undefined;
  Configuration: { fromButton: boolean } | undefined;
  UserPanel: { userInfo: UserInfo | null } | undefined;
  UserInfo: { userInfo: UserInfo | null } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const redirectURI = 'com.authgear.example.rn://host/path';
export const wechatRedirectURI = Platform.select<string>({
  android: 'com.authgear.example.rn://host/open_wechat_app',
  ios: 'https://authgear-demo-rn.pandawork.com/authgear/open_wechat_app',
});

export const biometricOptions: BiometricOptions = {
  ios: {
    localizedReason: 'Use biometric to authenticate',
    constraint: BiometricAccessConstraintIOS.BiometryCurrentSet,
    policy: BiometricLAPolicy.deviceOwnerAuthenticationWithBiometrics,
  },
  android: {
    title: 'Biometric Authentication',
    subtitle: 'Biometric authentication',
    description: 'Use biometric to authenticate',
    negativeButtonText: 'Cancel',
    constraint: [BiometricAccessConstraintAndroid.BiometricStrong],
    invalidatedByBiometricEnrollment: true,
  },
};

const CombinedDefaultTheme = {
  ...PaperDefaultTheme,
  ...NavigationDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    ...NavigationDefaultTheme.colors,
    background: '#F8F8F8',
    shadedBackground: '#EFEFEF',
    primary: '#0099FF',
    disabled: 'rgba(0, 0, 0, 0.6)',
    error: '#B00020',
  },
};
const CombinedDarkTheme = {
  ...PaperDarkTheme,
  ...NavigationDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    ...NavigationDarkTheme.colors,
    background: '#212121',
    shadedBackground: '#101010',
    primary: '#0099FF',
    disabled: 'rgba(255, 255, 255, 0.6)',
    error: '#B00020',
  },
};

const App: React.FC = () => {
  const systemColorScheme = useColorScheme();
  const theme =
    systemColorScheme === 'dark' ? CombinedDarkTheme : CombinedDefaultTheme;

  return (
    <ConfigProvider>
      <UserProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer theme={theme}>
            <Stack.Navigator
              initialRouteName="Authentication"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen
                name="Authentication"
                component={AuthenticationScreen}
              />
              <Stack.Screen
                name="Configuration"
                component={ConfigurationScreen}
              />
              <Stack.Screen name="UserPanel" component={UserPanelScreen} />
              <Stack.Screen name="UserInfo" component={UserInfoScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </UserProvider>
    </ConfigProvider>
  );
};

export default App;
