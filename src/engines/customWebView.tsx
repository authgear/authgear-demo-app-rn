import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import { Appbar } from 'react-native-paper';
import {
  CancelError,
  OpenAuthorizationURLOptions,
  UIImplementation,
} from '@authgear/react-native';
import { contrastingTextColor } from '../util/color';
import { DEFAULT_CUSTOM_WEBVIEW_NAV_BAR_COLOR } from '../providers/types';

export interface CustomWebViewUIImplementationOptions {
  navigationBarBackgroundColor?: string;
}

interface AuthorizationRequest {
  url: string;
  redirectURI: string;
  navigationBarBackgroundColor: string;
  resolve: (redirectURIWithQuery: string) => void;
  reject: (error: unknown) => void;
}

type Listener = (request: AuthorizationRequest | null) => void;

// openAuthorizationURL is called on the authgear singleton outside the React
// tree, so requests are handed to the mounted CustomWebViewHost through this
// module-level slot.
let currentRequest: AuthorizationRequest | null = null;
let listener: Listener | null = null;

function setRequest(request: AuthorizationRequest | null) {
  currentRequest = request;
  listener?.(request);
}

function isRedirectURI(url: string, redirectURI: string): boolean {
  const withoutQuery = url.split('#')[0].split('?')[0];
  return withoutQuery.toLowerCase() === redirectURI.toLowerCase();
}

export class CustomWebViewUIImplementation implements UIImplementation {
  private options?: CustomWebViewUIImplementationOptions;

  constructor(options?: CustomWebViewUIImplementationOptions) {
    this.options = options;
  }

  openAuthorizationURL(options: OpenAuthorizationURLOptions): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (currentRequest != null) {
        reject(new Error('Another authorization is already in progress'));
        return;
      }
      setRequest({
        url: options.url,
        redirectURI: options.redirectURI,
        navigationBarBackgroundColor:
          this.options?.navigationBarBackgroundColor ??
          DEFAULT_CUSTOM_WEBVIEW_NAV_BAR_COLOR,
        resolve,
        reject,
      });
    });
  }
}

const styles = StyleSheet.create({
  webView: { flex: 1 },
});

export const CustomWebViewHost: React.FC = () => {
  const [request, setLocalRequest] = useState<AuthorizationRequest | null>(
    currentRequest
  );
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    listener = setLocalRequest;
    return () => {
      listener = null;
    };
  }, []);

  const close = useCallback(() => {
    setCanGoBack(false);
    setRequest(null);
  }, []);

  const onCancel = useCallback(() => {
    request?.reject(new CancelError('cancel'));
    close();
  }, [request, close]);

  const onShouldStartLoadWithRequest = useCallback(
    (navRequest: ShouldStartLoadRequest) => {
      if (
        request != null &&
        isRedirectURI(navRequest.url, request.redirectURI)
      ) {
        request.resolve(navRequest.url);
        close();
        return false;
      }
      return true;
    },
    [request, close]
  );

  const onNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      // Fallback redirect detection: on some Android versions server-side
      // redirects bypass onShouldStartLoadWithRequest.
      if (request != null && isRedirectURI(navState.url, request.redirectURI)) {
        request.resolve(navState.url);
        close();
        return;
      }
      setCanGoBack(navState.canGoBack);
    },
    [request, close]
  );

  if (request == null) {
    return null;
  }

  const navBarColor = request.navigationBarBackgroundColor;
  const buttonColor = contrastingTextColor(navBarColor);

  return (
    <Modal animationType="slide" onRequestClose={onCancel}>
      <Appbar.Header style={{ backgroundColor: navBarColor }}>
        <Appbar.BackAction
          disabled={!canGoBack}
          color={buttonColor}
          onPress={() => webViewRef.current?.goBack()}
        />
        <Appbar.Content title="" />
        <Appbar.Action icon="close" color={buttonColor} onPress={onCancel} />
      </Appbar.Header>
      <WebView
        ref={webViewRef}
        // Match the configured color while the page is loading, instead of
        // WKWebView's default white flash.
        style={[styles.webView, { backgroundColor: navBarColor }]}
        source={{ uri: request.url }}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onNavigationStateChange={onNavigationStateChange}
      />
    </Modal>
  );
};
