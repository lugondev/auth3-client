'use client'

import React, {useEffect} from 'react'
import {useParams} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Users, UserCheck, UserPlus, UserX, Mail, Loader2} from 'lucide-react'

import {useTenantUsers} from '@/hooks/use-tenant-users'
import {useTenantRbac} from '@/hooks/useTenantRbac'
import {TenantUsersManager} from '@/components/tenants/TenantUsersManager'

export default function TenantUsersPage() {
	const params = useParams()
	const tenantId = params.tenantId as string

	// Fetch user data for statistics - using a larger limit to get more accurate stats
	const {users: allUsers, isLoading: isLoadingStats} = useTenantUsers({
		tenantId,
		limit: 100, // Get first 100 users for stats
		page: 1,
	})

	// Fetch roles from API
	const tenantRbac = useTenantRbac(tenantId)

	useEffect(() => {
		if (tenantId) {
			tenantRbac.actions.setTenantId(tenantId)
		}
	}, [tenantId])

	// Calculate statistics from user data
	const stats = React.useMemo(() => {
		if (!allUsers) {
			return {total: 0, active: 0, pending: 0, inactive: 0}
		}

		return {
			total: allUsers.length,
			active: allUsers.filter((u) => u.status_in_tenant === 'active').length,
			pending: allUsers.filter((u) => u.status_in_tenant === 'pending' || u.status_in_tenant === 'invited').length,
			inactive: allUsers.filter((u) => u.status_in_tenant === 'suspended').length,
		}
	}, [allUsers])

	// Get all available roles (both default and custom)
	const allRoles = React.useMemo(() => {
		const roles = [...(tenantRbac.roles.default || []), ...(tenantRbac.roles.custom || [])]
		// Fallback to basic roles if no roles are fetched yet
		return roles.length > 0 ? roles : ['TenantAdmin', 'TenantMember', 'TenantViewer']
	}, [tenantRbac.roles])

	// Loading state for roles
	const isLoadingRoles = tenantRbac.loading.initialRoles

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>User Management</h1>
					<p className='text-muted-foreground'>Manage users and their permissions in this tenant</p>
				</div>
				<Button>
					<UserPlus className='h-4 w-4 mr-2' />
					Invite User
				</Button>
			</div>

			{/* Stats Cards */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Total Users</p>
								<p className='text-2xl font-bold'>
									{isLoadingStats ? <Loader2 className='h-6 w-6 animate-spin' /> : stats.total}
								</p>
							</div>
							<Users className='h-8 w-8 text-blue-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Active</p>
								<p className='text-2xl font-bold'>
									{isLoadingStats ? <Loader2 className='h-6 w-6 animate-spin' /> : stats.active}
								</p>
							</div>
							<UserCheck className='h-8 w-8 text-green-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Pending</p>
								<p className='text-2xl font-bold'>
									{isLoadingStats ? <Loader2 className='h-6 w-6 animate-spin' /> : stats.pending}
								</p>
							</div>
							<Mail className='h-8 w-8 text-yellow-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Inactive</p>
								<p className='text-2xl font-bold'>
									{isLoadingStats ? <Loader2 className='h-6 w-6 animate-spin' /> : stats.inactive}
								</p>
							</div>
							<UserX className='h-8 w-8 text-red-600' />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Users Table */}
			<Card>
				<CardHeader>
					<CardTitle>All Users</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoadingRoles ? (
						<div className='flex justify-center items-center py-8'>
							<Loader2 className='h-6 w-6 animate-spin mr-2' />
							<span>Loading roles...</span>
						</div>
					) : tenantRbac.error ? (
						<div className='flex justify-center items-center py-8 text-red-600'>
							<span>Error loading roles: {tenantRbac.error}</span>
						</div>
					) : (
						<TenantUsersManager tenantId={tenantId} roles={allRoles} />
					)}
				</CardContent>
			</Card>
		</div>
	)
}
