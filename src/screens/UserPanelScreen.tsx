import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  Divider,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';
import {biometricOptions, RootStackParamList} from '../App';
import {useConfig} from '../context/ConfigProvider';
import {useUserInfo} from '../context/UserInfoProvider';
import ShowError from '../ShowError';
import authgear, {Page} from '@authgear/react-native';
import LoadingSpinner from '../LoadingSpinner';
import {redirectURI, wechatRedirectURI} from '../App';

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  contentText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },

  dialogText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  userInfoCard: {
    backgroundColor: '#F5F5F5',
    marginVertical: 16,
  },

  buttonContainer: {
    marginVertical: 8,
  },
  buttonContent: {
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});

type UserPanelScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'UserPanel'
>;

const UserPanelScreen: React.FC<UserPanelScreenProps> = props => {
  const navigation = props.navigation;
  const theme = useTheme();
  const {userInfo, setUserInfo} = useUserInfo();
  const config = useConfig();

  const [infoDialogVisble, setInfoDialogVisible] = useState(false);
  const [authTimeDialogVisble, setAuthTimeDialogVisble] = useState(false);
  const [disableBiometricDialogVisble, setDisableBiometricDialogVisble] =
    useState(false);
  const [reauthDialogVisble, setReauthDialogVisble] = useState(false);
  const [reauthSuccessDialogVisble, setReauthSuccessDialogVisble] =
    useState(false);
  const [logoutDialogVisble, setLogoutDialogVisble] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchAction, setDispatchAction] = useState<(() => void) | null>(
    null,
  );
  const [userDisplayName, setUserDisplayName] = useState<string>('User');

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
    if (userInfo == null) {
      setDispatchAction(() => () => navigation.replace('Authentication'));
      return;
    }

    if (userInfo.isAnonymous) {
      setUserDisplayName('Guest');
    }
    if (userInfo.phoneNumber != null) {
      setUserDisplayName(userInfo.phoneNumber);
    }
    if (userInfo.email != null) {
      setUserDisplayName(userInfo.email);
    }
    if (userInfo.givenName != null) {
      setUserDisplayName(userInfo.givenName);
    }
    if (userInfo.familyName != null) {
      setUserDisplayName(userInfo.familyName);
    }
    if (userInfo.givenName != null && userInfo.familyName != null) {
      setUserDisplayName(userInfo.givenName + ' ' + userInfo.familyName);
    }
  }, [navigation, userInfo]);

  const onPressUserSettingsButton = useCallback(() => {
    setLoading(true);
    authgear
      .open(Page.Settings, {
        colorScheme: config.content?.colorScheme,
        wechatRedirectURI,
      })
      .catch(e => ShowError(e))
      .finally(() => {
        setLoading(false);
      });
  }, [config.content?.colorScheme]);

  const updateBiometricState = useCallback(() => {
    authgear
      .checkBiometricSupported(biometricOptions)
      .then(() => {
        authgear
          .isBiometricEnabled()
          .then(enabled => {
            setBiometricEnabled(enabled);
          })
          .catch(() => {
            // ignore the error.
          });
      })
      .catch(() => {
        // ignore the error.
      });
  }, []);

  const onPressEnableBiometricButton = useCallback(() => {
    setLoading(true);
    authgear
      .enableBiometric(biometricOptions)
      .catch(e => {
        ShowError(e);
      })
      .finally(() => {
        setLoading(false);
        updateBiometricState();
      });
  }, [updateBiometricState]);

  const onDisableBiometric = useCallback(() => {
    setDisableBiometricDialogVisble(false);
    setLoading(true);
    authgear
      .disableBiometric()
      .catch(e => {
        ShowError(e);
      })
      .finally(() => {
        setLoading(false);
        updateBiometricState();
      });
  }, [updateBiometricState]);

  const onPressPromoteUserButton = useCallback(() => {
    setLoading(true);
    authgear
      .promoteAnonymousUser({
        redirectURI,
        wechatRedirectURI,
        colorScheme: config.content?.colorScheme,
      })
      .then(result => {
        setUserInfo(result.userInfo);
      })
      .catch(e => ShowError(e))
      .finally(() => {
        setLoading(false);
      });
  }, [config.content?.colorScheme, setUserInfo]);

  const onReauthenticate = useCallback(() => {
    async function task() {
      await authgear.refreshIDToken();
      if (!authgear.canReauthenticate()) {
        throw new Error(
          'canReauthenticate() returns false for the current user',
        );
      }

      const result = await authgear.reauthenticate(
        {
          redirectURI,
          colorScheme: config.content?.colorScheme,
          wechatRedirectURI,
        },
        biometricOptions,
      );

      setUserInfo(result.userInfo);

      return true;
    }

    setReauthDialogVisble(false);
    setLoading(true);
    task()
      .then(success => {
        if (success) {
          setReauthSuccessDialogVisble(true);
        }
      })
      .catch(e => {
        ShowError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [config.content?.colorScheme, setUserInfo]);

  const onLogout = useCallback(() => {
    setLogoutDialogVisble(false);
    setLoading(true);
    authgear
      .logout()
      .then(() => {
        setDispatchAction(() => () => navigation.replace('Authentication'));
      })
      .catch(e => {
        ShowError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigation]);

  return (
    <>
      <LoadingSpinner loading={loading} />

      <Appbar.Header>
        <Appbar.Content title="Authgear Demo" />
        <Appbar.Action
          icon="information-outline"
          onPress={() => setInfoDialogVisible(true)}
        />
      </Appbar.Header>

      <Portal>
        <Dialog
          visible={infoDialogVisble}
          onDismiss={() => setInfoDialogVisible(false)}>
          <Dialog.Title>Configuration</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              Endpoint: {config.content?.endpoint}
            </Text>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              Client ID: {config.content?.clientID}
            </Text>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              AUTHUI Color Scheme:{' '}
              {config.content?.explicitColorScheme ?? 'System'}
            </Text>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              Transient Token Storage:{' '}
              {config.content?.useTransientTokenStorage.toString()}
            </Text>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              Share Session with Device Browser:{' '}
              {config.content?.shareSessionWithSystemBrowser.toString()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInfoDialogVisible(false)}>Dismiss</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={authTimeDialogVisble}
          onDismiss={() => setAuthTimeDialogVisble(false)}>
          <Dialog.Title>Auth Time</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              {authgear.getAuthTime()?.toISOString()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAuthTimeDialogVisble(false)}>
              Dismiss
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={logoutDialogVisble}
          onDismiss={() => setLogoutDialogVisble(false)}>
          <Dialog.Title>Logout?</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              Are you sure to logout?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisble(false)}>Cancel</Button>
            <Button onPress={onLogout}>Logout</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={reauthDialogVisble}
          onDismiss={() => setReauthDialogVisble(false)}>
          <Dialog.Title>Reauthenticate user?</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              The auth time will be updated after reauthentication. This is
              useful to identify the users before sensitive operations.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReauthDialogVisble(false)}>Cancel</Button>
            <Button onPress={onReauthenticate}>Re-auth</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={reauthSuccessDialogVisble}
          onDismiss={() => setReauthSuccessDialogVisble(false)}>
          <Dialog.Title>Reauth success</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              The auth time is now {authgear.getAuthTime()?.toISOString()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReauthSuccessDialogVisble(false)}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={disableBiometricDialogVisble}
          onDismiss={() => setDisableBiometricDialogVisble(false)}>
          <Dialog.Title>Disable Biometric Login?</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, {color: theme.colors.disabled}]}>
              This will remove the biometric key from this device.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDisableBiometricDialogVisble(false)}>
              Cancel
            </Button>
            <Button onPress={onDisableBiometric}>Disable</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.container}>
        <Text style={styles.contentText}>Welcome!</Text>

        <Card.Title
          title={userDisplayName}
          subtitle={userInfo?.sub}
          style={styles.userInfoCard}
        />

        <View style={styles.buttonContainer}>
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}
            onPress={() => navigation.navigate('UserInfo')}>
            <Text style={styles.contentText}>User Information</Text>
          </Button>
          <Divider />
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}
            onPress={onPressUserSettingsButton}>
            <Text style={styles.contentText}>User Settings</Text>
          </Button>
          <Divider />
          {userInfo?.isAnonymous ? null : (
            <>
              <Button
                compact={true}
                uppercase={false}
                contentStyle={styles.buttonContent}
                onPress={
                  biometricEnabled
                    ? () => setDisableBiometricDialogVisble(true)
                    : onPressEnableBiometricButton
                }>
                <Text style={styles.contentText}>
                  {biometricEnabled
                    ? 'Disable Biometric Login'
                    : 'Enable Biometric Login'}
                </Text>
              </Button>
              <Divider />
              <Button
                compact={true}
                uppercase={false}
                contentStyle={styles.buttonContent}
                onPress={() => setReauthDialogVisble(true)}>
                <Text style={styles.contentText}>Reauthenticate</Text>
              </Button>
              <Divider />
            </>
          )}
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}
            onPress={() => setAuthTimeDialogVisble(true)}>
            <Text style={styles.contentText}>Show Auth Time</Text>
          </Button>
          <Divider />
          {userInfo?.isAnonymous ? (
            <>
              <Button
                compact={true}
                uppercase={false}
                contentStyle={styles.buttonContent}
                onPress={onPressPromoteUserButton}>
                <Text style={styles.contentText}>Promote User</Text>
              </Button>
              <Divider />
            </>
          ) : null}
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}
            onPress={() => setLogoutDialogVisble(true)}>
            <Text style={{...styles.contentText, color: theme.colors.error}}>
              Logout
            </Text>
          </Button>
          <Divider />
        </View>
      </View>
    </>
  );
};

export default UserPanelScreen;
