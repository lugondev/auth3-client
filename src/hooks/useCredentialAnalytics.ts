/**
 * React hooks for credential analytics
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getUserCredentialAnalytics } from '@/services/vcService';
import { 
  CredentialAnalyticsQuery, 
  UserCredentialAnalyticsResponse,
  OverviewMetrics,
  IssuanceMetrics,
  ReceivedMetrics,
  StatusMetrics
} from '@/types/analytics';

/**
 * Hook for fetching comprehensive user credential analytics
 * @param query - Analytics query parameters
 * @param options - React Query options
 * @returns Query result with analytics data
 */
export const useCredentialAnalytics = (
  query?: CredentialAnalyticsQuery,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
): UseQueryResult<UserCredentialAnalyticsResponse, Error> => {
  return useQuery({
    queryKey: ['credential-analytics', query],
    queryFn: () => getUserCredentialAnalytics(query),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    refetchInterval: options?.refetchInterval ?? false, // No auto-refetch by default
    enabled: options?.enabled ?? true,
  });
};

/**
 * Hook for fetching overview metrics only
 * @param query - Analytics query parameters
 * @returns Query result with overview metrics
 */
export const useOverviewMetrics = (
  query?: CredentialAnalyticsQuery
): UseQueryResult<OverviewMetrics, Error> => {
  return useQuery({
    queryKey: ['credential-analytics-overview', query],
    queryFn: async () => {
      const result = await getUserCredentialAnalytics(query);
      return result.overview_metrics;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for overview
  });
};

/**
 * Hook for fetching issuance metrics only
 * @param query - Analytics query parameters
 * @returns Query result with issuance metrics
 */
export const useIssuanceMetrics = (
  query?: CredentialAnalyticsQuery
): UseQueryResult<IssuanceMetrics, Error> => {
  return useQuery({
    queryKey: ['credential-analytics-issuance', query],
    queryFn: async () => {
      const result = await getUserCredentialAnalytics(query);
      return result.issuance_metrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching received metrics only
 * @param query - Analytics query parameters
 * @returns Query result with received metrics
 */
export const useReceivedMetrics = (
  query?: CredentialAnalyticsQuery
): UseQueryResult<ReceivedMetrics, Error> => {
  return useQuery({
    queryKey: ['credential-analytics-received', query],
    queryFn: async () => {
      const result = await getUserCredentialAnalytics(query);
      return result.received_metrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching status metrics only
 * @param query - Analytics query parameters
 * @returns Query result with status metrics
 */
export const useStatusMetrics = (
  query?: CredentialAnalyticsQuery
): UseQueryResult<StatusMetrics, Error> => {
  return useQuery({
    queryKey: ['credential-analytics-status', query],
    queryFn: async () => {
      const result = await getUserCredentialAnalytics(query);
      return result.status_metrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Utility function to get analytics query for different time periods
 */
export const getAnalyticsQueryPresets = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const lastQuarter = new Date(today);
  lastQuarter.setMonth(lastQuarter.getMonth() - 3);
  
  const lastYear = new Date(today);
  lastYear.setFullYear(lastYear.getFullYear() - 1);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return {
    today: {
      start_date: formatDate(today),
      end_date: formatDate(today),
      interval: 'day' as const,
    },
    yesterday: {
      start_date: formatDate(yesterday),
      end_date: formatDate(yesterday),
      interval: 'day' as const,
    },
    lastWeek: {
      start_date: formatDate(lastWeek),
      end_date: formatDate(today),
      interval: 'day' as const,
    },
    lastMonth: {
      start_date: formatDate(lastMonth),
      end_date: formatDate(today),
      interval: 'week' as const,
    },
    lastQuarter: {
      start_date: formatDate(lastQuarter),
      end_date: formatDate(today),
      interval: 'week' as const,
    },
    lastYear: {
      start_date: formatDate(lastYear),
      end_date: formatDate(today),
      interval: 'month' as const,
    },
  };
};
