// @/app/(protected)/dashboard/page.tsx
'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext' // Use the actual AuthContext
import Link from 'next/link' // Import Link for navigation

export default function UserDashboardPage() {
	const {user, loading, isAuthenticated, isSystemAdmin, userTenants} = useAuth()

	if (loading || (!isAuthenticated && !loading)) {
		// Show loading or if auth check complete and not authenticated (should be handled by layout, but good fallback)
		return (
			<div className='flex h-screen items-center justify-center'>
				<div className='animate-pulse space-y-4'>
					<div className='h-4 w-[200px] rounded bg-muted'></div>
					<div className='h-4 w-[160px] rounded bg-muted'></div>
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
			<section className='mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800'>
				<h2 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200'>Personal Information</h2>
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
			</section>

			{/* System Administration Section (Conditional) */}
			{isSystemAdmin && (
				<section className='mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800'>
					<h2 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200'>System Administration</h2>
					<p className='mb-4 text-gray-600 dark:text-gray-400'>Access global system settings and management tools.</p>
					<Link href='/admin/dashboard' legacyBehavior>
						<a className='inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow transition-colors hover:bg-indigo-700'>Go to System Admin</a>
					</Link>
				</section>
			)}

			{/* Tenants Management Section */}
			<section className='mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800'>
				<h2 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200'>My Tenants</h2>
				{userTenants && userTenants.length > 0 ? (
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{userTenants.map((tenant) => (
							<div key={tenant.tenant_id} className='flex flex-col justify-between rounded-md border bg-gray-50 p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-700'>
								<div>
									<h3 className='mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100'>{tenant.tenant_name}</h3>
									<p className='mb-3 text-sm text-gray-500 dark:text-gray-400'>ID: {tenant.tenant_id}</p>
								</div>
								<Link href={`/tenant/${tenant.tenant_id}/overview`} legacyBehavior>
									<a className='mt-auto block w-full rounded-md bg-sky-600 py-2 text-center font-medium text-white transition-colors hover:bg-sky-700'>Manage Tenant</a>
								</Link>
							</div>
						))}
					</div>
				) : (
					<p className='text-gray-500 dark:text-gray-400'>You are not a member of any tenants yet.</p>
				)}
			</section>

			{/* Create Tenant Button Section */}
			<section className='rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800'>
				<h2 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200'>Create New Tenant</h2>
				{/* TODO: Implement actual navigation or modal for tenant creation */}
				<button onClick={() => alert('Tenant creation functionality to be implemented.')} className='rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow transition-colors hover:bg-green-700'>
					Create Tenant
				</button>
			</section>
		</div>
	)
}
