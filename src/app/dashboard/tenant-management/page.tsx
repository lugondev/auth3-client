'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {getJoinedTenants, getOwnedTenants, getTenantPermissions} from '@/services/tenantService'
import {JoinedTenantsResponse, OwnedTenantsResponse, JoinedTenantMembership} from '@/types/tenantManagement'
import {TenantTable} from '@/components/tenants/TenantTable'
import {TenantPermission} from '@/types/tenantRbac'
import {loginTenantContext} from '@/services/authService'
import {useRouter} from 'next/navigation'
import {ChevronDown, ChevronUp, Loader2, Plus} from 'lucide-react'
import {toast} from 'sonner'
import {tokenManager} from '@/lib/token-storage'
import {decodeJwt} from '@/lib/jwt'
import {CreateTenantModal} from '@/components/tenants/CreateTenantModal'

export default function TenantManagementPage() {
	const {user, loading, isAuthenticated} = useAuth()
	const router = useRouter()
	const queryClient = useQueryClient()
	const [isSwitchingTenant, setIsSwitchingTenant] = React.useState(false)
	const [openPermissionsTenantId, setOpenPermissionsTenantId] = React.useState<string | null>(null)

	const {
		data: joinedTenantsData,
		isLoading: isLoadingJoined,
		error: errorJoined,
	} = useQuery<JoinedTenantsResponse, Error>({
		queryKey: ['joinedTenantsDashboard', user?.id],
		queryFn: () => getJoinedTenants(10, 0),
		enabled: !!user,
	})

	const [joinedTenantPermissions, setJoinedTenantPermissions] = React.useState<Record<string, TenantPermission | null>>({})

	const fetchJoinedPermissions = React.useCallback(async () => {
		if (!user) return

		const permissions: Record<string, TenantPermission | null> = {}
		for (const membership of joinedTenantsData?.memberships || []) {
			console.log(`Fetching permissions for tenant...`, membership)

			if (!membership.user_roles.includes('TenantOwner')) {
				try {
					const tenantPerms = await getTenantPermissions(membership.tenant_id)
					permissions[membership.tenant_id] = tenantPerms
				} catch (error) {
					console.error(`Failed to fetch permissions for tenant ${membership.tenant_id}:`, error)
					permissions[membership.tenant_id] = null
				}
			}
		}
		setJoinedTenantPermissions(permissions)
	}, [user, joinedTenantsData?.memberships])

	React.useEffect(() => {
		fetchJoinedPermissions()
	}, [fetchJoinedPermissions])

	const handleJoinedTenantManagement = React.useCallback(
		async (tenantId: string) => {
			setIsSwitchingTenant(true)
			try {
				// Check if current access token has tenant information for this specific tenant
				const tenantTokens = tokenManager.getTokens('tenant')

				let needsLoginTenant = false

				// If we have tenant tokens, check if they're for the correct tenant
				if (tenantTokens.accessToken) {
					try {
						const decoded = decodeJwt<{tenant_id?: string; exp?: number}>(tenantTokens.accessToken)
						if (!decoded?.tenant_id || decoded.tenant_id !== tenantId || (decoded.exp && decoded.exp * 1000 < Date.now())) {
							needsLoginTenant = true
						}
					} catch {
						console.log('Invalid tenant token, need to login')
						needsLoginTenant = true
					}
				} else {
					// No tenant tokens, need to login
					needsLoginTenant = true
				}

				// If access token doesn't have tenant info, perform login-tenant
				if (needsLoginTenant) {
					console.log(`🔄 Getting tenant access token for tenant ${tenantId}`)
					const contextResult = await loginTenantContext(tenantId, true, false) // Skip validation for initial context switch
					if (!contextResult.success) {
						throw new Error(contextResult.error || 'Context switch failed')
					}
				}

				router.push(`/dashboard/tenant/${tenantId}`)
			} catch (error) {
				console.error('Failed to login tenant context:', error)

				// More specific error handling
				if (error instanceof Error) {
					if (error.message.includes('403') || error.message.includes('Forbidden')) {
						toast.error('You do not have permission to access this tenant.')
					} else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
						toast.error('Authentication failed. Please log in again.')
					} else {
						toast.error(`Unable to switch tenant context: ${error.message}`)
					}
				} else {
					toast.error('Unable to switch tenant context. Please try again.')
				}
			} finally {
				setIsSwitchingTenant(false)
			}
		},
		[router],
	)

	const togglePermissions = React.useCallback((tenantId: string) => {
		setOpenPermissionsTenantId((prev) => (prev === tenantId ? null : tenantId))
	}, [])

	const handleTenantCreated = React.useCallback(() => {
		// Refetch both tenant queries when a new tenant is created
		queryClient.invalidateQueries({queryKey: ['joinedTenantsDashboard']})
		queryClient.invalidateQueries({queryKey: ['ownedTenantsDashboard']})
	}, [queryClient])

	const {
		data: ownedTenantsData,
		isLoading: isLoadingOwned,
		error: errorOwned,
	} = useQuery<OwnedTenantsResponse, Error>({
		queryKey: ['ownedTenantsDashboard', user?.id],
		queryFn: () => getOwnedTenants(10, 0),
		enabled: !!user,
	})

	if (loading || (!isAuthenticated && !loading)) {
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
		return <p className='text-center mt-10'>Redirecting to login...</p>
	}

	return (
		<div className='container mx-auto p-4 md:p-6'>
			{isSwitchingTenant && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
					<div className='bg-white dark:bg-zinc-900 rounded-lg p-8 flex flex-col items-center shadow-lg'>
						<Loader2 className='h-8 w-8 animate-spin mb-4 text-primary' />
						<span className='text-lg font-medium'>Switching Tenant Context...</span>
					</div>
				</div>
			)}
			<h1 className='mb-8 text-3xl font-bold text-gray-800 dark:text-gray-100'>Tenant Management</h1>

			<Card className='mb-8'>
				<CardHeader className='flex flex-row items-center justify-between'>
					<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>Organizations</CardTitle>
					<CreateTenantModal onTenantCreated={handleTenantCreated}>
						<Button variant='default' size='sm' className='hover:bg-gray-700'>
							<Plus className='h-4 w-4 mr-2' />
							Create Organization
						</Button>
					</CreateTenantModal>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue='joined' className='w-full'>
						<TabsList>
							<TabsTrigger value='joined'>Joined Organizations</TabsTrigger>
							<TabsTrigger value='owned'>My Created Organizations</TabsTrigger>
						</TabsList>
						<TabsContent value='joined'>
							<div className='mt-4 p-4 border rounded-md dark:border-gray-700'>
								<h2 className='text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200'>Organizations I&#39;ve Joined</h2>
								{isLoadingJoined && <p className='text-gray-500 dark:text-gray-400'>Loading joined organizations...</p>}
								{errorJoined && <p className='text-red-500'>Error loading joined organizations: {errorJoined.message}</p>}
								{joinedTenantsData && (
									<ul className='space-y-2'>
										{joinedTenantsData.memberships?.length === 0 && <p className='text-gray-500 dark:text-gray-400'>You have not joined any organizations yet.</p>}
										{joinedTenantsData.memberships?.map((membership: JoinedTenantMembership) => (
											<li key={membership.tenant_id} className='p-3 border-b dark:border-gray-700 last:border-b-0'>
												<div>
													<strong className='text-gray-800 dark:text-gray-100'>{membership.tenant_name}</strong> <span className='text-sm text-gray-500 dark:text-gray-400'>({membership.tenant_slug})</span>
													<br />
													<span className='text-sm text-gray-600 dark:text-gray-300'>
														<i>
															<small>{membership.tenant_id}</small>
														</i>
													</span>
													<br />
													<span className='text-sm text-gray-600 dark:text-gray-300'>
														Roles: {membership.user_roles.join(', ')} | Status: {membership.user_status}
													</span>
													<br />
													<span className='text-sm text-gray-600 dark:text-gray-300'>
														Joined: {new Date(membership.joined_at).toLocaleDateString()} | Active: {membership.tenant_is_active ? 'Yes' : 'No'}
													</span>
													<br />
													<div className='mt-2 flex items-center space-x-2'>
														<Button variant='outline' size='sm' onClick={() => handleJoinedTenantManagement(membership.tenant_id)} aria-label={`Manage ${membership.tenant_name} organization`}>
															Management
														</Button>
														{!!joinedTenantPermissions[membership.tenant_id]?.permissions?.length && (
															<Button variant='ghost' size='sm' onClick={() => togglePermissions(membership.tenant_id)} aria-label={`${openPermissionsTenantId === membership.tenant_id ? 'Hide' : 'Show'} permissions for ${membership.tenant_name}`}>
																{openPermissionsTenantId === membership.tenant_id ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
															</Button>
														)}
													</div>
													{openPermissionsTenantId === membership.tenant_id && !!joinedTenantPermissions[membership.tenant_id]?.permissions?.length && (
														<div className='mt-2 p-2 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800'>
															<h4 className='text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200'>Permissions:</h4>
															<ul className='list-disc list-inside text-sm text-gray-600 dark:text-gray-300'>
																{joinedTenantPermissions[membership.tenant_id]?.permissions.map((permission, index) => {
																	const [obj, act] = permission
																	return <li key={index}>{`${obj}:${act}`}</li>
																})}
															</ul>
														</div>
													)}
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						</TabsContent>
						<TabsContent value='owned'>
							<div className='mt-4 p-4 border rounded-md dark:border-gray-700'>
								<h2 className='text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200'>Organizations I&#39;ve Created</h2>
								{isLoadingOwned && <p className='text-gray-500 dark:text-gray-400'>Loading created organizations...</p>}
								{errorOwned && <p className='text-red-500'>Error loading created organizations: {errorOwned.message}</p>}
								{ownedTenantsData && ownedTenantsData.tenants && <TenantTable tenants={ownedTenantsData.tenants} />}
								{ownedTenantsData && ownedTenantsData.tenants?.length === 0 && <p className='text-gray-500 dark:text-gray-400'>You have not created any organizations yet.</p>}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	)
}
