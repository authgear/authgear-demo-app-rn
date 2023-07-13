import {
  ColorScheme,
  PersistentTokenStorage,
  TransientTokenStorage,
} from '@authgear/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import ShowError from '../ShowError';
import authgear from '@authgear/react-native';

export interface Config {
  clientID: string;
  endpoint: string;
  colorScheme?: ColorScheme;
  explicitColorScheme: ColorScheme | null;
  useTransientTokenStorage: boolean;
  shareSessionWithSystemBrowser: boolean;
}

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
      try {
        await authgear.configure({
          clientID: content.clientID,
          endpoint: content.endpoint,
          tokenStorage: content.useTransientTokenStorage
            ? new TransientTokenStorage()
            : new PersistentTokenStorage(),
          isSSOEnabled: false,
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
