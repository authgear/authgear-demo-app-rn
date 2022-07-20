import React, {useCallback, useEffect, useState} from 'react';
import {Platform, SafeAreaView, StyleSheet, View} from 'react-native';
import {useTheme, Button, Text} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../App';
import authgear, {
  PersistentTokenStorage,
  TransientTokenStorage,
} from '@authgear/react-native';
import {useConfig} from '../context/ConfigProvider';
import {useUserInfo} from '../context/UserInfoProvider';
import ShowError from '../ShowError';
import LoadingSpinner from '../LoadingSpinner';

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

type AuthenticationScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Authentication'
>;

const AuthenticationScreen: React.FC<AuthenticationScreenProps> = props => {
  const theme = useTheme();
  const {setUserInfo} = useUserInfo();
  const navigation = props.navigation;

  const config = useConfig();

  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchAction, setDispatchAction] = useState<(() => void) | null>(
    null,
  );

  useEffect(() => {
    if (loading) {
      return;
    }
    if (dispatchAction == null) {
      return;
    }
    // Give buffer time for spinner to disapear
    setTimeout(dispatchAction, 100);
    setDispatchAction(null);
  }, [dispatchAction, loading]);

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
        ShowError(e);
      });
  }, [config, navigation]);

  const onPressConfigButton = useCallback(() => {
    return navigation.navigate('Configuration', {fromButton: true});
  }, [navigation]);

  const authenticate = useCallback(
    (page: string) => {
      setLoading(true);
      authgear
        .authenticate({
          redirectURI,
          wechatRedirectURI,
          page,
          colorScheme: config.content?.colorScheme,
        })
        .then(({userInfo}) => {
          setUserInfo(userInfo);
          setDispatchAction(() => () => {
            navigation.replace('UserPanel');
          });
        })
        .catch(e => {
          ShowError(e);
        })
        .finally(() => {
          setLoading(false);
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
    setLoading(true);
    authgear
      .authenticateAnonymously()
      .then(({userInfo}) => {
        setUserInfo(userInfo);
        setDispatchAction(() => () => navigation.replace('UserPanel'));
      })
      .catch(e => {
        ShowError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigation, setUserInfo]);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <LoadingSpinner loading={loading} />
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
      </SafeAreaView>
    </>
  );
};

export default AuthenticationScreen;
