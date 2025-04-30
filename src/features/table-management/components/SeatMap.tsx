// next/src/features/table-management/components/SeatMap.tsx
import React, {useState, useRef, useCallback, SVGProps} from 'react' // Import hooks
import {SeatMapItem, SeatSelectHandler} from '../types/seatmap'
import SeatItem from './SeatItem'

// Define the type for the new prop
export type ItemMoveHandler = (id: string, x: number, y: number) => void

interface SeatMapProps {
	items: SeatMapItem[]
	onSelect: SeatSelectHandler
	selectedItemIds?: string[]
	onItemMove?: ItemMoveHandler // Prop to notify parent about position changes
	// Optional: Add props for controlling width/height/aspect ratio if needed
	className?: string // Allow custom styling
}

// Interface for drag state
interface DragState {
	isDragging: boolean
	item: SeatMapItem | null
	startCoords: {x: number; y: number} // Mouse start coords in SVG space
	offset: {x: number; y: number} // Offset from item origin (0,0) to mouse click point
}

const SeatMap: React.FC<SeatMapProps> = ({items, onSelect, selectedItemIds = [], onItemMove, className = ''}) => {
	const svgRef = useRef<SVGSVGElement>(null) // Ref to the SVG element
	const [dragState, setDragState] = useState<DragState>({
		isDragging: false,
		item: null,
		startCoords: {x: 0, y: 0},
		offset: {x: 0, y: 0},
	})

	// Helper to convert screen coords to SVG coords
	const getSVGPoint = useCallback((screenX: number, screenY: number): {x: number; y: number} => {
		if (!svgRef.current) return {x: 0, y: 0}

		const svg = svgRef.current
		const point = svg.createSVGPoint()
		point.x = screenX
		point.y = screenY

		const ctm = svg.getScreenCTM()
		if (!ctm) return {x: 0, y: 0} // Handle case where CTM is null

		const invertedCtm = ctm.inverse()
		const svgPoint = point.matrixTransform(invertedCtm)
		return {x: svgPoint.x, y: svgPoint.y}
	}, []) // Empty dependency array as svgRef.current doesn't change

	// --- Drag Handlers (Define BEFORE early return) ---
	const handleDragStart = useCallback(
		(event: React.MouseEvent<SVGGElement>, item: SeatMapItem) => {
			event.stopPropagation() // Prevent triggering other handlers if needed
			const startCoords = getSVGPoint(event.clientX, event.clientY)
			// Calculate offset from item's origin (top-left)
			const offset = {
				x: startCoords.x - item.x,
				y: startCoords.y - item.y,
			}
			setDragState({
				isDragging: true,
				item: item,
				startCoords: startCoords,
				offset: offset,
			})
		},
		[getSVGPoint],
	)

	const handleDragMove = useCallback(
		// Remove unused event parameter
		() => {
			// No event needed here if not using event details directly in this handler
			if (!dragState.isDragging || !dragState.item) return

			// ClientX/Y would need to be accessed from the event if needed, but currently, it's only used in getSVGPoint inside handleDragEnd.
			// If live-dragging visual update is implemented later, the event param will be needed here.
			// const currentCoords = getSVGPoint(event.clientX, event.clientY);
			// Calculate new top-left position based on mouse movement and initial offset
			// const newX = currentCoords.x - dragState.offset.x // Removed unused variable
			// const newY = currentCoords.y - dragState.offset.y // Removed unused variable

			// Optional: Add snapping or boundary checks here

			// Update the item's position visually (can be done via state update triggering re-render,
			// or direct DOM manipulation if performance becomes an issue, but state is cleaner)
			// For now, we just prepare the data. The actual update happens on mouse up.
			// We could potentially update a temporary position state here for smoother visual feedback.
		},
		[dragState], // Removed dependency on unused getSVGPoint
	)

	const handleDragEnd = useCallback(
		(event: React.MouseEvent<SVGSVGElement>) => {
			if (!dragState.isDragging || !dragState.item) {
				// If not dragging but mouseup occurred on SVG, maybe clear selection?
				// onSelect(null); // Requires onSelect prop to accept null
				return
			}

			const finalCoords = getSVGPoint(event.clientX, event.clientY)
			const finalX = finalCoords.x - dragState.offset.x
			const finalY = finalCoords.y - dragState.offset.y

			// Call the onItemMove prop to notify the parent of the final position
			if (onItemMove) {
				onItemMove(dragState.item.id, finalX, finalY)
			}

			// Reset drag state
			setDragState({
				isDragging: false,
				item: null,
				startCoords: {x: 0, y: 0},
				offset: {x: 0, y: 0},
			})
		},
		[dragState, getSVGPoint, onItemMove],
	)

	// Early return if no items
	if (!items || items.length === 0) {
		// Handle empty state or return null/placeholder
		return (
			<div className={className} style={{border: '1px dashed #ccc', padding: '20px', textAlign: 'center'}}>
				No items to display on the seat map.
			</div>
		)
	}

	// Calculate viewBox bounds to contain all items
	// Add some padding around the edges
	const padding = 20
	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity

	items.forEach((item) => {
		// Consider rotation: simple bounding box might not be perfect for bounds,
		// but for viewBox calculation, axis-aligned is usually sufficient.
		// A more accurate calculation would involve rotated bounding boxes.
		const itemMaxX = item.x + item.width
		const itemMaxY = item.y + item.height
		if (item.x < minX) minX = item.x
		if (item.y < minY) minY = item.y
		if (itemMaxX > maxX) maxX = itemMaxX
		if (itemMaxY > maxY) maxY = itemMaxY
	})

	// Handle case where items might have zero width/height or there's only one point
	if (maxX === minX) maxX += padding * 2 // Add default width if all items are at the same x or widthless
	if (maxY === minY) maxY += padding * 2 // Add default height if all items are at the same y or heightless

	const viewBoxX = minX - padding
	const viewBoxY = minY - padding
	const viewBoxWidth = maxX - minX + padding * 2
	const viewBoxHeight = maxY - minY + padding * 2

	// Add mouse move and mouse up listeners to the SVG element
	const svgProps: SVGProps<SVGSVGElement> = {
		onMouseMove: handleDragMove, // Moved handlers before return
		onMouseUp: handleDragEnd,
		onMouseLeave: handleDragEnd, // Stop dragging if mouse leaves SVG area
		style: {
			width: '100%',
			height: '100%',
			border: '1px solid #eee',
			cursor: dragState.isDragging ? 'grabbing' : 'default', // Change cursor while dragging
		},
	}

	return (
		<svg
			ref={svgRef}
			className={className}
			viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
			preserveAspectRatio='xMidYMid meet'
			data-testid='seat-map-svg'
			{...svgProps} // Spread the event handlers and style
		>
			{/* Optional: Add a background rect to catch clicks for deselecting */}
			{/* <rect x={viewBoxX} y={viewBoxY} width={viewBoxWidth} height={viewBoxHeight} fill="transparent" onClick={() => onSelect(null)} /> */}

			{items.map((item) => (
				<SeatItem
					key={item.id}
					item={item}
					onSelect={onSelect}
					isSelected={selectedItemIds.includes(item.id)}
					onDragStart={handleDragStart} // Pass the drag start handler
				/>
			))}
			{/* Optionally render the currently dragged item separately on top */}
			{/* {dragState.isDragging && dragState.item && (
        <SeatItem
          item={{ ...dragState.item, x: currentDragX, y: currentDragY }} // Use temp position state
          onSelect={() => {}} // Dummy handlers for the temporary item
          onDragStart={() => {}}
          isSelected={true}
        />
      )} */}
		</svg>
	)
}

export default SeatMap // Removed duplicate export
