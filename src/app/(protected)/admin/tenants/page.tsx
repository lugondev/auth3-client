'use client'

import React from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button' // Added Button
import {getJoinedTenants, getOwnedTenants, listTenants} from '@/services/tenantService'
import {JoinedTenantsResponse, OwnedTenantsResponse, AllTenantsResponse, JoinedTenantMembership} from '@/types/tenantManagement' // Removed Tenant
import {useAuth} from '@/contexts/AuthContext'
import {CreateTenantModal} from '@/components/tenants/CreateTenantModal' // Added Modal
import {TenantTable} from '@/components/tenants/TenantTable' // Added TenantTable

const TenantManagementPage = () => {
	const {user} = useAuth()
	const queryClient = useQueryClient() // Added for refetching

	// For now, let's assume a way to check if the user is a system admin.
	// This might come from user.roles, a specific claim in JWT, or a dedicated boolean.
	// Replace this with your actual admin check logic.
	const isAdmin = user?.roles?.includes('SystemSuperAdmin') || false // Example check

	const {
		data: joinedTenantsData,
		isLoading: isLoadingJoined,
		error: errorJoined,
	} = useQuery<JoinedTenantsResponse, Error>({
		queryKey: ['joinedTenants'],
		queryFn: () => getJoinedTenants({limit: 10, offset: 0}),
	})

	const {
		data: ownedTenantsData,
		isLoading: isLoadingOwned,
		error: errorOwned,
	} = useQuery<OwnedTenantsResponse, Error>({
		queryKey: ['ownedTenants'],
		queryFn: () => getOwnedTenants({limit: 10, offset: 0}),
	})

	const {
		data: allTenantsData,
		isLoading: isLoadingAll,
		error: errorAll,
	} = useQuery<AllTenantsResponse, Error>({
		// Changed PaginatedTenantsResponse to AllTenantsResponse
		queryKey: ['allTenantsForAdmin'],
		queryFn: () => listTenants(10, 0), // Using existing listTenants
		enabled: isAdmin, // Only fetch if user is admin
	})

	return (
		<div className='container mx-auto p-4'>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-bold'>Tenant Management</h1>
				{isAdmin && ( // Show button only if admin
					<CreateTenantModal
						onTenantCreated={() => {
							queryClient.invalidateQueries({queryKey: ['ownedTenants']})
							queryClient.invalidateQueries({queryKey: ['allTenantsForAdmin']})
						}}>
						<Button>Create New Tenant</Button>
					</CreateTenantModal>
				)}
			</div>
			<Tabs defaultValue='joined' className='w-full'>
				<TabsList>
					<TabsTrigger value='joined'>Joined Tenants</TabsTrigger>
					<TabsTrigger value='owned'>My Created Tenants</TabsTrigger>
					{isAdmin && <TabsTrigger value='all'>All Tenants (Admin)</TabsTrigger>}
				</TabsList>
				<TabsContent value='joined'>
					<div className='mt-4 p-4 border rounded-md'>
						<h2 className='text-xl font-semibold mb-2'>Tenants I&#39;ve Joined</h2>
						{isLoadingJoined && <p>Loading joined tenants...</p>}
						{errorJoined && <p className='text-red-500'>Error loading joined tenants: {errorJoined.message}</p>}
						{joinedTenantsData && (
							<ul>
								{joinedTenantsData.memberships?.length === 0 && <p>You have not joined any tenants yet.</p>}
								{joinedTenantsData.memberships?.map((membership: JoinedTenantMembership) => (
									<li key={membership.tenant_id} className='mb-2 p-2 border-b'>
										<strong>{membership.tenant_name}</strong> ({membership.tenant_slug})
										<br />
										Roles: {membership.user_roles.join(', ')} | Status: {membership.user_status}
										<br />
										Joined: {new Date(membership.joined_at).toLocaleDateString()} | Active: {membership.tenant_is_active ? 'Yes' : 'No'}
									</li>
								))}
							</ul>
						)}
					</div>
				</TabsContent>
				<TabsContent value='owned'>
					<div className='mt-4 p-4 border rounded-md'>
						<h2 className='text-xl font-semibold mb-2'>Tenants I&#39;ve Created</h2>
						{isLoadingOwned && <p>Loading owned tenants...</p>}
						{errorOwned && <p className='text-red-500'>Error loading owned tenants: {errorOwned.message}</p>}
						{ownedTenantsData && ownedTenantsData.tenants && <TenantTable tenants={ownedTenantsData.tenants} />}
						{ownedTenantsData && ownedTenantsData.tenants?.length === 0 && <p>You have not created any tenants yet.</p>}
					</div>
				</TabsContent>
				{isAdmin && (
					<TabsContent value='all'>
						<div className='mt-4 p-4 border rounded-md'>
							<h2 className='text-xl font-semibold mb-2'>All System Tenants</h2>
							{isLoadingAll && <p>Loading all tenants...</p>}
							{errorAll && <p className='text-red-500'>Error loading all tenants: {errorAll.message}</p>}
							{allTenantsData && allTenantsData.tenants && <TenantTable tenants={allTenantsData.tenants} />}
							{allTenantsData && allTenantsData.tenants?.length === 0 && <p>No tenants found in the system.</p>}
						</div>
					</TabsContent>
				)}
			</Tabs>
		</div>
	)
}

export default TenantManagementPage
