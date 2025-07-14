'use client'

import React from 'react'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Separator} from '@/components/ui/separator'
import {Badge} from '@/components/ui/badge'
import {Loader2, X, Plus, Shield} from 'lucide-react'
import {TenantRbacLoadingState} from '@/types/tenantRbac'

interface TenantRolePermissionsPanelProps {
	roleName: string
	groupedPermissions: Record<string, string[]>
	loading: TenantRbacLoadingState
	error: string | null
	newPermObject: string
	newPermAction: string
	onNewPermObjectChange: (value: string) => void
	onNewPermActionChange: (value: string) => void
	onAddPermission: (roleName: string | null, object: string, action: string) => Promise<void>
	onRemovePermission: (roleName: string | null, object: string, action: string) => Promise<void>
	onClose?: () => void
}

export const TenantRolePermissionsPanel: React.FC<TenantRolePermissionsPanelProps> = ({
	roleName,
	groupedPermissions,
	loading,
	error,
	newPermObject,
	newPermAction,
	onNewPermObjectChange,
	onNewPermActionChange,
	onAddPermission,
	onRemovePermission,
	onClose,
}) => {
	const permissionsExist = Object.keys(groupedPermissions).length > 0
	const panelError = error && (error.startsWith('Failed to add permission:') || error.startsWith('Failed to remove permission:') || error === 'Tenant ID, Role, Object, and Action cannot be empty.') ? error : null

	const handleAddPermission = async () => {
		if (!newPermObject || !newPermAction) {
			console.warn('Object and Action cannot be empty for adding permission.')
			return
		}
		await onAddPermission(roleName, newPermObject, newPermAction)
	}

	if (loading.rolePermissions) {
		return (
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='flex items-center gap-2'>
								<Shield className='h-5 w-5' />
								Permissions for "{roleName}"
							</CardTitle>
							<CardDescription>Loading permissions...</CardDescription>
						</div>
						{onClose && (
							<Button variant='ghost' size='sm' onClick={onClose}>
								<X className='h-4 w-4' />
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className='flex justify-center items-center p-8'>
						<Loader2 className='h-6 w-6 animate-spin text-primary' />
						<span className='ml-2'>Loading permissions...</span>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className='animate-in slide-in-from-bottom-4 duration-300'>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<Shield className='h-5 w-5 text-primary' />
							Permissions for "{roleName}"
						</CardTitle>
						<CardDescription>
							Manage object-action permissions for this role within the tenant.
						</CardDescription>
					</div>
					{onClose && (
						<Button variant='ghost' size='sm' onClick={onClose} className='hover:bg-destructive/10 hover:text-destructive'>
							<X className='h-4 w-4' />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Add New Permission Form */}
				<div className='space-y-4 p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20'>
					<h4 className='font-medium flex items-center gap-2'>
						<Plus className='h-4 w-4 text-green-600' />
						Add New Permission
					</h4>
					<div className='flex gap-2 items-end'>
						<div className='flex-1 space-y-1'>
							<Label htmlFor={`new-perm-object-${roleName}`}>Object</Label>
							<Input 
								id={`new-perm-object-${roleName}`} 
								placeholder='e.g., /api/v1/data/*' 
								value={newPermObject} 
								onChange={(e) => onNewPermObjectChange(e.target.value)} 
								disabled={loading.action} 
								className='focus:ring-2 focus:ring-primary'
							/>
						</div>
						<div className='flex-1 space-y-1'>
							<Label htmlFor={`new-perm-action-${roleName}`}>Action</Label>
							<Input 
								id={`new-perm-action-${roleName}`} 
								placeholder='e.g., GET or *' 
								value={newPermAction} 
								onChange={(e) => onNewPermActionChange(e.target.value)} 
								disabled={loading.action} 
								className='focus:ring-2 focus:ring-primary'
							/>
						</div>
						<Button 
							onClick={handleAddPermission} 
							disabled={loading.action || !newPermObject || !newPermAction}
							className='bg-green-600 hover:bg-green-700'
						>
							{loading.action ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Plus className='mr-2 h-4 w-4' />}
							Add
						</Button>
					</div>
					{panelError && (
						<div className='text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/20 animate-in slide-in-from-top-2'>
							{panelError}
						</div>
					)}
				</div>

				<Separator />

				{/* Existing Permissions List */}
				<div className='space-y-4'>
					<h4 className='font-medium flex items-center gap-2'>
						<Shield className='h-4 w-4 text-blue-600' />
						Assigned Permissions
					</h4>
					{!permissionsExist ? (
						<div className='text-center py-8 text-muted-foreground bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20'>
							<Shield className='h-8 w-8 mx-auto mb-2 opacity-50' />
							<p className='text-sm'>No permissions assigned to this role yet.</p>
							<p className='text-xs mt-1'>Add your first permission using the form above.</p>
						</div>
					) : (
						<ScrollArea className='h-[300px] border rounded-lg p-4 bg-background'>
							<div className='space-y-4'>
								{Object.entries(groupedPermissions).map(([object, actions]) => (
									<div key={object} className='space-y-2 p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors'>
										<div className='flex items-center gap-2'>
											<Badge variant='outline' className='font-mono text-xs bg-background'>
												{object}
											</Badge>
										</div>
										<div className='ml-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
											{actions.map((action) => (
												<div key={`${object}:${action}`} className='flex items-center justify-between p-2 rounded border bg-background hover:bg-muted/50 transition-colors group'>
													<span className='text-sm font-mono text-blue-600'>{action}</span>
													<Button 
														variant='ghost' 
														size='icon' 
														className='h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all' 
														onClick={() => onRemovePermission(roleName, object, action)} 
														disabled={loading.action} 
														aria-label={`Remove permission ${action} on ${object}`}
													>
														<X className='h-3 w-3' />
													</Button>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
