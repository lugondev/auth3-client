// next/src/features/table-management/components/TableManagementLayout.tsx
import React, {useState, useEffect, useCallback} from 'react'
import VenueZoneSelector from './VenueZoneSelector'
import SlotCanvas from './SlotCanvas'
import SlotInspector from './SlotInspector'
import {Slot, CreateSlotDto, UpdateSlotDto} from '@/types/slot'
import slotService from '@/services/slotService'
// Removed Skeleton import
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Button} from '@/components/ui/button' // Added Button import
import {Terminal} from 'lucide-react'
import {toast} from 'sonner'

interface TableManagementLayoutProps {
	venueId: string
}

const TableManagementLayout: React.FC<TableManagementLayoutProps> = ({venueId}) => {
	// State
	const [selectedZone, setSelectedZone] = useState<string | null>(null) // null means 'All Zones'
	const [slots, setSlots] = useState<Slot[]>([])
	const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [actionError, setActionError] = useState<string | null>(null) // For errors during actions C/U/D
	const [fetchError, setFetchError] = useState<string | null>(null) // For initial fetch error

	// Fetch slots effect
	const fetchSlots = useCallback(async () => {
		if (!venueId) return
		console.log(`Fetching slots for venue: ${venueId}, zone: ${selectedZone ?? 'ALL'}`)
		setLoading(true)
		setFetchError(null)
		setActionError(null) // Clear action errors on refetch
		try {
			const params = selectedZone ? {zone: selectedZone} : {}
			const fetchedSlots = await slotService.getSlots(venueId, params)
			setSlots(fetchedSlots)
		} catch (err) {
			console.error('Failed to fetch slots:', err)
			setFetchError('Could not load slots. Please try refreshing.')
			setSlots([])
			toast.error('Failed to load slots.')
		} finally {
			setLoading(false)
		}
	}, [venueId, selectedZone])

	useEffect(() => {
		fetchSlots()
	}, [fetchSlots])

	// --- Handlers ---

	const handleZoneChange = (zone: string | null) => {
		setSelectedZone(zone) // This will trigger the useEffect to refetch slots
		setSelectedSlotIds([]) // Clear selection when zone changes
	}

	const handleAddSlot = async () => {
		console.log('Add Slot Clicked')
		setActionError(null) // Clear previous action errors
		const newSlotData: CreateSlotDto = {
			label: 'New Slot',
			type: 'table',
			shape: 'rect',
			x: 50,
			y: 50,
			width: 80,
			height: 80,
			zone: selectedZone || 'Default Zone', // Use selected or a default if 'All Zones' is chosen
			status: 'available', // Default status
			rotation: 0,
		}
		try {
			// No setLoading(true) here, as parent might show global loader or we rely on button state
			const createdSlot = await slotService.createSlot(venueId, newSlotData)
			setSlots((prev) => [...prev, createdSlot]) // Add to local state
			toast.success(`Slot "${createdSlot.label}" created successfully.`)
			setSelectedSlotIds([createdSlot.id]) // Select the new slot
		} catch (err) {
			console.error('Failed to create slot:', err)
			const errorMsg = 'Failed to create slot.'
			setActionError(errorMsg)
			toast.error(errorMsg)
		}
	}

	const handleSelectSlot = (slotId: string | null, multiSelect: boolean) => {
		setActionError(null) // Clear action errors on selection change
		if (slotId === null) {
			setSelectedSlotIds([])
		} else if (multiSelect) {
			setSelectedSlotIds((prev) => (prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]))
		} else {
			setSelectedSlotIds([slotId])
		}
	}

	// Handle transform updates from Fabric canvas (position, rotation, size)
	const handleUpdateSlotTransform = async (updates: {id: string; x?: number; y?: number; rotation?: number; width?: number; height?: number}[]) => {
		setActionError(null)
		const originalSlots = [...slots] // Store state for potential revert
		// Optimistic update
		const optimisticSlots = slots.map((s) => {
			const update = updates.find((u) => u.id === s.id)
			return update ? {...s, ...update} : s
		})
		setSlots(optimisticSlots)

		for (const update of updates) {
			console.log(`Update transform for ${update.id}:`, update)
			const patchData: UpdateSlotDto = {}
			// Only include non-nullish and rounded values in patchData
			if (update.x !== undefined && update.x !== null) patchData.x = Math.round(update.x)
			if (update.y !== undefined && update.y !== null) patchData.y = Math.round(update.y)
			if (update.rotation !== undefined && update.rotation !== null) patchData.rotation = Math.round(update.rotation)
			if (update.width !== undefined && update.width !== null) patchData.width = Math.round(update.width)
			if (update.height !== undefined && update.height !== null) patchData.height = Math.round(update.height)

			if (Object.keys(patchData).length > 0) {
				try {
					// Perform the API call without waiting for optimistic UI
					await slotService.updateSlot(venueId, update.id, patchData)
					// If API modifies data, fetchSlots() or merge response here
				} catch (err) {
					console.error(`Failed to update slot ${update.id} transform:`, err)
					setSlots(originalSlots) // Revert ALL changes on ANY failure
					const errorMsg = `Failed to save position/size for slot ${update.id}.`
					setActionError(errorMsg)
					toast.error(errorMsg)
					break // Stop processing batch on error
				}
			}
		}
	}

	// NEW: Handles live form changes from SlotInspector for visual updates
	const handleSlotFormChange = useCallback((slotId: string, changedData: Partial<UpdateSlotDto>) => {
		setSlots((prevSlots) => prevSlots.map((s) => (s.id === slotId ? {...s, ...changedData} : s)))
		// Note: This only updates the visual state. Saving happens via handleUpdateSlot.
	}, []) // No dependencies needed if it only uses setSlots

	// Handles SAVING updates from the SlotInspector form
	const handleUpdateSlot = async (slotId: string, data: UpdateSlotDto) => {
		console.log(`Save inspector data for ${slotId}:`, data)
		setActionError(null)
		const originalSlots = [...slots] // Keep for revert on API error
		// REMOVED Optimistic update: setSlots((prevSlots) => prevSlots.map((s) => (s.id === slotId ? {...s, ...data} : s)))
		try {
			const updatedSlot = await slotService.updateSlot(venueId, slotId, data)
			// Update state with the definitive response from backend (might be slightly different due to rounding/validation)
			setSlots((prevSlots) => prevSlots.map((s) => (s.id === slotId ? updatedSlot : s)))
			toast.success(`Slot "${updatedSlot.label}" updated.`)
		} catch (err) {
			console.error(`Failed to update slot ${slotId} data:`, err)
			setSlots(originalSlots) // Revert
			const errorMsg = `Failed to save changes for slot ${slotId}.`
			setActionError(errorMsg)
			toast.error(errorMsg)
			throw err // Re-throw to potentially signal failure to SlotInspector if needed
		}
	}

	const handleDeleteSlot = async (slotId: string) => {
		console.log(`Delete slot ${slotId}`)
		setActionError(null)
		const originalSlots = [...slots]
		const slotLabel = slots.find((s) => s.id === slotId)?.label || slotId // Get label for messages

		// Basic confirmation
		if (!window.confirm(`Are you sure you want to delete slot ${slotLabel}?`)) {
			return // Abort if user cancels
		}

		// Optimistic update
		setSlots((prevSlots) => prevSlots.filter((s) => s.id !== slotId))
		setSelectedSlotIds((prev) => prev.filter((id) => id !== slotId)) // Clear selection if deleted
		try {
			await slotService.deleteSlot(venueId, slotId) // Consider adding hardDelete=true option if needed
			toast.success(`Slot "${slotLabel}" deleted successfully.`)
		} catch (err) {
			console.error(`Failed to delete slot ${slotId}:`, err)
			setSlots(originalSlots) // Revert
			const errorMsg = `Failed to delete slot ${slotLabel}.`
			setActionError(errorMsg)
			toast.error(errorMsg)
			// Re-select the slot if deletion failed? Maybe not necessary.
		}
	}

	// --- Derived State ---
	const selectedSlot = slots.find((s) => s.id === selectedSlotIds[0] && selectedSlotIds.length === 1) || null
	// Ensure '__ALL__' is always an option, get unique zones, sort them
	const zones = ['__ALL__', ...new Set(slots.map((s) => s.zone))].sort((a, b) => {
		if (a === '__ALL__') return -1
		if (b === '__ALL__') return 1
		return a.localeCompare(b)
	})

	// --- Render Logic ---

	// Display fetch error prominently if it occurs
	if (fetchError) {
		return (
			<Alert variant='destructive' className='m-4'>
				<Terminal className='h-4 w-4' />
				<AlertTitle>Error Loading Venue Layout</AlertTitle>
				<AlertDescription>{fetchError}</AlertDescription>
				<Button onClick={fetchSlots} variant='outline' size='sm' className='mt-2'>
					Retry
				</Button>
			</Alert>
		)
	}

	return (
		<div className='flex flex-col h-[calc(100vh-theme-header-height)] p-4 gap-4'>
			{/* Display action errors if they occur */}
			{actionError && (
				<Alert variant='destructive' className='mb-4'>
					<Terminal className='h-4 w-4' />
					<AlertTitle>Action Failed</AlertTitle>
					<AlertDescription>{actionError}</AlertDescription>
				</Alert>
			)}

			{/* Top Controls */}
			<VenueZoneSelector
				zones={zones}
				selectedZone={selectedZone}
				onZoneChange={handleZoneChange}
				onAddSlot={handleAddSlot}
				disabled={loading} // Disable controls while loading initial data
			/>

			{/* Main Area: Canvas or Loading Skeleton */}
			<div className='flex-grow border rounded-md bg-muted/40 overflow-hidden relative'>
				{loading ? (
					<div className='absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10'>
						{' '}
						{/* Adjusted loading overlay */}
						<p className='text-muted-foreground'>Loading slots...</p>
						{/* TODO: Replace with a proper Spinner component if available */}
					</div>
				) : null}
				{/* Render Canvas underneath the loader or when not loading */}
				{/* Ensure canvas itself doesn't show placeholder text when empty */}
				{/* Correct prop name: onSlotUpdate */}
				<SlotCanvas slots={slots} selectedSlotIds={selectedSlotIds} onSelectSlot={handleSelectSlot} onSlotUpdate={handleUpdateSlotTransform} />
			</div>

			{/* Bottom Inspector Panel */}
			<div className='border rounded-md'>
				{/* Disable inspector while loading initial data or saving */}
				<SlotInspector
					selectedSlot={selectedSlot}
					zones={zones.filter((z) => z !== '__ALL__')} // Pass actual zones
					onUpdateSlot={handleUpdateSlot}
					onDeleteSlot={handleDeleteSlot}
					onFormChange={handleSlotFormChange} // Pass the live update handler
					disabled={loading} // Disable form while loading/saving actions handled internally by SlotInspector
				/>
			</div>
		</div>
	)
}

export default TableManagementLayout
