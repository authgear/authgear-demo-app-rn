import React from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

interface LoadingSpinnerProps {
  loading: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = (props) => {
  const loading = props.loading;

  return (
    <ActivityIndicator
      animating={loading}
      style={loading ? [styles.loading, { zIndex: 1 }] : styles.loading}
    />
  );
};

export default LoadingSpinner;
