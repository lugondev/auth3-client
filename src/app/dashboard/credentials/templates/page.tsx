'use client'

import React from 'react'
import {TemplateManager} from '@/components/credentials/templates'

export default function CredentialTemplatesPage() {
	return (
		<div className='container mx-auto py-6'>
			<div className='space-y-6'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Credential Templates</h1>
					<p className='text-muted-foreground'>Manage your verifiable credential templates and schemas</p>
				</div>

				<TemplateManager />
			</div>
		</div>
	)
}
