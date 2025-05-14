'use client'

import React from 'react'
import {Label} from '@/components/ui/label'
import {TenantResponse} from '@/types/tenant' // Assuming TenantResponse is defined here

interface TenantStaticInfoProps {
	tenant: TenantResponse
}

export function TenantStaticInfo({tenant}: TenantStaticInfoProps) {
	return (
		<div className='grid gap-4 pb-6 border-b'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<div>
					<Label>Tenant ID</Label>
					<p className='text-sm text-muted-foreground font-mono break-all'>{tenant.id}</p>
				</div>
				<div>
					<Label>Slug</Label>
					<p className='text-sm text-muted-foreground break-all'>{tenant.slug}</p>
				</div>
			</div>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<div>
					<Label>Created At</Label>
					<p className='text-sm text-muted-foreground'>
						{new Date(tenant.created_at).toLocaleDateString(undefined, {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
						})}
					</p>
				</div>
				<div>
					<Label>Last Updated</Label>
					<p className='text-sm text-muted-foreground'>
						{new Date(tenant.updated_at).toLocaleDateString(undefined, {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
						})}
					</p>
				</div>
			</div>
		</div>
	)
}
