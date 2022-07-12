/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import {DefaultTheme, Provider as PaperProvider} from 'react-native-paper';
import {name as appName} from './app.json';
import App from './src/App';

const theme = {
  ...DefaultTheme,
  version: 3,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F5F5',
    primary: '#0099FF',
    disabled: 'rgba(0, 0, 0, 0.6)',
  },
};

export default function Main() {
  return (
    <PaperProvider theme={theme}>
      <App />
    </PaperProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);
