import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  Divider,
  MD2Theme,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';
import { biometricOptions, RootStackParamList } from '../App';
import { useConfig } from '../context/ConfigProvider';
import ShowError from '../ShowError';
import authgear, { Page, UserInfo } from '@authgear/react-native';
import LoadingSpinner from '../LoadingSpinner';
import { redirectURI, wechatRedirectURI } from '../App';
import { useUser } from '../context/UserProvider';

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

const UserPanelScreen: React.FC<UserPanelScreenProps> = (props) => {
  const navigation = props.navigation;
  const theme = useTheme<MD2Theme>();
  const config = useConfig();
  const user = useUser();

  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [authTimeDialogVisible, setAuthTimeDialogVisible] = useState(false);
  const [disableBiometricDialogVisible, setDisableBiometricDialogVisible] =
    useState(false);
  const [reauthDialogVisible, setReauthDialogVisible] = useState(false);
  const [reauthSuccessDialogVisible, setReauthSuccessDialogVisible] =
    useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchAction, setDispatchAction] = useState<(() => void) | null>(
    null
  );
  const [userInfo, setUserInfo] = useState<UserInfo | null>(
    props.route.params?.userInfo ?? null
  );

  useEffect(() => {
    if (user.sessionState !== 'AUTHENTICATED') {
      setDispatchAction(() => () => navigation.replace('Authentication'));
    }
  }, [navigation, user.sessionState]);

  const updateUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authgear.fetchUserInfo();
      setUserInfo(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (dispatchAction == null) {
      return;
    }

    // Give buffer time for spinner to disappear
    setTimeout(dispatchAction, 100);
    setDispatchAction(null);
  }, [dispatchAction, loading]);

  useEffect(() => {
    if (userInfo == null) {
      updateUserInfo().catch((e) => {
        ShowError(e);
        setDispatchAction(() => () => navigation.replace('Authentication'));
      });
    }
  }, [navigation, updateUserInfo, userInfo]);

  const userDisplayName = useMemo(() => {
    if (userInfo == null) {
      return;
    }

    if (userInfo.isAnonymous) {
      return 'Guest';
    }
    if (userInfo.name != null) {
      return userInfo.name;
    }
    if (userInfo.nickname != null) {
      return userInfo.nickname;
    }
    if (userInfo.preferredUsername != null) {
      return userInfo.preferredUsername;
    }
    if (
      userInfo.givenName != null &&
      userInfo.middleName != null &&
      userInfo.familyName != null
    ) {
      return (
        userInfo.givenName +
        ' ' +
        userInfo.middleName +
        ' ' +
        userInfo.familyName
      );
    }
    if (userInfo.givenName != null && userInfo.familyName != null) {
      return userInfo.givenName + ' ' + userInfo.familyName;
    }
    if (userInfo.givenName != null) {
      return userInfo.givenName;
    }
    if (userInfo.familyName != null) {
      return userInfo.familyName;
    }
    if (userInfo.email != null) {
      return userInfo.email;
    }
    if (userInfo.phoneNumber != null) {
      return userInfo.phoneNumber;
    }
  }, [userInfo]);

  const onPressUserInfoButton = useCallback(() => {
    async function navigateToUserInfoScreen() {
      setLoading(true);
      try {
        const result = await updateUserInfo();
        setDispatchAction(
          () => () => navigation.navigate('UserInfo', { userInfo: result })
        );
      } finally {
        setLoading(false);
      }
    }

    navigateToUserInfoScreen().catch((e) => {
      ShowError(e);
      setDispatchAction(() => () => navigation.replace('Authentication'));
    });
  }, [navigation, updateUserInfo]);

  const onPressUserSettingsButton = useCallback(() => {
    async function userSettings() {
      setLoading(true);
      try {
        await authgear.open(Page.Settings, {
          colorScheme: config.content?.colorScheme,
          wechatRedirectURI,
        });
      } finally {
        try {
          await updateUserInfo();
        } catch (e) {
          ShowError(e);
        } finally {
          setLoading(false);
        }
      }
    }

    userSettings().catch((e) => {
      ShowError(e);
    });
  }, [config.content?.colorScheme, updateUserInfo]);

  const onPressEnableBiometricButton = useCallback(() => {
    async function enableBiometric() {
      setLoading(true);
      try {
        await authgear.checkBiometricSupported(biometricOptions);
        await authgear.enableBiometric(biometricOptions);
      } finally {
        setLoading(false);
        user.updateState(authgear);
      }
    }

    enableBiometric().catch((e) => {
      ShowError(e);
    });
  }, [user]);

  const onDisableBiometric = useCallback(() => {
    async function disableBiometric() {
      setDisableBiometricDialogVisible(false);
      setLoading(true);
      try {
        await authgear.disableBiometric();
      } finally {
        setLoading(false);
        user.updateState(authgear);
      }
    }

    disableBiometric().catch((e) => {
      ShowError(e);
    });
  }, [user]);

  const onPressPromoteUserButton = useCallback(() => {
    async function promoteUser() {
      setLoading(true);
      try {
        const result = await authgear.promoteAnonymousUser({
          redirectURI,
          wechatRedirectURI,
          colorScheme: config.content?.colorScheme,
        });
        setUserInfo(result.userInfo);
      } finally {
        setLoading(false);
      }
    }

    promoteUser().catch((e) => {
      ShowError(e);
    });
  }, [config.content?.colorScheme, setUserInfo]);

  const onReauthenticate = useCallback(() => {
    async function reauth() {
      setReauthDialogVisible(false);
      setLoading(true);
      try {
        await authgear.refreshIDToken();
        if (!authgear.canReauthenticate()) {
          throw new Error(
            'canReauthenticate() returns false for the current user'
          );
        }

        const result = await authgear.reauthenticate(
          {
            redirectURI,
            colorScheme: config.content?.colorScheme,
            wechatRedirectURI,
          },
          biometricOptions
        );
        setUserInfo(result.userInfo);
        setReauthSuccessDialogVisible(true);
      } finally {
        setLoading(false);
      }
    }

    reauth().catch((e) => {
      ShowError(e);
    });
  }, [config.content?.colorScheme, setUserInfo]);

  const onLogout = useCallback(() => {
    async function logout() {
      setLogoutDialogVisible(false);
      setLoading(true);
      try {
        await authgear.logout();
      } finally {
        setLoading(false);
      }
    }

    logout().catch((e) => {
      ShowError(e);
    });
  }, []);

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
          visible={infoDialogVisible}
          onDismiss={() => setInfoDialogVisible(false)}
        >
          <Dialog.Title>Configuration</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              Endpoint: {config.content?.endpoint}
            </Text>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              Client ID: {config.content?.clientID}
            </Text>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              AUTHUI Color Scheme:{' '}
              {config.content?.explicitColorScheme ?? 'System'}
            </Text>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              Logout upon app quit (Transient TokenStorage):{' '}
              {config.content?.useTransientTokenStorage.toString()}
            </Text>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              Share Session with Device Browser (Enable SSO):{' '}
              {config.content?.shareSessionWithSystemBrowser.toString()}
            </Text>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              Webkit Webview:{' '}
              {config.content?.useWebkitWebView?.toString() ?? 'false'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInfoDialogVisible(false)}>Dismiss</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={authTimeDialogVisible}
          onDismiss={() => setAuthTimeDialogVisible(false)}
        >
          <Dialog.Title>Auth Time</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              {authgear.getAuthTime()?.toISOString()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAuthTimeDialogVisible(false)}>
              Dismiss
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
        >
          <Dialog.Title>Logout?</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              Are you sure to logout?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={onLogout}>Logout</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={reauthDialogVisible}
          onDismiss={() => setReauthDialogVisible(false)}
        >
          <Dialog.Title>Reauthenticate user?</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              The auth time will be updated after reauthentication. This is
              useful to identify the users before sensitive operations.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReauthDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={onReauthenticate}>Re-auth</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={reauthSuccessDialogVisible}
          onDismiss={() => setReauthSuccessDialogVisible(false)}
        >
          <Dialog.Title>Reauth success</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              The auth time is now {authgear.getAuthTime()?.toISOString()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReauthSuccessDialogVisible(false)}>
              Dismiss
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={disableBiometricDialogVisible}
          onDismiss={() => setDisableBiometricDialogVisible(false)}
        >
          <Dialog.Title>Disable Biometric Login?</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
              This will remove the biometric key from this device.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDisableBiometricDialogVisible(false)}>
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
          style={[
            styles.userInfoCard,
            // @ts-expect-error
            { backgroundColor: theme.colors.shadedBackground },
          ]}
        />

        <View style={styles.buttonContainer}>
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}
            onPress={onPressUserInfoButton}
          >
            <Text style={styles.contentText}>User Information</Text>
          </Button>
          <Divider />
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}
            onPress={onPressUserSettingsButton}
          >
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
                  user.isBiometricEnabled
                    ? () => setDisableBiometricDialogVisible(true)
                    : onPressEnableBiometricButton
                }
              >
                <Text style={styles.contentText}>
                  {user.isBiometricEnabled
                    ? 'Disable Biometric Login'
                    : 'Enable Biometric Login'}
                </Text>
              </Button>
              <Divider />
              <Button
                compact={true}
                uppercase={false}
                contentStyle={styles.buttonContent}
                onPress={() => setReauthDialogVisible(true)}
              >
                <Text style={styles.contentText}>Reauthenticate</Text>
              </Button>
              <Divider />
            </>
          )}
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}
            onPress={() => setAuthTimeDialogVisible(true)}
          >
            <Text style={styles.contentText}>Show Auth Time</Text>
          </Button>
          <Divider />
          {userInfo?.isAnonymous ? (
            <>
              <Button
                compact={true}
                uppercase={false}
                contentStyle={styles.buttonContent}
                onPress={onPressPromoteUserButton}
              >
                <Text style={styles.contentText}>Promote User</Text>
              </Button>
              <Divider />
            </>
          ) : null}
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}
            onPress={() => setLogoutDialogVisible(true)}
          >
            <Text style={{ ...styles.contentText, color: theme.colors.error }}>
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
