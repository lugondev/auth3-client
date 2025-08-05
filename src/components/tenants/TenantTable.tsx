'use client'

import React from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {Tenant} from '@/types/tenantManagement'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Edit, Fingerprint, Users} from 'lucide-react'
import {loginTenantContext} from '@/services/authService'
import {Loader2} from 'lucide-react'
import {toast} from 'sonner'
import {PermissionButton} from '@/components/guards'
import {PermissionTooltip} from '@/components/permissions'
import {useAuth} from '@/contexts/AuthContext'
import {usePermissions} from '@/contexts/PermissionContext'
import {tokenManager} from '@/lib/token-storage'
import {decodeJwt} from '@/lib/jwt'

interface TenantTableProps {
	tenants: Tenant[]
	isAdmin?: boolean // Could be used to conditionally show/hide actions if needed elsewhere
}

export const TenantTable: React.FC<TenantTableProps> = ({tenants, isAdmin}) => {
	const router = useRouter()
	const [loading, setLoading] = React.useState(false)
	const {user, switchToTenantById} = useAuth()
	const {hasPermission} = usePermissions()

	if (!tenants || tenants.length === 0) {
		return <p>No tenants to display.</p>
	}

	const handleTenantManagement = async (tenantId: string) => {
		setLoading(true)
		try {
			// Check if current access token has tenant information for this specific tenant
			const tenantTokens = tokenManager.getTokens('tenant')
			
			let needsLoginTenant = false
			
			// If we have tenant tokens, check if they're for the correct tenant
			if (tenantTokens.accessToken) {
				try {
					const decoded = decodeJwt<{ tenant_id?: string; exp?: number }>(tenantTokens.accessToken)
					if (!decoded?.tenant_id || 
						decoded.tenant_id !== tenantId || 
						(decoded.exp && decoded.exp * 1000 < Date.now())) {
						needsLoginTenant = true
					}
				} catch (error) {
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
				await loginTenantContext(tenantId, true, false)
			}
			
			// Use the AuthContext switchToTenantById method which handles validation
			await switchToTenantById(tenantId)
			
			// Navigate to tenant dashboard
			router.push(`/dashboard/tenant/${tenantId}`)
		} catch (error) {
			console.error('Failed to switch tenant context:', error)
			
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
			setLoading(false)
		}
	}

	// Check if user can manage this tenant (either has permission or is the owner)
	const canManageTenant = (tenant: Tenant): boolean => {
		if (!user) return false
		
		// Check if user has tenant:manage permission
		if (hasPermission('tenant:manage')) return true
		
		// Check if user is the owner of this tenant
		if (tenant.owner_user_id && user.id === tenant.owner_user_id) return true
		
		return false
	}

	return (
		<div>
			{loading && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
					<div className='bg-white dark:bg-zinc-900 rounded-lg p-8 flex flex-col items-center shadow-lg'>
						<Loader2 className='h-8 w-8 animate-spin mb-4 text-primary' />
						<span className='text-lg font-medium'>Loading...</span>
					</div>
				</div>
			)}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Slug</TableHead>
						{isAdmin && <TableHead>Owner Email</TableHead>}
						<TableHead>Status</TableHead>
						<TableHead className='text-right'>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{tenants.map((tenant) => (
						<TableRow key={tenant.id}>
							<TableCell className='font-medium'>{tenant.name}</TableCell>
							<TableCell>{tenant.slug}</TableCell>
							{isAdmin && <TableCell>{tenant.owner?.email || 'N/A'}</TableCell>}
							<TableCell>
								<Badge variant={tenant.is_active ? 'default' : 'destructive'}>{tenant.is_active ? 'Active' : 'Inactive'}</Badge>
							</TableCell>
							{isAdmin ? (
								<TableCell className='text-right space-x-2'>
									<PermissionTooltip permission='admin:tenants:update'>
										<PermissionButton variant='outline' size='sm' permission='admin:tenants:update' asChild>
											<Link href={`/dashboard/admin/tenants/${tenant.id}/edit`}>
												<Edit className='h-4 w-4 mr-2' />
												Edit
											</Link>
										</PermissionButton>
									</PermissionTooltip>
									<PermissionTooltip permission='admin:tenants:users:read'>
										<PermissionButton variant='outline' size='sm' permission='admin:tenants:users:read' asChild>
											<Link href={`/dashboard/admin/tenants/${tenant.id}/users`}>
												<Users className='h-4 w-4 mr-2' />
												Manage Users
											</Link>
										</PermissionButton>
									</PermissionTooltip>
									<PermissionTooltip permission='admin:tenants:dids:read'>
										<PermissionButton variant='outline' size='sm' permission='admin:tenants:dids:read' asChild>
											<Link href={`/dashboard/admin/tenants/${tenant.id}/dids`}>
												<Fingerprint className='h-4 w-4 mr-2' />
												Users DIDs
											</Link>
										</PermissionButton>
									</PermissionTooltip>
								</TableCell>
							) : (
								<TableCell className='text-right space-x-2'>
									{canManageTenant(tenant) ? (
										<Button 
											variant='outline' 
											size='sm' 
											onClick={() => handleTenantManagement(tenant.id)}
										>
											<Edit className='h-4 w-4 mr-2' />
											Management
										</Button>
									) : (
										<PermissionTooltip permission='tenant:manage'>
											<PermissionButton 
												variant='outline' 
												size='sm' 
												permission='tenant:manage' 
												onClick={() => handleTenantManagement(tenant.id)}
											>
												<Edit className='h-4 w-4 mr-2' />
												Management
											</PermissionButton>
										</PermissionTooltip>
									)}
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
