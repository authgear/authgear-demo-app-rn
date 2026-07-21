import React from 'react';
import { ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Text, Button, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import appInfo from '../../app.json';
import pkg from '../../package.json';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16 },
  heading: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  divider: { marginVertical: 16 },
  link: { alignSelf: 'flex-start' },
  version: { marginTop: 24, fontSize: 13 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

const AboutScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="About" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>What it is</Text>
        <Text style={styles.body}>
          An OIDC/OAuth integration tester. Add any OpenID Connect provider, run
          the sign-in flow, and inspect the resulting tokens, claims, and
          discovery metadata.
        </Text>

        <Text style={styles.heading}>How it works</Text>
        <Text style={styles.body}>
          1. Add a provider (start from a preset or enter an issuer and client
          ID).{'\n'}
          2. Run the login flow.{'\n'}
          3. Inspect the tokens, decoded claims, discovery document, and verify
          the ID token signature.
        </Text>

        <Text style={styles.heading}>Privacy &amp; data handling</Text>
        <Text style={styles.body}>
          Provider configurations are stored locally on your device. Tokens
          obtained while testing are kept in memory only and are never persisted
          or sent anywhere except the OIDC provider you configure. The app has
          no backend and collects no analytics.
        </Text>

        <Divider style={styles.divider} />

        <Button
          style={styles.link}
          onPress={() => Linking.openURL('https://docs.authgear.com')}
        >
          Authgear documentation
        </Button>
        <Button
          style={styles.link}
          onPress={() =>
            Linking.openURL('https://openid.net/developers/how-connect-works/')
          }
        >
          How OpenID Connect works
        </Button>

        <Text style={styles.version}>
          Version {appInfo.displayName} • {pkg.version}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;
