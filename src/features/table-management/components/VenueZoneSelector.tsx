// next/src/features/table-management/components/VenueZoneSelector.tsx
import React from 'react'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select' // Import Select
import {Label} from '@/components/ui/label' // Import Label (optional)

interface VenueZoneSelectorProps {
	// Add props from TableManagementLayout
	zones: string[] // Includes '__ALL__'
	selectedZone: string | null
	onZoneChange: (zone: string | null) => void
	onAddSlot: () => void
	disabled?: boolean
	// venue list and handler can be added later if needed
}

const VenueZoneSelector: React.FC<VenueZoneSelectorProps> = ({zones, selectedZone, onZoneChange, onAddSlot, disabled = false}) => {
	return (
		<div className='flex items-center gap-4 p-2 border-b'>
			{/* TODO: Add Venue Dropdown later if managing multiple venues on this page */}
			{/* <div className='w-48'>
				<Label htmlFor="venue-select">Venue</Label>
				<Select disabled={disabled}>
                    <SelectTrigger id="venue-select">
                        <SelectValue placeholder="Select Venue" />
                    </SelectTrigger>
                     <SelectContent> ... </SelectContent>
                </Select>
			</div> */}

			{/* Zone Dropdown */}
			<div className='w-48'>
				<Label htmlFor='zone-select'>Zone</Label>
				<Select
					value={selectedZone ?? '__ALL__'} // Default to 'ALL' if null
					onValueChange={(value) => onZoneChange(value === '__ALL__' ? null : value)} // Pass null if 'ALL' is selected
					disabled={disabled || zones.length <= 1} // Also disable if only 'ALL' is present
				>
					<SelectTrigger id='zone-select'>
						<SelectValue placeholder='Select Zone' />
					</SelectTrigger>
					<SelectContent>
						{zones.map((zone) => (
							<SelectItem key={zone} value={zone}>
								{zone === '__ALL__' ? 'All Zones' : zone}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Add Slot Button */}
			<div className='ml-auto'>
				<Button size='sm' onClick={onAddSlot} disabled={disabled}>
					+ Add Slot
				</Button>
			</div>
		</div>
	)
}

export default VenueZoneSelector
