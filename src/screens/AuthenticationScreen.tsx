import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Text} from 'react-native-paper';

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
    color: 'rgba(0, 0, 0, 0.6)',
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

const AuthenticationScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.titleText}>Authgear Demo</Text>
        <Text style={styles.subTitleText}>https://demo.authgear.apps.com/</Text>
        <View style={styles.configButton}>
          <Button mode="text">Configure</Button>
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
