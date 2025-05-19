import React, {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Loader2} from 'lucide-react'
import {RbacLoadingState, Role} from '@/types/rbac'
import {deleteRole} from '@/services/rbacService'

interface RolesSectionProps {
	roles: Role[]
	loading: RbacLoadingState
	error: string | null
	selectedRole: Role | null
	onOpenCreateRoleModal: () => void
	onOpenRolePermsModal: (role: Role) => void
	onDeleteRole: (role: Role) => void
}

export const RolesSection: React.FC<RolesSectionProps> = ({roles, loading, error, selectedRole, onOpenCreateRoleModal, onOpenRolePermsModal, onDeleteRole}) => {
	const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
	const [confirming, setConfirming] = useState(false)

	const handleDelete = (role: Role) => {
		setDeleteTarget(role)
		setConfirming(true)
	}

	const handleConfirmDelete = async () => {
		if (deleteTarget) {
			try {
				await deleteRole(deleteTarget)
				onDeleteRole(deleteTarget)
			} catch (error) {
				console.error('Error deleting role:', error)
			} finally {
				setConfirming(false)
				setDeleteTarget(null)
			}
		}
	}

	const handleCancelDelete = () => {
		setConfirming(false)
		setDeleteTarget(null)
	}

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
				<div className='overflow-x-auto'>
					<table className='min-w-full bg-card rounded-lg shadow-sm'>
						<thead>
							<tr>
								<th className='px-4 py-2 text-left'>Role</th>
								<th className='px-4 py-2 text-left'>Domain</th>
								<th className='px-4 py-2 text-center'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{roles.map((role) => (
								<tr key={role.name + '-' + role.domain} className='border-b last:border-b-0'>
									<td className='px-4 py-2 font-medium truncate' title={role.name}>
										{role.name}
									</td>
									<td className='px-4 py-2 font-medium truncate' title={role.domain}>
										{role.domain}
									</td>
									<td className='px-4 py-2 flex gap-2'>
										<Button variant='outline' size='sm' onClick={() => onOpenRolePermsModal(role)} disabled={loading.rolePermissions && selectedRole?.name === role.name && selectedRole?.domain === role.domain}>
											{loading.rolePermissions && selectedRole?.name === role.name && selectedRole?.domain === role.domain ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
											Manage Permissions
										</Button>
										<Button variant='destructive' size='sm' onClick={() => handleDelete(role)} disabled={loading.action}>
											Delete
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Confirm Delete Modal */}
			{confirming && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
					<div className='bg-white dark:bg-card rounded-lg shadow-lg p-6 w-full max-w-sm'>
						<h3 className='text-lg font-semibold mb-2'>Confirm Delete</h3>
						<p className='mb-4'>
							Are you sure you want to delete role <span className='font-bold'>{deleteTarget?.name}</span>?
						</p>
						<div className='flex justify-end gap-2'>
							<Button variant='outline' onClick={handleCancelDelete} disabled={loading.action}>
								Cancel
							</Button>
							<Button variant='destructive' onClick={handleConfirmDelete} disabled={loading.action}>
								{loading.action ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}
		</section>
	)
}
