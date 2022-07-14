import React, {useCallback, useMemo, useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme,
} from 'react-native';
import {
  useTheme,
  Button,
  TextInput,
  Text,
  Switch,
  Divider,
  Portal,
  Dialog,
} from 'react-native-paper';
import {ColorScheme} from '@authgear/react-native';
import RadioGroup, {RadioGroupItemProps} from '../RadioGroup';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
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

  textInputs: {
    marginVertical: 25,
  },
  textInput: {
    marginVertical: 15,
  },

  colorSchemeLabelButton: {
    marginHorizontal: -8,
  },
  colorSchemeLabelButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  colorSchemeLabel: {
    flexDirection: 'column',
  },

  switch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },

  saveButton: {
    marginVertical: 46,
  },
});

const colorSchemeItems: RadioGroupItemProps<ColorScheme | null>[] = [
  {
    label: 'Use system',
    value: null,
  },
  {
    label: 'Light',
    value: 'light',
  },
  {
    label: 'Dark',
    value: 'dark',
  },
];

const ConfigurationScreen: React.FC = () => {
  const theme = useTheme();
  const [endpoint, setEndpoint] = useState<string>('');
  const [clientID, setClientID] = useState<string>('');
  const [explicitColorScheme, setExplicitColorScheme] =
    useState<ColorScheme | null>(null);
  const [isTokenStorageEnabled, setIsTokenStorageEnabled] =
    useState<boolean>(false);
  const [isShareSessionEnabled, setIsShareSessionEnabled] =
    useState<boolean>(false);
  const [isColorSchemeDialogVisible, setIsColorSchemeDialogVisible] =
    useState<boolean>(false);

  const systemColorSchemeNull = useColorScheme();
  const systemColorScheme = systemColorSchemeNull ?? undefined;

  const colorScheme = explicitColorScheme ?? systemColorScheme;

  const colorSchemeLabel = useMemo(() => {
    if (explicitColorScheme === 'dark') {
      return 'Dark';
    }
    if (explicitColorScheme === 'light') {
      return 'Light';
    }
    return 'System';
  }, [explicitColorScheme]);

  const showColorSchemeDialog = useCallback(() => {
    setIsColorSchemeDialogVisible(true);
  }, [setIsColorSchemeDialogVisible]);

  const hideColorSchemeDialog = useCallback(() => {
    setIsColorSchemeDialogVisible(false);
  }, [setIsColorSchemeDialogVisible]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View>
          <Text style={styles.titleText}>Authgear Demo</Text>
          <Text style={{...styles.subTitleText, color: theme.colors.disabled}}>
            Configuration
          </Text>
        </View>

        <View>
          <View style={styles.textInputs}>
            <TextInput
              style={styles.textInput}
              mode="outlined"
              label="Authgear Endpoint"
              value={endpoint}
              onChangeText={setEndpoint}
            />
            <TextInput
              style={styles.textInput}
              mode="outlined"
              label="Client ID"
              value={clientID}
              onChangeText={setClientID}
            />
          </View>

          <Button
            mode="text"
            compact={true}
            uppercase={false}
            style={styles.colorSchemeLabelButton}
            contentStyle={styles.colorSchemeLabelButtonContent}
            onPress={showColorSchemeDialog}>
            <View style={styles.colorSchemeLabel}>
              <Text style={styles.labelText}>AUTHUI Color Scheme</Text>
              <Text style={{...styles.labelText, color: theme.colors.disabled}}>
                {colorSchemeLabel}
              </Text>
            </View>
          </Button>
          <Divider />

          <Portal>
            <Dialog
              visible={isColorSchemeDialogVisible}
              onDismiss={hideColorSchemeDialog}>
              <Dialog.Title>Color Scheme</Dialog.Title>
              <Dialog.Content>
                <RadioGroup
                  items={colorSchemeItems}
                  value={explicitColorScheme}
                  onChange={setExplicitColorScheme}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={hideColorSchemeDialog}>Done</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          <View style={styles.switch}>
            <Text style={styles.labelText}>Transient TokenStorage</Text>
            <Switch
              color={theme.colors.primary}
              value={isTokenStorageEnabled}
              onValueChange={setIsTokenStorageEnabled}
            />
          </View>
          <Divider />

          <View style={styles.switch}>
            <Text style={styles.labelText}>
              Share Session with Device Browser
            </Text>
            <Switch
              color={theme.colors.primary}
              value={isShareSessionEnabled}
              onValueChange={setIsShareSessionEnabled}
            />
          </View>
          <Divider />

          <Button mode="contained" style={styles.saveButton}>
            Save
          </Button>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ConfigurationScreen;
