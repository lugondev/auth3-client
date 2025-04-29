import { useMutation, useQueryClient, MutationOptions } from '@tanstack/react-query';
import venueService from '@/services/venueService';
import { CreateVenueData, Venue, VenueStatus, TransferOwnershipDto } from '@/types/venue'; // Removed UpdateVenueData
import { toast } from 'sonner';

/**
 * Hook for creating a new venue.
 * Handles the API call, state updates, and notifications.
 */
export const useCreateVenue = () => {
	const queryClient = useQueryClient();

	return useMutation<Venue, Error, CreateVenueData>({
		mutationFn: (venueData: CreateVenueData) => venueService.createVenue(venueData),
		onSuccess: (newVenue) => {
			// Invalidate and refetch venue lists or related queries
			// Example: Invalidate a query that fetches all venues for the user
			queryClient.invalidateQueries({ queryKey: ['venues'] });
			// Can also manually add the new venue to the query cache if needed for immediate UI update
			// queryClient.setQueryData(['venues'], (oldData: any) => ...);

			toast.success(`Venue "${newVenue.name}" created successfully! It's pending approval.`);
		},
		onError: (error) => {
			console.error('Error creating venue:', error);
			toast.error(`Failed to create venue: ${error.message || 'Unknown error'}`);
		},
	});
};

// --- Update Venue Status Hook ---

interface UpdateVenueStatusVariables {
	venueId: string;
	status: VenueStatus;
}

/**
 * Hook for updating the status of a venue (e.g., pending -> active, active -> inactive).
 */
export const useUpdateVenueStatus = (options?: MutationOptions<Venue, Error, UpdateVenueStatusVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Venue, Error, UpdateVenueStatusVariables>({
		mutationFn: ({ venueId, status }: UpdateVenueStatusVariables) =>
			venueService.updateVenue(venueId, { status }), // Only send status in the update payload
		onSuccess: (updatedVenue, variables) => {
			// Invalidate queries related to the specific venue and venue lists
			queryClient.invalidateQueries({ queryKey: ['venue', variables.venueId] });
			queryClient.invalidateQueries({ queryKey: ['venues'] }); // Or more specific list keys

			// Optionally update the specific venue query data immediately
			queryClient.setQueryData(['venue', variables.venueId], updatedVenue);

			toast.success(`Venue "${updatedVenue.name}" status updated to ${variables.status}.`);
			// Call onSuccess from options if provided
			options?.onSuccess?.(updatedVenue, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error updating status for venue ${variables.venueId}:`, error);
			toast.error(`Failed to update venue status: ${error.message || 'Unknown error'}`);
			// Call onError from options if provided
			options?.onError?.(error, variables, undefined);
		},
		// Spread any additional options like onMutate, onSettled
		...options,
	});
};

// --- Verify Venue Hook ---

interface VerifyVenueVariables {
	venueId: string;
	verified: boolean;
}

/**
 * Hook for marking a venue as verified or unverified.
 */
export const useVerifyVenue = (options?: MutationOptions<Venue, Error, VerifyVenueVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Venue, Error, VerifyVenueVariables>({
		mutationFn: ({ venueId, verified }: VerifyVenueVariables) =>
			venueService.updateVenue(venueId, { verified }), // Only send verified status
		onSuccess: (updatedVenue, variables) => {
			queryClient.invalidateQueries({ queryKey: ['venue', variables.venueId] });
			queryClient.invalidateQueries({ queryKey: ['venues'] });
			queryClient.setQueryData(['venue', variables.venueId], updatedVenue);

			toast.success(`Venue "${updatedVenue.name}" verification status set to ${variables.verified}.`);
			options?.onSuccess?.(updatedVenue, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error updating verification for venue ${variables.venueId}:`, error);
			toast.error(`Failed to update verification status: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};


// --- Transfer Venue Ownership Hook ---

interface TransferOwnershipVariables {
	venueId: string;
	data: TransferOwnershipDto;
}

/**
 * Hook for transferring ownership of a venue.
 */
export const useTransferVenueOwnership = (options?: MutationOptions<void, Error, TransferOwnershipVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, TransferOwnershipVariables>({
		mutationFn: ({ venueId, data }: TransferOwnershipVariables) =>
			venueService.transferVenueOwnership(venueId, data),
		onSuccess: (data, variables) => {
			// Invalidate venue details, staff list, and potentially user-related queries
			queryClient.invalidateQueries({ queryKey: ['venue', variables.venueId] });
			queryClient.invalidateQueries({ queryKey: ['venueStaff', variables.venueId] });
			queryClient.invalidateQueries({ queryKey: ['venues'] }); // User's venue list might change

			toast.success(`Ownership transfer initiated for venue ${variables.venueId}.`);
			options?.onSuccess?.(data, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error transferring ownership for venue ${variables.venueId}:`, error);
			toast.error(`Failed to transfer ownership: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};
