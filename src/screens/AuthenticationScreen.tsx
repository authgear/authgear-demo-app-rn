import React, {useCallback, useEffect} from 'react';
import {Alert, Platform, StyleSheet, View} from 'react-native';
import {useTheme, Button, Text} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../App';
import authgear, {
  BiometricLockoutError,
  BiometricNoEnrollmentError,
  BiometricNoPasscodeError,
  BiometricNotSupportedOrPermissionDeniedError,
  BiometricPrivateKeyNotFoundError,
  CancelError,
  PersistentTokenStorage,
  TransientTokenStorage,
} from '@authgear/react-native';
import {useConfig} from '../context/ConfigProvider';
import {useUserInfo} from '../context/UserInfoProvider';

const styles = StyleSheet.create({
  container: {
    margin: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  titleText: {
    marginTop: 64,
    marginBottom: 6,
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 36,
  },
  subTitleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 15,
  },
  configButton: {
    alignItems: 'flex-start',
    marginLeft: -15,
  },
  actionButtons: {
    alignItems: 'center',
    marginBottom: 32,
  },
  button: {
    marginBottom: 20,
    width: '100%',
    textAlign: 'center',
  },
});

const redirectURI = 'com.authgear.example.rn://host/path';
const wechatRedirectURI = Platform.select<string>({
  android: 'com.authgear.example.rn://host/open_wechat_app',
  ios: 'https://authgear-demo-rn.pandawork.com/authgear/open_wechat_app',
});

const showError = (e: any) => {
  const json = JSON.parse(JSON.stringify(e));
  delete json.line;
  delete json.column;
  delete json.sourceURL;
  json['constructor.name'] = e?.constructor?.name;
  json.message = e.message;
  const title = 'Error';
  let message = JSON.stringify(json);

  if (e instanceof CancelError) {
    // Cancel is not an error actually.
    return;
  }

  if (e instanceof BiometricPrivateKeyNotFoundError) {
    message = Platform.select({
      android:
        'Your biometric info has changed. For security reason, you have to set up biometric authentication again.',
      ios: 'Your Touch ID or Face ID has changed. For security reason, you have to set up biometric authentication again.',
      default: message,
    });
  }

  if (e instanceof BiometricNoEnrollmentError) {
    message = Platform.select({
      android:
        'You have not set up biometric yet. Please set up your fingerprint or face',
      ios: 'You do not have Face ID or Touch ID set up yet. Please set it up first',
      default: message,
    });
  }

  if (e instanceof BiometricNotSupportedOrPermissionDeniedError) {
    message = Platform.select({
      android:
        'Your device does not support biometric. The developer should have checked this and not letting you to see feature that requires biometric',
      ios: 'If the developer should performed checking, then it is likely that you have denied the permission of Face ID. Please enable it in Settings',
      default: message,
    });
  }

  if (e instanceof BiometricNoPasscodeError) {
    message = Platform.select({
      android:
        'You device does not have credential set up. Please set up either a PIN, a pattern or a password',
      ios: 'You device does not have passcode set up. Please set up a passcode',
      default: message,
    });
  }

  if (e instanceof BiometricLockoutError) {
    message =
      'The biometric is locked out due to too many failed attempts. The developer should handle this error by using normal authentication as a fallback. So normally you should not see this error';
  }

  Alert.alert(title, message);
};

type AuthenticationScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Authentication'
>;

const AuthenticationScreen: React.FC<AuthenticationScreenProps> = props => {
  const theme = useTheme();
  const {setUserInfo} = useUserInfo();
  const navigation = props.navigation;

  const config = useConfig();

  useEffect(() => {
    if (config.loading) {
      return;
    }
    if (config.content == null) {
      navigation.replace('Configuration');
      return;
    }

    const clientID = config.content?.clientID;
    const endpoint = config.content?.endpoint;
    const tokenStorage = config.content?.useTransientTokenStorage
      ? new TransientTokenStorage()
      : new PersistentTokenStorage();
    const shareSessionWithSystemBrowser =
      config.content?.shareSessionWithSystemBrowser;

    authgear
      .configure({
        clientID,
        endpoint,
        tokenStorage,
        shareSessionWithSystemBrowser,
      })
      .catch(e => {
        showError(e);
      });
  }, [config, navigation]);

  const onPressConfigButton = useCallback(() => {
    return navigation.navigate('Configuration', {fromButton: true});
  }, [navigation]);

  const authenticate = useCallback(
    (page: string) => {
      authgear
        .authenticate({
          redirectURI,
          wechatRedirectURI,
          page,
          colorScheme: config.content?.colorScheme,
        })
        .then(({userInfo}) => {
          setUserInfo(userInfo);
          navigation.navigate('UserPanel');
        })
        .catch(e => {
          showError(e);
        });
    },
    [config.content?.colorScheme, navigation, setUserInfo],
  );

  const onPressSignupButton = useCallback(() => {
    authenticate('signup');
  }, [authenticate]);

  const onPressLoginButton = useCallback(() => {
    authenticate('login');
  }, [authenticate]);

  const onPressGuestButton = useCallback(() => {
    authgear
      .authenticateAnonymously()
      .then(({userInfo}) => {
        setUserInfo(userInfo);
        navigation.navigate('UserPanel');
      })
      .catch(e => {
        showError(e);
      });
  }, [navigation, setUserInfo]);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.titleText}>Authgear Demo</Text>
        <Text style={{...styles.subTitleText, color: theme.colors.disabled}}>
          https://demo.authgear.apps.com/
        </Text>
        <View style={styles.configButton}>
          <Button mode="text" onPress={onPressConfigButton}>
            Configure
          </Button>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          style={styles.button}
          onPress={onPressSignupButton}>
          Signup
        </Button>
        <Button
          mode="outlined"
          style={styles.button}
          onPress={onPressLoginButton}>
          Login
        </Button>
        <Button mode="outlined" style={styles.button}>
          Login with biometric
        </Button>
        <Button
          mode="outlined"
          style={styles.button}
          onPress={onPressGuestButton}>
          Continue as guest
        </Button>
      </View>
    </View>
  );
};

export default AuthenticationScreen;
