'use client'

import React from 'react'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {Loader2, Trash2} from 'lucide-react'

interface DeleteTenantConfirmationModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	tenantName: string
	isLoading: boolean
}

export const DeleteTenantConfirmationModal: React.FC<DeleteTenantConfirmationModalProps> = ({isOpen, onClose, onConfirm, tenantName, isLoading}) => {
	if (!isOpen) {
		return null
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
					<AlertDialogDescription>{`Are you sure you want to delete the tenant "${tenantName}"? This action cannot be undone and will permanently remove all associated data.`}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onClose} disabled={isLoading}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button variant='destructive' onClick={onConfirm} disabled={isLoading}>
							{isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
							Delete Tenant
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
