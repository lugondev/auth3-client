'use client'

import React from 'react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Loader2} from 'lucide-react'

interface DeleteRoleConfirmationModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	roleName: string
	isLoading: boolean
}

export function DeleteRoleConfirmationModal({isOpen, onClose, onConfirm, roleName, isLoading}: DeleteRoleConfirmationModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Role</DialogTitle>
					<DialogDescription>Are you sure you want to delete the role &quot;{roleName}&quot;? This action cannot be undone. Any users currently assigned this role will lose the associated permissions.</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant='outline' onClick={onClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button variant='destructive' onClick={onConfirm} disabled={isLoading}>
						{isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						Delete Role
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
