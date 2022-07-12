/**
 * @format
 */

import React from 'react';
import {SafeAreaView, StatusBar} from 'react-native';

import AuthenticationScreen from './screens/AuthenticationScreen';

const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView>
        <AuthenticationScreen />
      </SafeAreaView>
    </>
  );
};

export default App;
