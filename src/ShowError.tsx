import {
  CancelError,
  BiometricPrivateKeyNotFoundError,
  BiometricNoEnrollmentError,
  BiometricNotSupportedOrPermissionDeniedError,
  BiometricNoPasscodeError,
  BiometricLockoutError,
} from '@authgear/react-native';
import { Platform, Alert } from 'react-native';

const ShowError = (e: any) => {
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

export default ShowError;
