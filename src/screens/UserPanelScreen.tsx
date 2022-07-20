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
import {RootStackParamList} from '../App';
import {useConfig} from '../context/ConfigProvider';
import {useUserInfo} from '../context/UserInfoProvider';
import ShowError from '../ShowError';
import authgear, {Page} from '@authgear/react-native';
import LoadingSpinner from '../LoadingSpinner';
import {wechatRedirectURI} from './AuthenticationScreen';

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  contentText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },

  configDialogText: {
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
  const {userInfo} = useUserInfo();
  const config = useConfig();

  const [infoDialogVisble, setInfoDialogVisible] = useState(false);
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const onPressLogoutButton = useCallback(() => {
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
        <Dialog visible={infoDialogVisble}>
          <Dialog.Title>Configuration</Dialog.Title>
          <Dialog.Content>
            <Text
              style={[styles.configDialogText, {color: theme.colors.disabled}]}>
              Endpoint: {config.content?.endpoint}
            </Text>
            <Text
              style={[styles.configDialogText, {color: theme.colors.disabled}]}>
              Client ID: {config.content?.clientID}
            </Text>
            <Text
              style={[styles.configDialogText, {color: theme.colors.disabled}]}>
              AUTHUI Color Scheme:{' '}
              {config.content?.explicitColorScheme ?? 'System'}
            </Text>
            <Text
              style={[styles.configDialogText, {color: theme.colors.disabled}]}>
              Transient Token Storage:{' '}
              {config.content?.useTransientTokenStorage.toString()}
            </Text>
            <Text
              style={[styles.configDialogText, {color: theme.colors.disabled}]}>
              Share Session with Device Browser:{' '}
              {config.content?.shareSessionWithSystemBrowser.toString()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInfoDialogVisible(false)}>Dismiss</Button>
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
                contentStyle={styles.buttonContent}>
                <Text style={styles.contentText}>Enable Biometric Login</Text>
              </Button>
              <Divider />
              <Button
                compact={true}
                uppercase={false}
                contentStyle={styles.buttonContent}>
                <Text style={styles.contentText}>Reauthenticate</Text>
              </Button>
              <Divider />
            </>
          )}
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}>
            <Text style={styles.contentText}>Show Auth Time</Text>
          </Button>
          <Divider />
          {userInfo?.isAnonymous ? (
            <>
              <Button
                compact={true}
                uppercase={false}
                contentStyle={styles.buttonContent}>
                <Text style={styles.contentText}>Promote User</Text>
              </Button>
              <Divider />
            </>
          ) : null}
          <Button
            compact={true}
            uppercase={false}
            contentStyle={styles.buttonContent}
            onPress={onPressLogoutButton}>
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
