import apiClient from "@/lib/apiClient";
import { withErrorHandling } from './errorHandlingService';
import {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  ClientInfo,
  ClientListResponse,
  TokenResponse,
  UserInfoResponse,
  AuthorizeResponse,
  TokenInfo,
  OpenIDConfiguration,
  JWKS,
} from "../types/oauth2";

const baseOauth2URL = "/api/v1/oauth2";
const baseURL = "/oauth2";

export const registerClient = withErrorHandling(
  async (data: ClientRegistrationRequest): Promise<ClientRegistrationResponse> => {
    const response = await apiClient.post<ClientRegistrationResponse>(`${baseOauth2URL}/clients`, data);
    return response.data;
  }
);

export const listClients = withErrorHandling(
  async (
    limit?: number,
    offset?: number,
    tenant_id?: string
  ): Promise<ClientListResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    if (tenant_id) params.append("tenant_id", tenant_id);

    const query = params.toString();
    const url = query ? `${baseOauth2URL}/clients?${query}` : `${baseOauth2URL}/clients`;

    const response = await apiClient.get<ClientListResponse>(url);
    return response.data;
  }
);

export const authorize = withErrorHandling(
  async (
    response_type: string,
    client_id: string,
    redirect_uri: string,
    scope?: string,
    state?: string,
    code_challenge?: string,
    code_challenge_method?: string,
    nonce?: string
  ): Promise<AuthorizeResponse> => {
    const params = new URLSearchParams({
      response_type,
      client_id,
      redirect_uri,
      ...(scope ? { scope } : {}),
      ...(state ? { state } : {}),
      ...(code_challenge ? { code_challenge } : {}),
      ...(code_challenge_method ? { code_challenge_method } : {}),
      ...(nonce ? { nonce } : {}),
    });

    const response = await apiClient.get<AuthorizeResponse>(`${baseOauth2URL}/authorize?${params.toString()}`);
    return response.data;
  }
);

// New function for authenticated OAuth2 authorization
export const authorizeAuthenticated = async (
  oauth2Params: Record<string, string>
): Promise<{ code: string; state?: string }> => {
  console.log('🔍 authorizeAuthenticated called with params:', oauth2Params);

  try {
    const response = await apiClient.post<{ code: string; state?: string }>(`${baseOauth2URL}/authorize`, oauth2Params);

    console.log('✅ Authorization successful:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('❌ Authorization failed:', error);

    // Check if this is an OAuth2 redirect error
    if (error && typeof error === 'object') {
      // Check for login redirect (user not authenticated)
      if ('isOAuth2LoginRedirect' in error && error.isOAuth2LoginRedirect) {
        const axiosError = error as { response?: { headers?: { location?: string } } };
        const location = axiosError.response?.headers?.location;
        console.log('🔐 User not authenticated, redirect to login:', location);

        // Redirect user to login page with OAuth2 parameters
        if (location && typeof window !== 'undefined') {
          window.location.href = location;
          return Promise.reject(new Error('Redirecting to login page'));
        }
      }

      // Check for consent redirect (user authenticated, needs consent)
      if ('isOAuth2ConsentRedirect' in error && error.isOAuth2ConsentRedirect) {
        const axiosError = error as { response?: { headers?: { location?: string } } };
        const location = axiosError.response?.headers?.location;
        console.log('✋ User authenticated but needs to give consent:', location);

        // Redirect user to consent page
        if (location && typeof window !== 'undefined') {
          window.location.href = location;
          return Promise.reject(new Error('Redirecting to consent page'));
        }
      }

      // Check for other OAuth2 redirects
      if ('isOAuth2Redirect' in error && error.isOAuth2Redirect) {
        const axiosError = error as { response?: { headers?: { location?: string } } };
        const location = axiosError.response?.headers?.location;
        console.log('🔄 OAuth2 flow redirect:', location);

        if (location && typeof window !== 'undefined') {
          window.location.href = location;
          return Promise.reject(new Error('Following OAuth2 flow redirect'));
        }
      }

      // Check for general redirect
      if ('response' in error) {
        const axiosError = error as { response?: { status?: number; headers?: { location?: string } } };
        if (axiosError.response?.status === 302) {
          const location = axiosError.response.headers?.location;
          console.log('🔄 General OAuth2 redirect detected:', location);
          throw new Error(`OAuth2 authorization requires user interaction - redirect to: ${location}`);
        }
      }
    }

    throw error;
  }
};

// Helper function to generate PKCE parameters
export const generatePKCE = async (): Promise<{ codeVerifier: string; codeChallenge: string }> => {
  const codeVerifier = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replace(/[+/]/g, (c) => (c === '+' ? '-' : '_'))
    .replace(/=/g, '');

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);

  const hash = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/[+/]/g, (c_1) => (c_1 === '+' ? '-' : '_'))
    .replace(/=/g, '');

  return { codeVerifier, codeChallenge };
};

// Complete OAuth2 authorization flow for authenticated users
export const handleOAuth2Authorization = async (
  clientId: string,
  redirectUri: string,
  scope: string = 'openid profile email',
  state?: string
): Promise<void> => {
  console.log('� Starting OAuth2 authorization flow');

  try {
    // Generate PKCE parameters for security
    const { codeVerifier, codeChallenge } = await generatePKCE();

    // Store PKCE verifier in session storage for later use
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth2_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth2_state', state || '');
    }

    // Prepare authorization parameters
    const authParams = {
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state: state || '',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    };

    console.log('📋 Authorization parameters:', authParams);

    // Try to authorize with the backend
    // Backend will redirect based on user authentication status:
    // - If not authenticated: redirect to /login?client_id=...
    // - If authenticated: redirect to /auth/oauth2/authorize?client_id=... (consent page)
    await authorizeAuthenticated(authParams);

  } catch (error: unknown) {
    console.log('🔄 OAuth2 flow requires user interaction:', error);

    // The error is expected - it means user needs to complete the flow
    // The actual redirect happens in the authorizeAuthenticated function
    if (error instanceof Error) {
      if (error.message.includes('Redirecting to login page')) {
        console.log('✅ User redirected to login page');
      } else if (error.message.includes('Redirecting to consent page')) {
        console.log('✅ User redirected to consent page');
      } else if (error.message.includes('Following OAuth2 flow redirect')) {
        console.log('✅ Following OAuth2 redirect');
      } else {
        console.error('❌ Unexpected OAuth2 error:', error);
        throw error;
      }
    }
  }
};

export const token = withErrorHandling(
  async (
    grant_type: string,
    code?: string,
    redirect_uri?: string,
    client_id?: string,
    client_secret?: string,
    code_verifier?: string,
    refresh_token?: string,
    scope?: string
  ): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append("grant_type", grant_type);
    if (code) formData.append("code", code);
    if (redirect_uri) formData.append("redirect_uri", redirect_uri);
    if (client_id) formData.append("client_id", client_id);
    if (client_secret) formData.append("client_secret", client_secret);
    if (code_verifier) formData.append("code_verifier", code_verifier);
    if (refresh_token) formData.append("refresh_token", refresh_token);
    if (scope) formData.append("scope", scope);

    const response = await apiClient.post<TokenResponse>(`${baseOauth2URL}/token`, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }
);

export const userInfo = withErrorHandling(
  async (): Promise<UserInfoResponse> => {
    const response = await apiClient.get<UserInfoResponse>(`${baseOauth2URL}/userinfo`);
    return response.data;
  }
);

export const tokenInfo = withErrorHandling(
  async (accessToken: string): Promise<TokenInfo> => {
    const response = await apiClient.get<TokenInfo>(`${baseOauth2URL}/tokeninfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }
);

export const revokeToken = withErrorHandling(
  async (
    token: string,
    token_type_hint?: string,
    client_id?: string,
    client_secret?: string
  ): Promise<void> => {
    const formData = new URLSearchParams();
    formData.append("token", token);
    if (token_type_hint) formData.append("token_type_hint", token_type_hint);
    if (client_id) formData.append("client_id", client_id);
    if (client_secret) formData.append("client_secret", client_secret);

    const response = await apiClient.post<void>(`${baseOauth2URL}/revoke`, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }
);

export const getOpenIDConfiguration = withErrorHandling(
  async (): Promise<OpenIDConfiguration> => {
    const response = await apiClient.get<OpenIDConfiguration>(`${baseURL}/.well-known/openid_configuration`);
    return response.data;
  }
);

export const getJWKS = withErrorHandling(
  async (): Promise<JWKS> => {
    const response = await apiClient.get<JWKS>(`${baseURL}/.well-known/jwks.json`);
    return response.data;
  }
);

// Helper function to handle OAuth2 callback (after user returns from authorization)
/**
 * Refresh OAuth2 access token using refresh token
 * @param refreshToken - The refresh token
 * @param clientId - The OAuth2 client ID
 * @param clientSecret - The OAuth2 client secret (optional for public clients)
 * @returns Promise<TokenResponse>
 */
export const refreshAccessToken = async (
  refreshToken: string,
  clientId: string,
  clientSecret?: string
): Promise<TokenResponse> => {
  const formData = new URLSearchParams();
  formData.append('grant_type', 'refresh_token');
  formData.append('refresh_token', refreshToken);
  formData.append('client_id', clientId);
  if (clientSecret) {
    formData.append('client_secret', clientSecret);
  }

  const response = await apiClient.post<TokenResponse>(`${baseOauth2URL}/token`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
};

export const handleOAuth2Callback = async (
  code: string,
  state: string,
  clientId: string,
  redirectUri: string,
  clientSecret?: string
): Promise<TokenResponse> => {
  console.log('🔙 Handling OAuth2 callback');

  // Retrieve PKCE verifier from session storage
  const codeVerifier = typeof window !== 'undefined'
    ? sessionStorage.getItem('oauth2_code_verifier')
    : null;

  const storedState = typeof window !== 'undefined'
    ? sessionStorage.getItem('oauth2_state')
    : null;

  // Validate state parameter for security
  if (storedState !== state) {
    throw new Error('OAuth2 state mismatch - possible CSRF attack');
  }

  if (!codeVerifier) {
    throw new Error('OAuth2 code verifier not found - PKCE validation failed');
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await token(
      'authorization_code',
      code,
      redirectUri,
      clientId,
      clientSecret,
      codeVerifier
    );

    // Clean up session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('oauth2_code_verifier');
      sessionStorage.removeItem('oauth2_state');
    }

    console.log('✅ OAuth2 tokens obtained successfully');
    return tokenResponse;

  } catch (error) {
    console.error('❌ OAuth2 token exchange failed:', error);

    // Clean up session storage on error
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('oauth2_code_verifier');
      sessionStorage.removeItem('oauth2_state');
    }

    throw error;
  }
};

/**
 * Get OAuth2 client details by client ID
 * @param clientId - The OAuth2 client ID
 * @returns Promise<ClientRegistrationResponse>
 */
export const getClient = async (clientId: string): Promise<ClientInfo> => {
  const response = await apiClient.get<ClientInfo>(`${baseOauth2URL}/clients/${clientId}`);
  return response.data;
};

/**
 * Get OAuth2 client secret (admin only)
 * @param clientId - The OAuth2 client ID
 * @returns Promise<{client_id: string, client_secret: string}>
 */
export const getClientSecret = async (clientId: string): Promise<{ client_id: string, client_secret: string }> => {
  const response = await apiClient.get<{ client_id: string, client_secret: string }>(`${baseOauth2URL}/clients/${clientId}/secret`);
  return response.data;
};

/**
 * Update OAuth2 client details
 * @param clientId - The OAuth2 client ID
 * @param data - The client data to update
 * @returns Promise<ClientRegistrationResponse>
 */
export const updateClient = async (
  clientId: string,
  data: ClientRegistrationRequest
): Promise<ClientRegistrationResponse> => {
  const response = await apiClient.put<ClientRegistrationResponse>(`${baseOauth2URL}/clients/${clientId}`, data);
  return response.data;
};

/**
 * Delete an OAuth2 client
 */
export const deleteClient = withErrorHandling(
  async (clientId: string): Promise<void> => {
    await apiClient.delete(`${baseOauth2URL}/clients/${clientId}`);
  }
);

/**
 * Process OAuth2 consent (allow or deny)
 */
export interface ConsentRequest {
  action: 'allow' | 'deny';
  client_id: string;
  scopes: string[];
  redirect_uri: string;
  state?: string;
  response_type?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export interface ConsentResponse {
  success: boolean;
  redirect_url?: string;
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export const processConsent = withErrorHandling(
  async (consentRequest: ConsentRequest): Promise<ConsentResponse> => {
    const response = await apiClient.post<ConsentResponse>(`${baseOauth2URL}/consent`, consentRequest);
    return response.data;
  }
);

/**
 * Get consent details for a client
 */
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

export const getConsentDetails = withErrorHandling(
  async (clientId: string, scope: string, redirectUri: string, state?: string, responseType?: string, codeChallenge?: string, codeChallengeMethod?: string): Promise<ConsentDetails> => {
    // Get client details
    const client = await getClient(clientId);

    return {
      clientId,
      clientName: client.name || clientId,
      clientLogoUri: client.logo_uri,
      requestedScopes: scope.split(' '),
      redirectUri,
      state: state || '',
      responseType: responseType || 'code',
      codeChallenge,
      codeChallengeMethod,
    };
  }
);

/**
 * OAuth2 authorization request
 */
export interface AuthorizeRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  nonce?: string;
}

export interface OAuth2AuthorizeResponse {
  consent_required?: boolean;
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  message?: string;
}

export const authorizeOAuth2 = withErrorHandling(
  async (request: AuthorizeRequest): Promise<OAuth2AuthorizeResponse> => {
    const response = await apiClient.post<OAuth2AuthorizeResponse>(`${baseOauth2URL}/authorize`, request);
    return response.data;
  }
);
