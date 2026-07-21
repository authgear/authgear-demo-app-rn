import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Card,
  Text,
  Divider,
  IconButton,
  MD2Theme,
  useTheme,
} from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useProviders } from '../context/ProvidersProvider';
import { isOIDCProvider, OIDCProvider } from '../providers/types';
import {
  oidcAuthorize,
  oidcRefresh,
  oidcEndSession,
  fetchUserInfo,
} from '../engines/oidc';
import { decodeJwt } from '../util/jwt';
import LoadingSpinner from '../LoadingSpinner';

interface TokenState {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  accessTokenExpirationDate: string;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16 },
  card: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  tokenLabel: { fontWeight: '700', marginTop: 8 },
  tokenValue: { flex: 1, fontFamily: 'Courier', fontSize: 12 },
  claim: { fontSize: 13, marginVertical: 2 },
  error: { marginBottom: 16 },
  loginButton: { marginBottom: 16 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'OIDCResult'>;

const OIDCResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme<MD2Theme>();
  const { providers } = useProviders();
  const provider = providers.find((p) => p.id === route.params.providerId);
  const oidcProvider: OIDCProvider | null =
    provider != null && isOIDCProvider(provider) ? provider : null;

  const [loading, setLoading] = useState<boolean>(false);
  const [tokens, setTokens] = useState<TokenState | null>(null);
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const claims = useMemo(() => {
    if (tokens == null) {
      return null;
    }
    return decodeJwt(tokens.idToken)?.payload ?? null;
  }, [tokens]);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (e: any) {
      // A user-cancelled browser flow is not an error worth surfacing loudly.
      const message = String(e?.message ?? e);
      if (!/cancel/i.test(message)) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const onLogin = useCallback(() => {
    if (oidcProvider == null) {
      return;
    }
    run(async () => {
      const result = await oidcAuthorize(oidcProvider);
      setTokens({
        accessToken: result.accessToken,
        idToken: result.idToken,
        refreshToken: result.refreshToken ?? '',
        accessTokenExpirationDate: result.accessTokenExpirationDate,
      });
      setUserInfo(null);
    });
  }, [oidcProvider, run]);

  const onRefresh = useCallback(() => {
    if (oidcProvider == null || tokens == null || tokens.refreshToken === '') {
      return;
    }
    run(async () => {
      const result = await oidcRefresh(oidcProvider, tokens.refreshToken);
      setTokens({
        accessToken: result.accessToken,
        idToken: result.idToken ?? tokens.idToken,
        refreshToken: result.refreshToken ?? tokens.refreshToken,
        accessTokenExpirationDate: result.accessTokenExpirationDate,
      });
    });
  }, [oidcProvider, tokens, run]);

  const onFetchUserInfo = useCallback(() => {
    if (oidcProvider == null || tokens == null) {
      return;
    }
    run(async () => {
      const info = await fetchUserInfo(oidcProvider, tokens.accessToken);
      setUserInfo(info);
    });
  }, [oidcProvider, tokens, run]);

  const onLogout = useCallback(() => {
    if (oidcProvider == null || tokens == null) {
      return;
    }
    run(async () => {
      await oidcEndSession(oidcProvider, tokens.idToken);
      setTokens(null);
      setUserInfo(null);
    });
  }, [oidcProvider, tokens, run]);

  const renderToken = (label: string, value: string) => (
    <View>
      <Text style={styles.tokenLabel}>{label}</Text>
      <View style={styles.row}>
        <Text style={styles.tokenValue} numberOfLines={3}>
          {value || '(none)'}
        </Text>
        {value ? (
          <IconButton
            icon="content-copy"
            size={18}
            onPress={() => Clipboard.setString(value)}
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={provider?.name ?? 'OIDC'} />
      </Appbar.Header>
      <LoadingSpinner loading={loading} />
      <ScrollView contentContainerStyle={styles.content}>
        {error != null ? (
          <Text style={{ ...styles.error, color: theme.colors.error }}>
            {error}
          </Text>
        ) : null}

        {tokens == null ? (
          <Button
            mode="contained"
            style={styles.loginButton}
            onPress={onLogin}
            disabled={oidcProvider == null}
          >
            Login
          </Button>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Title title="Tokens" />
              <Card.Content>
                {renderToken('Access token', tokens.accessToken)}
                {renderToken('ID token', tokens.idToken)}
                {renderToken('Refresh token', tokens.refreshToken)}
                <Text style={styles.tokenLabel}>Access token expires</Text>
                <Text style={styles.claim}>
                  {tokens.accessTokenExpirationDate}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="ID token claims (unverified)" />
              <Card.Content>
                {claims == null ? (
                  <Text style={styles.claim}>Could not decode ID token.</Text>
                ) : (
                  Object.entries(claims).map(([k, v]) => (
                    <Text key={k} style={styles.claim}>
                      {k}: {JSON.stringify(v)}
                    </Text>
                  ))
                )}
              </Card.Content>
            </Card>

            {userInfo != null ? (
              <Card style={styles.card}>
                <Card.Title title="UserInfo" />
                <Card.Content>
                  {Object.entries(userInfo).map(([k, v]) => (
                    <Text key={k} style={styles.claim}>
                      {k}: {JSON.stringify(v)}
                    </Text>
                  ))}
                </Card.Content>
              </Card>
            ) : null}

            <Button
              mode="outlined"
              style={styles.card}
              onPress={onFetchUserInfo}
            >
              Fetch userinfo
            </Button>
            <Button
              mode="outlined"
              style={styles.card}
              onPress={onRefresh}
              disabled={tokens.refreshToken === ''}
            >
              Refresh token
            </Button>
            <Divider />
            <Button mode="contained" style={styles.card} onPress={onLogout}>
              Logout
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OIDCResultScreen;
