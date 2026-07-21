export interface ProviderPreset {
  key: string;
  label: string;
  issuerTemplate: string;
  issuerPlaceholder?: string;
  defaultScopes: string[];
}

export const providerPresets: ProviderPreset[] = [
  {
    key: 'google',
    label: 'Google',
    issuerTemplate: 'https://accounts.google.com',
    defaultScopes: ['openid', 'email', 'profile'],
  },
  {
    key: 'entra',
    label: 'Microsoft Entra',
    issuerTemplate: 'https://login.microsoftonline.com/{tenant}/v2.0',
    issuerPlaceholder: 'Replace {tenant} with your tenant ID',
    defaultScopes: ['openid', 'profile', 'email'],
  },
  {
    key: 'okta',
    label: 'Okta',
    issuerTemplate: 'https://{your-domain}.okta.com',
    issuerPlaceholder: 'Replace {your-domain} with your Okta domain',
    defaultScopes: ['openid', 'profile', 'email'],
  },
  {
    key: 'auth0',
    label: 'Auth0',
    issuerTemplate: 'https://{tenant}.auth0.com',
    issuerPlaceholder: 'Replace {tenant} with your Auth0 tenant',
    defaultScopes: ['openid', 'profile', 'email'],
  },
  {
    key: 'keycloak',
    label: 'Keycloak',
    issuerTemplate: 'https://{host}/realms/{realm}',
    issuerPlaceholder: 'Replace {host} and {realm}',
    defaultScopes: ['openid', 'profile', 'email'],
  },
];
