'use client'

import React, {useEffect, useState} from 'react'
import {useParams} from 'next/navigation'
import {getAllRoles} from '@/services/rbacService' // Using system roles as available roles for tenant
import {RoleListOutput} from '@/types/rbac'
import {toast} from 'sonner'

export default function TenantRolesPage() {
	const params = useParams()
	const tenantId = params.tenantId as string
	const [roles, setRoles] = useState<string[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!tenantId) {
			setError('Tenant ID is missing.')
			setLoading(false)
			return
		}
		// Fetch system roles, as these are typically the pool of roles assignable within a tenant.
		// Tenant-specific role definitions would require a different API.
		const fetchAvailableRoles = async () => {
			setLoading(true)
			setError(null)
			try {
				const result: RoleListOutput = await getAllRoles()
				setRoles(result.roles || [])
				if ((result.roles || []).length === 0) {
					toast.info('No system roles available to assign.')
				}
			} catch (err) {
				console.error(`Failed to fetch available roles for tenant ${tenantId}:`, err)
				const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
				setError(errorMessage)
				toast.error(`Failed to load available roles: ${errorMessage}`)
			} finally {
				setLoading(false)
			}
		}

		fetchAvailableRoles()
	}, [tenantId])

	// TODO: Implement UI for assigning roles to users (likely on TenantUsersPage or a dedicated assignment UI)
	// TODO: If tenant-specific role definitions are needed, implement create/edit/delete for tenant roles.
	// TODO: Display permissions associated with each role (getPermissionsForRole)

	if (loading) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Roles in Tenant ({tenantId || 'N/A'})</h1>
				<p>Loading available roles...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Roles in Tenant ({tenantId || 'N/A'})</h1>
				<p className='text-red-500'>Error: {error}</p>
			</div>
		)
	}

	return (
		<div>
			<h1 className='text-2xl font-semibold mb-4'>Manage Roles for Tenant ({tenantId})</h1>
			<p className='mb-4'>View available roles that can be assigned to users within this tenant. Actual role assignment to users is typically done via the Tenant Users page.</p>

			{roles.length === 0 && !loading ? (
				<p>No roles available in the system to assign.</p>
			) : (
				<div className='bg-white shadow rounded p-4'>
					<h2 className='text-xl font-semibold mb-3'>Available System Roles</h2>
					<ul className='list-disc pl-5 space-y-1'>
						{roles.map((role) => (
							<li key={role} className='flex justify-between items-center py-1'>
								<span>{role}</span>
								<button className='text-sm text-blue-500 hover:underline' onClick={() => toast.info(`View/Edit permissions for role '${role}' (TODO).`)}>
									View/Manage Permissions
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
			{/* TODO: If tenant-specific role creation is allowed:
      <div className="mt-6">
        <button 
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => toast.info("Create tenant-specific role functionality (TODO).")}
        >
          Create Tenant-Specific Role
        </button>
      </div>
      */}
		</div>
	)
}
