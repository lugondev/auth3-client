// next/src/components/venues/events/EventList.tsx
import React from 'react'
import {Event, EventStatus} from '@/types/event' // Removed EventCategory import
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Edit, Trash2} from 'lucide-react'
import {format} from 'date-fns'

interface EventListProps {
	events: Event[]
	venueId: string // Keep venueId if needed for future actions within the list
	onEdit: (event: Event) => void
	onDelete: (eventId: string) => void // Expecting just the ID for deletion confirmation
}

// Helper function to format category/status nicely
const formatEnum = (enumValue: string): string => {
	if (!enumValue) return ''
	return enumValue.charAt(0).toUpperCase() + enumValue.slice(1)
}

// Helper for status badge variants
const getStatusVariant = (status: EventStatus): 'default' | 'destructive' | 'secondary' | 'outline' => {
	switch (status) {
		case EventStatus.Published:
			return 'default'
		case EventStatus.Draft:
			return 'secondary'
		case EventStatus.Cancelled:
			return 'destructive'
		case EventStatus.Completed:
			return 'outline'
		default:
			return 'secondary'
	}
}

const EventList: React.FC<EventListProps> = ({events, onEdit, onDelete}) => {
	if (!events || events.length === 0) {
		return <p>No events found for this venue.</p>
	}

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
			{events.map((event) => (
				<Card key={event.id}>
					<CardHeader>
						<div className='flex justify-between items-start'>
							<CardTitle>{event.name}</CardTitle>
							<Badge variant={getStatusVariant(event.status)}>{formatEnum(event.status)}</Badge>
						</div>
						<CardDescription>{formatEnum(event.category)}</CardDescription>
					</CardHeader>
					<CardContent className='space-y-2'>
						<p className='text-sm text-muted-foreground'>
							{format(new Date(event.startTime), "PPP 'at' HH:mm")} - {format(new Date(event.endTime), 'HH:mm')}
						</p>
						<p className='text-sm line-clamp-2'>{event.description || 'No description provided.'}</p>
						<div className='text-sm text-muted-foreground flex justify-between'>
							<span>Capacity: {event.capacity ?? 'N/A'}</span>
							<span>Price: {event.ticketPrice !== null ? `$${event.ticketPrice.toFixed(2)}` : 'Free'}</span>
						</div>
						{event.isFeatured && <Badge variant='secondary'>Featured</Badge>}
					</CardContent>
					<CardFooter className='flex justify-end gap-2'>
						<Button variant='ghost' size='icon' onClick={() => onEdit(event)}>
							<Edit className='h-4 w-4' />
							<span className='sr-only'>Edit Event</span>
						</Button>
						<Button variant='ghost' size='icon' onClick={() => onDelete(event.id)}>
							<Trash2 className='h-4 w-4 text-destructive' />
							<span className='sr-only'>Delete Event</span>
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	)
}

export default EventList
