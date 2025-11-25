import React, { createContext, useCallback, useContext, useState } from 'react';
import { getBiometricOptions } from '../App';
import authgear, {
  BiometricNoEnrollmentError,
  ReactNativeContainer,
  SessionState,
} from '@authgear/react-native';
import ShowError from '../ShowError';
import { useConfig } from './ConfigProvider';

interface UserContextProviderValue {
  sessionState: SessionState;
  isBiometricEnabled: boolean;
  updateState: (container: ReactNativeContainer) => void;
}

const UserContext = createContext<UserContextProviderValue>({
  sessionState: SessionState.NoSession,
  isBiometricEnabled: false,
  updateState: () => {},
});

interface UserProviderProps {
  children: React.ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [sessionState, setSessionState] = useState<SessionState>(
    SessionState.NoSession
  );
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);

  const config = useConfig();

  const updateState = useCallback(
    (container: ReactNativeContainer) => {
      async function update() {
        try {
          const biometricOptions = getBiometricOptions({
            forEnableBiometric: true,
            allowFallbackToPasscode:
              config.content?.allowFallbackToPasscodeInBiometric ?? false,
          });
          await container.checkBiometricSupported(biometricOptions);
        } finally {
          const newIsBiometricEnabled = await container.isBiometricEnabled();
          const newSessionState = container.sessionState;
          setIsBiometricEnabled(newIsBiometricEnabled);
          setSessionState(newSessionState);
        }
      }

      update().catch((e) => {
        if (e instanceof BiometricNoEnrollmentError) {
          setIsBiometricEnabled(false);
          return;
        }
        ShowError(e);
      });
    },
    [config.content?.allowFallbackToPasscodeInBiometric]
  );

  authgear.delegate = {
    onSessionStateChange: (container) => {
      updateState(container);
    },
  };

  return (
    <UserContext.Provider
      value={{ sessionState, isBiometricEnabled, updateState }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserProvider;
