// @/app/(protected)/dashboard/page.tsx
'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext' // Use the actual AuthContext
import Link from 'next/link' // Import Link for navigation
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'

export default function UserDashboardPage() {
	const {user, loading, isAuthenticated, isSystemAdmin, userTenants, switchTenant, currentTenantId} = useAuth()

	if (loading || (!isAuthenticated && !loading)) {
		// Show loading or if auth check complete and not authenticated (should be handled by layout, but good fallback)
		return (
			<div className='flex h-screen items-center justify-center'>
				<div className='space-y-4'>
					<Skeleton className='h-4 w-[200px]' />
					<Skeleton className='h-4 w-[160px]' />
				</div>
			</div>
		)
	}

	if (!user) {
		// This case should ideally be handled by a higher-level auth guard (ProtectedLayout)
		// redirecting to login if no user is found on a protected route.
		// If ProtectedLayout is working, this might not be hit often.
		return <p className='text-center mt-10'>Redirecting to login...</p>
	}

	return (
		<div className='container mx-auto p-4 md:p-6'>
			<h1 className='mb-8 text-3xl font-bold text-gray-800 dark:text-gray-100'>User Dashboard</h1>

			{/* Personal Information Section */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>Personal Information</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-2 text-gray-700 dark:text-gray-300'>
						<p>
							<strong>Name:</strong> {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.last_name || user.email || 'N/A'}
						</p>
						<p>
							<strong>Email:</strong> {user.email || 'N/A'}
						</p>
						<p>
							<strong>User ID:</strong> {user.id}
						</p>
						{isSystemAdmin && <p className='mt-2 rounded-md bg-blue-100 p-2 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-300'>You have System Administrator privileges.</p>}
					</div>
				</CardContent>
			</Card>

			{/* System Administration Section (Conditional) */}
			{isSystemAdmin && (
				<Card className='mb-8'>
					<CardHeader>
						<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>System Administration</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='mb-4 text-gray-600 dark:text-gray-400'>Access global system settings and management tools.</p>
						<Button asChild variant='default' size='lg'>
							<Link href='/admin/dashboard'>Go to System Admin</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Tenants Management Section */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>My Organizations</CardTitle>
				</CardHeader>
				<CardContent>
					{userTenants && userTenants.length > 0 ? (
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{userTenants.map((tenantMembership) => {
								const canSwitch = tenantMembership.user_roles.includes('owner') || tenantMembership.user_roles.includes('manager')
								const isCurrent = tenantMembership.tenant_id === currentTenantId
								return (
									<Card key={tenantMembership.tenant_id} className={`flex flex-col justify-between transition-all hover:shadow-md ${isCurrent ? 'border-2 border-sky-500' : ''}`}>
										<CardHeader>
											<CardTitle className='mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100'>{tenantMembership.tenant_name}</CardTitle>
										</CardHeader>
										<CardContent className='flex-grow'>
											<p className='mb-1 text-sm text-gray-500 dark:text-gray-400'>ID: {tenantMembership.tenant_id}</p>
											<p className='text-sm text-gray-600 dark:text-gray-300'>
												Your Roles: <span className='font-medium'>{tenantMembership.user_roles.join(', ')}</span>
											</p>
											{isCurrent && <p className='mt-2 text-sm font-semibold text-sky-600 dark:text-sky-400'>Currently Active</p>}
										</CardContent>
										<CardContent className='mt-auto p-4'>
											{canSwitch && !isCurrent && (
												<Button
													onClick={async () => {
														const success = await switchTenant(tenantMembership.tenant_id)
														if (success) {
															// Optionally, navigate or show a success message.
															// AuthContext should handle state updates and potential re-fetches.
															// router.push('/dashboard'); // Or wherever appropriate after switch
														}
													}}
													variant='default'
													className='w-full bg-sky-600 hover:bg-sky-700'
													disabled={loading}>
													Switch to this Organization
												</Button>
											)}
											{!canSwitch && <p className='text-sm text-gray-500 dark:text-gray-400'>You do not have permission to switch to this organization directly.</p>}
											{isCurrent && (
												<Button disabled variant='outline' className='w-full'>
													Active Organization
												</Button>
											)}
										</CardContent>
									</Card>
								)
							})}
						</div>
					) : (
						<p className='text-gray-500 dark:text-gray-400'>You are not a member of any organizations yet.</p>
					)}
				</CardContent>
			</Card>

			{/* Create Tenant Button Section */}
			{isSystemAdmin && ( // Only system admins can create tenants from the main dashboard for now, or adjust as needed
				<Card>
					<CardHeader>
						<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>Create New Organization</CardTitle>
					</CardHeader>
					<CardContent>
						<Button asChild variant='default' size='lg' className='bg-green-600 hover:bg-green-700'>
							<Link href='/admin/tenants/create'>Create Organization</Link>
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
