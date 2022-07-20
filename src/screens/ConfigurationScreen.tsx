import React, {useCallback, useMemo, useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme,
  Alert,
  SafeAreaView,
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
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../App';
import {useConfig} from '../context/ConfigProvider';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    justifyContent: 'space-between',
  },
  titleText: {
    marginTop: 40,
    marginBottom: 6,
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 36,
  },
  subTitleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  textInputs: {
    marginVertical: 16,
  },
  textInput: {
    marginVertical: 8,
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

  buttonContainer: {
    marginVertical: 32,
  },
  button: {
    marginBottom: 16,
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
  const fromButton = props.route.params?.fromButton;

  const config = useConfig();

  const [endpoint, setEndpoint] = useState<string>(
    config.content?.endpoint ?? '',
  );
  const [clientID, setClientID] = useState<string>(
    config.content?.clientID ?? '',
  );
  const [explicitColorScheme, setExplicitColorScheme] =
    useState<ColorScheme | null>(config.content?.explicitColorScheme ?? null);
  const [useTransientTokenStorage, setUseTransientTokenStorage] =
    useState<boolean>(config.content?.useTransientTokenStorage ?? false);
  const [shareSessionWithSystemBrowser, setShareSessionWithSystemBrowser] =
    useState<boolean>(config.content?.shareSessionWithSystemBrowser ?? false);
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

  const onSave = useCallback(async () => {
    if (clientID === '' || endpoint === '') {
      Alert.alert('Error', 'Please fill in client ID and endpoint');
      return;
    }

    const newConfig = {
      clientID,
      endpoint,
      colorScheme,
      explicitColorScheme,
      useTransientTokenStorage,
      shareSessionWithSystemBrowser,
    };
    config.setContent(newConfig);

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.replace('Authentication');
  }, [
    clientID,
    colorScheme,
    config,
    endpoint,
    explicitColorScheme,
    navigation,
    shareSessionWithSystemBrowser,
    useTransientTokenStorage,
  ]);

  const onCancelButtonClick = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View>
          <Text style={styles.titleText}>Authgear Demo</Text>
          <Text style={{...styles.subTitleText, color: theme.colors.disabled}}>
            Configuration
          </Text>
        </View>

        <View style={styles.textInputs}>
          <TextInput
            style={styles.textInput}
            mode="outlined"
            label="Client ID"
            value={clientID}
            onChangeText={setClientID}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.textInput}
            mode="outlined"
            label="Authgear Endpoint"
            value={endpoint}
            onChangeText={setEndpoint}
            autoCapitalize="none"
          />
        </View>

        <View>
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

          <View style={styles.buttonContainer}>
            <Button mode="contained" style={styles.button} onPress={onSave}>
              Save
            </Button>
            {fromButton ? (
              <Button
                mode="outlined"
                style={styles.button}
                onPress={onCancelButtonClick}>
                Cancel
              </Button>
            ) : (
              <></>
            )}
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ConfigurationScreen;
