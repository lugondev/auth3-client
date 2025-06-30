'use client'

import React from 'react'
import {Button} from '@/components/ui/button'
import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {PresentationForm} from '@/components/presentations/PresentationForm'
export default function CreatePresentationPage() {
	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex items-center gap-4'>
				<Link href='/dashboard/presentations'>
					<Button variant='outline' size='sm'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back to Presentations
					</Button>
				</Link>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Create Presentation</h1>
					<p className='text-muted-foreground'>Create a new verifiable presentation from your credentials</p>
				</div>
			</div>
			<PresentationForm />
		</div>
	)
}
