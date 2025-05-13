// @/app/(protected)/dashboard/page.tsx
'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext' // Use the actual AuthContext
import Link from 'next/link' // Import Link for navigation
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'
import {useQuery} from '@tanstack/react-query' // Added
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs' // Added
import {getJoinedTenants, getOwnedTenants} from '@/services/tenantService' // Added
import {JoinedTenantsResponse, OwnedTenantsResponse, JoinedTenantMembership} from '@/types/tenantManagement' // Added
import {TenantTable} from '@/components/tenants/TenantTable' // Added

export default function UserDashboardPage() {
	const {user, loading, isAuthenticated, isSystemAdmin} = useAuth()

	const {
		data: joinedTenantsData,
		isLoading: isLoadingJoined,
		error: errorJoined,
	} = useQuery<JoinedTenantsResponse, Error>({
		queryKey: ['joinedTenantsDashboard', user?.id], // Ensure key is unique to dashboard and user
		queryFn: () => getJoinedTenants({limit: 10, offset: 0}),
		enabled: !!user, // Only fetch if user is available
	})

	const {
		data: ownedTenantsData,
		isLoading: isLoadingOwned,
		error: errorOwned,
	} = useQuery<OwnedTenantsResponse, Error>({
		queryKey: ['ownedTenantsDashboard', user?.id], // Ensure key is unique to dashboard and user
		queryFn: () => getOwnedTenants({limit: 10, offset: 0}),
		enabled: !!user, // Only fetch if user is available
	})

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

			{/* Moved Tenant Sections */}
			<Card className='mb-8'>
				<CardHeader className='flex flex-row items-center justify-between'>
					<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>Tenant Management</CardTitle>
					{isSystemAdmin && (
						<Button asChild variant='default' size='sm' className='hover:bg-gray-700'>
							<Link href='/admin/tenants/create'>Create Organization</Link>
						</Button>
					)}
				</CardHeader>
				<CardContent>
					<Tabs defaultValue='joined' className='w-full'>
						<TabsList>
							<TabsTrigger value='joined'>Joined Tenants</TabsTrigger>
							<TabsTrigger value='owned'>My Created Tenants</TabsTrigger>
						</TabsList>
						<TabsContent value='joined'>
							<div className='mt-4 p-4 border rounded-md dark:border-gray-700'>
								<h2 className='text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200'>Tenants I&#39;ve Joined</h2>
								{isLoadingJoined && <p className='text-gray-500 dark:text-gray-400'>Loading joined tenants...</p>}
								{errorJoined && <p className='text-red-500'>Error loading joined tenants: {errorJoined.message}</p>}
								{joinedTenantsData && (
									<ul className='space-y-2'>
										{joinedTenantsData.memberships?.length === 0 && <p className='text-gray-500 dark:text-gray-400'>You have not joined any tenants yet.</p>}
										{joinedTenantsData.memberships?.map((membership: JoinedTenantMembership) => (
											<li key={membership.tenant_id} className='p-3 border-b dark:border-gray-700 last:border-b-0'>
												<strong className='text-gray-800 dark:text-gray-100'>{membership.tenant_name}</strong> <span className='text-sm text-gray-500 dark:text-gray-400'>({membership.tenant_slug})</span>
												<br />
												<span className='text-sm text-gray-600 dark:text-gray-300'>
													Roles: {membership.user_roles.join(', ')} | Status: {membership.user_status}
												</span>
												<br />
												<span className='text-sm text-gray-600 dark:text-gray-300'>
													Joined: {new Date(membership.joined_at).toLocaleDateString()} | Active: {membership.tenant_is_active ? 'Yes' : 'No'}
												</span>
											</li>
										))}
									</ul>
								)}
							</div>
						</TabsContent>
						<TabsContent value='owned'>
							<div className='mt-4 p-4 border rounded-md dark:border-gray-700'>
								<h2 className='text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200'>Tenants I&#39;ve Created</h2>
								{isLoadingOwned && <p className='text-gray-500 dark:text-gray-400'>Loading created tenants...</p>}
								{errorOwned && <p className='text-red-500'>Error loading created tenants: {errorOwned.message}</p>}
								{ownedTenantsData && ownedTenantsData.tenants && <TenantTable tenants={ownedTenantsData.tenants} />}
								{ownedTenantsData && ownedTenantsData.tenants?.length === 0 && <p className='text-gray-500 dark:text-gray-400'>You have not created any tenants yet.</p>}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	)
}
