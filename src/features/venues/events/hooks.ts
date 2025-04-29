import { useQuery, useMutation, useQueryClient, UseQueryOptions, MutationOptions } from '@tanstack/react-query';
import venueService from '@/services/venueService';
import { Event, CreateEventDto, UpdateEventDto, EventPhoto, AddEventPhotoDto } from '@/types/event'; // Import event types
import { toast } from 'sonner';

// --- Query Key Factory ---
const venueEventsQueryKey = (venueId: string) => ['venueEvents', venueId];
const venueUpcomingEventsQueryKey = (venueId: string) => ['venueUpcomingEvents', venueId];
const eventDetailsQueryKey = (eventId: string) => ['eventDetails', eventId];

// --- Fetch Events Hooks ---
/**
 * Hook to fetch the list of all events for a specific venue.
 */
export const useFetchVenueEvents = (
	venueId: string,
	options?: Omit<UseQueryOptions<Event[], Error>, 'queryKey' | 'queryFn'>
) => {
	return useQuery<Event[], Error>({
		queryKey: venueEventsQueryKey(venueId),
		queryFn: () => {
			if (!venueId) return Promise.resolve([]);
			return venueService.getVenueEvents(venueId);
		},
		enabled: !!venueId && options?.enabled !== false,
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		...options,
	});
};

/**
 * Hook to fetch the list of upcoming events for a specific venue.
 */
export const useFetchUpcomingVenueEvents = (
	venueId: string,
	options?: Omit<UseQueryOptions<Event[], Error>, 'queryKey' | 'queryFn'>
) => {
	return useQuery<Event[], Error>({
		queryKey: venueUpcomingEventsQueryKey(venueId),
		queryFn: () => {
			if (!venueId) return Promise.resolve([]);
			return venueService.getUpcomingVenueEvents(venueId);
		},
		enabled: !!venueId && options?.enabled !== false,
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		...options,
	});
};


// --- Fetch Event Details Hook (Optional, if needed) ---
/**
 * Hook to fetch details for a specific event.
 */
export const useFetchEventDetails = (
	eventId: string,
	options?: Omit<UseQueryOptions<Event, Error>, 'queryKey' | 'queryFn'>
) => {
	return useQuery<Event, Error>({
		queryKey: eventDetailsQueryKey(eventId),
		queryFn: () => {
			if (!eventId) throw new Error("Event ID is required to fetch details.");
			return venueService.getEventDetails(eventId);
		},
		enabled: !!eventId && options?.enabled !== false,
		...options,
	});
};


// --- Create Event Hook ---
interface CreateEventVariables {
	venueId: string;
	data: CreateEventDto;
}

export const useCreateEvent = (options?: MutationOptions<Event, Error, CreateEventVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Event, Error, CreateEventVariables>({
		mutationFn: ({ venueId, data }) => venueService.createEvent(venueId, data),
		onSuccess: (newEvent, variables) => {
			queryClient.invalidateQueries({ queryKey: venueEventsQueryKey(variables.venueId) });
			queryClient.invalidateQueries({ queryKey: venueUpcomingEventsQueryKey(variables.venueId) }); // Invalidate upcoming too
			toast.success(`Event "${newEvent.name}" created successfully.`);
			options?.onSuccess?.(newEvent, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error creating event for venue ${variables.venueId}:`, error);
			toast.error(`Failed to create event: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Update Event Hook ---
// Note: Update/Delete use /events/{eventId} endpoint
interface UpdateEventVariables {
	eventId: string;
	data: UpdateEventDto;
	venueId?: string; // For invalidating the venue's event lists
}

export const useUpdateEvent = (options?: MutationOptions<Event, Error, UpdateEventVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Event, Error, UpdateEventVariables>({
		mutationFn: ({ eventId, data }) => venueService.updateEvent(eventId, data),
		onSuccess: (updatedEvent, variables) => {
			queryClient.invalidateQueries({ queryKey: eventDetailsQueryKey(variables.eventId) });
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: venueEventsQueryKey(variables.venueId) });
				queryClient.invalidateQueries({ queryKey: venueUpcomingEventsQueryKey(variables.venueId) });
				// Optionally update cache directly
				// ... (more complex for lists due to potential date changes affecting 'upcoming')
			}
			toast.success(`Event "${updatedEvent.name}" updated successfully.`);
			options?.onSuccess?.(updatedEvent, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error updating event ${variables.eventId}:`, error);
			toast.error(`Failed to update event: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Delete Event Hook ---
interface DeleteEventVariables {
	eventId: string;
	eventName?: string; // For toast message
	venueId?: string; // For invalidating the venue's event lists
}

export const useDeleteEvent = (options?: MutationOptions<void, Error, DeleteEventVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, DeleteEventVariables>({
		mutationFn: ({ eventId }) => venueService.deleteEvent(eventId),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: eventDetailsQueryKey(variables.eventId) });
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: venueEventsQueryKey(variables.venueId) });
				queryClient.invalidateQueries({ queryKey: venueUpcomingEventsQueryKey(variables.venueId) });
				// Optionally remove from cache directly
				// ... (more complex for lists)
			}
			toast.success(`Event "${variables.eventName || variables.eventId}" deleted successfully.`);
			options?.onSuccess?.(data, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error deleting event ${variables.eventId}:`, error);
			toast.error(`Failed to delete event: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Add Event Photo Hook ---
// Note: Add/Delete photo use /events/{eventId}/photos endpoint
interface AddEventPhotoVariables {
	eventId: string;
	data: AddEventPhotoDto; // Contains file and optional altText
	venueId?: string; // For list invalidation (less critical maybe)
}

export const useAddEventPhoto = (options?: MutationOptions<EventPhoto, Error, AddEventPhotoVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<EventPhoto, Error, AddEventPhotoVariables>({
		mutationFn: ({ eventId, data }) => venueService.addEventPhoto(eventId, data),
		onSuccess: (newEventPhoto, variables) => {
			queryClient.invalidateQueries({ queryKey: eventDetailsQueryKey(variables.eventId) });
			// Less likely needed, but invalidate lists if photo influences list display
			// if (variables.venueId) {
			//     queryClient.invalidateQueries({ queryKey: venueEventsQueryKey(variables.venueId) });
			//     queryClient.invalidateQueries({ queryKey: venueUpcomingEventsQueryKey(variables.venueId) });
			// }
			toast.success(`Photo added successfully to event ${variables.eventId}.`);
			options?.onSuccess?.(newEventPhoto, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error adding photo for event ${variables.eventId}:`, error);
			toast.error(`Failed to add photo: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Delete Event Photo Hook ---
interface DeleteEventPhotoVariables {
	eventId: string;
	photoId: string;
	venueId?: string; // For list invalidation (less critical maybe)
}

export const useDeleteEventPhoto = (options?: MutationOptions<void, Error, DeleteEventPhotoVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, DeleteEventPhotoVariables>({
		mutationFn: ({ eventId, photoId }) => venueService.deleteEventPhoto(eventId, photoId),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: eventDetailsQueryKey(variables.eventId) });
			// Less likely needed, but invalidate lists if photo influences list display
			// if (variables.venueId) {
			//     queryClient.invalidateQueries({ queryKey: venueEventsQueryKey(variables.venueId) });
			//     queryClient.invalidateQueries({ queryKey: venueUpcomingEventsQueryKey(variables.venueId) });
			// }
			toast.success(`Photo deleted successfully from event ${variables.eventId}.`);
			options?.onSuccess?.(data, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error deleting photo ${variables.photoId} for event ${variables.eventId}:`, error);
			toast.error(`Failed to delete photo: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};


// --- Placeholder for more complex event management logic ---
// export const useManageEventCapacity = (...) => { ... };
// export const useCheckEventConflicts = (...) => { ... };
// export const useGenerateRecurringEvents = (...) => { ... };
// export const useCancelEvent = (...) => { ... };
// export const useFeatureEvent = (...) => { ... };
