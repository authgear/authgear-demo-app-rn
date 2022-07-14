import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme,
  Alert,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../App';

interface Config {
  clientID: string;
  endpoint: string;
  colorScheme?: ColorScheme;
  explicitColorScheme: ColorScheme | null;
  useTransientTokenStorage: boolean;
  shareSessionWithSystemBrowser: boolean;
}

export async function getConfigFromStorage(): Promise<Config | null> {
  try {
    const configString = await AsyncStorage.getItem('config');
    return configString != null ? JSON.parse(configString) : null;
  } catch (e: any) {
    Alert.alert('Error', String(e));
    return null;
  }
}

async function saveConfigToStorage(config: Config) {
  try {
    const configString = JSON.stringify(config);
    await AsyncStorage.setItem('config', configString);
  } catch (e: any) {
    Alert.alert('Error', String(e));
  }
}

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

type ConfigurationScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Configuration'
>;

const ConfigurationScreen: React.FC<ConfigurationScreenProps> = props => {
  const theme = useTheme();
  const navigation = props.navigation;

  const [endpoint, setEndpoint] = useState<string>('');
  const [clientID, setClientID] = useState<string>('');
  const [explicitColorScheme, setExplicitColorScheme] =
    useState<ColorScheme | null>(null);
  const [useTransientTokenStorage, setUseTransientTokenStorage] =
    useState<boolean>(false);
  const [shareSessionWithSystemBrowser, setShareSessionWithSystemBrowser] =
    useState<boolean>(false);
  const [isColorSchemeDialogVisible, setIsColorSchemeDialogVisible] =
    useState<boolean>(false);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await getConfigFromStorage();
      if (config == null) {
        return;
      }

      setClientID(config.clientID);
      setEndpoint(config.endpoint);
      setExplicitColorScheme(config.explicitColorScheme);
      setUseTransientTokenStorage(config.useTransientTokenStorage);
      setShareSessionWithSystemBrowser(config.shareSessionWithSystemBrowser);
    };
    loadConfig();
  }, []);

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

  const onSave = useCallback(async () => {
    if (clientID === '' || endpoint === '') {
      Alert.alert('Error', 'Please fill in client ID and endpoint');
      return;
    }

    const config = {
      clientID,
      endpoint,
      colorScheme,
      explicitColorScheme,
      useTransientTokenStorage,
      shareSessionWithSystemBrowser,
    };
    saveConfigToStorage(config);

    navigation.navigate('Authentication');
  }, [
    clientID,
    colorScheme,
    endpoint,
    explicitColorScheme,
    navigation,
    shareSessionWithSystemBrowser,
    useTransientTokenStorage,
  ]);

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
              autoCapitalize="none"
            />
            <TextInput
              style={styles.textInput}
              mode="outlined"
              label="Client ID"
              value={clientID}
              onChangeText={setClientID}
              autoCapitalize="none"
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
              value={useTransientTokenStorage}
              onValueChange={setUseTransientTokenStorage}
            />
          </View>
          <Divider />

          <View style={styles.switch}>
            <Text style={styles.labelText}>
              Share Session with Device Browser
            </Text>
            <Switch
              color={theme.colors.primary}
              value={shareSessionWithSystemBrowser}
              onValueChange={setShareSessionWithSystemBrowser}
            />
          </View>
          <Divider />

          <Button mode="contained" style={styles.saveButton} onPress={onSave}>
            Save
          </Button>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ConfigurationScreen;
