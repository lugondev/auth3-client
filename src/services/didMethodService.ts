import apiClient from '../lib/apiClient';

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

// Get all DID method configurations
export const getMethodConfigurations = async (): Promise<GetMethodConfigurationsOutput> => {
  try {
    const response = await apiClient.get<DIDMethodApiResponse<GetMethodConfigurationsOutput>>('/api/v1/admin/did-methods/configurations');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get method configurations');
  } catch (error) {
    console.error('Failed to get method configurations:', error);
    throw error;
  }
};

// Get all network configurations
export const getNetworkConfigurations = async (): Promise<GetNetworkConfigurationsOutput> => {
  try {
    const response = await apiClient.get<DIDMethodApiResponse<GetNetworkConfigurationsOutput>>('/api/v1/admin/did-methods/networks');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get network configurations');
  } catch (error) {
    console.error('Failed to get network configurations:', error);
    throw error;
  }
};

// Update a DID method configuration
export const updateMethodConfiguration = async (input: UpdateMethodConfigurationInput): Promise<DIDMethodConfig> => {
  try {
    const response = await apiClient.patch<DIDMethodApiResponse<DIDMethodConfig>>(`/api/v1/admin/did-methods/configurations/${input.id}`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update method configuration');
  } catch (error) {
    console.error('Failed to update method configuration:', error);
    throw error;
  }
};

// Update multiple DID method configurations
export const updateMethodConfigurations = async (methods: DIDMethodConfig[]): Promise<DIDMethodConfig[]> => {
  try {
    const response = await apiClient.put<DIDMethodApiResponse<DIDMethodConfig[]>>('/api/v1/admin/did-methods/configurations', { methods });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update method configurations');
  } catch (error) {
    console.error('Failed to update method configurations:', error);
    throw error;
  }
};

// Update a network configuration
export const updateNetworkConfiguration = async (input: UpdateNetworkConfigurationInput): Promise<NetworkConfig> => {
  try {
    const response = await apiClient.patch<DIDMethodApiResponse<NetworkConfig>>(`/api/v1/admin/did-methods/networks/${input.id}`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update network configuration');
  } catch (error) {
    console.error('Failed to update network configuration:', error);
    throw error;
  }
};

// Set default DID method
export const setDefaultMethod = async (methodId: string): Promise<DIDMethodConfig> => {
  try {
    const response = await apiClient.post<DIDMethodApiResponse<DIDMethodConfig>>(`/api/v1/admin/did-methods/configurations/${methodId}/set-default`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to set default method');
  } catch (error) {
    console.error('Failed to set default method:', error);
    throw error;
  }
};

// Toggle method enabled status
export const toggleMethodEnabled = async (methodId: string, enabled: boolean): Promise<DIDMethodConfig> => {
  try {
    const response = await apiClient.patch<DIDMethodApiResponse<DIDMethodConfig>>(`/api/v1/admin/did-methods/configurations/${methodId}`, { enabled });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to toggle method status');
  } catch (error) {
    console.error('Failed to toggle method status:', error);
    throw error;
  }
};