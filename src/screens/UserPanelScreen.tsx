import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { biometricOptions, RootStackParamList } from '../App';
import { useConfig } from '../context/ConfigProvider';
import ShowError from '../ShowError';
import authgear, { Page, UserInfo } from '@authgear/react-native';
import LoadingSpinner from '../LoadingSpinner';
import { redirectURI, wechatRedirectURI } from '../App';
import { useBiometric } from '../context/BiometricProvider';

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

const UserPanelScreen: React.FC<UserPanelScreenProps> = (props) => {
  const navigation = props.navigation;
  const theme = useTheme();
  const config = useConfig();
  const biometric = useBiometric();

  const [infoDialogVisble, setInfoDialogVisible] = useState(false);
  const [authTimeDialogVisble, setAuthTimeDialogVisble] = useState(false);
  const [disableBiometricDialogVisble, setDisableBiometricDialogVisble] =
    useState(false);
  const [reauthDialogVisble, setReauthDialogVisble] = useState(false);
  const [reauthSuccessDialogVisble, setReauthSuccessDialogVisble] =
    useState(false);
  const [logoutDialogVisble, setLogoutDialogVisble] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchAction, setDispatchAction] = useState<(() => void) | null>(
    null
  );
  const [userInfo, setUserInfo] = useState<UserInfo | null>(
    props.route.params?.userInfo ?? null
  );

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

    // Give buffer time for spinner to disapear
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
    if (userInfo.phoneNumber != null) {
      return userInfo.phoneNumber;
    }
    if (userInfo.email != null) {
      return userInfo.email;
    }
    if (userInfo.givenName != null) {
      return userInfo.givenName;
    }
    if (userInfo.familyName != null) {
      return userInfo.familyName;
    }
    if (userInfo.givenName != null && userInfo.familyName != null) {
      return userInfo.givenName + ' ' + userInfo.familyName;
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
        await authgear.enableBiometric(biometricOptions);
      } finally {
        setLoading(false);
        biometric.updateState();
      }
    }

    enableBiometric().catch((e) => {
      ShowError(e);
    });
  }, [biometric]);

  const onDisableBiometric = useCallback(() => {
    async function disableBiometric() {
      setDisableBiometricDialogVisble(false);
      setLoading(true);
      try {
        await authgear.disableBiometric();
      } finally {
        setLoading(false);
        biometric.updateState();
      }
    }

    disableBiometric().catch((e) => {
      ShowError(e);
    });
  }, [biometric]);

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
        biometric.updateState();
        setLoading(false);
      }
    }

    promoteUser().catch((e) => {
      ShowError(e);
    });
  }, [biometric, config.content?.colorScheme, setUserInfo]);

  const onReauthenticate = useCallback(() => {
    async function reauth() {
      setReauthDialogVisble(false);
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
      } finally {
        setReauthSuccessDialogVisble(true);
        setLoading(false);
      }
    }

    reauth().catch((e) => {
      ShowError(e);
    });
  }, [config.content?.colorScheme, setUserInfo]);

  const onLogout = useCallback(() => {
    async function logout() {
      setLogoutDialogVisble(false);
      setLoading(true);
      try {
        await authgear.logout();
      } finally {
        setDispatchAction(() => () => navigation.replace('Authentication'));
        setLoading(false);
      }
    }

    logout().catch((e) => {
      ShowError(e);
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
              Transient Token Storage:{' '}
              {config.content?.useTransientTokenStorage.toString()}
            </Text>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
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
          onDismiss={() => setAuthTimeDialogVisble(false)}
        >
          <Dialog.Title>Auth Time</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
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
          onDismiss={() => setLogoutDialogVisble(false)}
        >
          <Dialog.Title>Logout?</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
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
          onDismiss={() => setReauthDialogVisble(false)}
        >
          <Dialog.Title>Reauthenticate user?</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
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
          onDismiss={() => setReauthSuccessDialogVisble(false)}
        >
          <Dialog.Title>Reauth success</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
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
          onDismiss={() => setDisableBiometricDialogVisble(false)}
        >
          <Dialog.Title>Disable Biometric Login?</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.disabled }]}>
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
                  biometric.enabled
                    ? () => setDisableBiometricDialogVisble(true)
                    : onPressEnableBiometricButton
                }
              >
                <Text style={styles.contentText}>
                  {biometric.enabled
                    ? 'Disable Biometric Login'
                    : 'Enable Biometric Login'}
                </Text>
              </Button>
              <Divider />
              <Button
                compact={true}
                uppercase={false}
                contentStyle={styles.buttonContent}
                onPress={() => setReauthDialogVisble(true)}
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
            onPress={() => setAuthTimeDialogVisble(true)}
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
            onPress={() => setLogoutDialogVisble(true)}
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
