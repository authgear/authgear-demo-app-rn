/**
 * @format
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthenticationScreen from './screens/AuthenticationScreen';
import ConfigurationScreen from './screens/ConfigurationScreen';

export type RootStackParamList = {
  Authentication: undefined;
  Configuration: {fromButton: boolean} | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <>
      <Stack.Navigator initialRouteName="Authentication">
        <Stack.Screen name="Authentication" component={AuthenticationScreen} />
        <Stack.Screen name="Configuration" component={ConfigurationScreen} />
      </Stack.Navigator>
    </>
  );
};

export default App;
