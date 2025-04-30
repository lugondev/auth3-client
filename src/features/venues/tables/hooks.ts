import { useMutation, useQueryClient, MutationOptions, InfiniteData, useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'; // Removed unused useQuery, UseQueryOptions. Added UseInfiniteQueryOptions
import venueService from '@/services/venueService';
// import { Table, CreateTableDto, UpdateTableDto } from '@/types/venue'; // Removed incorrect import
import { Table, CreateTableDTO, UpdateTableDTO, PaginatedTableResponse } from '@/types/table'; // Import correct types
import { toast } from 'sonner';

// --- Query Key Factory ---
// Updated key factory to include filters for better cache separation
// Use specific types for filters instead of Record<string, any>
const venueTablesQueryKey = (venueId: string, filters: { groupId?: string | null; limit?: number } = {}) => ['venueTables', venueId, filters];

// Define interface outside the hook
interface CreateTableVariables {
	venueId: string;
	data: CreateTableDTO; // Use correct DTO
}


// --- Fetch Tables Hook (Using Infinite Query for Pagination) ---
/**
 * Hook to fetch tables for a specific venue with pagination and optional filtering.
 */
export const useFetchVenueTables = (
	venueId: string,
	filters: { groupId?: string | null; limit?: number } = {}, // Accept filters
	// Use UseInfiniteQueryOptions for better type compatibility
	options?: Omit<UseInfiniteQueryOptions<PaginatedTableResponse, Error, InfiniteData<PaginatedTableResponse, unknown>, PaginatedTableResponse, ReturnType<typeof venueTablesQueryKey>, number>, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>
) => {
	const queryKey = venueTablesQueryKey(venueId, filters); // Use updated key factory
	const { groupId, limit = 10 } = filters;

	return useInfiniteQuery<PaginatedTableResponse, Error, InfiniteData<PaginatedTableResponse>, ReturnType<typeof venueTablesQueryKey>, number>({ // Add initialPageParam type (number)
		queryKey: queryKey,
		queryFn: ({ pageParam }) => { // pageParam is already number type from initialPageParam
			if (!venueId) {
				// Should not happen if enabled is set correctly, but good practice
				return Promise.reject(new Error("Venue ID is required"));
			}
			// Pass page, limit, and groupId to the service function
			return venueService.getVenueTables(venueId, pageParam, limit, groupId); // No need to cast pageParam
		},
		initialPageParam: 1, // Start fetching from page 1
		getNextPageParam: (lastPage) => { // Remove unused allPages
			const totalPages = Math.ceil(lastPage.total / lastPage.limit);
			const nextPage = lastPage.page + 1;
			return nextPage <= totalPages ? nextPage : undefined; // Return number or undefined
		},
		enabled: !!venueId, // Simplified enabled check
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		...options, // Spread the rest of the options
	});
};


// --- Create Table Hook ---
export const useCreateTable = (options?: MutationOptions<Table, Error, CreateTableVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Table, Error, CreateTableVariables>({ // Use interface defined above
		mutationFn: ({ venueId, data }) => venueService.createTable(venueId, data),
		onSuccess: (newTable, variables) => {
			// Invalidate all table queries for this venue, regardless of filters
			queryClient.invalidateQueries({ queryKey: ['venueTables', variables.venueId] });
			toast.success(`Table "${newTable.name}" created successfully.`);
			options?.onSuccess?.(newTable, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error creating table for venue ${variables.venueId}:`, error);
			toast.error(`Failed to create table: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Update Table Hook ---
// Note: Update and Delete use /tables/{tableId} endpoint, not nested under venue in API
interface UpdateTableVariables {
	tableId: string;
	data: UpdateTableDTO; // Use correct DTO
	venueId?: string; // Optional: venueId needed for invalidating the correct list query
}

export const useUpdateTable = (options?: MutationOptions<Table, Error, UpdateTableVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Table, Error, UpdateTableVariables>({
		mutationFn: ({ tableId, data }) => venueService.updateTable(tableId, data),
		onSuccess: (updatedTable, variables) => {
			// Invalidate all table list queries for this venue if venueId is provided
			if (variables.venueId) {
				// Invalidate the infinite query cache
				queryClient.invalidateQueries({ queryKey: ['venueTables', variables.venueId] });

				// TODO: Consider selectively updating infinite query cache for better UX
				// This is more complex as it involves finding the right page and item.
				// Example (simplified, may need adjustments for actual structure):
				// queryClient.setQueriesData({ queryKey: ['venueTables', variables.venueId] }, (oldData: InfiniteData<PaginatedTableResponse> | undefined) => {
				//   if (!oldData) return oldData;
				//   return {
				//     ...oldData,
				//     pages: oldData.pages.map(page => ({
				//       ...page,
				//       tables: page.tables.map(table => table.id === variables.tableId ? updatedTable : table)
				//     }))
				//   };
				// });
			}
			toast.success(`Table "${updatedTable.name}" updated successfully.`);
			options?.onSuccess?.(updatedTable, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error updating table ${variables.tableId}:`, error);
			toast.error(`Failed to update table: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};


// --- Delete Table Hook ---
interface DeleteTableVariables {
	tableId: string;
	tableName?: string; // Optional: for toast message
	venueId?: string; // Optional: venueId needed for invalidating the correct list query
}

export const useDeleteTable = (options?: MutationOptions<void, Error, DeleteTableVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, DeleteTableVariables>({
		mutationFn: ({ tableId }) => venueService.deleteTable(tableId),
		onSuccess: (data, variables) => {
			if (variables.venueId) {
				// Invalidate all table list queries for this venue
				queryClient.invalidateQueries({ queryKey: ['venueTables', variables.venueId] });

				// TODO: Consider selectively updating infinite query cache
				// Similar complexity to update cache modification
			}
			toast.success(`Table "${variables.tableName || variables.tableId}" deleted successfully.`);
			options?.onSuccess?.(data, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error deleting table ${variables.tableId}:`, error);
			toast.error(`Failed to delete table: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Placeholder for more complex table/reservation logic hooks ---
// export const useCalculateTableAvailability = (...) => { ... };
// export const useCheckDoubleBooking = (...) => { ... };
// export const useCombineTables = (...) => { ... };
// export const useManageWaitlist = (...) => { ... };
