// next/src/features/table-management/components/SeatMap.tsx
import React, {useState, useRef, useCallback, SVGProps, useEffect} from 'react' // Import useEffect
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

// Interface for pan state
interface PanState {
	isPanning: boolean
	startCoords: {x: number; y: number} // Mouse start coords in SVG space
}

// Interface for ViewBox state
interface ViewBoxState {
	x: number
	y: number
	width: number
	height: number
}

// State for the temporary position during drag
interface DragPosition {
	x: number
	y: number
}

const SeatMap: React.FC<SeatMapProps> = ({items, onSelect, selectedItemIds = [], onItemMove, className = ''}) => {
	const svgRef = useRef<SVGSVGElement>(null) // Ref to the SVG element

	// State for item dragging
	const [dragState, setDragState] = useState<DragState>({
		isDragging: false,
		item: null, // The item being dragged
		startCoords: {x: 0, y: 0}, // Where the drag started
		offset: {x: 0, y: 0}, // Click offset relative to item top-left
	})

	// State for canvas panning
	const [panState, setPanState] = useState<PanState>({
		isPanning: false,
		startCoords: {x: 0, y: 0}, // Where the pan started
	})

	// State for the SVG viewBox
	const [viewBox, setViewBox] = useState<ViewBoxState>({x: 0, y: 0, width: 100, height: 100}) // Initial default

	// State for temporary visual position during item drag
	const [currentDragPosition, setCurrentDragPosition] = useState<DragPosition | null>(null)

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
			// Initialize visual drag position
			setCurrentDragPosition({x: item.x, y: item.y})
		},
		[getSVGPoint, setCurrentDragPosition], // Add setCurrentDragPosition
	)

	// --- Unified Mouse Handlers ---

	// Handle item drag end (logic extracted from original handleDragEnd)
	const handleItemDragEnd = useCallback(
		(event: React.MouseEvent<SVGGElement>) => {
			if (!dragState.isDragging || !dragState.item) {
				return // Should not happen if called correctly, but safe check
			}

			const finalCoords = getSVGPoint(event.clientX, event.clientY)
			const finalX = finalCoords.x - dragState.offset.x
			const finalY = finalCoords.y - dragState.offset.y

			// Notify parent about the final position
			if (onItemMove) {
				onItemMove(dragState.item.id, finalX, finalY)
			}

			// Reset item drag state specifically
			setDragState((prev) => ({...prev, isDragging: false, item: null}))
		},
		[dragState, getSVGPoint, onItemMove], // Keep dependencies
	)

	// Unified mouse move handler for both dragging and panning
	const handleMouseMove = useCallback(
		(event: React.MouseEvent<SVGSVGElement>) => {
			event.preventDefault() // Prevent default browser behavior like text selection

			if (dragState.isDragging && dragState.item) {
				// Item Dragging Logic: Update temporary visual position
				const currentCoords = getSVGPoint(event.clientX, event.clientY)
				const newX = currentCoords.x - dragState.offset.x
				const newY = currentCoords.y - dragState.offset.y
				setCurrentDragPosition({x: newX, y: newY})
			} else if (panState.isPanning) {
				// Canvas Panning Logic
				// event.preventDefault() is now at the top
				const currentCoords = getSVGPoint(event.clientX, event.clientY)
				const dx = currentCoords.x - panState.startCoords.x
				const dy = currentCoords.y - panState.startCoords.y

				// Update viewBox position (move opposite to mouse drag)
				setViewBox((prev) => ({
					...prev,
					x: prev.x - dx,
					y: prev.y - dy,
				}))
				// Note: startCoords remain the same for the duration of this pan sequence
			}
		},
		[
			dragState.isDragging,
			dragState.item,
			dragState.offset.x, // Added offset dependencies
			dragState.offset.y,
			panState,
			getSVGPoint,
			setViewBox,
			setCurrentDragPosition, // Added setCurrentDragPosition
		],
	)

	// Unified mouse up handler
	const handleMouseUp = useCallback(
		(event: React.MouseEvent<SVGSVGElement>) => {
			if (dragState.isDragging) {
				handleItemDragEnd(event) // Finalize item drag
				setCurrentDragPosition(null) // Clear temporary position
			}
			if (panState.isPanning) {
				setPanState((prev) => ({...prev, isPanning: false})) // Stop panning
			}
			// Ensure drag state is fully reset if mouseup occurs without a specific action finishing
			if (!dragState.isDragging && !panState.isPanning) {
				setDragState({isDragging: false, item: null, startCoords: {x: 0, y: 0}, offset: {x: 0, y: 0}})
				setCurrentDragPosition(null)
			}
		},
		// Add setCurrentDragPosition to dependencies
		[dragState.isDragging, panState.isPanning, handleItemDragEnd, setPanState, setCurrentDragPosition],
	)

	// Mouse down handler for initiating pan on SVG background
	const handleMouseDownSVG = useCallback(
		(event: React.MouseEvent<SVGSVGElement>) => {
			// Only pan if clicking directly on the SVG background, not an item or its children
			if (event.target === svgRef.current) {
				event.preventDefault() // Prevent text selection/default drag
				const coords = getSVGPoint(event.clientX, event.clientY)
				setPanState({isPanning: true, startCoords: coords})
				// Ensure item dragging is off if starting a pan
				setDragState((prev) => (prev.isDragging ? {...prev, isDragging: false, item: null} : prev))
			}
			// If clicking an item, its onDragStart (handleDragStart) will manage item dragging state.
		},
		[getSVGPoint, setPanState, setDragState], // Add setPanState, setDragState
	)

	// Calculate initial viewBox based on items - run once or when items change
	useEffect(() => {
		if (!items || items.length === 0) {
			setViewBox({x: 0, y: 0, width: 100, height: 100}) // Default for empty
			return
		}

		const padding = 50 // Increased padding for better initial view
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity

		items.forEach((item) => {
			// Basic axis-aligned bounding box calculation
			const itemMaxX = item.x + item.width
			const itemMaxY = item.y + item.height
			if (item.x < minX) minX = item.x
			if (item.y < minY) minY = item.y
			if (itemMaxX > maxX) maxX = itemMaxX
			if (itemMaxY > maxY) maxY = itemMaxY
		})

		// Handle cases with no dimensions or single point
		if (!isFinite(minX)) minX = 0
		if (!isFinite(minY)) minY = 0
		if (!isFinite(maxX)) maxX = 100
		if (!isFinite(maxY)) maxY = 100
		if (maxX <= minX) maxX = minX + padding * 2 // Use <= to handle zero-width case
		if (maxY <= minY) maxY = minY + padding * 2 // Use <= to handle zero-height case

		setViewBox({
			x: minX - padding,
			y: minY - padding,
			width: maxX - minX + padding * 2,
			height: maxY - minY + padding * 2,
		})
	}, [items, setViewBox]) // Recalculate when items array ref changes

	// Early return if no items (already calculated viewBox for default state)
	if (!items || items.length === 0) {
		// Render placeholder but keep SVG structure for potential interaction
		return (
			<svg ref={svgRef} className={className} viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} style={{border: '1px dashed #ccc', width: '100%', height: '100%'}}>
				<text x='50%' y='50%' dominantBaseline='middle' textAnchor='middle' fill='#888'>
					No items to display.
				</text>
			</svg>
		)
	}

	// Determine cursor style based on current state
	const getCursorStyle = () => {
		if (dragState.isDragging) return 'grabbing' // Item drag
		if (panState.isPanning) return 'grabbing' // Canvas pan
		// Optional: Add 'grab' on hover over background when pannable?
		return 'default' // Default cursor
	}

	// SVG props including event handlers and style
	const svgProps: SVGProps<SVGSVGElement> = {
		onMouseDown: handleMouseDownSVG, // Use the SVG-specific handler to start pan
		onMouseMove: handleMouseMove, // Unified move handler (pan or item drag)
		onMouseUp: handleMouseUp, // Unified up handler (stop pan or item drag)
		onMouseLeave: handleMouseUp, // Stop panning/dragging if mouse leaves SVG
		style: {
			width: '100%',
			height: '100%',
			border: '1px solid #eee', // Keep border or customize
			cursor: getCursorStyle(), // Dynamic cursor
			userSelect: 'none', // Prevent text selection during drag/pan
		},
	}

	return (
		<svg
			ref={svgRef}
			className={className}
			// Use the dynamic viewBox state here
			viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
			preserveAspectRatio='xMidYMid meet'
			data-testid='seat-map-svg'
			{...svgProps} // Spread the handlers and style
		>
			{/* Background rect is implicitly the SVG itself for catching clicks */}
			{/* <rect x={viewBoxX} y={viewBoxY} width={viewBoxWidth} height={viewBoxHeight} fill="transparent" onClick={() => onSelect(null)} /> */}

			{items.map((item) => {
				// Determine the position to render: use temporary drag position if this item is being dragged
				const displayItem = dragState.isDragging && dragState.item?.id === item.id && currentDragPosition ? {...item, x: currentDragPosition.x, y: currentDragPosition.y} : item

				return (
					<SeatItem
						key={item.id}
						// Pass the potentially modified item with temporary position
						item={displayItem}
						onSelect={onSelect}
						isSelected={selectedItemIds.includes(item.id)}
						onDragStart={handleDragStart} // Pass the drag start handler
					/>
				)
			})}
			{/* No need to render separately on top if modifying the mapped item */}
			{/* {dragState.isDragging && dragState.item && currentDragPosition && (
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
