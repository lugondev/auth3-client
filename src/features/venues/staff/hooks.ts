import React from 'react'; // Added React import
import { useQuery, useMutation, useQueryClient, UseQueryOptions, MutationOptions } from '@tanstack/react-query';
import venueService from '@/services/venueService';
import { StaffMember, AddStaffDto, UpdateStaffDto } from '@/types/venue'; // Removed StaffRole
import { useAuth } from '@/contexts/AuthContext'; // Assuming AuthContext provides user info
import { toast } from 'sonner';

// --- Query Hook for fetching staff ---

const venueStaffQueryKey = (venueId: string) => ['venueStaff', venueId];

/**
 * Hook to fetch the list of staff members for a specific venue.
 */
export const useFetchVenueStaff = (
	venueId: string,
	options?: Omit<UseQueryOptions<StaffMember[], Error>, 'queryKey' | 'queryFn'> // Allow passing options like enabled, staleTime etc.
) => {
	return useQuery<StaffMember[], Error>({
		queryKey: venueStaffQueryKey(venueId),
		queryFn: () => {
			if (!venueId) {
				// Return an empty array or throw if venueId is required but not provided yet
				// This prevents the query from running with an invalid ID.
				return Promise.resolve([]);
				// Or throw new Error("Venue ID is required to fetch staff.");
			}
			return venueService.getVenueStaff(venueId);
		},
		enabled: !!venueId && options?.enabled !== false, // Ensure query only runs when venueId is available and not explicitly disabled
		staleTime: 5 * 60 * 1000, // Cache staff list for 5 minutes
		...options, // Spread additional user-provided options
	});
};

// --- Hook to get current user's role in a venue ---

/**
 * Hook to determine the current authenticated user's role within a specific venue.
 * Returns the role, loading state, and potentially error state.
 */
export const useCurrentUserVenueRole = (venueId: string) => {
	const { user } = useAuth(); // Get current user from Auth context
	const { data: staffList, isLoading, error, ...rest } = useFetchVenueStaff(venueId, {
		enabled: !!user && !!venueId, // Only run if user and venueId are available
	});

	const currentUserRole = React.useMemo(() => {
		if (!user || !staffList) return null;
		const currentUserStaffEntry = staffList.find(staff => staff.userId === user.id); // Changed user.uid to user.id
		return currentUserStaffEntry?.role || null; // Return role or null if user is not staff
	}, [user, staffList]);

	return {
		role: currentUserRole,
		isLoading: isLoading, // Reflects loading state of the staff list fetch
		error: error,        // Reflects error state of the staff list fetch
		...rest // Pass through other query state like isFetching etc.
	};
};


// --- Mutation Hooks for Staff Management ---

// Add Staff Member
interface AddStaffVariables {
	venueId: string;
	data: AddStaffDto;
}

export const useAddStaffMember = (options?: MutationOptions<StaffMember, Error, AddStaffVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<StaffMember, Error, AddStaffVariables>({
		mutationFn: ({ venueId, data }) => venueService.addStaffMember(venueId, data),
		onSuccess: (newStaffMember, variables) => {
			// Invalidate the staff list query for this venue
			queryClient.invalidateQueries({ queryKey: venueStaffQueryKey(variables.venueId) });
			// Optionally, manually add the new staff member to the cache for immediate UI update
			// queryClient.setQueryData(venueStaffQueryKey(variables.venueId), (oldData: StaffMember[] | undefined) => [...(oldData || []), newStaffMember]);

			toast.success(`Staff member ${newStaffMember.email} added successfully.`);
			options?.onSuccess?.(newStaffMember, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error adding staff to venue ${variables.venueId}:`, error);
			toast.error(`Failed to add staff: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// Update Staff Member
interface UpdateStaffVariables {
	venueId: string;
	staffId: string;
	data: UpdateStaffDto;
}

export const useUpdateStaffMember = (options?: MutationOptions<StaffMember, Error, UpdateStaffVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<StaffMember, Error, UpdateStaffVariables>({
		mutationFn: ({ venueId, staffId, data }) => venueService.updateStaffMember(venueId, staffId, data),
		onSuccess: (updatedStaffMember, variables) => {
			queryClient.invalidateQueries({ queryKey: venueStaffQueryKey(variables.venueId) });
			// Optionally update the specific staff member in the cache
			// queryClient.setQueryData(venueStaffQueryKey(variables.venueId), (oldData: StaffMember[] | undefined) =>
			//   oldData?.map(staff => staff.id === variables.staffId ? updatedStaffMember : staff) || []
			// );

			toast.success(`Staff member ${updatedStaffMember.email} updated successfully.`);
			options?.onSuccess?.(updatedStaffMember, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error updating staff ${variables.staffId} in venue ${variables.venueId}:`, error);
			toast.error(`Failed to update staff: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// Remove Staff Member
interface RemoveStaffVariables {
	venueId: string;
	staffId: string;
	staffEmail?: string; // Optional email for display in toast
}

export const useRemoveStaffMember = (options?: MutationOptions<void, Error, RemoveStaffVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, RemoveStaffVariables>({
		mutationFn: ({ venueId, staffId }) => venueService.removeStaffMember(venueId, staffId),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: venueStaffQueryKey(variables.venueId) });
			// Optionally remove the staff member from the cache
			// queryClient.setQueryData(venueStaffQueryKey(variables.venueId), (oldData: StaffMember[] | undefined) =>
			//   oldData?.filter(staff => staff.id !== variables.staffId) || []
			// );

			toast.success(`Staff member ${variables.staffEmail || variables.staffId} removed successfully.`);
			options?.onSuccess?.(data, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error removing staff ${variables.staffId} from venue ${variables.venueId}:`, error);
			toast.error(`Failed to remove staff: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};
