// @/app/(protected)/tenant-management/page.tsx
'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'
import AppShell from '@/components/layout/AppShell'
import {useQuery} from '@tanstack/react-query'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {getJoinedTenants, getOwnedTenants, getTenantPermissions} from '@/services/tenantService'
import {JoinedTenantsResponse, OwnedTenantsResponse, JoinedTenantMembership} from '@/types/tenantManagement'
import {TenantTable} from '@/components/tenants/TenantTable'
import {TenantPermission} from '@/types/tenantRbac'
import {loginTenantContext} from '@/services/authService'
import {useRouter} from 'next/navigation'
import {ChevronDown, ChevronUp, Loader2} from 'lucide-react'

export default function TenantManagementPage() {
	const {user, loading, isAuthenticated, handleAuthSuccess} = useAuth()
	const router = useRouter()
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

	React.useEffect(() => {
		const fetchJoinedPermissions = async () => {
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
		}

		fetchJoinedPermissions()
	}, [joinedTenantsData, user])

	const handleJoinedTenantManagement = async (tenantId: string) => {
		setIsSwitchingTenant(true)
		try {
			const authResult = await loginTenantContext(tenantId)
			await handleAuthSuccess(authResult)
			router.push(`/tenant/${tenantId}`)
		} catch (error) {
			console.error('Failed to login tenant context:', error)
		} finally {
			setIsSwitchingTenant(false)
		}
	}

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
		<AppShell sidebarType='user'>
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
						<Button asChild variant='default' size='sm' className='hover:bg-gray-700'>
							<Link href='/admin/tenants/create'>Create Organization</Link>
						</Button>
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
														{!!joinedTenantPermissions[membership.tenant_id]?.permissions?.length && (
															<div className='mt-2 flex items-center space-x-2'>
																<Button variant='outline' size='sm' onClick={() => handleJoinedTenantManagement(membership.tenant_id)}>
																	Management
																</Button>
																<Button variant='ghost' size='sm' onClick={() => setOpenPermissionsTenantId(openPermissionsTenantId === membership.tenant_id ? null : membership.tenant_id)}>
																	{openPermissionsTenantId === membership.tenant_id ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
																</Button>
															</div>
														)}
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
		</AppShell>
	)
}
