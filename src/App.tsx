/**
 * @format
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthenticationScreen from './screens/AuthenticationScreen';
import ConfigurationScreen from './screens/ConfigurationScreen';
import ConfigProvider from './context/ConfigProvider';
import UserPanelScreen from './screens/UserPanelScreen';
import UserInfoScreen from './screens/UserInfoScreen';
import { Platform } from 'react-native';
import UserProvider from './context/UserProvider';
import { UserInfo } from '@authgear/react-native';

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

export const biometricOptions = {
  ios: {
    localizedReason: 'Use biometric to authenticate',
    constraint: 'biometryCurrentSet' as const,
  },
  android: {
    title: 'Biometric Authentication',
    subtitle: 'Biometric authentication',
    description: 'Use biometric to authenticate',
    negativeButtonText: 'Cancel',
    constraint: ['BIOMETRIC_STRONG' as const],
    invalidatedByBiometricEnrollment: true,
  },
};

const App: React.FC = () => {
  return (
    <ConfigProvider>
      <UserProvider>
        <Stack.Navigator
          initialRouteName="Authentication"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="Authentication"
            component={AuthenticationScreen}
          />
          <Stack.Screen name="Configuration" component={ConfigurationScreen} />
          <Stack.Screen name="UserPanel" component={UserPanelScreen} />
          <Stack.Screen name="UserInfo" component={UserInfoScreen} />
        </Stack.Navigator>
      </UserProvider>
    </ConfigProvider>
  );
};

export default App;
