'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Checkbox} from '@/components/ui/checkbox'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {AlertTriangle, XCircle, Clock, ArrowLeft, Eye, EyeOff} from 'lucide-react'
import {DIDStatus} from '@/types/did'
import {DIDStatusBadge} from './DIDStatusBadge'
import {toast} from 'sonner'
import * as didService from '@/services/didService'
import {useAuth} from '@/contexts/AuthContext'

interface DIDDeactivateProps {
	didId: string
	currentStatus: DIDStatus
	onSuccess?: (didId: string) => void
	onCancel?: () => void
	className?: string
}

interface DeactivationForm {
	reason: string
	description: string
	privateKey: string
	confirmDeletion: boolean
	permanentDeactivation: boolean
	notifyServices: boolean
}

interface DeactivationOption {
	id: 'temporary' | 'permanent' | 'revoke'
	title: string
	description: string
	icon: React.ReactNode
	severity: 'warning' | 'destructive'
	reversible: boolean
}

/**
 * DIDDeactivate component provides options for deactivating or revoking a DID
 * with different levels of permanence and security considerations
 */
export function DIDDeactivate({didId, currentStatus, onSuccess, onCancel, className}: DIDDeactivateProps) {
	const {user} = useAuth()
	const [selectedOption, setSelectedOption] = useState<DeactivationOption['id'] | null>(null)
	const [form, setForm] = useState<DeactivationForm>({
		reason: '',
		description: '',
		privateKey: '',
		confirmDeletion: false,
		permanentDeactivation: false,
		notifyServices: false,
	})
	const [loading, setLoading] = useState(false)
	const [showPrivateKey, setShowPrivateKey] = useState(false)
	const [showConfirmDialog, setShowConfirmDialog] = useState(false)
	const [step, setStep] = useState<'options' | 'details' | 'confirm'>('options')

	const deactivationOptions: DeactivationOption[] = [
		{
			id: 'temporary',
			title: 'Temporary Deactivation',
			description: 'Temporarily disable the DID. Can be reactivated later with the private key.',
			icon: <Clock className='h-6 w-6' />,
			severity: 'warning',
			reversible: true,
		},
		{
			id: 'permanent',
			title: 'Permanent Deactivation',
			description: 'Permanently deactivate the DID. This action cannot be undone.',
			icon: <XCircle className='h-6 w-6' />,
			severity: 'destructive',
			reversible: false,
		},
		{
			id: 'revoke',
			title: 'Revoke DID',
			description: 'Mark the DID as compromised or invalid. This is the strongest form of deactivation.',
			icon: <AlertTriangle className='h-6 w-6' />,
			severity: 'destructive',
			reversible: false,
		},
	]

	/**
	 * Handle option selection and move to details step
	 */
	const handleOptionSelect = (optionId: DeactivationOption['id']) => {
		setSelectedOption(optionId)
		setStep('details')
	}

	/**
	 * Validate the deactivation form
	 */
	const validateForm = (): boolean => {
		if (!selectedOption) {
			toast.error('Please select a deactivation option')
			return false
		}

		if (!form.reason.trim()) {
			toast.error('Please provide a reason for deactivation')
			return false
		}

		if (!form.privateKey.trim()) {
			toast.error('Private key is required to authorize deactivation')
			return false
		}

		if (selectedOption === 'permanent' && !form.permanentDeactivation) {
			toast.error('Please confirm permanent deactivation')
			return false
		}

		if (selectedOption === 'revoke' && !form.confirmDeletion) {
			toast.error('Please confirm DID revocation')
			return false
		}

		return true
	}

	/**
	 * Handle form submission
	 */
	const handleSubmit = () => {
		if (!validateForm()) return
		setShowConfirmDialog(true)
	}

	/**
	 * Execute the deactivation
	 */
	const executeDeactivation = async () => {
		try {
			setLoading(true)
			setShowConfirmDialog(false)

			if (selectedOption === 'revoke') {
				// Use revokeDID for permanent revocation
				await didService.revokeDID({
					id: didId,
					did: didId,
					user_id: user?.id || '',
					reason: form.reason,
				})
			} else {
				// Use deactivateDID for temporary/permanent deactivation
				await didService.deactivateDID({
					id: didId,
					did: didId,
					user_id: user?.id || '',
					reason: form.reason,
				})
			}

			toast.success(`DID ${selectedOption} completed successfully`)
			onSuccess?.(didId)
		} catch (error) {
			console.error('Error deactivating DID:', error)
			toast.error(`Failed to ${selectedOption} DID`)
		} finally {
			setLoading(false)
		}
	}

	/**
	 * Get the selected option details
	 */
	const getSelectedOption = () => {
		return deactivationOptions.find((option) => option.id === selectedOption)
	}

	/**
	 * Check if DID can be deactivated
	 */
	const canDeactivate = currentStatus === 'active'

	if (!canDeactivate) {
		return (
			<div className={className}>
				<Alert>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>This DID is already {currentStatus} and cannot be deactivated.</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<div className={className}>
			{/* Header */}
			<div className='mb-6'>
				<div className='flex items-center gap-4 mb-4'>
					{onCancel && step !== 'options' && (
						<Button
							variant='ghost'
							size='sm'
							onClick={() => {
								if (step === 'details') setStep('options')
								else if (step === 'confirm') setStep('details')
							}}>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back
						</Button>
					)}
					<div>
						<h2 className='text-2xl font-bold text-red-600'>Deactivate DID</h2>
						<p className='text-muted-foreground'>Choose how to deactivate your DID</p>
					</div>
				</div>

				{/* Current DID Info */}
				<Card className='bg-gray-50'>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-muted-foreground'>DID to deactivate:</p>
								<code className='text-sm font-mono'>{didId}</code>
							</div>
							<div className='flex items-center gap-2'>
								<span className='text-sm text-muted-foreground'>Current Status:</span>
								<DIDStatusBadge status={currentStatus} />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Step 1: Options Selection */}
			{step === 'options' && (
				<div className='space-y-4'>
					<h3 className='text-lg font-semibold mb-4'>Select Deactivation Type</h3>

					{deactivationOptions.map((option) => (
						<Card key={option.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedOption === option.id ? 'ring-2 ring-blue-500' : ''} ${option.severity === 'destructive' ? 'border-red-200' : 'border-orange-200'}`} onClick={() => handleOptionSelect(option.id)}>
							<CardContent className='p-6'>
								<div className='flex items-start gap-4'>
									<div className={`p-3 rounded-lg ${option.severity === 'destructive' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{option.icon}</div>
									<div className='flex-1'>
										<div className='flex items-center gap-3 mb-2'>
											<h4 className='font-semibold'>{option.title}</h4>
											{option.reversible ? <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>Reversible</span> : <span className='text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full'>Irreversible</span>}
										</div>
										<p className='text-muted-foreground text-sm'>{option.description}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{onCancel && (
						<div className='flex justify-end pt-4'>
							<Button variant='outline' onClick={onCancel}>
								Cancel
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Step 2: Details Form */}
			{step === 'details' && selectedOption && (
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								{getSelectedOption()?.icon}
								{getSelectedOption()?.title}
							</CardTitle>
							<CardDescription>{getSelectedOption()?.description}</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Reason */}
							<div className='space-y-2'>
								<Label htmlFor='reason'>Reason for Deactivation *</Label>
								<select id='reason' className='w-full p-2 border rounded-md' value={form.reason} onChange={(e) => setForm((prev) => ({...prev, reason: e.target.value}))}>
									<option value=''>Select a reason...</option>
									<option value='security_compromise'>Security Compromise</option>
									<option value='key_loss'>Private Key Lost</option>
									<option value='no_longer_needed'>No Longer Needed</option>
									<option value='migration'>Migrating to New DID</option>
									<option value='regulatory_compliance'>Regulatory Compliance</option>
									<option value='other'>Other</option>
								</select>
							</div>

							{/* Description */}
							<div className='space-y-2'>
								<Label htmlFor='description'>Additional Details (Optional)</Label>
								<Textarea id='description' placeholder='Provide additional context for this deactivation...' value={form.description} onChange={(e) => setForm((prev) => ({...prev, description: e.target.value}))} rows={3} />
							</div>

							{/* Private Key */}
							<div className='space-y-2'>
								<Label htmlFor='privateKey'>Private Key *</Label>
								<div className='flex items-center gap-2'>
									<Input id='privateKey' type={showPrivateKey ? 'text' : 'password'} placeholder='Enter your private key to authorize deactivation' value={form.privateKey} onChange={(e) => setForm((prev) => ({...prev, privateKey: e.target.value}))} />
									<Button type='button' variant='outline' size='sm' onClick={() => setShowPrivateKey(!showPrivateKey)}>
										{showPrivateKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
									</Button>
								</div>
								<p className='text-xs text-muted-foreground'>Your private key is required to cryptographically sign the deactivation request.</p>
							</div>

							{/* Options */}
							<div className='space-y-3'>
								<div className='flex items-center space-x-2'>
									<Checkbox id='notifyServices' checked={form.notifyServices} onCheckedChange={(checked) => setForm((prev) => ({...prev, notifyServices: checked as boolean}))} />
									<Label htmlFor='notifyServices' className='text-sm'>
										Notify connected services about deactivation
									</Label>
								</div>

								{selectedOption === 'permanent' && (
									<div className='flex items-center space-x-2'>
										<Checkbox id='permanentDeactivation' checked={form.permanentDeactivation} onCheckedChange={(checked) => setForm((prev) => ({...prev, permanentDeactivation: checked as boolean}))} />
										<Label htmlFor='permanentDeactivation' className='text-sm text-red-600'>
											I understand this action is permanent and cannot be undone
										</Label>
									</div>
								)}

								{selectedOption === 'revoke' && (
									<div className='flex items-center space-x-2'>
										<Checkbox id='confirmDeletion' checked={form.confirmDeletion} onCheckedChange={(checked) => setForm((prev) => ({...prev, confirmDeletion: checked as boolean}))} />
										<Label htmlFor='confirmDeletion' className='text-sm text-red-600'>
											I confirm that I want to revoke this DID and mark it as compromised
										</Label>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Warning Alert */}
					<Alert className={selectedOption === 'temporary' ? 'border-orange-200' : 'border-red-200'}>
						<AlertTriangle className='h-4 w-4' />
						<AlertDescription>
							<strong>Warning:</strong> {selectedOption === 'temporary' ? 'Temporarily deactivating your DID will make it unresolvable until reactivated. Connected services may stop working.' : 'This action is permanent and cannot be undone. Your DID will be permanently deactivated and cannot be used for any future operations.'}
						</AlertDescription>
					</Alert>

					<div className='flex justify-between'>
						<Button variant='outline' onClick={() => setStep('options')}>
							Back
						</Button>
						<Button onClick={handleSubmit} variant={selectedOption === 'temporary' ? 'default' : 'destructive'}>
							Continue to Confirmation
						</Button>
					</div>
				</div>
			)}

			{/* Confirmation Dialog */}
			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2 text-red-600'>
							<AlertTriangle className='h-5 w-5' />
							Confirm {getSelectedOption()?.title}
						</DialogTitle>
						<DialogDescription>This action will {selectedOption} your DID. Please review the details below.</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<div className='bg-gray-50 p-4 rounded-lg space-y-2'>
							<div className='flex justify-between'>
								<span className='text-sm font-medium'>DID:</span>
								<code className='text-xs'>{didId}</code>
							</div>
							<div className='flex justify-between'>
								<span className='text-sm font-medium'>Action:</span>
								<span className='text-sm'>{getSelectedOption()?.title}</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-sm font-medium'>Reason:</span>
								<span className='text-sm'>{form.reason.replace('_', ' ')}</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-sm font-medium'>Reversible:</span>
								<span className={`text-sm ${getSelectedOption()?.reversible ? 'text-green-600' : 'text-red-600'}`}>{getSelectedOption()?.reversible ? 'Yes' : 'No'}</span>
							</div>
						</div>

						{!getSelectedOption()?.reversible && (
							<Alert className='border-red-200'>
								<AlertTriangle className='h-4 w-4' />
								<AlertDescription className='text-red-600'>This action is permanent and cannot be undone.</AlertDescription>
							</Alert>
						)}
					</div>

					<DialogFooter>
						<Button variant='outline' onClick={() => setShowConfirmDialog(false)} disabled={loading}>
							Cancel
						</Button>
						<Button onClick={executeDeactivation} variant={selectedOption === 'temporary' ? 'default' : 'destructive'} disabled={loading}>
							{loading ? 'Processing...' : `Confirm ${getSelectedOption()?.title}`}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
