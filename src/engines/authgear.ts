import authgear, {
  PersistentTokenStorage,
  TransientTokenStorage,
  UIImplementation,
  WebKitWebViewUIImplementation,
} from '@authgear/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthgearProvider } from '../providers/types';
import { randomId } from '../util/id';
import { CustomWebViewUIImplementation } from './customWebView';

const CONTAINER_NAME_KEY = 'authgear.container.name';

// The anonymous-user key is tied to the container name. A fixed name across
// endpoints causes invalid-credentials errors, so we use a distinct name per
// install. See https://github.com/authgear/authgear-demo-app-rn/issues/31
async function getDistinctNamePerInstall(): Promise<string> {
  const existing = await AsyncStorage.getItem(CONTAINER_NAME_KEY);
  if (existing != null && existing !== '') {
    return existing;
  }
  const name = randomId(44);
  await AsyncStorage.setItem(CONTAINER_NAME_KEY, name);
  return name;
}

function makeUIImplementation(
  provider: AuthgearProvider
): UIImplementation | undefined {
  switch (provider.uiImplementation) {
    case 'webkitWebView':
      return new WebKitWebViewUIImplementation({
        ios: { navigationBarButtonTintColor: 0xff000000 },
        android: { actionBarButtonTintColor: 0xff000000 },
      });
    case 'customWebView':
      return new CustomWebViewUIImplementation({
        navigationBarBackgroundColor: provider.customWebViewNavBarColor,
      });
    case 'asWebAuthenticationSession':
      // undefined selects the SDK default: ASWebAuthenticationSession on iOS,
      // Custom Tabs on Android.
      return undefined;
  }
}

export async function configureAuthgear(
  provider: AuthgearProvider
): Promise<void> {
  const name = await getDistinctNamePerInstall();
  authgear.name = name;
  await authgear.configure({
    clientID: provider.clientID,
    endpoint: provider.endpoint,
    tokenStorage: provider.useTransientTokenStorage
      ? new TransientTokenStorage()
      : new PersistentTokenStorage(),
    isSSOEnabled: provider.shareSessionWithSystemBrowser,
    uiImplementation: makeUIImplementation(provider),
  });
}
