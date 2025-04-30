// next/src/features/table-management/components/SlotCanvas.tsx
'use client' // Required for useEffect, useRef, useState

import React, {useEffect, useRef, useState} from 'react'
// Use named imports for Fabric v6+
import {Canvas, Rect, Circle, Ellipse, Group, Text, ActiveSelection, Object as FabricObject} from 'fabric' // Removed TEvent
import {Slot} from '@/types/slot'

// Extend FabricObject interface to include custom 'data' property
declare module 'fabric' {
	interface FabricObject {
		data?: {id: string; type: string}
	}
	// Add specific event option interfaces if needed, or use inline types
}

interface SlotCanvasProps {
	slots: Slot[]
	selectedSlotIds: string[]
	onSelectSlot: (slotId: string | null, multiSelect: boolean) => void // Allow null for clearing selection
	onUpdateSlotTransform: (updates: {id: string; x?: number; y?: number; rotation?: number; width?: number; height?: number}[]) => void
	// TODO: Add prop for double click handler e.g., onSlotDoubleClick: (slotId: string) => void;
}

// --- Helper Functions (Moved outside component for stable reference) ---

// Helper to get color based on status
const getSlotColor = (status: Slot['status']): string => {
	switch (status) {
		case 'reserved':
			return '#fef9c3'
		case 'confirmed':
			return '#dcfce7'
		case 'selected':
			return '#dbeafe'
		case 'available':
		default:
			return '#ffffff'
	}
}

// Fabric Object Creation Helper
const createFabricObject = (slot: Slot): FabricObject | null => {
	// Use Partial<> for base options to satisfy type checks before casting
	const baseOptions: Partial<fabric.IObjectOptions> = {
		left: slot.x,
		top: slot.y,
		width: slot.width,
		height: slot.height,
		angle: slot.rotation || 0,
		fill: getSlotColor(slot.status),
		stroke: '#666',
		strokeWidth: 1,
		originX: 'left' as const, // Cast literal type
		originY: 'top' as const, // Cast literal type
		data: {id: slot.id, type: 'slot'},
		borderColor: '#3b82f6',
		cornerColor: '#3b82f6',
		cornerSize: 8,
		transparentCorners: false,
	}

	let shape: FabricObject | null = null

	// Create shapes with minimal constructor args, then set options
	try {
		switch (slot.shape) {
			case 'rect':
			case 'longrect':
				shape = new Rect()
				shape.set(baseOptions as fabric.IRectOptions) // Cast options here
				break
			case 'circle':
				shape = new Circle({radius: slot.width / 2})
				// Apply baseOptions, overriding radius from baseOptions if present
				shape.set({...baseOptions, radius: slot.width / 2} as fabric.ICircleOptions)
				break
			case 'ellipse':
				shape = new Ellipse({rx: slot.width / 2, ry: slot.height / 2})
				// Apply baseOptions, overriding rx/ry from baseOptions if present
				shape.set({...baseOptions, rx: slot.width / 2, ry: slot.height / 2} as fabric.IEllipseOptions)
				break
			default:
				console.warn(`Unsupported slot shape: ${slot.shape}`)
				return null
		}
	} catch (error) {
		console.error('Error creating Fabric shape:', error, 'with options:', baseOptions)
		return null // Prevent further errors if shape creation failed
	}

	const label = new Text(slot.label || '', {
		left: 0,
		top: 0,
		fontSize: 10,
		fill: '#333',
		originX: 'left',
		originY: 'top',
		selectable: false,
		evented: false,
	})

	if (!shape) return null

	// Define group options without data first
	const groupOptions: Partial<fabric.IGroupOptions> = {
		left: slot.x,
		top: slot.y,
		angle: slot.rotation || 0,
		originX: 'left' as const,
		originY: 'top' as const,
		borderColor: '#3b82f6',
		cornerColor: '#3b82f6',
		cornerSize: 8,
		transparentCorners: false,
		// subTargetCheck: true, // Optional
	}

	// Cast options to 'any' during group creation to bypass strict type incompatibility
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const group = new Group([shape, label], groupOptions as any)
	// Set custom data property after creation
	group.data = {id: slot.id, type: 'slot'}

	return group
}

const SlotCanvas: React.FC<SlotCanvasProps> = ({slots, selectedSlotIds, onSelectSlot, onUpdateSlotTransform}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const fabricRef = useRef<Canvas | null>(null)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [canvasSize, setCanvasSize] = useState({width: 0, height: 0})
	const objectMapRef = useRef<Map<string, FabricObject>>(new Map()) // Keep track of Fabric objects by Slot ID

	// --- Canvas Initialization and Resizing ---
	useEffect(() => {
		if (!canvasRef.current) return

		const parent = canvasRef.current.parentElement
		if (!parent) return

		// Initialize Fabric Canvas using named import
		const canvas = new Canvas(canvasRef.current)
		fabricRef.current = canvas

		// Resize observer for responsiveness
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0]
			const {width, height} = entry.contentRect
			setCanvasSize({width, height})
			canvas.setDimensions({width, height})
			canvas.requestRenderAll()
		})
		resizeObserver.observe(parent)

		// --- Event Listeners ---
		// Update event handler signatures to use inline option types
		canvas.on('selection:created', (options: {selected?: FabricObject[]}) => {
			if (options.selected && options.selected.length > 0) {
				const ids = options.selected.map((obj: FabricObject) => obj.data?.id).filter((id): id is string => !!id)
				onSelectSlot(ids[0], ids.length > 1)
			}
		})
		canvas.on('selection:updated', (options: {selected?: FabricObject[]; deselected?: FabricObject[]}) => {
			if (options.selected && options.selected.length > 0) {
				const ids = options.selected.map((obj: FabricObject) => obj.data?.id).filter((id): id is string => !!id)
				onSelectSlot(ids[0], ids.length > 1)
			} else {
				onSelectSlot(null, false)
			}
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		canvas.on('selection:cleared', (options: {deselected?: FabricObject[]}) => {
			onSelectSlot(null, false)
		})

		canvas.on('object:modified', (options: {target?: FabricObject}) => {
			if (options.target) {
				const target = options.target
				const id = target.data?.id
				if (id) {
					const update = {
						id: id,
						x: target.left,
						y: target.top,
						rotation: target.angle,
						width: target.width && target.scaleX ? target.width * target.scaleX : target.width,
						height: target.height && target.scaleY ? target.height * target.scaleY : target.height,
					}
					onUpdateSlotTransform([update])
					target.set({scaleX: 1, scaleY: 1})
					target.setCoords()
					canvas.requestRenderAll()
				}
			}
		})

		// TODO: Add 'mouse:dblclick' listener

		// Cleanup
		return () => {
			resizeObserver.disconnect()
			canvas.dispose()
			fabricRef.current = null
		}
	}, [onSelectSlot, onUpdateSlotTransform])

	// --- Sync Fabric Canvas with Slots Prop ---
	useEffect(() => {
		const canvas = fabricRef.current
		if (!canvas) return

		const currentSlotIds = new Set(slots.map((s) => s.id))
		const currentObjectMap = objectMapRef.current

		// 1. Remove objects from canvas that are no longer in slots prop
		currentObjectMap.forEach((obj: FabricObject, id: string) => {
			if (!currentSlotIds.has(id)) {
				canvas.remove(obj)
				currentObjectMap.delete(id)
			}
		})

		// 2. Add new slots or update existing ones
		slots.forEach((slot) => {
			const existingObj = currentObjectMap.get(slot.id)

			if (existingObj instanceof Group) {
				const shape = existingObj.item(0)
				const label = existingObj.item(1) as Text

				let needsRender = false

				if (shape && shape.fill !== getSlotColor(slot.status)) {
					shape.set('fill', getSlotColor(slot.status))
					needsRender = true
				}
				if (label && label.text !== slot.label) {
					label.set('text', slot.label)
					needsRender = true
				}

				if (existingObj.left !== slot.x || existingObj.top !== slot.y) {
					existingObj.set({left: slot.x, top: slot.y})
					needsRender = true
				}
				if (existingObj.angle !== (slot.rotation || 0)) {
					existingObj.set('angle', slot.rotation || 0)
					needsRender = true
				}
				if (shape && (shape.width !== slot.width || shape.height !== slot.height)) {
					shape.set({width: slot.width, height: slot.height})
					// After modifying an object within a group, you might need to update the group layout
					// Let's try recalculating layout and then setting coords
					existingObj.item(0).setCoords() // Update shape coords first
					// Replace addWithUpdate with setCoords for the group
					existingObj.setCoords() // Update group coords after internal shape resize
					needsRender = true // Flag that canvas needs redraw
				}

				if (needsRender) {
					// Calling setCoords within the resize block is sufficient
				}
			} else if (!existingObj) {
				const newObj = createFabricObject(slot)
				if (newObj) {
					canvas.add(newObj)
					currentObjectMap.set(slot.id, newObj)
				}
			}
		})

		canvas.requestRenderAll()
	}, [slots])

	// --- Sync Fabric Selection with selectedSlotIds Prop ---
	useEffect(() => {
		const canvas = fabricRef.current
		if (!canvas) return

		const activeObjects = canvas.getActiveObjects()
		const activeIds = new Set(activeObjects.map((obj: FabricObject) => obj.data?.id).filter(Boolean))

		const propIds = new Set(selectedSlotIds)

		let selectionChanged = false
		if (activeIds.size !== propIds.size) {
			selectionChanged = true
		} else {
			for (const id of propIds) {
				if (!activeIds.has(id)) {
					selectionChanged = true
					break
				}
			}
		}

		if (selectionChanged) {
			canvas.discardActiveObject()
			const objectsToSelect: FabricObject[] = []
			selectedSlotIds.forEach((id: string) => {
				const obj = objectMapRef.current.get(id)
				if (obj) {
					objectsToSelect.push(obj)
				}
			})

			if (objectsToSelect.length > 0) {
				const sel = new ActiveSelection(objectsToSelect, {canvas: canvas})
				canvas.setActiveObject(sel)
			}
			canvas.requestRenderAll()
		}
	}, [selectedSlotIds])

	return (
		<div className='relative w-full h-full overflow-hidden'>
			<canvas ref={canvasRef} />
		</div>
	)
}

export default SlotCanvas
