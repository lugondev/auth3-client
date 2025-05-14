'use client'

import React, {useState} from 'react'
import {useForm, SubmitHandler} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter} from '@/components/ui/card'
import {Loader2, UserCheck, AlertCircle} from 'lucide-react'
import {checkEmailExists, transferTenantOwnership} from '@/services/tenantService' // Assuming these are correctly imported

const transferOwnershipFormSchema = z.object({
	email: z.string().email('Invalid email address'),
})
type TransferOwnershipFormData = z.infer<typeof transferOwnershipFormSchema>

interface TransferTenantOwnershipSectionProps {
	tenantId: string
	currentTenantName: string // To display in messages
	onOwnershipTransferred?: () => void
}

export function TransferTenantOwnershipSection({tenantId, currentTenantName, onOwnershipTransferred}: TransferTenantOwnershipSectionProps) {
	const queryClient = useQueryClient()
	const [transferEmailCheckResult, setTransferEmailCheckResult] = useState<{emailToTransfer?: string; message: string; isError: boolean} | null>(null)

	const {
		register: registerTransfer,
		handleSubmit: handleSubmitTransfer,
		formState: {errors: errorsTransfer, isSubmitting: isSubmittingTransferForm},
		reset: resetTransferForm,
	} = useForm<TransferOwnershipFormData>({
		resolver: zodResolver(transferOwnershipFormSchema),
	})

	const checkEmailMutation = useMutation({
		mutationFn: async (email: string) => {
			setTransferEmailCheckResult(null)
			// Assuming checkEmailExists returns { exists: boolean, email?: string }
			// The original page used the 'email' from response as the identifier for transfer
			return checkEmailExists(email)
		},
		onSuccess: (data) => {
			if (data.exists && data.email) {
				setTransferEmailCheckResult({emailToTransfer: data.email, message: `User found. Ready to transfer.`, isError: false})
			} else {
				setTransferEmailCheckResult({message: 'User with this email does not exist or cannot be an owner.', isError: true})
			}
		},
		onError: (error: Error) => {
			setTransferEmailCheckResult({message: `Error checking email: ${error.message}`, isError: true})
		},
	})

	const transferOwnershipMutation = useMutation({
		mutationFn: (newOwnerUserId: string) => transferTenantOwnership(tenantId, newOwnerUserId),
		onSuccess: () => {
			console.log(`Ownership of tenant "${currentTenantName}" has been transferred successfully.`)
			queryClient.invalidateQueries({queryKey: ['tenantDetails', tenantId]})
			queryClient.invalidateQueries({queryKey: ['allTenantsForAdmin']}) // If this component is used in admin context
			queryClient.invalidateQueries({queryKey: ['ownedTenants']}) // If this component is used by tenant owner
			setTransferEmailCheckResult({message: 'Ownership transferred successfully!', isError: false})
			resetTransferForm()
			if (onOwnershipTransferred) {
				onOwnershipTransferred()
			}
		},
		onError: (error: Error) => {
			console.error('Error Transferring Ownership:', error.message)
			setTransferEmailCheckResult({message: `Error transferring ownership: ${error.message}`, isError: true})
		},
	})

	const onCheckEmailSubmit: SubmitHandler<TransferOwnershipFormData> = async (data) => {
		checkEmailMutation.mutate(data.email)
	}

	const handleTransferOwnership = () => {
		if (transferEmailCheckResult && transferEmailCheckResult.emailToTransfer && !transferEmailCheckResult.isError) {
			transferOwnershipMutation.mutate(transferEmailCheckResult.emailToTransfer)
		} else {
			setTransferEmailCheckResult({message: 'Cannot transfer ownership without a valid user.', isError: true})
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Transfer Tenant Ownership</CardTitle>
				<CardDescription>Transfer ownership of this tenant to another user by their email address. The user must already exist in the system.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmitTransfer(onCheckEmailSubmit)} className='space-y-4'>
					<div>
						<Label htmlFor='transferEmail'>New Owner&#39;s Email</Label>
						<Input id='transferEmail' type='email' {...registerTransfer('email')} className='mt-1' placeholder="new owner's email" />
						{errorsTransfer.email && <p className='text-sm text-red-500 mt-1'>{errorsTransfer.email.message}</p>}
					</div>
					<Button type='submit' disabled={checkEmailMutation.isPending || isSubmittingTransferForm}>
						{checkEmailMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						Check Email
					</Button>
				</form>

				{transferEmailCheckResult && (
					<div className={`mt-4 p-3 rounded-md flex items-center ${transferEmailCheckResult.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
						{transferEmailCheckResult.isError ? <AlertCircle className='mr-2 h-5 w-5' /> : <UserCheck className='mr-2 h-5 w-5' />}
						<p>{transferEmailCheckResult.message}</p>
					</div>
				)}
			</CardContent>
			{transferEmailCheckResult && !transferEmailCheckResult.isError && transferEmailCheckResult.emailToTransfer && (
				<CardFooter className='border-t pt-6'>
					<Button variant='destructive' onClick={handleTransferOwnership} disabled={transferOwnershipMutation.isPending || !transferEmailCheckResult?.emailToTransfer}>
						{transferOwnershipMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						Confirm Transfer Ownership to User
					</Button>
				</CardFooter>
			)}
		</Card>
	)
}
