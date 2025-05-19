import React from 'react'
import {UserOutput} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose} from '@/components/ui/dialog'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Loader2} from 'lucide-react'
import {RbacLoadingState, Role} from '@/types/rbac'

interface UserRolesModalProps {
	isOpen: boolean
	onClose: () => void
	user: UserOutput | null
	roles: Role[] // All available roles
	userRolesMap: Record<string, string[]> // Map of userId to their assigned roles
	loading: RbacLoadingState // Pass relevant loading states (userRoles, action)
	error: string | null
	onAddRole: (userId: string | undefined, roleName: string) => void
	onRemoveRole: (userId: string | undefined, roleName: string) => void
}

export const UserRolesModal: React.FC<UserRolesModalProps> = ({isOpen, onClose, user, roles, userRolesMap, loading, error, onAddRole, onRemoveRole}) => {
	if (!user) return null // Don't render if no user is selected

	const assignedRoles = userRolesMap[user.id] || []
	const modalError = error && (error.startsWith('Failed to add role:') || error.startsWith('Failed to remove role:')) ? error : null

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[500px]'>
				<DialogHeader>
					<DialogTitle>Manage Roles for {user.email}</DialogTitle>
					<DialogDescription>Assign or remove roles for this user.</DialogDescription>
				</DialogHeader>
				{loading.userRoles ? (
					<div className='flex justify-center items-center p-8'>
						<Loader2 className='h-6 w-6 animate-spin text-primary' />
						<span className='ml-2'>Loading roles...</span>
					</div>
				) : (
					<div className='grid gap-4 py-4'>
						<h4 className='font-medium mb-2'>Available Roles</h4>
						<ScrollArea className='h-[200px] border rounded p-2'>
							<div className='space-y-2'>
								{roles.length === 0 ? (
									<p className='text-sm text-muted-foreground italic p-2'>No roles defined in the system.</p>
								) : (
									roles
										.filter((role) => role.domain == 'global')
										.map((role) => {
											const isAssigned = assignedRoles.includes(role.name)
											return (
												<div key={role.name} className='flex items-center justify-between p-1'>
													<Label htmlFor={`role-${user.id}-${role.name}`} className='flex-1 cursor-pointer'>
														{role.name}
													</Label>
													<Checkbox
														id={`role-${user.id}-${role.name}`}
														checked={isAssigned}
														onCheckedChange={(checked: boolean | 'indeterminate') => {
															// Ensure checked is boolean before calling handlers
															if (typeof checked === 'boolean') {
																if (checked) {
																	onAddRole(user.id, role.name)
																} else {
																	onRemoveRole(user.id, role.name)
																}
															}
														}}
														disabled={loading.action} // Disable checkbox during add/remove actions
														aria-label={`Assign role ${role.name}`}
													/>
												</div>
											)
										})
								)}
							</div>
						</ScrollArea>
						{/* Display modal-specific errors */}
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
