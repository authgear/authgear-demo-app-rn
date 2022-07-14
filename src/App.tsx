/**
 * @format
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthenticationScreen from './screens/AuthenticationScreen';
import ConfigurationScreen from './screens/ConfigurationScreen';

export type RootStackParamList = {
  Authentication: any;
  Configuration: any;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Authentication">
          <Stack.Screen
            name="Authentication"
            component={AuthenticationScreen}
          />
          <Stack.Screen name="Configuration" component={ConfigurationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;
