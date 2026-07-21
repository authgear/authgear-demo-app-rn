import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Button, Text, Appbar, MD2Theme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getBiometricOptions,
  redirectURI,
  RootStackParamList,
  wechatRedirectURI,
} from '../App';
import { useProviders } from '../context/ProvidersProvider';
import { isAuthgearProvider } from '../providers/types';
import ShowError from '../ShowError';
import LoadingSpinner from '../LoadingSpinner';
import { useUser } from '../context/UserProvider';
import authgear from '@authgear/react-native';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  root: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 32,
  },
  headerContainer: { flexDirection: 'row', paddingTop: 16 },
  titleContainer: { flex: 1 },
  titleText: { fontSize: 34, fontWeight: '400', lineHeight: 42 },
  subTitleText: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  actionButtons: { alignItems: 'center' },
  button: { marginBottom: 20, width: '100%' },
  buttonContent: { height: 48 },
  buttonText: { fontSize: 16 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'AuthgearLogin'>;

const AuthenticationScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme<MD2Theme>();
  const { providers, activateAuthgear, activeAuthgearProvider } =
    useProviders();
  const user = useUser();

  const providerId = route.params.providerId;
  const provider = providers.find((p) => p.id === providerId);

  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchAction, setDispatchAction] = useState<(() => void) | null>(
    null
  );

  // Configure the Authgear SDK for the selected provider on mount.
  useEffect(() => {
    if (provider != null && isAuthgearProvider(provider)) {
      activateAuthgear(provider).catch((e) => ShowError(e));
    }
  }, [provider, activateAuthgear]);

  useEffect(() => {
    if (loading || dispatchAction == null) {
      return;
    }
    setTimeout(dispatchAction, 100);
    setDispatchAction(null);
  }, [dispatchAction, loading]);

  const colorScheme = activeAuthgearProvider?.explicitColorScheme ?? undefined;

  const authenticate = useCallback(
    (page: string) => {
      async function auth() {
        setLoading(true);
        try {
          const { userInfo } = await authgear.authenticate({
            redirectURI,
            wechatRedirectURI,
            page,
            colorScheme,
          });
          setDispatchAction(
            () => () => navigation.replace('UserPanel', { userInfo })
          );
        } finally {
          setLoading(false);
        }
      }
      auth().catch((e) => ShowError(e));
    },
    [colorScheme, navigation]
  );

  const onPressSignup = useCallback(
    () => authenticate('signup'),
    [authenticate]
  );
  const onPressLogin = useCallback(() => authenticate('login'), [authenticate]);

  const onPressBiometricLogin = useCallback(() => {
    async function biometricLogin() {
      setLoading(true);
      try {
        const options = getBiometricOptions({
          forEnableBiometric: false,
          allowFallbackToPasscode:
            activeAuthgearProvider?.allowFallbackToPasscodeInBiometric ?? false,
        });
        const { userInfo } = await authgear.authenticateBiometric(options);
        setDispatchAction(
          () => () => navigation.replace('UserPanel', { userInfo })
        );
      } finally {
        setLoading(false);
      }
    }
    biometricLogin().catch((e) => ShowError(e));
  }, [activeAuthgearProvider, navigation]);

  const onPressGuestLogin = useCallback(() => {
    async function guestLogin() {
      setLoading(true);
      try {
        const { userInfo } = await authgear.authenticateAnonymously();
        setDispatchAction(
          () => () => navigation.replace('UserPanel', { userInfo })
        );
      } finally {
        setLoading(false);
      }
    }
    guestLogin().catch((e) => ShowError(e));
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Authgear" />
      </Appbar.Header>
      <View style={styles.root}>
        <LoadingSpinner loading={loading} />
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{provider?.name ?? 'Authgear'}</Text>
            <Text
              style={{ ...styles.subTitleText, color: theme.colors.disabled }}
            >
              {activeAuthgearProvider?.endpoint ?? ''}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          {user.isBiometricEnabled ? (
            <Button
              mode="contained"
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonText}
              onPress={onPressBiometricLogin}
            >
              Login with biometric
            </Button>
          ) : null}
          <Button
            mode={user.isBiometricEnabled ? 'outlined' : 'contained'}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            onPress={onPressSignup}
          >
            Signup
          </Button>
          <Button
            mode="outlined"
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            onPress={onPressLogin}
          >
            Login
          </Button>
          <Button
            mode="outlined"
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            onPress={onPressGuestLogin}
          >
            Continue as guest
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AuthenticationScreen;
