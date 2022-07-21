import React, { createContext, useCallback, useContext, useState } from 'react';
import { biometricOptions } from '../App';
import authgear from '@authgear/react-native';

interface BiometricContextProviderValue {
  enabled: boolean;
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  updateState: () => void;
}

const BiometricContext = createContext<BiometricContextProviderValue>({
  enabled: false,
  setEnabled: () => {},
  updateState: () => {},
});

interface BiometricProviderProps {
  children: React.ReactNode;
}

const BiometricProvider: React.FC<BiometricProviderProps> = ({ children }) => {
  const [enabled, setEnabled] = useState<boolean>(false);

  const updateState = useCallback(() => {
    async function update() {
      try {
        await authgear.checkBiometricSupported(biometricOptions);
      } finally {
        try {
          const result = await authgear.isBiometricEnabled();
          setEnabled(result);
        } catch {
          // ignore the error.
        }
      }
    }

    update().catch(() => {
      // ignore the error.
    });
  }, []);

  return (
    <BiometricContext.Provider value={{ enabled, setEnabled, updateState }}>
      {children}
    </BiometricContext.Provider>
  );
};

export const useBiometric = () => useContext(BiometricContext);

export default BiometricProvider;
