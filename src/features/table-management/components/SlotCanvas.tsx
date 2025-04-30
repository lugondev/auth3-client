// next/src/features/table-management/components/SlotCanvas.tsx
'use client' // Keep for potential future hooks, though not strictly needed now

import React from 'react'
import {Slot} from '@/types/slot' // Keep original Slot type for input prop
import SeatMap, {ItemMoveHandler} from './SeatMap' // Import ItemMoveHandler type
import {SeatMapItem, SeatSelectHandler, SeatShape, SeatStatus, SeatType} from '../types/seatmap' // Import SeatMap types

// Define the type for the update handler prop - matching old `onUpdateSlotTransform` structure
export type SlotUpdateHandler = (updates: {id: string; x?: number; y?: number; rotation?: number; width?: number; height?: number}[]) => void

interface SlotCanvasProps {
	slots: Slot[]
	selectedSlotIds: string[]
	onSelectSlot: (slotId: string | null, multiSelect: boolean) => void
	onSlotUpdate?: SlotUpdateHandler // Add prop to handle updates (position, etc.)
	className?: string // Allow passing className for styling the container
}

// Helper function to map Slot to SeatMapItem
// We need to handle potential mismatches between Slot types/statuses and SeatMapItem types/statuses.
// For now, we'll perform a basic mapping. You might need to refine this based on actual data.
const mapSlotToSeatMapItem = (slot: Slot): SeatMapItem => {
	// Basic mapping, adjust as needed for type/status/shape compatibility
	let seatType: SeatType
	switch (slot.type) {
		case 'table':
			seatType = 'table'
			break
		case 'seat': // Assuming 'seat' maps to 'bar_seat' or similar? Needs clarification.
			seatType = 'bar_seat' // Example mapping
			break
		// Add other mappings if SlotType has more options
		default:
			seatType = 'decor' // Default fallback
	}

	let seatShape: SeatShape
	switch (slot.shape) {
		case 'rect':
			seatShape = 'rect'
			break
		case 'longrect':
			seatShape = 'longrect'
			break
		case 'circle':
			seatShape = 'circle'
			break
		case 'ellipse':
			seatShape = 'ellipse'
			break
		default:
			seatShape = 'rect' // Default fallback
	}

	let seatStatus: SeatStatus
	switch (slot.status) {
		case 'available':
			seatStatus = 'available'
			break
		case 'reserved':
			seatStatus = 'reserved'
			break
		case 'confirmed': // Map 'confirmed' to 'occupied' maybe?
			seatStatus = 'occupied' // Example mapping
			break
		case 'selected': // 'selected' doesn't exist in SeatStatus, map to something?
			seatStatus = 'blocked' // Example mapping for selected state visual (or handle via isSelected)
			break
		default:
			seatStatus = 'maintenance' // Default fallback
	}

	return {
		id: slot.id,
		label: slot.label,
		type: seatType,
		shape: seatShape,
		x: slot.x,
		y: slot.y,
		width: slot.width,
		height: slot.height,
		rotation: slot.rotation || 0,
		status: seatStatus, // Use mapped status
		metadata: {
			// Map metadata if possible/needed. Slot metadata is number[] | null, SeatMapItem metadata is object.
			// color: undefined, // Example: You might derive color from Slot metadata if applicable
			// capacity: undefined, // Example: derive capacity
		},
	}
}

const SlotCanvas: React.FC<SlotCanvasProps> = ({slots, selectedSlotIds, onSelectSlot, onSlotUpdate, className}) => {
	// Destructure onSlotUpdate
	// Map the incoming Slot[] to SeatMapItem[]
	const seatMapItems: SeatMapItem[] = slots.map(mapSlotToSeatMapItem)

	// Handle selection from the SeatMap component
	const handleSelect: SeatSelectHandler = (item) => {
		// Currently assumes single selection logic from the old component
		// If clicking the same item, deselect it. Otherwise, select the new one.
		const currentlySelected = selectedSlotIds.length === 1 && selectedSlotIds[0] === item.id
		onSelectSlot(currentlySelected ? null : item.id, false) // Pass false for multiSelect for now
	}

	// Handle item movement from the SeatMap component
	const handleItemMove: ItemMoveHandler = (id, x, y) => {
		if (onSlotUpdate) {
			// Format the update to match the expected structure for onSlotUpdate
			// Only include x and y, as drag currently only handles position
			onSlotUpdate([{id, x, y}])
		} else {
			console.warn('SlotCanvas: onItemMove triggered but no onSlotUpdate handler provided.')
		}
	}

	// TODO: Add handler for clicking the SVG background to clear selection?
	// This would likely involve adding an onClick handler to the outer div or the SVG itself in SeatMap.tsx
	// and calling onSelectSlot(null, false)

	return (
		// Use the passed className for the container
		<div className={`relative w-full h-full overflow-hidden ${className || ''}`}>
			<SeatMap
				items={seatMapItems}
				onSelect={handleSelect}
				selectedItemIds={selectedSlotIds}
				onItemMove={handleItemMove} // Pass the move handler
				className='w-full h-full'
			/>
		</div>
	)
}

export default SlotCanvas
