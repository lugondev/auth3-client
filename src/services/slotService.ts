// next/src/services/slotService.ts
import apiClient from '@/lib/apiClient';
import { Slot, CreateSlotDto, UpdateSlotDto, SlotType } from '@/types/slot'; // Removed SlotListResponse

const slotService = {
	/**
	 * List all slots in a venue, with optional filters.
	 * GET /venues/{venueId}/slots
	 */
	getSlots: async (venueId: string, params?: { type?: SlotType; zone?: string }): Promise<Slot[]> => {
		// Assuming the API returns Slot[] directly based on the prompt.
		// If it returns SlotListResponse, adjust the return type and data access.
		try {
			const response = await apiClient.get<Slot[]>(`/venues/${venueId}/slots`, { params });
			// If response is { slots: [...] }, return response.data.slots
			return response.data;
		} catch (error) {
			console.error('Error fetching slots:', error);
			// Consider more specific error handling or re-throwing
			throw error;
		}
	},

	/**
	 * Create a new slot (table or seat).
	 * POST /venues/{venueId}/slots
	 */
	createSlot: async (venueId: string, data: CreateSlotDto): Promise<Slot> => {
		try {
			const response = await apiClient.post<Slot>(`/venues/${venueId}/slots`, data);
			return response.data;
		} catch (error) {
			console.error('Error creating slot:', error);
			throw error;
		}
	},

	/**
	 * Update an existing slot.
	 * PATCH /venues/{venueId}/slots/{slotId}
	 */
	updateSlot: async (venueId: string, slotId: string, data: UpdateSlotDto): Promise<Slot> => {
		try {
			// Ensure data isn't sending undefined values if the backend doesn't handle them well
			const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
				if (value !== undefined) {
					acc[key as keyof UpdateSlotDto] = value;
				}
				return acc;
			}, {} as UpdateSlotDto);

			const response = await apiClient.patch<Slot>(`/venues/${venueId}/slots/${slotId}`, cleanData);
			return response.data;
		} catch (error) {
			console.error(`Error updating slot ${slotId}:`, error);
			throw error;
		}
	},

	/**
	 * Delete a slot.
	 * DELETE /venues/{venueId}/slots/{slotId}
	 * Optional hard delete query param.
	 */
	deleteSlot: async (venueId: string, slotId: string, hardDelete: boolean = false): Promise<void> => {
		try {
			const params = hardDelete ? { hard: true } : {};
			await apiClient.delete(`/venues/${venueId}/slots/${slotId}`, { params });
			// No data expected on successful delete
		} catch (error) {
			console.error(`Error deleting slot ${slotId}:`, error);
			throw error;
		}
	},

	/**
	* Get a single slot by ID (Endpoint assumed, add if backend supports it)
	* GET /venues/{venueId}/slots/{slotId} - Assuming this endpoint exists
	*/
	// getSlotById: async (venueId: string, slotId: string): Promise<Slot> => {
	//      try {
	//         const response = await apiClient.get<Slot>(`/venues/${venueId}/slots/${slotId}`);
	//         return response.data;
	//     } catch (error) {
	//         console.error(`Error fetching slot ${slotId}:`, error);
	//         throw error;
	//     }
	// }
};

export default slotService;
