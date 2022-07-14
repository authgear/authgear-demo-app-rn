import React, {useCallback, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme, Button, Text} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../App';
import {getConfigFromStorage} from './ConfigurationScreen';

const styles = StyleSheet.create({
  container: {
    margin: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  titleText: {
    marginTop: 60,
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
  },
  button: {
    marginBottom: 20,
    width: '100%',
    textAlign: 'center',
  },
});

type AuthenticationScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Authentication'
>;

const AuthenticationScreen: React.FC<AuthenticationScreenProps> = props => {
  const theme = useTheme();
  const navigation = props.navigation;

  useEffect(() => {
    const checkIfConfigExists = async () => {
      const config = await getConfigFromStorage();
      if (config == null) {
        navigation.replace('Configuration');
      }
    };
    checkIfConfigExists();
  }, [navigation]);

  const onPressConfigButton = useCallback(() => {
    return navigation.navigate('Configuration', {fromButton: true});
  }, [navigation]);

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
        <Button mode="contained" style={styles.button}>
          Signup
        </Button>
        <Button mode="outlined" style={styles.button}>
          Login
        </Button>
        <Button mode="outlined" style={styles.button}>
          Login with biometric
        </Button>
        <Button mode="outlined" style={styles.button}>
          Continue as guest
        </Button>
      </View>
    </View>
  );
};

export default AuthenticationScreen;
