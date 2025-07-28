/**
 * React hooks for tenant-specific credential and presentation operations
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import {
  issueCredential,
  listCredentials,
  getCredential,
  revokeCredential,
  bulkIssueCredentials,
  getBulkIssueStatus,
  bulkIssueFromCSV,
} from '@/services/tenantCredentialService';
import {
  createTenantPresentation,
  listTenantPresentations,
  getTenantPresentation,
  deleteTenantPresentation,
  verifyTenantPresentation,
} from '@/services/tenantPresentationService';
import { getUserCredentialAnalytics } from '@/services/vcService';
import {
  CredentialAnalyticsQuery,
  UserCredentialAnalyticsResponse,
  OverviewMetrics,
  IssuanceMetrics,
  ReceivedMetrics,
  StatusMetrics
} from '@/types/analytics';
import type {
  IssueCredentialRequest,
} from '@/services/tenantCredentialService';
import type {
  TenantPresentationListQuery,
  TenantPresentationListResponse,
  TenantPresentation,
} from '@/services/tenantPresentationService';
import type {
  CreatePresentationInput,
  VerifyPresentationInput,
  BulkCredentialRecipient,
} from '@/types/credentials';

// ============ Credential Hooks ============

/**
 * Hook for listing tenant credentials
 */
export const useTenantCredentials = (
  tenantId?: string,
  query?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
    issuer?: string;
    subject?: string;
  },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['tenant-credentials', tenantId, query],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return listCredentials(tenantId, query);
    },
    enabled: !!tenantId && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for getting a single tenant credential
 */
export const useTenantCredential = (
  tenantId?: string,
  credentialId?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['tenant-credential', tenantId, credentialId],
    queryFn: () => {
      if (!tenantId || !credentialId) throw new Error('Tenant ID and Credential ID are required');
      return getCredential(tenantId, credentialId);
    },
    enabled: !!tenantId && !!credentialId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for issuing tenant credentials
 */
export const useIssueTenantCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, ...input }: IssueCredentialRequest) =>
      issueCredential({ tenantId, ...input }),
    onSuccess: (data, { tenantId }) => {
      // Invalidate and refetch tenant credentials
      queryClient.invalidateQueries({ queryKey: ['tenant-credentials', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-credential-analytics', tenantId] });
    },
  });
};

/**
 * Hook for revoking tenant credentials
 */
export const useRevokeTenantCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, credentialId, input }: {
      tenantId: string;
      credentialId: string;
      input: { issuerDID: string; reason?: string };
    }) => revokeCredential(tenantId, credentialId, input),
    onSuccess: (data, { tenantId, credentialId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tenant-credentials', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-credential', tenantId, credentialId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-credential-analytics', tenantId] });
    },
  });
};

/**
 * Hook for bulk issuing tenant credentials
 */
export const useBulkIssueTenantCredentials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, templateId, issuerDid, recipients }: {
      tenantId: string;
      templateId: string;
      issuerDid: string;
      recipients: BulkCredentialRecipient[];
    }) =>
      bulkIssueCredentials(tenantId, { templateId, issuerDid, recipients }),
    onSuccess: (data, { tenantId }) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-credentials', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-credential-analytics', tenantId] });
    },
  });
};

// ============ Presentation Hooks ============

/**
 * Hook for listing tenant presentations
 */
export const useTenantPresentations = (
  tenantId?: string,
  query?: TenantPresentationListQuery,
  options?: { enabled?: boolean }
): UseQueryResult<TenantPresentationListResponse, Error> => {
  return useQuery({
    queryKey: ['tenant-presentations', tenantId, query],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return listTenantPresentations(tenantId, query);
    },
    enabled: !!tenantId && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for getting a single tenant presentation
 */
export const useTenantPresentation = (
  tenantId?: string,
  presentationId?: string,
  options?: { enabled?: boolean }
): UseQueryResult<TenantPresentation, Error> => {
  return useQuery({
    queryKey: ['tenant-presentation', tenantId, presentationId],
    queryFn: () => {
      if (!tenantId || !presentationId) throw new Error('Tenant ID and Presentation ID are required');
      return getTenantPresentation(tenantId, presentationId);
    },
    enabled: !!tenantId && !!presentationId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for creating tenant presentations
 */
export const useCreateTenantPresentation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, input }: { tenantId: string; input: CreatePresentationInput }) =>
      createTenantPresentation(tenantId, input),
    onSuccess: (data, { tenantId }) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-presentations', tenantId] });
    },
  });
};

/**
 * Hook for deleting tenant presentations
 */
export const useDeleteTenantPresentation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, presentationId }: { tenantId: string; presentationId: string }) =>
      deleteTenantPresentation(tenantId, presentationId),
    onSuccess: (data, { tenantId, presentationId }) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-presentations', tenantId] });
      queryClient.removeQueries({ queryKey: ['tenant-presentation', tenantId, presentationId] });
    },
  });
};

/**
 * Hook for verifying tenant presentations
 */
export const useVerifyTenantPresentation = () => {
  return useMutation({
    mutationFn: ({ tenantId, input }: { tenantId: string; input: VerifyPresentationInput }) =>
      verifyTenantPresentation(tenantId, input),
  });
};

// ============ Analytics Hooks ============

/**
 * Hook for fetching tenant-specific credential analytics
 */
export const useTenantCredentialAnalytics = (
  tenantId?: string,
  query?: Omit<CredentialAnalyticsQuery, 'tenant_id'>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
): UseQueryResult<UserCredentialAnalyticsResponse, Error> => {
  const fullQuery: CredentialAnalyticsQuery = {
    ...query,
    tenant_id: tenantId,
  };

  return useQuery({
    queryKey: ['tenant-credential-analytics', tenantId, query],
    queryFn: () => getUserCredentialAnalytics(fullQuery),
    enabled: !!tenantId && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    refetchInterval: options?.refetchInterval ?? false,
  });
};

/**
 * Hook for fetching tenant overview metrics only
 */
export const useTenantOverviewMetrics = (
  tenantId?: string,
  query?: Omit<CredentialAnalyticsQuery, 'tenant_id'>
): UseQueryResult<OverviewMetrics, Error> => {
  const fullQuery: CredentialAnalyticsQuery = {
    ...query,
    tenant_id: tenantId,
  };

  return useQuery({
    queryKey: ['tenant-credential-analytics-overview', tenantId, query],
    queryFn: async () => {
      const result = await getUserCredentialAnalytics(fullQuery);
      return result.overview_metrics;
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes for overview
  });
};

/**
 * Hook for fetching tenant issuance metrics only
 */
export const useTenantIssuanceMetrics = (
  tenantId?: string,
  query?: Omit<CredentialAnalyticsQuery, 'tenant_id'>
): UseQueryResult<IssuanceMetrics, Error> => {
  const fullQuery: CredentialAnalyticsQuery = {
    ...query,
    tenant_id: tenantId,
  };

  return useQuery({
    queryKey: ['tenant-credential-analytics-issuance', tenantId, query],
    queryFn: async () => {
      const result = await getUserCredentialAnalytics(fullQuery);
      return result.issuance_metrics;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching tenant received metrics only
 */
export const useTenantReceivedMetrics = (
  tenantId?: string,
  query?: Omit<CredentialAnalyticsQuery, 'tenant_id'>
): UseQueryResult<ReceivedMetrics, Error> => {
  const fullQuery: CredentialAnalyticsQuery = {
    ...query,
    tenant_id: tenantId,
  };

  return useQuery({
    queryKey: ['tenant-credential-analytics-received', tenantId, query],
    queryFn: async () => {
      const result = await getUserCredentialAnalytics(fullQuery);
      return result.received_metrics;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching tenant status metrics only
 */
export const useTenantStatusMetrics = (
  tenantId?: string,
  query?: Omit<CredentialAnalyticsQuery, 'tenant_id'>
): UseQueryResult<StatusMetrics, Error> => {
  const fullQuery: CredentialAnalyticsQuery = {
    ...query,
    tenant_id: tenantId,
  };

  return useQuery({
    queryKey: ['tenant-credential-analytics-status', tenantId, query],
    queryFn: async () => {
      const result = await getUserCredentialAnalytics(fullQuery);
      return result.status_metrics;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
