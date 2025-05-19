'use client'

import React from 'react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Loader2, X} from 'lucide-react'
import {TenantRbacLoadingState} from '@/types/tenantRbac' // Use Tenant specific types

interface TenantRolePermissionsModalProps {
	isOpen: boolean
	onClose: () => void
	role: string | null
	groupedPermissions: Record<string, string[]> // Pre-grouped permissions for the selected role
	loading: TenantRbacLoadingState
	error: string | null
	newPermObject: string
	newPermAction: string
	onNewPermObjectChange: (value: string) => void
	onNewPermActionChange: (value: string) => void
	onAddPermission: (roleName: string | null, object: string, action: string) => Promise<void>
	onRemovePermission: (roleName: string | null, object: string, action: string) => Promise<void>
}

export const TenantRolePermissionsModal: React.FC<TenantRolePermissionsModalProps> = ({isOpen, onClose, role, groupedPermissions, loading, error, newPermObject, newPermAction, onNewPermObjectChange, onNewPermActionChange, onAddPermission, onRemovePermission}) => {
	if (!role) return null

	const permissionsExist = Object.keys(groupedPermissions).length > 0
	const modalError = error && (error.startsWith('Failed to add permission:') || error.startsWith('Failed to remove permission:') || error === 'Tenant ID, Role, Object, and Action cannot be empty.') ? error : null

	const handleAddPermission = async () => {
		if (!newPermObject || !newPermAction) {
			// This case should ideally be handled by button's disabled state,
			// but as a fallback:
			// Call a local error setter or rely on the hook's setError if it covers this.
			// For now, assuming the hook's setError will be called by onAddPermission if needed.
			console.warn('Object and Action cannot be empty for adding permission.')
		}
		await onAddPermission(role, newPermObject, newPermAction)
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[600px]'>
				<DialogHeader>
					<DialogTitle>Manage Permissions for Tenant Role: {role}</DialogTitle>
					<DialogDescription>Add or remove permissions (object-action pairs) for this role within the tenant.</DialogDescription>
				</DialogHeader>
				{loading.rolePermissions ? (
					<div className='flex justify-center items-center p-8'>
						<Loader2 className='h-6 w-6 animate-spin text-primary' />
						<span className='ml-2'>Loading permissions...</span>
					</div>
				) : (
					<div className='py-4 space-y-4'>
						{/* Add New Permission Form */}
						<div className='flex gap-2 items-end border-b pb-4'>
							<div className='flex-1 space-y-1'>
								<Label htmlFor={`tenant-new-perm-object-${role}`}>Object</Label>
								<Input id={`tenant-new-perm-object-${role}`} placeholder='e.g., /api/v1/data/*' value={newPermObject} onChange={(e) => onNewPermObjectChange(e.target.value)} disabled={loading.action} />
							</div>
							<div className='flex-1 space-y-1'>
								<Label htmlFor={`tenant-new-perm-action-${role}`}>Action</Label>
								<Input id={`tenant-new-perm-action-${role}`} placeholder='e.g., GET or *' value={newPermAction} onChange={(e) => onNewPermActionChange(e.target.value)} disabled={loading.action} />
							</div>
							<Button onClick={handleAddPermission} disabled={loading.action || !newPermObject || !newPermAction}>
								{loading.action ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
								Add
							</Button>
						</div>

						{/* Existing Permissions List */}
						<h4 className='font-medium'>Assigned Permissions</h4>
						<ScrollArea className='h-[250px] border rounded p-2'>
							{!permissionsExist ? (
								<p className='text-sm text-muted-foreground italic p-2'>No permissions assigned.</p>
							) : (
								Object.entries(groupedPermissions).map(([object, actions]) => (
									<div key={object} className='mb-3 last:mb-0'>
										<h5 className='text-sm font-semibold capitalize mb-1 px-2'>Object: {object}</h5>
										<div className='space-y-1'>
											{actions.map((action) => (
												<div key={`${object}:${action}`} className='flex items-center justify-between p-2 rounded hover:bg-muted/50'>
													<span className='text-sm'>
														<span className='font-medium text-muted-foreground'>Action:</span> {action}
													</span>
													<Button variant='ghost' size='icon' className='h-6 w-6 text-muted-foreground hover:text-destructive' onClick={() => onRemovePermission(role, object, action)} disabled={loading.action} aria-label={`Remove permission ${action} on ${object}`}>
														<X className='h-4 w-4' />
													</Button>
												</div>
											))}
										</div>
									</div>
								))
							)}
						</ScrollArea>
						{modalError && <p className='text-sm text-destructive px-1'>{modalError}</p>}
					</div>
				)}
				<DialogFooter>
					<DialogClose asChild>
						<Button type='button' variant='secondary'>
							Close
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
