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
  configLoading: boolean;
  config: Config | null;
  setConfig: React.Dispatch<React.SetStateAction<Config | null>>;
}

const ConfigContext = createContext<ConfigContextProviderValue>({
  configLoading: true,
  config: null,
  setConfig: () => {},
});

interface ConfigProviderProps {
  children: React.ReactNode;
}

const ConfigProvider: React.FC<ConfigProviderProps> = ({children}) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(true);

  useEffect(() => {
    if (config != null) {
      setConfigLoading(true);
      AsyncStorage.setItem('config', JSON.stringify(config))
        .then(() => setConfigLoading(false))
        .catch((e: any) => {
          Alert.alert('Error', JSON.parse(JSON.stringify(e)));
        });
    }
  }, [config]);

  useEffect(() => {
    setConfigLoading(true);
    AsyncStorage.getItem('config')
      .then(value => {
        if (value != null) {
          setConfig(JSON.parse(value));
        }
        setConfigLoading(false);
      })
      .catch((e: any) => {
        Alert.alert('Error', JSON.parse(JSON.stringify(e)));
      });
  }, []);

  return (
    <ConfigContext.Provider value={{configLoading, config, setConfig}}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

export default ConfigProvider;
