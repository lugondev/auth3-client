import apiClient from '../lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import {
  DIDMethodConfig,
  NetworkConfig,
  GetMethodConfigurationsOutput,
  GetNetworkConfigurationsOutput,
  UpdateMethodConfigurationInput,
  UpdateMethodConfigurationsInput,
  UpdateNetworkConfigurationInput,
  SetDefaultMethodInput,
  ToggleMethodEnabledInput
} from '../types/didMethod';

// Re-export types for external use
export type { DIDMethodConfig, NetworkConfig };

// Get all DID method configurations
export const getMethodConfigurations = withErrorHandling(
  async (): Promise<GetMethodConfigurationsOutput> => {
    const response = await apiClient.get<GetMethodConfigurationsOutput>('/api/v1/admin/did-methods/configurations');
    return response.data;
  }
);

// Get all network configurations
export const getNetworkConfigurations = withErrorHandling(
  async (): Promise<GetNetworkConfigurationsOutput> => {
    const response = await apiClient.get<GetNetworkConfigurationsOutput>('/api/v1/admin/did-methods/networks');
    return response.data;
  }
);

// Update a DID method configuration
export const updateMethodConfiguration = withErrorHandling(
  async (input: UpdateMethodConfigurationInput): Promise<DIDMethodConfig> => {
    const response = await apiClient.patch<DIDMethodConfig>(`/api/v1/admin/did-methods/configurations/${input.id}`, input);
    return response.data;
  }
);

// Update multiple DID method configurations
export const updateMethodConfigurations = withErrorHandling(
  async (input: UpdateMethodConfigurationsInput): Promise<GetMethodConfigurationsOutput> => {
    const response = await apiClient.patch<GetMethodConfigurationsOutput>('/api/v1/admin/did-methods/configurations', input);
    return response.data;
  }
);

// Update a network configuration
export const updateNetworkConfiguration = withErrorHandling(
  async (input: UpdateNetworkConfigurationInput): Promise<NetworkConfig> => {
    const response = await apiClient.patch<NetworkConfig>(`/api/v1/admin/did-methods/networks/${input.id}`, input);
    return response.data;
  }
);

// Set default DID method
export const setDefaultMethod = withErrorHandling(
  async (input: SetDefaultMethodInput): Promise<DIDMethodConfig> => {
    const response = await apiClient.post<DIDMethodConfig>('/api/v1/admin/did-methods/default', input);
    return response.data;
  }
);

// Toggle DID method enabled status
export const toggleMethodEnabled = withErrorHandling(
  async (input: ToggleMethodEnabledInput): Promise<DIDMethodConfig> => {
    const response = await apiClient.patch<DIDMethodConfig>(`/api/v1/admin/did-methods/configurations/${input.id}/toggle`, input);
    return response.data;
  }
);