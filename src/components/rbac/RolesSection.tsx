import React from 'react'
import {Button} from '@/components/ui/button'
import {Loader2} from 'lucide-react'
import {RbacLoadingState} from '@/types/rbac'

interface RolesSectionProps {
	roles: string[]
	loading: RbacLoadingState // Pass relevant loading states (initial, action, rolePermissions)
	error: string | null // Pass general error state
	selectedRole: string | null // To disable button while loading specific role perms
	onOpenCreateRoleModal: () => void
	onOpenRolePermsModal: (roleName: string) => void
}

export const RolesSection: React.FC<RolesSectionProps> = ({roles, loading, error, selectedRole, onOpenCreateRoleModal, onOpenRolePermsModal}) => {
	return (
		<section aria-labelledby='roles-heading'>
			<div className='flex justify-between items-center mb-4'>
				<h2 id='roles-heading' className='text-2xl font-semibold'>
					Roles
				</h2>
				<Button onClick={onOpenCreateRoleModal} size='sm' disabled={loading.action}>
					{loading.action ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
					Create New Role
				</Button>
			</div>
			{roles.length === 0 && !loading.initial && !error ? (
				<p className='text-muted-foreground text-center py-4'>No roles defined in the system yet.</p>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
					{roles.map((roleName) => (
						<div key={roleName} className='border bg-card p-4 rounded-lg shadow-sm flex flex-col justify-between'>
							<h3 className='font-medium text-lg mb-3 truncate' title={roleName}>
								{roleName}
							</h3>
							<Button
								variant='outline'
								size='sm'
								className='w-full mt-auto' // Ensure button is at the bottom
								onClick={() => onOpenRolePermsModal(roleName)}
								disabled={loading.rolePermissions && selectedRole === roleName} // Disable while loading permissions for this role
							>
								{loading.rolePermissions && selectedRole === roleName ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
								Manage Permissions
							</Button>
						</div>
					))}
				</div>
			)}
		</section>
	)
}
