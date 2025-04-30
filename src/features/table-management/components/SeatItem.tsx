// next/src/features/table-management/components/SeatItem.tsx
import React from 'react'
import {SeatMapItem, SeatSelectHandler} from '../types/seatmap'

interface SeatItemProps {
	item: SeatMapItem
	onSelect: SeatSelectHandler
	isSelected?: boolean
	onDragStart: (event: React.MouseEvent<SVGGElement>, item: SeatMapItem) => void // Prop for drag start
}

// Define default colors based on status
const statusColors: Record<SeatMapItem['status'], string> = {
	available: '#4CAF50', // Green
	blocked: '#9E9E9E', // Grey
	reserved: '#FF9800', // Orange
	occupied: '#F44336', // Red
	maintenance: '#2196F3', // Blue
}

const SeatItem: React.FC<SeatItemProps> = ({item, onSelect, isSelected = false, onDragStart}) => {
	// Add onDragStart
	// Destructure isSelected
	const {id, label, type, shape, x, y, width, height, rotation, status, metadata} = item

	const fillColor = metadata.color || statusColors[status] || '#CCCCCC' // Default fallback color
	const center_x = width / 2
	const center_y = height / 2

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation() // Prevent triggering parent SVG handlers if any
		onSelect(item)
	}

	// Common props for the shapes
	const shapeProps = {
		fill: fillColor,
		stroke: isSelected ? '#3b82f6' : '#333', // Blue border if selected, else dark grey
		strokeWidth: isSelected ? 2 : 1, // Thicker border if selected
	}

	// Common props for the text label
	const textProps = {
		x: center_x,
		y: center_y,
		textAnchor: 'middle' as const, // Ensure type correctness
		dominantBaseline: 'middle' as const,
		fill: '#FFFFFF', // White text for contrast
		fontSize: Math.min(width, height) * 0.3, // Adjust font size based on shape size
		pointerEvents: 'none' as const, // Text should not block clicks on the shape
	}

	// Combine click and drag start handlers
	const handleMouseDown = (e: React.MouseEvent<SVGGElement>) => {
		// Prevent browser default drag behavior if any
		e.preventDefault()
		onDragStart(e, item) // Call the drag start handler passed from parent
		handleClick(e) // Also trigger selection on mouse down
	}

	return (
		<g
			key={id}
			transform={`translate(${x} ${y}) rotate(${rotation} ${center_x} ${center_y})`}
			onMouseDown={handleMouseDown} // Use combined handler
			// onClick={handleClick} // onClick might interfere or be redundant with onMouseDown for selection
			style={{cursor: 'grab'}} // Change cursor to indicate draggability
			data-testid={`seat-item-${id}`} // Add test ID
		>
			{shape === 'rect' || shape === 'longrect' ? <rect x={0} y={0} width={width} height={height} rx={type === 'table' ? 4 : 0} ry={type === 'table' ? 4 : 0} {...shapeProps} /> : shape === 'circle' ? <circle cx={center_x} cy={center_y} r={center_x} {...shapeProps} /> : shape === 'ellipse' ? <ellipse cx={center_x} cy={center_y} rx={center_x} ry={center_y} {...shapeProps} /> : null}
			<text {...textProps} style={{userSelect: 'none'}}>
				{label}
			</text>{' '}
			{/* Prevent text selection during drag */}
		</g>
	)
}

export default SeatItem
