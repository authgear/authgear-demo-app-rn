import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import ShowError from '../ShowError';
import { AuthgearProvider, Provider } from '../providers/types';
import {
  seedProviders,
  upsertProvider as upsertInList,
  removeProvider as removeFromList,
} from '../providers/store';
import {
  legacyConfigToProvider,
  normalizeStoredProvider,
  LegacyConfig,
} from '../providers/migration';
import { configureAuthgear } from '../engines/authgear';

const STORAGE_KEY = 'providers.v1';
const LEGACY_CONFIG_KEY = 'config';

interface ProvidersContextValue {
  loading: boolean;
  providers: Provider[];
  activeAuthgearProvider: AuthgearProvider | null;
  addOrUpdate: (p: Provider) => Promise<void>;
  remove: (id: string) => Promise<void>;
  activateAuthgear: (p: AuthgearProvider) => Promise<void>;
}

const ProvidersContext = createContext<ProvidersContextValue>({
  loading: true,
  providers: [],
  activeAuthgearProvider: null,
  addOrUpdate: async () => {},
  remove: async () => {},
  activateAuthgear: async () => {},
});

interface ProvidersProviderProps {
  children: React.ReactNode;
}

async function loadInitial(): Promise<Provider[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw != null) {
    const stored = (JSON.parse(raw) as Provider[]).map(normalizeStoredProvider);
    return seedProviders(stored);
  }
  // Migrate the legacy single-config key if present.
  const legacyRaw = await AsyncStorage.getItem(LEGACY_CONFIG_KEY);
  if (legacyRaw != null) {
    const migrated = legacyConfigToProvider(
      JSON.parse(legacyRaw) as LegacyConfig
    );
    const seeded = seedProviders([migrated]);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    await AsyncStorage.removeItem(LEGACY_CONFIG_KEY);
    return seeded;
  }
  const seeded = seedProviders(null);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

const ProvidersProvider: React.FC<ProvidersProviderProps> = ({ children }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeAuthgearProvider, setActiveAuthgearProvider] =
    useState<AuthgearProvider | null>(null);

  useEffect(() => {
    loadInitial()
      .then((list) => setProviders(list))
      .catch((e) => ShowError(e))
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(async (list: Provider[]) => {
    setProviders(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const addOrUpdate = useCallback(
    async (p: Provider) => {
      await persist(upsertInList(providers, p));
    },
    [persist, providers]
  );

  const remove = useCallback(
    async (id: string) => {
      await persist(removeFromList(providers, id));
    },
    [persist, providers]
  );

  const activateAuthgear = useCallback(async (p: AuthgearProvider) => {
    await configureAuthgear(p);
    setActiveAuthgearProvider(p);
  }, []);

  return (
    <ProvidersContext.Provider
      value={{
        loading,
        providers,
        activeAuthgearProvider,
        addOrUpdate,
        remove,
        activateAuthgear,
      }}
    >
      {children}
    </ProvidersContext.Provider>
  );
};

export const useProviders = () => useContext(ProvidersContext);

export default ProvidersProvider;
