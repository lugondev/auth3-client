import apiClient from "@/lib/apiClient";
import {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  ClientListResponse,
  TokenResponse,
  UserInfoResponse,
  AuthorizeResponse,
  TokenInfo,
  OpenIDConfiguration,
  JWKS,
} from "../types/oauth2";

const baseURL = "/api/v1/oauth2";

export const registerClient = async (
  data: ClientRegistrationRequest
): Promise<ClientRegistrationResponse> => {
  return apiClient.post(`${baseURL}/clients`, data);
};

export const listClients = async (
  limit?: number,
  offset?: number,
  tenant_id?: string
): Promise<ClientListResponse> => {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (offset) params.append("offset", offset.toString());
  if (tenant_id) params.append("tenant_id", tenant_id);

  const query = params.toString();
  const url = query ? `${baseURL}/clients?${query}` : `${baseURL}/clients`;

  const response = await apiClient.get(url);
  return response.data;
};

export const authorize = async (
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

  return apiClient.get(`${baseURL}/authorize?${params.toString()}`);
};

export const token = async (
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

  return apiClient.post(`${baseURL}/token`, formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const userInfo = async (): Promise<UserInfoResponse> => {
  return apiClient.get(`${baseURL}/userinfo`);
};

export const tokenInfo = async (accessToken: string): Promise<TokenInfo> => {
  return apiClient.get(`${baseURL}/tokeninfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const revokeToken = async (
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

  return apiClient.post(`${baseURL}/revoke`, formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const getOpenIDConfiguration = async (): Promise<OpenIDConfiguration> => {
  return apiClient.get(`/.well-known/openid_configuration`);
};

export const getJWKS = async (): Promise<JWKS> => {
  return apiClient.get(`${baseURL}/.well-known/jwks.json`);
};
