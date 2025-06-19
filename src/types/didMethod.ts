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