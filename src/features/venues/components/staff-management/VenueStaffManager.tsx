import React, {useState, useEffect, useCallback} from 'react'
import {toast} from 'sonner' // Import sonner's toast function
import StaffManagementTable from './StaffManagementTable'
import StaffFormDialog from './StaffFormDialog'
import {getVenueStaff, addVenueStaff, updateVenueStaff, deleteVenueStaff} from '@/services/staffService'
import {VenueStaff, AddStaffInput, UpdateStaffInput} from '@/types/staff'
// TODO: Add pagination controls if needed

interface VenueStaffManagerProps {
	venueId: string
}

const VenueStaffManager: React.FC<VenueStaffManagerProps> = ({venueId}) => {
	const [staffList, setStaffList] = useState<VenueStaff[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false) // For form submission loading state
	const [error, setError] = useState<string | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
	const [editingStaff, setEditingStaff] = useState<VenueStaff | null>(null)
	// No need for useToast hook with sonner

	const fetchStaff = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			// TODO: Implement pagination if the list can be long
			const result = await getVenueStaff(venueId, 1, 100) // Fetching up to 100 for now
			// Assuming the API returns email on the staff object, or we need another way
			// For now, let's add a dummy email if missing for display
			// Also check if the backend actually returns `user` object nested
			const staffWithEmail = result.staff.map((s) => ({
				...s,
				email: s.email || `user-${s.user_id.substring(0, 8)}@example.com`, // Placeholder email
			}))
			setStaffList(staffWithEmail)
		} catch (err) {
			console.error('Failed to fetch staff:', err)
			setError('Failed to load staff members.')
			toast.error('Could not fetch staff members.') // Use sonner's toast.error
		} finally {
			setIsLoading(false)
		}
	}, [venueId]) // Remove toast from dependency array

	useEffect(() => {
		if (venueId) {
			// Only fetch if venueId is available
			fetchStaff()
		}
	}, [fetchStaff, venueId])

	const handleOpenAddDialog = () => {
		setEditingStaff(null)
		setIsDialogOpen(true)
	}

	const handleOpenEditDialog = (staff: VenueStaff) => {
		setEditingStaff(staff)
		setIsDialogOpen(true)
	}

	const handleCloseDialog = () => {
		setIsDialogOpen(false)
		setEditingStaff(null) // Clear editing state when closing
	}

	const handleSubmitStaffForm = async (data: AddStaffInput | UpdateStaffInput, staffId?: string) => {
		setIsSubmitting(true)
		try {
			if (staffId && editingStaff) {
				// Editing existing staff
				await updateVenueStaff(venueId, staffId, data as UpdateStaffInput)
				toast.success('Staff member updated.') // Use sonner's toast.success
			} else {
				// Adding new staff
				try {
					await addVenueStaff(venueId, data as AddStaffInput)
					toast.success('Staff member added.') // Use sonner's toast.success
				} catch (addError: unknown) {
					// Changed 'any' to 'unknown'
					// Catch specific error if user_id is missing/placeholder
					// Type guard for error message access
					const errorMessage = addError instanceof Error ? addError.message : String(addError)
					if (errorMessage === 'Valid user_id is required to add staff.') {
						toast.error('Cannot add staff without selecting a valid user.') // Use sonner's toast.error
						// Keep dialog open maybe? Or guide user.
						setIsSubmitting(false) // Stop loading
						return // Prevent further processing
					} else {
						// Handle other potential errors from addVenueStaff
						console.error('Error adding staff:', addError)
						toast.error('Failed to add staff member.') // Use sonner's toast.error
						setIsSubmitting(false)
						return // Stop processing
					}
				}
			}
			handleCloseDialog()
			await fetchStaff() // Refetch the list after successful add/update
		} catch (err) {
			// Catch errors from updateVenueStaff or re-thrown errors from addVenueStaff
			console.error('Failed to save staff member:', err)
			toast.error(`Failed to ${staffId ? 'update' : 'add'} staff member. Please try again.`) // Use sonner's toast.error
		} finally {
			// Ensure submitting state is always reset unless handled specifically above
			if (isSubmitting) {
				setIsSubmitting(false)
			}
		}
	}

	const handleDeleteStaff = async (staffIdToDelete: string) => {
		// Simple confirmation dialog
		if (!window.confirm('Are you sure you want to remove this staff member?')) {
			return
		}

		// Indicate loading state specific to deletion maybe? For now, reuse general loading
		setIsLoading(true)
		try {
			await deleteVenueStaff(venueId, staffIdToDelete)
			toast.success('Staff member removed.') // Use sonner's toast.success
			await fetchStaff() // Refetch list
		} catch (err) {
			console.error('Failed to delete staff member:', err)
			toast.error('Failed to remove staff member.') // Use sonner's toast.error
			setIsLoading(false) // Ensure loading is turned off on error
		}
		// fetchStaff() called above will handle setIsLoading(false) on success
	}

	if (error && !isLoading) {
		// Show error only if not loading initially
		// TODO: Better error display component
		return <div className='text-red-500 p-4'>{error}</div>
	}

	return (
		<div>
			<StaffManagementTable
				// Pass venueId={venueId} if table component needs it later
				staff={staffList}
				isLoading={isLoading && staffList.length === 0} // Show loading skeleton/text only on initial load
				onAddStaff={handleOpenAddDialog}
				onEditStaff={handleOpenEditDialog}
				onDeleteStaff={handleDeleteStaff}
			/>
			<StaffFormDialog
				isOpen={isDialogOpen}
				onClose={handleCloseDialog}
				onSubmit={handleSubmitStaffForm}
				initialData={editingStaff}
				isLoading={isSubmitting}
				venueId={venueId} // Pass venueId to dialog for add operation
			/>
		</div>
	)
}

export default VenueStaffManager
