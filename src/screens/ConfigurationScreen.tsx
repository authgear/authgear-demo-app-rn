import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  useColorScheme,
  Alert,
  SafeAreaView,
  ScrollView,
  Pressable,
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
import { ColorScheme } from '@authgear/react-native';
import RadioGroup, { RadioGroupItemProps } from '../RadioGroup';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { defaultConfig, useConfig } from '../context/ConfigProvider';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
  },
  contentContainer: {
    flex: 1,
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
    marginVertical: 8,
  },
  textInput: {
    marginVertical: 8,
  },

  colorSchemeLabelButton: {
    paddingVertical: 12,
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
  buttonContent: {
    height: 48,
  },
  buttonText: {
    fontSize: 16,
  },
});

const colorSchemeItems: RadioGroupItemProps<ColorScheme | null>[] = [
  {
    label: 'Use system',
    value: null,
  },
  {
    label: 'Light',
    value: ColorScheme.Light,
  },
  {
    label: 'Dark',
    value: ColorScheme.Dark,
  },
];

type ConfigurationScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Configuration'
>;

function useCorrectedColorScheme(): ColorScheme | undefined {
  const native = useColorScheme();
  if (native === 'light') {
    return ColorScheme.Light;
  }
  if (native === 'dark') {
    return ColorScheme.Dark;
  }
  return undefined;
}

const ConfigurationScreen: React.FC<ConfigurationScreenProps> = (props) => {
  const theme = useTheme();
  const navigation = props.navigation;
  const fromButton = props.route.params?.fromButton;

  const config = useConfig();

  const [endpoint, setEndpoint] = useState<string>(
    config.content?.endpoint ?? defaultConfig.endpoint
  );
  const [clientID, setClientID] = useState<string>(
    config.content?.clientID ?? defaultConfig.clientID
  );
  const [explicitColorScheme, setExplicitColorScheme] =
    useState<ColorScheme | null>(config.content?.explicitColorScheme ?? null);
  const [useTransientTokenStorage, setUseTransientTokenStorage] =
    useState<boolean>(config.content?.useTransientTokenStorage ?? false);
  const [shareSessionWithSystemBrowser, setShareSessionWithSystemBrowser] =
    useState<boolean>(config.content?.shareSessionWithSystemBrowser ?? false);
  const [isColorSchemeDialogVisible, setIsColorSchemeDialogVisible] =
    useState<boolean>(false);

  const systemColorScheme = useCorrectedColorScheme();

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View>
          <Text style={styles.titleText}>Authgear Demo</Text>
          <Text
            style={{ ...styles.subTitleText, color: theme.colors.disabled }}
          >
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
          <Pressable
            style={styles.colorSchemeLabelButton}
            onPress={showColorSchemeDialog}
          >
            <View style={styles.colorSchemeLabel}>
              <Text style={styles.labelText}>AuthUI Color Scheme</Text>
              <Text
                style={{ ...styles.labelText, color: theme.colors.disabled }}
              >
                {colorSchemeLabel}
              </Text>
            </View>
          </Pressable>
          <Divider />

          <Portal>
            <Dialog
              visible={isColorSchemeDialogVisible}
              onDismiss={hideColorSchemeDialog}
            >
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

          <Pressable
            onPress={() =>
              setUseTransientTokenStorage(!useTransientTokenStorage)
            }
          >
            <View style={styles.switch}>
              <Text style={styles.labelText}>Transient TokenStorage</Text>
              <Switch
                color={theme.colors.primary}
                value={useTransientTokenStorage}
                onValueChange={setUseTransientTokenStorage}
              />
            </View>
          </Pressable>
          <Divider />

          <Pressable
            onPress={() =>
              setShareSessionWithSystemBrowser(!shareSessionWithSystemBrowser)
            }
          >
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
          </Pressable>
          <Divider />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonText}
              onPress={onSave}
            >
              Save
            </Button>
            {fromButton ? (
              <Button
                mode="outlined"
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonText}
                onPress={onCancelButtonClick}
              >
                Cancel
              </Button>
            ) : (
              <></>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConfigurationScreen;
