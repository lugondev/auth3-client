export interface ConsentDetails {
  clientId: string;
  clientName: string;
  clientLogoUri?: string;
  requestedScopes: string[];
  redirectUri: string;
  state: string;
  responseType: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

export interface ConsentRequest {
  action: 'allow' | 'deny';
  client_id: string;
  scopes: string[];
  redirect_uri: string;
  state: string;
  response_type: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export interface ConsentResponse {
  redirect_url?: string;
  message?: string;
}

export interface OAuth2ConsentInfo {
  id: number;
  user_id: string;
  client_id: string;
  scopes: string[];
  consented_at: string;
  expires_at?: string;
  is_revoked: boolean;
  revoked_at?: string;
  tenant_id?: string;
}

export interface ScopeDescription {
  scope: string;
  description: string;
  icon?: string;
  sensitive?: boolean;
}

export const SCOPE_DESCRIPTIONS: Record<string, ScopeDescription> = {
  openid: {
    scope: 'openid',
    description: 'Access your basic identity information',
    icon: '🆔',
    sensitive: false,
  },
  profile: {
    scope: 'profile',
    description: 'Access your profile information (name, picture, etc.)',
    icon: '👤',
    sensitive: false,
  },
  email: {
    scope: 'email',
    description: 'Access your email address',
    icon: '📧',
    sensitive: true,
  },
  phone: {
    scope: 'phone',
    description: 'Access your phone number',
    icon: '📱',
    sensitive: true,
  },
  address: {
    scope: 'address',
    description: 'Access your physical address',
    icon: '🏠',
    sensitive: true,
  },
  offline_access: {
    scope: 'offline_access',
    description: 'Keep access when you\'re not using the app',
    icon: '🔄',
    sensitive: true,
  },
};
