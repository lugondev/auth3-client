{
	/* // next/src/features/table-management/components/SlotInspector.tsx */
}
import React, {useState, useEffect, useCallback} from 'react'
import {Slot, slotStatuses, slotTypes, slotShapes, UpdateSlotDto, SlotStatus, SlotType, SlotShape} from '@/types/slot'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {toast} from 'sonner'

interface SlotInspectorProps {
	selectedSlot: Slot | null
	zones: string[] // List of available zones in the venue (excluding '__ALL__')
	onUpdateSlot: (slotId: string, data: UpdateSlotDto) => Promise<void>
	onDeleteSlot: (slotId: string) => Promise<void>
	onFormChange?: (slotId: string, changedData: Partial<UpdateSlotDto>) => void // New prop for live updates
	disabled?: boolean
}

// Add x and y to editable keys
const editableKeys: ReadonlyArray<keyof UpdateSlotDto> = ['label', 'status', 'type', 'shape', 'width', 'height', 'rotation', 'zone', 'x', 'y'] as const

// Type guards
function isSlotStatus(value: unknown): value is SlotStatus {
	return slotStatuses.includes(value as SlotStatus)
}
function isSlotType(value: unknown): value is SlotType {
	return slotTypes.includes(value as SlotType)
}
function isSlotShape(value: unknown): value is SlotShape {
	return slotShapes.includes(value as SlotShape)
}
// Add x and y to numeric keys check
function isNumericKey(key: keyof UpdateSlotDto): key is 'width' | 'height' | 'rotation' | 'x' | 'y' {
	return key === 'width' || key === 'height' || key === 'rotation' || key === 'x' || key === 'y'
}
function isStringKey(key: keyof UpdateSlotDto): key is 'label' | 'zone' {
	return key === 'label' || key === 'zone'
}

// Destructure onFormChange from props
const SlotInspector: React.FC<SlotInspectorProps> = ({selectedSlot, zones, onUpdateSlot, onDeleteSlot, onFormChange, disabled = false}) => {
	const [formData, setFormData] = useState<UpdateSlotDto>({})
	const [originalData, setOriginalData] = useState<UpdateSlotDto>({})
	const [hasChanges, setHasChanges] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	// Store the ID associated with the current formData to prevent unnecessary resets
	const [formDataSlotId, setFormDataSlotId] = useState<string | null>(null)

	// Reset form state ONLY when the selectedSlot ID truly changes or selection is cleared
	useEffect(() => {
		const currentSelectedId = selectedSlot?.id ?? null

		// Only proceed if the selected ID has actually changed from what the form currently represents
		if (currentSelectedId !== formDataSlotId) {
			if (selectedSlot) {
				// A new slot is selected
				const initialData: UpdateSlotDto = {}
				editableKeys.forEach((key) => {
					const value = selectedSlot[key as keyof Slot]
					if (isNumericKey(key)) {
						initialData[key] = typeof value === 'number' && !isNaN(value) ? value : undefined
					} else if (isStringKey(key)) {
						initialData[key] = typeof value === 'string' ? value : undefined
					} else if (key === 'status' && isSlotStatus(value)) {
						initialData[key] = value
					} else if (key === 'type' && isSlotType(value)) {
						initialData[key] = value
					} else if (key === 'shape' && isSlotShape(value)) {
						initialData[key] = value
					} else {
						initialData[key] = undefined
					}
				})
				setFormData(initialData)
				setOriginalData(initialData)
				setHasChanges(false)
				setFormDataSlotId(currentSelectedId) // Update the ID associated with the form data
			} else {
				// Selection was cleared
				setFormData({})
				setOriginalData({})
				setHasChanges(false)
				setFormDataSlotId(null) // Clear the associated ID
			}
		}
		// If currentSelectedId === formDataSlotId, do nothing in this effect.
	}, [selectedSlot, formDataSlotId]) // Depend on the selectedSlot object and the tracking state

	// Effect to update form data's X/Y when the selected slot's coordinates change externally (e.g., dragging)
	// This runs ONLY when selectedSlot.x or selectedSlot.y changes, AND the ID is the same as the one the form holds.
	useEffect(() => {
		if (selectedSlot && selectedSlot.id === formDataSlotId) {
			// Check if the external X/Y differs from the form's current X/Y
			const xChanged = selectedSlot.x !== formData.x
			const yChanged = selectedSlot.y !== formData.y

			if (xChanged || yChanged) {
				setFormData((prev) => ({
					...prev,
					...(xChanged && {x: selectedSlot.x}), // Only update if changed
					...(yChanged && {y: selectedSlot.y}), // Only update if changed
				}))
				// Important: Do NOT update originalData here, as that would prevent detecting this as a change to save.
			}
		}
		// Depend specifically on the coordinates and the ID match status
		// We include selectedSlot here to satisfy exhaustive-deps, the logic inside handles the ID check.
	}, [selectedSlot, formDataSlotId, formData.x, formData.y])

	// Check for changes whenever formData updates
	useEffect(() => {
		let changed = false
		for (const key of editableKeys) {
			const normalize = (val: unknown): string => (val === undefined || val === null ? 'nullish' : String(val))
			if (normalize(formData[key]) !== normalize(originalData[key])) {
				changed = true
				break
			}
		}
		setHasChanges(changed)
	}, [formData, originalData])

	// Effect to call onFormChange when formData updates for a selected slot
	useEffect(() => {
		if (selectedSlot && formDataSlotId === selectedSlot.id && onFormChange) {
			// Construct a partial update DTO. Important: Only include keys that are meant to be live-updated.
			const liveUpdateData: Partial<UpdateSlotDto> = {}
			editableKeys.forEach((key) => {
				const value = formData[key] // Get the value from the form

				switch (key) {
					case 'label':
						liveUpdateData.label = typeof value === 'string' && value !== '' ? value : undefined
						break
					case 'status':
						liveUpdateData.status = isSlotStatus(value) ? value : undefined
						break
					case 'type':
						liveUpdateData.type = isSlotType(value) ? value : undefined
						break
					case 'shape':
						liveUpdateData.shape = isSlotShape(value) ? value : undefined
						break
					case 'zone':
						liveUpdateData.zone = typeof value === 'string' && value !== '' ? value : undefined
						break
					case 'width':
					case 'height':
					case 'rotation':
					case 'x':
					case 'y':
						const numValue = typeof value === 'number' ? value : parseFloat(String(value))
						liveUpdateData[key] = !isNaN(numValue) ? numValue : undefined
						break
					// No default case needed as we iterate only over editableKeys
				}
				// Ensure null values are treated as undefined for consistency with partial DTOs
				if (liveUpdateData[key] === null) {
					liveUpdateData[key] = undefined
				}
			})
			onFormChange(selectedSlot.id, liveUpdateData)
		}
		// Depend on formData, selectedSlot's ID, and the callback prop itself
	}, [formData, selectedSlot?.id, formDataSlotId, onFormChange])

	// Generic input handler
	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const {id, value, type} = e.target
		const formKey = id.replace('slot-', '') as keyof UpdateSlotDto
		if (!editableKeys.includes(formKey)) return

		let newValue: string | number | undefined
		if (type === 'number') {
			newValue = value === '' ? undefined : parseFloat(value)
			if (typeof newValue === 'number' && isNaN(newValue)) {
				newValue = undefined
			}
		} else {
			newValue = value
		}
		setFormData((prev) => ({...prev, [formKey]: newValue}))
	}, [])

	// Generic select handler
	const handleSelectChange = useCallback((key: Extract<keyof UpdateSlotDto, 'status' | 'type' | 'shape' | 'zone' | 'label'>, value: string) => {
		setFormData((prev) => ({...prev, [key]: value}))
	}, [])

	const handleSave = useCallback(async () => {
		if (!selectedSlot || !hasChanges || disabled || isSaving) return
		setIsSaving(true)

		const changedData: UpdateSlotDto = {}

		editableKeys.forEach((key) => {
			const formValue = formData[key]
			const originalValue = originalData[key]

			const normalize = (val: unknown): string => (val === undefined || val === null ? 'nullish' : String(val))
			const formValueStr = normalize(formValue)
			const originalValueStr = normalize(originalValue)

			if (formValueStr !== originalValueStr) {
				if (isNumericKey(key)) {
					const numericValue = Number(formValue)
					changedData[key] = !isNaN(numericValue) ? numericValue : undefined
				} else if (isStringKey(key)) {
					// 'label' or 'zone'
					// Assign string if non-empty, otherwise undefined
					changedData[key] = typeof formValue === 'string' && formValue !== '' ? formValue : undefined
				} else if (key === 'status') {
					// Literal types require explicit checks
					changedData[key] = isSlotStatus(formValue) ? formValue : undefined
				} else if (key === 'type') {
					changedData[key] = isSlotType(formValue) ? formValue : undefined
				} else if (key === 'shape') {
					changedData[key] = isSlotShape(formValue) ? formValue : undefined
				}
			}
		})

		// Filter out strictly undefined values before sending API call
		const finalChangedData = Object.entries(changedData)
			.filter(([, value]) => value !== undefined)
			.reduce((acc, [key, value]) => {
				acc[key as keyof UpdateSlotDto] = value
				return acc
			}, {} as UpdateSlotDto)

		if (Object.keys(finalChangedData).length > 0) {
			try {
				await onUpdateSlot(selectedSlot.id, finalChangedData)
			} catch (err) {
				console.error('Update failed:', err)
				toast.error(`Failed to save changes for slot ${selectedSlot.label}.`)
			} finally {
				setIsSaving(false)
			}
		} else {
			toast.info('No changes detected to save.')
			setHasChanges(false)
			setIsSaving(false)
		}
	}, [selectedSlot, formData, originalData, hasChanges, disabled, onUpdateSlot, isSaving])

	const handleDelete = useCallback(async () => {
		if (!selectedSlot || disabled || isSaving) return
		setIsSaving(true)
		try {
			await onDeleteSlot(selectedSlot.id)
		} catch (err) {
			console.error('Delete failed:', err)
			toast.error(`Failed to delete slot ${selectedSlot.label}.`)
		} finally {
			setIsSaving(false)
		}
	}, [selectedSlot, disabled, onDeleteSlot, isSaving])

	if (!selectedSlot) {
		return <div className='p-4 text-sm text-muted-foreground'>Select a slot on the canvas to see details or add a new slot.</div>
	}

	const isFormDisabled = disabled || isSaving || !selectedSlot

	return (
		<div className='p-4 space-y-4'>
			<h3 className='text-lg font-medium truncate'>
				Slot: {formData.label ?? selectedSlot.label} ({selectedSlot.id.substring(0, 6)}...)
			</h3>
			<div className='grid grid-cols-3 gap-4 items-center'>
				{/* Row 1 */}
				<div>
					<Label htmlFor='slot-label'>Label</Label>
					<Input id='slot-label' value={formData.label ?? ''} onChange={handleInputChange} disabled={isFormDisabled} />
				</div>
				<div>
					<Label htmlFor='slot-status'>Status</Label>
					<Select value={formData.status ?? undefined} onValueChange={(value) => handleSelectChange('status', value)} disabled={isFormDisabled}>
						<SelectTrigger id='slot-status'>
							<SelectValue placeholder='Select status' />
						</SelectTrigger>
						<SelectContent>
							{slotStatuses.map((status) => (
								<SelectItem key={status} value={status}>
									{status}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor='slot-type'>Type</Label>
					<Select value={formData.type ?? undefined} onValueChange={(value) => handleSelectChange('type', value)} disabled={isFormDisabled}>
						<SelectTrigger id='slot-type'>
							<SelectValue placeholder='Select type' />
						</SelectTrigger>
						<SelectContent>
							{slotTypes.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Row 2 */}
				<div>
					<Label htmlFor='slot-shape'>Shape</Label>
					<Select value={formData.shape ?? undefined} onValueChange={(value) => handleSelectChange('shape', value)} disabled={isFormDisabled}>
						<SelectTrigger id='slot-shape'>
							<SelectValue placeholder='Select shape' />
						</SelectTrigger>
						<SelectContent>
							{slotShapes.map((shape) => (
								<SelectItem key={shape} value={shape}>
									{shape}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor='slot-width'>Width</Label>
					<Input id='slot-width' type='number' value={formData.width ?? ''} onChange={handleInputChange} disabled={isFormDisabled} />
				</div>
				<div>
					<Label htmlFor='slot-height'>Height</Label>
					<Input id='slot-height' type='number' value={formData.height ?? ''} onChange={handleInputChange} disabled={isFormDisabled} />
				</div>

				{/* Row 3 */}
				<div>
					<Label htmlFor='slot-rotation'>Rotation</Label>
					<Input id='slot-rotation' type='number' value={formData.rotation ?? ''} onChange={handleInputChange} disabled={isFormDisabled} />
				</div>
				<div>
					<Label htmlFor='slot-zone'>Zone</Label>
					<Select value={formData.zone ?? undefined} onValueChange={(value) => handleSelectChange('zone', value)} disabled={isFormDisabled}>
						<SelectTrigger id='slot-zone'>
							<SelectValue placeholder='Select zone' />
						</SelectTrigger>
						<SelectContent>
							{zones.map((zone) => (
								<SelectItem key={zone} value={zone}>
									{zone}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div> {/* Placeholder for X/Y or spacer */} </div>

				{/* Row 4 - Coordinates (Editable) */}
				<div>
					<Label htmlFor='slot-x'>X</Label>
					{/* Bind to formData, remove readOnly/disabled */}
					<Input id='slot-x' type='number' value={formData.x ?? ''} onChange={handleInputChange} disabled={isFormDisabled} />
				</div>
				<div>
					<Label htmlFor='slot-y'>Y</Label>
					{/* Bind to formData, remove readOnly/disabled */}
					<Input id='slot-y' type='number' value={formData.y ?? ''} onChange={handleInputChange} disabled={isFormDisabled} />
				</div>
				<div> {/* Spacer */} </div>
			</div>

			{/* Action Buttons */}
			<div className='flex justify-end gap-2 pt-4'>
				<Button variant='destructive' size='sm' onClick={handleDelete} disabled={isFormDisabled}>
					Delete
				</Button>
				<Button size='sm' onClick={handleSave} disabled={isFormDisabled || !hasChanges}>
					{isSaving ? 'Saving...' : 'Save Changes'}
				</Button>
			</div>
		</div>
	)
}

export default SlotInspector
