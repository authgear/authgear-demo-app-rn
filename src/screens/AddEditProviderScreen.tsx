import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  TextInput,
  SegmentedButtons,
  Switch,
  Text,
  IconButton,
  MD2Theme,
  useTheme,
} from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useProviders } from '../context/ProvidersProvider';
import {
  AuthgearProvider,
  OIDCProvider,
  Provider,
  isAuthgearProvider,
  isOIDCProvider,
} from '../providers/types';
import { AUTHGEAR_DEMO_PROVIDER_ID } from '../providers/store';
import { randomId } from '../util/id';
import { parseScopes, serializeScopes } from '../util/scopes';
import { OIDC_REDIRECT_URL } from '../engines/oidc';
import ShowError from '../ShowError';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16 },
  field: { marginVertical: 8 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  redirectBox: { marginTop: 12, marginBottom: 4 },
  redirectRow: { flexDirection: 'row', alignItems: 'center' },
  redirectValue: { flex: 1, fontFamily: 'Courier', fontSize: 13 },
  hint: { fontSize: 12 },
  saveButton: { marginTop: 24 },
  deleteButton: { marginTop: 12 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditProvider'>;

const AddEditProviderScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme<MD2Theme>();
  const { providers, addOrUpdate, remove } = useProviders();

  const editingId = route.params?.providerId;
  const existing = useMemo(
    () => providers.find((p) => p.id === editingId),
    [providers, editingId]
  );
  const isDemo = editingId === AUTHGEAR_DEMO_PROVIDER_ID;

  const [kind, setKind] = useState<'authgear' | 'oidc'>(
    existing?.kind ?? 'oidc'
  );
  const [name, setName] = useState<string>(existing?.name ?? '');

  // Authgear fields
  const authgearExisting =
    existing != null && isAuthgearProvider(existing) ? existing : null;
  const [clientID, setClientID] = useState<string>(
    existing?.kind === 'oidc'
      ? existing.clientID
      : authgearExisting?.clientID ?? ''
  );
  const [endpoint, setEndpoint] = useState<string>(
    authgearExisting?.endpoint ?? ''
  );
  const [useTransient, setUseTransient] = useState<boolean>(
    authgearExisting?.useTransientTokenStorage ?? false
  );
  const [shareSSO, setShareSSO] = useState<boolean>(
    authgearExisting?.shareSessionWithSystemBrowser ?? false
  );
  const [useWebkit, setUseWebkit] = useState<boolean>(
    authgearExisting?.useWebkitWebView ?? false
  );
  const [allowPasscode, setAllowPasscode] = useState<boolean>(
    authgearExisting?.allowFallbackToPasscodeInBiometric ?? false
  );

  // OIDC fields
  const oidcExisting =
    existing != null && isOIDCProvider(existing) ? existing : null;
  const [issuer, setIssuer] = useState<string>(oidcExisting?.issuer ?? '');
  const [scopesText, setScopesText] = useState<string>(
    serializeScopes(oidcExisting?.scopes ?? ['openid', 'profile', 'email'])
  );

  const onSave = () => {
    const id = existing?.id ?? randomId();
    let provider: Provider;
    if (kind === 'authgear') {
      if (clientID.trim() === '' || endpoint.trim() === '') {
        ShowError(new Error('Client ID and endpoint are required.'));
        return;
      }
      const authgear: AuthgearProvider = {
        id,
        kind: 'authgear',
        name: name.trim() || 'Authgear',
        clientID: clientID.trim(),
        endpoint: endpoint.trim(),
        explicitColorScheme: authgearExisting?.explicitColorScheme ?? null,
        useTransientTokenStorage: useTransient,
        shareSessionWithSystemBrowser: shareSSO,
        useWebkitWebView: useWebkit,
        allowFallbackToPasscodeInBiometric: allowPasscode,
      };
      provider = authgear;
    } else {
      if (issuer.trim() === '' || clientID.trim() === '') {
        ShowError(new Error('Issuer and client ID are required.'));
        return;
      }
      const normalizedIssuer = issuer.trim().replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(normalizedIssuer)) {
        ShowError(
          new Error('Issuer must be a valid URL starting with https://')
        );
        return;
      }
      const oidc: OIDCProvider = {
        id,
        kind: 'oidc',
        name: name.trim() || 'OIDC provider',
        issuer: normalizedIssuer,
        clientID: clientID.trim(),
        scopes: parseScopes(scopesText),
      };
      provider = oidc;
    }
    addOrUpdate(provider)
      .then(() => navigation.goBack())
      .catch((e) => ShowError(e));
  };

  const onDelete = () => {
    if (editingId == null) {
      return;
    }
    remove(editingId)
      .then(() => navigation.goBack())
      .catch((e) => ShowError(e));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={existing ? 'Edit provider' : 'Add provider'} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        {!isDemo ? (
          <SegmentedButtons
            value={kind}
            onValueChange={(v) => setKind(v as 'authgear' | 'oidc')}
            buttons={[
              { value: 'oidc', label: 'Generic OIDC' },
              { value: 'authgear', label: 'Authgear' },
            ]}
          />
        ) : null}

        <TextInput
          style={styles.field}
          mode="outlined"
          label="Display name"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
        />

        {kind === 'authgear' ? (
          <>
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Client ID"
              value={clientID}
              onChangeText={setClientID}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Authgear Endpoint"
              value={endpoint}
              onChangeText={setEndpoint}
              autoCapitalize="none"
            />
            <View style={styles.toggleRow}>
              <Text>Transient token storage</Text>
              <Switch value={useTransient} onValueChange={setUseTransient} />
            </View>
            <View style={styles.toggleRow}>
              <Text>Share session with system browser</Text>
              <Switch value={shareSSO} onValueChange={setShareSSO} />
            </View>
            <View style={styles.toggleRow}>
              <Text>Use WebKit WebView</Text>
              <Switch value={useWebkit} onValueChange={setUseWebkit} />
            </View>
            <View style={styles.toggleRow}>
              <Text>Allow passcode fallback in biometric</Text>
              <Switch value={allowPasscode} onValueChange={setAllowPasscode} />
            </View>
          </>
        ) : (
          <>
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Issuer URL"
              value={issuer}
              onChangeText={setIssuer}
              autoCapitalize="none"
              placeholder="https://example.okta.com"
            />
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Client ID"
              value={clientID}
              onChangeText={setClientID}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Scopes (space separated)"
              value={scopesText}
              onChangeText={setScopesText}
              autoCapitalize="none"
            />
            <View style={styles.redirectBox}>
              <Text style={{ ...styles.hint, color: theme.colors.disabled }}>
                Register this redirect URI in your provider:
              </Text>
              <View style={styles.redirectRow}>
                <Text style={styles.redirectValue}>{OIDC_REDIRECT_URL}</Text>
                <IconButton
                  icon="content-copy"
                  size={18}
                  onPress={() => Clipboard.setString(OIDC_REDIRECT_URL)}
                />
              </View>
            </View>
          </>
        )}

        <Button mode="contained" style={styles.saveButton} onPress={onSave}>
          Save
        </Button>
        {existing != null && !isDemo ? (
          <Button
            mode="outlined"
            style={styles.deleteButton}
            textColor={theme.colors.error}
            onPress={onDelete}
          >
            Delete provider
          </Button>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddEditProviderScreen;
