import { useQuery, useMutation, useQueryClient, UseQueryOptions, MutationOptions } from '@tanstack/react-query';
import venueService from '@/services/venueService';
import { Table, CreateTableDto, UpdateTableDto } from '@/types/venue'; // Import table-related types
import { toast } from 'sonner';

// --- Query Key Factory ---
const venueTablesQueryKey = (venueId: string) => ['venueTables', venueId];

// --- Fetch Tables Hook ---
/**
 * Hook to fetch the list of tables for a specific venue.
 */
export const useFetchVenueTables = (
	venueId: string,
	options?: Omit<UseQueryOptions<Table[], Error>, 'queryKey' | 'queryFn'>
) => {
	return useQuery<Table[], Error>({
		queryKey: venueTablesQueryKey(venueId),
		queryFn: () => {
			if (!venueId) {
				return Promise.resolve([]); // Return empty if no venueId
			}
			return venueService.getVenueTables(venueId);
		},
		enabled: !!venueId && options?.enabled !== false, // Only run if venueId is provided
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		...options,
	});
};

// --- Create Table Hook ---
interface CreateTableVariables {
	venueId: string;
	data: CreateTableDto;
}

export const useCreateTable = (options?: MutationOptions<Table, Error, CreateTableVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Table, Error, CreateTableVariables>({
		mutationFn: ({ venueId, data }) => venueService.createTable(venueId, data),
		onSuccess: (newTable, variables) => {
			queryClient.invalidateQueries({ queryKey: venueTablesQueryKey(variables.venueId) });
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
	data: UpdateTableDto;
	venueId?: string; // Optional: venueId needed for invalidating the correct list query
}

export const useUpdateTable = (options?: MutationOptions<Table, Error, UpdateTableVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Table, Error, UpdateTableVariables>({
		mutationFn: ({ tableId, data }) => venueService.updateTable(tableId, data),
		onSuccess: (updatedTable, variables) => {
			// Invalidate the specific table details if cached separately
			// queryClient.invalidateQueries({ queryKey: ['tableDetails', variables.tableId] });
			// Invalidate the list query using the venueId if provided
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: venueTablesQueryKey(variables.venueId) });
				// Optionally update the cache directly
				queryClient.setQueryData(venueTablesQueryKey(variables.venueId), (oldData: Table[] | undefined) =>
					oldData?.map(table => table.id === variables.tableId ? updatedTable : table) || []
				);
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
				queryClient.invalidateQueries({ queryKey: venueTablesQueryKey(variables.venueId) });
				// Optionally remove from cache directly
				queryClient.setQueryData(venueTablesQueryKey(variables.venueId), (oldData: Table[] | undefined) =>
					oldData?.filter(table => table.id !== variables.tableId) || []
				);
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
