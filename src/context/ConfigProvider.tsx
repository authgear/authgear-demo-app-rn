import {ColorScheme} from '@authgear/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useContext, useEffect, useState} from 'react';
import {Alert} from 'react-native';

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

const ConfigProvider: React.FC<ConfigProviderProps> = ({children}) => {
  const [content, setContent] = useState<Config | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (content != null) {
      setLoading(true);
      AsyncStorage.setItem('config', JSON.stringify(content))
        .then(() => setLoading(false))
        .catch((e: any) => {
          Alert.alert('Error', JSON.parse(JSON.stringify(e)));
        });
    }
  }, [content]);

  useEffect(() => {
    setLoading(true);
    AsyncStorage.getItem('config')
      .then(value => {
        if (value != null) {
          setContent(JSON.parse(value));
        }
        setLoading(false);
      })
      .catch((e: any) => {
        Alert.alert('Error', JSON.parse(JSON.stringify(e)));
      });
  }, []);

  return (
    <ConfigContext.Provider value={{loading, content, setContent}}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

export default ConfigProvider;
