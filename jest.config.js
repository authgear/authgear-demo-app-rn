module.exports = {
  preset: '@react-native/jest-preset',
  // react-native-app-auth (and its react-native-base64 dependency) ship
  // untranspiled ESM, so they need to go through babel-jest like RN itself.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-app-auth|react-native-base64)/)',
  ],
};
