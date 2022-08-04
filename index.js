/**
 * @format
 */

import React from 'react';
import { AppRegistry, useColorScheme } from 'react-native';
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
import { name as appName } from './app.json';
import App from './src/App';

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

export default function Main() {
  const systemColorScheme = useColorScheme();
  const theme =
    systemColorScheme === 'dark' ? CombinedDarkTheme : CombinedDefaultTheme;

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <App />
      </NavigationContainer>
    </PaperProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);
