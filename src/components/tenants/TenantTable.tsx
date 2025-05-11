'use client'

import React from 'react'
import Link from 'next/link'
import {Tenant} from '@/types/tenantManagement'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Edit, Users} from 'lucide-react' // Removed Eye

interface TenantTableProps {
	tenants: Tenant[]
	// isAdmin?: boolean // Could be used to conditionally show/hide actions if needed elsewhere
}

export const TenantTable: React.FC<TenantTableProps> = ({tenants}) => {
	if (!tenants || tenants.length === 0) {
		return <p>No tenants to display.</p>
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Slug</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className='text-right'>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{tenants.map((tenant) => (
					<TableRow key={tenant.id}>
						<TableCell className='font-medium'>{tenant.name}</TableCell>
						<TableCell>{tenant.slug}</TableCell>
						<TableCell>
							<Badge variant={tenant.is_active ? 'default' : 'destructive'}>{tenant.is_active ? 'Active' : 'Inactive'}</Badge>
						</TableCell>
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
							{/* Optional: A general view link if you have a details page */}
							{/*
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/tenants/${tenant.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
              */}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
