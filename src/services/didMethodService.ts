import apiClient from '../lib/apiClient';
import { withErrorHandling } from './errorHandlingService';

// Types for DID method configuration
export interface DIDMethodConfig {
  id: string;
  name: string;
  method: 'key' | 'web' | 'ethr' | 'ion' | 'peer';
  enabled: boolean;
  default: boolean;
  priority: number;
  config: {
    [key: string]: string | number | boolean;
  };
  description: string;
  supportedOperations: string[];
  lastUpdated: string;
  status: 'active' | 'inactive' | 'error';
}

export interface NetworkConfig {
  id: string;
  name: string;
  rpcUrl: string;
  chainId?: number;
  contractAddress?: string;
  enabled: boolean;
}

export interface DIDMethodApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GetMethodConfigurationsOutput {
  methods: DIDMethodConfig[];
  total: number;
}

export interface GetNetworkConfigurationsOutput {
  networks: NetworkConfig[];
  total: number;
}

export interface UpdateMethodConfigurationInput {
  id: string;
  enabled?: boolean;
  default?: boolean;
  priority?: number;
  config?: {
    [key: string]: string | number | boolean;
  };
}

export interface UpdateNetworkConfigurationInput {
  id: string;
  enabled?: boolean;
  rpcUrl?: string;
  contractAddress?: string;
}

export interface UpdateMethodConfigurationsInput {
  methods: UpdateMethodConfigurationInput[];
}

export interface SetDefaultMethodInput {
  id: string;
}

export interface ToggleMethodEnabledInput {
  id: string;
  enabled: boolean;
}

// Get all DID method configurations
export const getMethodConfigurations = withErrorHandling(
  async (): Promise<GetMethodConfigurationsOutput> => {
    const response = await apiClient.get<DIDMethodApiResponse<GetMethodConfigurationsOutput>>('/api/v1/admin/did-methods/configurations');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get method configurations');
  }
);

// Get all network configurations
export const getNetworkConfigurations = withErrorHandling(
  async (): Promise<GetNetworkConfigurationsOutput> => {
    const response = await apiClient.get<DIDMethodApiResponse<GetNetworkConfigurationsOutput>>('/api/v1/admin/did-methods/networks');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get network configurations');
  }
);

// Update a DID method configuration
export const updateMethodConfiguration = withErrorHandling(
  async (input: UpdateMethodConfigurationInput): Promise<DIDMethodConfig> => {
    const response = await apiClient.patch<DIDMethodApiResponse<DIDMethodConfig>>(`/api/v1/admin/did-methods/configurations/${input.id}`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update method configuration');
  }
);

// Update multiple DID method configurations
export const updateMethodConfigurations = withErrorHandling(
  async (input: UpdateMethodConfigurationsInput): Promise<GetMethodConfigurationsOutput> => {
    const response = await apiClient.patch<DIDMethodApiResponse<GetMethodConfigurationsOutput>>('/api/v1/admin/did-methods/configurations', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update method configurations');
  }
);

// Update a network configuration
export const updateNetworkConfiguration = withErrorHandling(
  async (input: UpdateNetworkConfigurationInput): Promise<NetworkConfig> => {
    const response = await apiClient.patch<DIDMethodApiResponse<NetworkConfig>>(`/api/v1/admin/did-methods/networks/${input.id}`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update network configuration');
  }
);

// Set default DID method
export const setDefaultMethod = withErrorHandling(
  async (input: SetDefaultMethodInput): Promise<DIDMethodConfig> => {
    const response = await apiClient.post<DIDMethodApiResponse<DIDMethodConfig>>('/api/v1/admin/did-methods/default', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to set default method');
  }
);

// Toggle DID method enabled status
export const toggleMethodEnabled = withErrorHandling(
  async (input: ToggleMethodEnabledInput): Promise<DIDMethodConfig> => {
    const response = await apiClient.patch<DIDMethodApiResponse<DIDMethodConfig>>(`/api/v1/admin/did-methods/configurations/${input.id}/toggle`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to toggle method enabled status');
  }
);