import {
  ColorScheme,
  PersistentTokenStorage,
  TransientTokenStorage,
  WebKitWebViewUIImplementation,
} from '@authgear/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import ShowError from '../ShowError';
import authgear from '@authgear/react-native';

function createRandomString(length: number) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getDistinctNamePerInstall(): Promise<string> {
  const key = 'authgear.container.name';
  let name = await AsyncStorage.getItem(key);
  if (name == null || name === '') {
    name = createRandomString(44);
    await AsyncStorage.setItem(key, name);
    return name;
  }
  return name;
}

export interface Config {
  clientID: string;
  endpoint: string;
  colorScheme?: ColorScheme;
  explicitColorScheme: ColorScheme | null;
  useTransientTokenStorage: boolean;
  shareSessionWithSystemBrowser: boolean;
  useWebkitWebView?: boolean;
}

export const defaultConfig: Config = {
  clientID: 'e6b2f5bad8546ee3',
  endpoint: 'https://demo-app.authgear.cloud',
  colorScheme: undefined,
  explicitColorScheme: null,
  useTransientTokenStorage: false,
  shareSessionWithSystemBrowser: false,
  useWebkitWebView: false,
};

interface ConfigContextProviderValue {
  loading: boolean;
  content: Config | null;
  setContent: React.Dispatch<React.SetStateAction<Config | null>>;
}

const ConfigContext = createContext<ConfigContextProviderValue>({
  loading: true,
  content: null,
  setContent: () => {},
});

interface ConfigProviderProps {
  children: React.ReactNode;
}

const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [content, setContent] = useState<Config | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function updateStorage() {
      if (content == null) {
        return;
      }

      setLoading(true);
      // The anonymous user key is associated with the container name.
      // If endpoint is changed, then the SDK will use a key assoicated with another project,
      // resulting in invalid credentials error.
      // To work around this issue, we generate a disinct name per install.
      // See https://github.com/authgear/authgear-demo-app-rn/issues/31
      const name = await getDistinctNamePerInstall();
      try {
        authgear.name = name;
        await authgear.configure({
          clientID: content.clientID,
          endpoint: content.endpoint,
          tokenStorage: content.useTransientTokenStorage
            ? new TransientTokenStorage()
            : new PersistentTokenStorage(),
          isSSOEnabled: content.shareSessionWithSystemBrowser,
          uiImplementation: content.useWebkitWebView
            ? new WebKitWebViewUIImplementation()
            : undefined,
        });
        await AsyncStorage.setItem('config', JSON.stringify(content));
      } finally {
        setLoading(false);
      }
    }

    updateStorage().catch((e) => {
      ShowError(e);
    });
  }, [content]);

  useEffect(() => {
    async function updateContent() {
      setLoading(true);
      try {
        const value = await AsyncStorage.getItem('config');
        if (value != null) {
          setContent(JSON.parse(value));
        }
      } finally {
        setLoading(false);
      }
    }

    updateContent().catch((e) => {
      ShowError(e);
    });
  }, []);

  return (
    <ConfigContext.Provider value={{ loading, content, setContent }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

export default ConfigProvider;
