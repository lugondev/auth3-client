'use client'

import React from 'react'
import {Skeleton} from '@/components/ui/skeleton'
import AppShell from '@/components/layout/AppShell'

export default function Home() {
	return (
		<AppShell sidebarType='user'>
			<div className='flex h-screen items-center justify-center'>
				<div className='space-y-4'>
					<Skeleton className='h-4 w-[200px]' />
					<Skeleton className='h-4 w-[160px]' />
				</div>
			</div>
		</AppShell>
	)
}
