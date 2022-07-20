import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
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
import {useUserInfo} from '../context/UserInfoProvider';

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  contentText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },

  userInfoCard: {
    backgroundColor: '#F5F5F5',
    marginVertical: 16,
  },

  buttonContainer: {
    marginVertical: 8,
  },
  button: {
    flexDirection: 'row',
    marginVertical: 8,
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
  const [infoDialogVisble, setInfoDialogVisible] = useState(false);

  return (
    <>
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
            <Text>Hi</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInfoDialogVisible(false)}>Dismiss</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.container}>
        <Text style={styles.contentText}>Welcome!</Text>

        <Card.Title
          title={userInfo?.isAnonymous ? 'Guest' : userInfo?.name}
          subtitle={userInfo?.sub}
          style={styles.userInfoCard}
        />

        <View style={styles.buttonContainer}>
          <Button compact={true} uppercase={false} style={styles.button}>
            <Text style={styles.contentText}>User Information</Text>
          </Button>
          <Divider />
          <Button compact={true} uppercase={false} style={styles.button}>
            <Text style={styles.contentText}>User Settings</Text>
          </Button>
          <Divider />
          <Button compact={true} uppercase={false} style={styles.button}>
            <Text style={styles.contentText}>Enable Biometric Login</Text>
          </Button>
          <Divider />
          <Button compact={true} uppercase={false} style={styles.button}>
            <Text style={styles.contentText}>Reauthenticate</Text>
          </Button>
          <Divider />
          <Button compact={true} uppercase={false} style={styles.button}>
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
