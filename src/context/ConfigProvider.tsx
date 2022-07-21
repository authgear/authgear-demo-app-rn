import {
  ColorScheme,
  PersistentTokenStorage,
  TransientTokenStorage,
} from '@authgear/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
    if (content != null) {
      setLoading(true);

      authgear
        .configure({
          clientID: content.clientID,
          endpoint: content.endpoint,
          tokenStorage: content.useTransientTokenStorage
            ? new TransientTokenStorage()
            : new PersistentTokenStorage(),
          shareSessionWithSystemBrowser: content.shareSessionWithSystemBrowser,
        })
        .catch((e) => {
          ShowError(e);
        });
      AsyncStorage.setItem('config', JSON.stringify(content))
        .catch((e: any) => {
          Alert.alert('Error', JSON.parse(JSON.stringify(e)));
        })
        .finally(() => setLoading(false));
    }
  }, [content]);

  useEffect(() => {
    setLoading(true);
    AsyncStorage.getItem('config')
      .then((value) => {
        if (value != null) {
          setContent(JSON.parse(value));
        }
      })
      .catch((e: any) => {
        Alert.alert('Error', JSON.parse(JSON.stringify(e)));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ loading, content, setContent }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

export default ConfigProvider;
