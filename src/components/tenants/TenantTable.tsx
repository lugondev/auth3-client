'use client'

import React from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {Tenant} from '@/types/tenantManagement'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Edit, Users} from 'lucide-react'
import {loginTenantContext} from '@/services/authService'
import {useAuth} from '@/contexts/AuthContext'
import {Loader2} from 'lucide-react'

interface TenantTableProps {
	tenants: Tenant[]
	isAdmin?: boolean // Could be used to conditionally show/hide actions if needed elsewhere
}

export const TenantTable: React.FC<TenantTableProps> = ({tenants, isAdmin}) => {
	const router = useRouter()
	const {handleAuthSuccess} = useAuth()
	const [loading, setLoading] = React.useState(false)

	if (!tenants || tenants.length === 0) {
		return <p>No tenants to display.</p>
	}

	const handleTenantManagement = async (tenantId: string) => {
		setLoading(true)
		try {
			const authResult = await loginTenantContext(tenantId)
			await handleAuthSuccess(authResult)
			router.push(`/tenant/${tenantId}`)
		} catch (error) {
			// Optionally handle error (e.g., toast)
			console.error('Failed to login tenant context:', error) // Updated error message
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
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
									<Button variant='outline' size='sm' asChild>
										<Link href={`/admin/tenants/${tenant.id}/edit`}>
											<Edit className='h-4 w-4 mr-2' />
											Edit
										</Link>
									</Button>
									<Button variant='outline' size='sm' asChild>
										<Link href={`/admin/tenants/${tenant.id}/users`}>
											<Users className='h-4 w-4 mr-2' />
											Manage Users
										</Link>
									</Button>
								</TableCell>
							) : (
								<TableCell className='text-right space-x-2'>
									<Button variant='outline' size='sm' onClick={() => handleTenantManagement(tenant.id)}>
										<Edit className='h-4 w-4 mr-2' />
										Management
									</Button>
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	)
}
