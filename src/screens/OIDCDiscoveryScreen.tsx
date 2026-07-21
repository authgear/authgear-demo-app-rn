import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Card,
  Text,
  IconButton,
  MD2Theme,
  useTheme,
} from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useProviders } from '../context/ProvidersProvider';
import { isOIDCProvider } from '../providers/types';
import { fetchDiscovery } from '../engines/oidc';
import LoadingSpinner from '../LoadingSpinner';

const KEY_FIELDS = [
  'issuer',
  'authorization_endpoint',
  'token_endpoint',
  'userinfo_endpoint',
  'jwks_uri',
  'end_session_endpoint',
  'scopes_supported',
  'response_types_supported',
  'id_token_signing_alg_values_supported',
];

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16 },
  card: { marginBottom: 16 },
  label: { fontWeight: '700', marginTop: 8 },
  value: { fontFamily: 'Courier', fontSize: 12 },
  error: { marginBottom: 16 },
  jsonRow: { flexDirection: 'row', alignItems: 'flex-start' },
  json: { flex: 1, fontFamily: 'Courier', fontSize: 11 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'OIDCDiscovery'>;

const OIDCDiscoveryScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme<MD2Theme>();
  const { providers } = useProviders();
  const provider = providers.find((p) => p.id === route.params.providerId);

  const [loading, setLoading] = useState<boolean>(false);
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (provider == null || !isOIDCProvider(provider)) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      setDoc(await fetchDiscovery(provider));
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    load();
  }, [load]);

  const fullJson = doc == null ? '' : JSON.stringify(doc, null, 2);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Discovery" subtitle={provider?.name} />
      </Appbar.Header>
      <LoadingSpinner loading={loading} />
      <ScrollView contentContainerStyle={styles.content}>
        {error != null ? (
          <Text style={{ ...styles.error, color: theme.colors.error }}>
            {error}
          </Text>
        ) : null}
        {doc != null ? (
          <>
            <Card style={styles.card}>
              <Card.Title title="Key fields" />
              <Card.Content>
                {KEY_FIELDS.filter((k) => doc[k] != null).map((k) => (
                  <View key={k}>
                    <Text style={styles.label}>{k}</Text>
                    <Text style={styles.value}>{JSON.stringify(doc[k])}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
            <Card style={styles.card}>
              <Card.Title title="Full document" />
              <Card.Content>
                <View style={styles.jsonRow}>
                  <Text style={styles.json}>{fullJson}</Text>
                  <IconButton
                    icon="content-copy"
                    size={18}
                    onPress={() => Clipboard.setString(fullJson)}
                  />
                </View>
              </Card.Content>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OIDCDiscoveryScreen;
