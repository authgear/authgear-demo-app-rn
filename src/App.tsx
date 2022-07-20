/**
 * @format
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthenticationScreen from './screens/AuthenticationScreen';
import ConfigurationScreen from './screens/ConfigurationScreen';
import ConfigProvider from './context/ConfigProvider';
import UserPanelScreen from './screens/UserPanelScreen';
import UserInfoProvider from './context/UserInfoProvider';

export type RootStackParamList = {
  Authentication: undefined;
  Configuration: {fromButton: boolean} | undefined;
  UserPanel: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <ConfigProvider>
      <UserInfoProvider>
        <Stack.Navigator
          initialRouteName="Authentication"
          screenOptions={{headerShown: false}}>
          <Stack.Screen
            name="Authentication"
            component={AuthenticationScreen}
          />
          <Stack.Screen name="Configuration" component={ConfigurationScreen} />
          <Stack.Screen name="UserPanel" component={UserPanelScreen} />
        </Stack.Navigator>
      </UserInfoProvider>
    </ConfigProvider>
  );
};

export default App;
