'use client'

import React from 'react'
import {PresentationList} from '@/components/presentations'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Plus, Eye} from 'lucide-react'
import Link from 'next/link'

export default function PresentationsPage() {
	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Presentations</h1>
					<p className='text-muted-foreground'>Manage your verifiable presentations and view verification status</p>
				</div>
				<div className='flex gap-2'>
					<Link href='/dashboard/presentations/create'>
						<Button>
							<Plus className='mr-2 h-4 w-4' />
							Create Presentation
						</Button>
					</Link>
					<Link href='/dashboard/presentations/verify'>
						<Button variant='outline'>
							<Eye className='mr-2 h-4 w-4' />
							Verify Presentation
						</Button>
					</Link>
				</div>
			</div>

			<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Presentations</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>0</div>
						<p className='text-xs text-muted-foreground'>No presentations created yet</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Verified</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>0</div>
						<p className='text-xs text-muted-foreground'>Successfully verified presentations</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Pending</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>0</div>
						<p className='text-xs text-muted-foreground'>Presentations awaiting verification</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Your Presentations</CardTitle>
					<CardDescription>View and manage all your verifiable presentations</CardDescription>
				</CardHeader>
				<CardContent>
					<PresentationList />
				</CardContent>
			</Card>
		</div>
	)
}
