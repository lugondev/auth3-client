'use client'

import React from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Loader2, Trash2} from 'lucide-react'
import {TenantResponse} from '@/types/tenant'

interface DeleteTenantSectionProps {
	tenant: TenantResponse // Used for displaying name or other info if needed, and for context
	onDeleteInitiated: () => void // Callback to open the confirmation modal
	isDeleting: boolean // To show loading state on the button
}

export function DeleteTenantSection({tenant, onDeleteInitiated, isDeleting}: DeleteTenantSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-destructive'>Danger Zone</CardTitle>
				<CardDescription>Actions that can have severe consequences.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='flex flex-col space-y-2 w-full'>
					<p className='text-sm text-muted-foreground'>Deleting tenant &quot;{tenant.name}&quot; will permanently remove all its data, including users, roles, and permissions. This action cannot be undone.</p>
					<Button variant='destructive' onClick={onDeleteInitiated} className='self-start' disabled={isDeleting}>
						{isDeleting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
						Delete Tenant
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
