// next/src/components/venues/staff/TransferOwnershipDialog.tsx
'use client'

import React, {useState} from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose} from '@/components/ui/dialog'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import venueService from '@/services/venueService'
import {TransferOwnershipDto} from '@/types/venue'
import {toast} from 'sonner'
import {Loader2, AlertTriangle} from 'lucide-react'

// Schema for the transfer ownership form
const transferOwnershipSchema = z
	.object({
		newOwnerEmail: z.string().email('Invalid email address'),
		confirmEmail: z.string().email('Confirmation email does not match'),
	})
	.refine((data) => data.newOwnerEmail === data.confirmEmail, {
		message: "Email addresses don't match",
		path: ['confirmEmail'], // Apply error to the confirmation field
	})

type TransferOwnershipFormData = z.infer<typeof transferOwnershipSchema>

interface TransferOwnershipDialogProps {
	venueId: string
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onOwnershipTransferred: () => void // Callback after successful transfer
}

export const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({venueId, isOpen, onOpenChange, onOwnershipTransferred}) => {
	const [isSaving, setIsSaving] = useState(false)
	const [showConfirmation, setShowConfirmation] = useState(false)
	const [transferData, setTransferData] = useState<TransferOwnershipDto | null>(null)

	const form = useForm<TransferOwnershipFormData>({
		resolver: zodResolver(transferOwnershipSchema),
		defaultValues: {
			newOwnerEmail: '',
			confirmEmail: '',
		},
	})

	const handleInitiateTransfer = (data: TransferOwnershipFormData) => {
		// Store data and show confirmation step
		setTransferData({newOwnerEmail: data.newOwnerEmail})
		setShowConfirmation(true)
	}

	const executeTransfer = async () => {
		if (!transferData) return

		setIsSaving(true)
		console.log('Transferring ownership to:', transferData.newOwnerEmail)
		try {
			await venueService.transferVenueOwnership(venueId, transferData)
			toast.success('Ownership Transferred', {
				description: `Venue ownership has been transferred to ${transferData.newOwnerEmail}. You may lose owner privileges shortly.`,
				duration: 10000, // Show longer message
			})
			form.reset() // Reset form on success
			setShowConfirmation(false) // Hide confirmation
			setTransferData(null)
			onOwnershipTransferred() // Trigger callback
			onOpenChange(false) // Close main dialog
		} catch (err: unknown) {
			console.error('Failed to transfer ownership:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
			toast.error('Transfer Failed', {
				description: errorMessage,
			})
			// Keep confirmation dialog open on error? Or close? Let's close confirmation but keep main open.
			setShowConfirmation(false)
		} finally {
			setIsSaving(false)
		}
	}

	// Reset form when main dialog opens/closes
	React.useEffect(() => {
		if (!isOpen) {
			form.reset()
			setShowConfirmation(false) // Ensure confirmation is hidden
			setTransferData(null)
		}
	}, [isOpen, form])

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Transfer Venue Ownership</DialogTitle>
					<DialogDescription>Enter the email address of the user you wish to transfer ownership to. This action is irreversible.</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleInitiateTransfer)} className='space-y-4 py-4'>
						<FormField
							control={form.control}
							name='newOwnerEmail'
							render={({field}) => (
								<FormItem>
									<FormLabel>New Owner s Email</FormLabel>
									<FormControl>
										<Input type='email' placeholder='new.owner@example.com' {...field} disabled={isSaving} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='confirmEmail'
							render={({field}) => (
								<FormItem>
									<FormLabel>Confirm New Owner s Email</FormLabel>
									<FormControl>
										<Input type='email' placeholder='confirm.email@example.com' {...field} disabled={isSaving} />
									</FormControl>
									<FormDescription>Please re-enter the email address to confirm.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter className='sm:justify-start'>
							{/* Use AlertDialog for the final confirmation */}
							<AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
								<AlertDialogTrigger asChild>
									<Button type='submit' variant='destructive' disabled={isSaving}>
										Initiate Transfer
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle className='flex items-center'>
											<AlertTriangle className='text-destructive mr-2 h-5 w-5' /> Are you absolutely sure?
										</AlertDialogTitle>
										<AlertDialogDescription>
											This will permanently transfer ownership of the venue to <strong>{transferData?.newOwnerEmail || 'the specified user'}</strong>. You will likely lose owner privileges. This action cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={executeTransfer} disabled={isSaving} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
											{isSaving ? (
												<>
													<Loader2 className='mr-2 h-4 w-4 animate-spin' /> Transferring...
												</>
											) : (
												'Confirm Transfer'
											)}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
							<DialogClose asChild>
								<Button type='button' variant='outline' disabled={isSaving}>
									Close
								</Button>
							</DialogClose>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
