'use client'

import React from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Eye, LayoutDashboard, BarChart3} from 'lucide-react'
import Link from 'next/link'

export default function AdminPresentationsPage() {
	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>VP Administration</h1>
					<p className='text-muted-foreground'>Manage verifiable presentations across the system</p>
				</div>
			</div>

			<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Presentations</CardTitle>
						<LayoutDashboard className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>0</div>
						<p className='text-xs text-muted-foreground'>Across all tenants</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Verified Today</CardTitle>
						<Eye className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>0</div>
						<p className='text-xs text-muted-foreground'>Presentations verified today</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Failed Verifications</CardTitle>
						<BarChart3 className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>0</div>
						<p className='text-xs text-muted-foreground'>Verification failures</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Active Tenants</CardTitle>
						<LayoutDashboard className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>0</div>
						<p className='text-xs text-muted-foreground'>With presentations</p>
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 md:grid-cols-3'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Eye className='h-5 w-5' />
							Verification Management
						</CardTitle>
						<CardDescription>Monitor and manage presentation verifications</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<p className='text-sm text-muted-foreground'>View verification logs, failed verifications, and system health.</p>
							<Link href='/dashboard/admin/presentations/verification'>
								<Button className='w-full'>View Verifications</Button>
							</Link>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<BarChart3 className='h-5 w-5' />
							Analytics & Reports
						</CardTitle>
						<CardDescription>System-wide presentation analytics</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<p className='text-sm text-muted-foreground'>View usage statistics, trends, and generate reports.</p>
							<Link href='/dashboard/admin/presentations/analytics'>
								<Button className='w-full'>View Analytics</Button>
							</Link>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<LayoutDashboard className='h-5 w-5' />
							System Configuration
						</CardTitle>
						<CardDescription>Configure presentation settings</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<p className='text-sm text-muted-foreground'>Manage verification policies and system settings.</p>
							<Button className='w-full' variant='outline'>
								Configure Settings
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>Latest presentation verification activities across the system</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='text-center text-muted-foreground py-8'>No recent activity to display</div>
				</CardContent>
			</Card>
		</div>
	)
}
