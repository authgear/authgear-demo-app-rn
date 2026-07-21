import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, List, Button, Divider, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useProviders } from '../context/ProvidersProvider';
import { isAuthgearProvider, Provider } from '../providers/types';
import LoadingSpinner from '../LoadingSpinner';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { flex: 1 },
  addButton: { margin: 16 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderList'>;

const ProviderListScreen: React.FC<Props> = ({ navigation }) => {
  const { providers, loading } = useProviders();

  const openProvider = (p: Provider) => {
    if (isAuthgearProvider(p)) {
      navigation.navigate('AuthgearLogin', { providerId: p.id });
    } else {
      navigation.navigate('OIDCResult', { providerId: p.id });
    }
  };

  const editProvider = (p: Provider) => {
    navigation.navigate('AddEditProvider', { providerId: p.id });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content
          title="Authgear Tools"
          subtitle="OIDC integration tester"
        />
        <Appbar.Action
          icon="information"
          onPress={() => navigation.navigate('About')}
        />
      </Appbar.Header>
      <LoadingSpinner loading={loading} />
      <ScrollView style={styles.list}>
        {providers.map((p) => (
          <React.Fragment key={p.id}>
            <List.Item
              title={p.name}
              description={isAuthgearProvider(p) ? p.endpoint : p.issuer}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={
                    isAuthgearProvider(p) ? 'shield-account' : 'key-variant'
                  }
                />
              )}
              right={() => (
                <IconButton icon="pencil" onPress={() => editProvider(p)} />
              )}
              onPress={() => openProvider(p)}
              onLongPress={() => editProvider(p)}
            />
            <Divider />
          </React.Fragment>
        ))}
      </ScrollView>
      <Button
        mode="contained"
        style={styles.addButton}
        icon="plus"
        onPress={() => navigation.navigate('AddEditProvider', {})}
      >
        Add provider
      </Button>
    </SafeAreaView>
  );
};

export default ProviderListScreen;
