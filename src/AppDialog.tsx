import React from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { MD2Theme, useTheme } from 'react-native-paper';

interface AppDialogProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}

// react-native-paper's Modal (which Dialog and Portal-based overlays build on)
// lays out its backdrop and content as a stacked column on React Native 0.86
// new architecture — its absolute-fill wrapper loses its absolute position, so
// the backdrop covers only part of the screen and the dialog drifts to the
// bottom. This dialog avoids paper's Modal entirely: a native Modal with our
// own backdrop and centered card. Use paper's Dialog.Title / Dialog.Content /
// Dialog.Actions (plain views) as children.
const AppDialog: React.FC<AppDialogProps> = ({
  visible,
  onDismiss,
  children,
}) => {
  const theme = useTheme<MD2Theme>();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}
        onPress={onDismiss}
      >
        {/* Swallow presses on the card so they do not dismiss the dialog. */}
        <Pressable
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() => {}}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 26,
    borderRadius: 4,
    elevation: 24,
  },
});

export default AppDialog;
