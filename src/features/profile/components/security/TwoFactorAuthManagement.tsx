'use client'

import React, {useState} from 'react'
import Image from 'next/image'
import {UserOutput, Verify2FARequest, Disable2FARequest} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input' // Needed for disable password
import {InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot} from '@/components/ui/input-otp'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose} from '@/components/ui/dialog'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Checkbox} from '@/components/ui/checkbox' // Added Checkbox
import {Copy, AlertCircle, ShieldCheck, ShieldOff, Download} from 'lucide-react' // Added Download icon
import {toast} from 'sonner'
import {generate2FASecret, enable2FA, disable2FA} from '@/services/authService'
import {Label} from '@/components/ui/label'
import {Skeleton} from '@/components/ui/skeleton' // Added Skeleton

interface TwoFactorAuthManagementProps {
	userData: UserOutput | null
	onUpdate: (updatedUser: UserOutput) => void // Callback to refresh user data
}

type SetupStage = 'idle' | 'generating' | 'verifying' | 'showing_codes' | 'disabling' | 'error'

const TwoFactorAuthManagement: React.FC<TwoFactorAuthManagementProps> = ({userData, onUpdate}) => {
	const isEnabled = userData?.is_two_factor_enabled ?? false
	const [stage, setStage] = useState<SetupStage>('idle')
	const [qrCodeUri, setQrCodeUri] = useState<string | null>(null)
	const [secret, setSecret] = useState<string | null>(null)
	const [otp, setOtp] = useState('')
	const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
	const [disablePassword, setDisablePassword] = useState('')
	const [disableOtp, setDisableOtp] = useState('')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isDisablingDialogOpen, setIsDisablingDialogOpen] = useState(false)
	const [hasConfirmedSave, setHasConfirmedSave] = useState(false) // Added state for confirmation

	const handleGenerateSecret = async () => {
		// console.log('handleGenerateSecret called') // Removed previous log
		setStage('generating')
		setErrorMessage(null)
		setOtp('')
		setQrCodeUri(null) // Clear previous QR if regenerating
		setSecret(null)
		try {
			const response = await generate2FASecret()
			// Use qr_code_uri consistent with corrected type and actual API response
			const newQrCodeUri = response.qr_code_uri
			const newSecret = response.secret
			setQrCodeUri(newQrCodeUri)
			setSecret(newSecret)
			setStage('verifying')
			// Removed console log
		} catch (error: unknown) {
			console.error('Error generating 2FA secret:', error)
			const message = error instanceof Error ? error.message : 'Failed to generate 2FA setup code.'
			setErrorMessage(message)
			setStage('error')
			toast.error(`Setup failed: ${message}`)
		}
	}

	const handleVerifyOtp = async () => {
		if (otp.length !== 6) {
			toast.warning('Please enter the 6-digit code from your authenticator app.')
			return
		}
		setStage('verifying') // Keep stage as verifying, maybe add loading state within
		setErrorMessage(null)
		const payload: Verify2FARequest = {code: otp, two_factor_session_token: ''}
		try {
			const response = await enable2FA(payload)
			setRecoveryCodes(response.recovery_codes)
			setStage('showing_codes') // Move to showing recovery codes
			toast.success('2FA enabled successfully! Save your recovery codes.')
			// Refresh user data in parent
			if (onUpdate) {
				// Ideally fetch fresh user data, for now signal update
				onUpdate({...userData!, is_two_factor_enabled: true}) // Assume update locally first
			}
		} catch (error: unknown) {
			console.error('Error enabling 2FA:', error)
			let message = 'Failed to enable 2FA. The code might be incorrect or expired.'
			if (error && typeof error === 'object' && 'response' in error && error.response) {
				const responseError = error.response as {data?: {error?: string} | string}
				if (responseError.data && typeof responseError.data === 'object' && responseError.data.error) {
					message = responseError.data.error
				} else if (typeof responseError.data === 'string') {
					message = responseError.data
				}
			} else if (error instanceof Error) {
				message = error.message
			}
			setErrorMessage(message)
			// Don't reset stage, allow user to retry OTP
			// setStage('error'); // Maybe go back to 'verifying' or show error inline?
			toast.error(`Enable failed: ${message}`)
		} finally {
			// Reset OTP field regardless of success/failure? Optional.
			// setOtp('');
		}
	}

	const handleDisable2FA = async () => {
		setStage('disabling')
		setErrorMessage(null)
		if (!disablePassword && !disableOtp) {
			toast.warning('Please provide your current password or a 2FA code to disable.')
			setStage('idle') // Go back to idle if input is missing
			return
		}

		const payload: Disable2FARequest = {}
		if (disablePassword) payload.password = disablePassword
		if (disableOtp) payload.code = disableOtp

		try {
			await disable2FA(payload)
			toast.success('2FA disabled successfully.')
			setIsDisablingDialogOpen(false) // Close dialog on success
			setStage('idle')
			// Refresh user data in parent
			if (onUpdate) {
				onUpdate({...userData!, is_two_factor_enabled: false}) // Assume update locally first
			}
			// Clear sensitive fields
			setDisablePassword('')
			setDisableOtp('')
		} catch (error: unknown) {
			console.error('Error disabling 2FA:', error)
			let message = 'Failed to disable 2FA. Check your password or code.'
			if (error && typeof error === 'object' && 'response' in error && error.response) {
				const responseError = error.response as {data?: {error?: string} | string}
				if (responseError.data && typeof responseError.data === 'object' && responseError.data.error) {
					message = responseError.data.error
				} else if (typeof responseError.data === 'string') {
					message = responseError.data
				}
			} else if (error instanceof Error) {
				message = error.message
			}
			setErrorMessage(message) // Show error within the dialog
			// setStage('error'); // Keep dialog open, show error
			setStage('idle') // Or reset stage but keep dialog open? Let's keep it open for retry
			toast.error(`Disable failed: ${message}`)
		}
	}

	const handleCopyCode = (code: string) => {
		navigator.clipboard.writeText(code)
		toast.success('Recovery code copied!')
	}

	const handleDownloadCodes = () => {
		if (recoveryCodes.length === 0) return
		const text = recoveryCodes.join('\n')
		const blob = new Blob([text], {type: 'text/plain'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'recovery-codes.txt'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
		toast.info('Recovery codes downloaded.')
	}

	const handleCopySecret = () => {
		if (secret) {
			navigator.clipboard.writeText(secret)
			toast.success('Secret key copied!')
		}
	}

	const resetSetup = () => {
		setStage('idle')
		setQrCodeUri(null)
		setSecret(null)
		setOtp('')
		setRecoveryCodes([])
		setErrorMessage(null)
		setHasConfirmedSave(false) // Reset confirmation on reset
	}

	const isLoading = stage === 'generating' || stage === 'disabling' // Add more states if needed

	// Removed console log

	return (
		<div className='space-y-4 rounded-md border p-4'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-2'>
					{isEnabled ? <ShieldCheck className='h-5 w-5 text-green-600' /> : <ShieldOff className='h-5 w-5 text-muted-foreground' />}
					<span className='font-medium'>Two-Factor Authentication (2FA)</span>
				</div>
				<Badge variant={isEnabled ? 'default' : 'secondary'} className={isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
					{isEnabled ? 'Enabled' : 'Disabled'}
				</Badge>
			</div>

			{/* Content based on stage */}
			{stage === 'idle' && !isEnabled && (
				<>
					<p className='text-sm text-muted-foreground'>Add an extra layer of security to your account using an authenticator app.</p>
					<Button onClick={handleGenerateSecret} disabled={isLoading} size='sm' className='hover:bg-gray-700'>
						{isLoading ? 'Generating...' : 'Enable 2FA'}
					</Button>
				</>
			)}

			{stage === 'generating' && (
				<div className='space-y-4 pt-4 text-center'>
					<Skeleton className='h-40 w-40 mx-auto' />
					<Skeleton className='h-4 w-3/4 mx-auto' />
					<Skeleton className='h-10 w-1/2 mx-auto' />
					<p className='text-sm text-muted-foreground'>Generating setup code...</p>
				</div>
			)}

			{stage === 'verifying' && qrCodeUri && (
				<div className='space-y-4 pt-4'>
					<p className='text-sm font-medium'>1. Scan this QR code with your authenticator app (like Google Authenticator, Authy, etc.):</p>
					<div className='flex justify-center'>
						<Image src={qrCodeUri} alt='2FA QR Code' width={200} height={200} className='border rounded-md' />
					</div>
					<p className='text-sm text-muted-foreground text-center'>
						Or manually enter this setup key:
						<Button variant='link' size='sm' onClick={handleCopySecret} className='ml-1 px-1' title='Copy secret key'>
							<span className='font-mono text-xs break-all'>{secret ? `${secret.substring(0, 6)}...` : '...'}</span> <Copy className='h-3 w-3 ml-1' />
						</Button>
					</p>
					<p className='text-sm font-medium'>2. Enter the 6-digit code generated by your app:</p>
					<div className='flex flex-col items-center space-y-3'>
						<Label htmlFor='otp-2fa-verify' className='sr-only'>
							Verification Code
						</Label>
						<InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)} id='otp-2fa-verify'>
							<InputOTPGroup>
								<InputOTPSlot index={0} />
								<InputOTPSlot index={1} />
								<InputOTPSlot index={2} />
							</InputOTPGroup>
							<InputOTPSeparator />
							<InputOTPGroup>
								<InputOTPSlot index={3} />
								<InputOTPSlot index={4} />
								<InputOTPSlot index={5} />
							</InputOTPGroup>
						</InputOTP>
						{errorMessage && <p className='text-sm text-destructive'>{errorMessage}</p>}
						<div className='flex gap-2'>
							<Button onClick={handleVerifyOtp} disabled={otp.length !== 6 || isLoading} size='sm'>
								{isLoading ? 'Verifying...' : 'Verify & Enable'}
							</Button>
							<Button variant='outline' size='sm' onClick={resetSetup} disabled={isLoading}>
								Cancel
							</Button>
						</div>
					</div>
				</div>
			)}

			{stage === 'showing_codes' && recoveryCodes.length > 0 && (
				<div className='space-y-4 pt-4'>
					{/* Changed variant from 'success' (invalid) to 'default'. Can add custom styling if needed */}
					<Alert variant='default'>
						<ShieldCheck className='h-4 w-4' />
						<AlertTitle>2FA Enabled Successfully!</AlertTitle>
						<AlertDescription>Save these recovery codes in a safe place. They can be used to access your account if you lose access to your authenticator app.</AlertDescription>
					</Alert>
					<div className='grid grid-cols-2 gap-3 p-4 border rounded-md bg-muted/50'>
						{recoveryCodes.map((code) => (
							<div key={code} className='flex items-center justify-between p-2 bg-background rounded'>
								<span className='font-mono text-sm'>{code}</span>
								<Button variant='ghost' size='icon' onClick={() => handleCopyCode(code)} title='Copy code'>
									<Copy className='h-4 w-4' />
								</Button>
							</div>
						))}
					</div>
					<p className='text-xs text-muted-foreground'>Each recovery code can only be used once. Treat them like passwords.</p>
					{/* Confirmation Checkbox */}
					<div className='flex items-center space-x-2 pt-2'>
						<Checkbox id='confirm-save' checked={hasConfirmedSave} onCheckedChange={(checked) => setHasConfirmedSave(Boolean(checked))} />
						<Label htmlFor='confirm-save' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
							I have saved these recovery codes securely.
						</Label>
					</div>
					{/* Action Buttons */}
					<div className='flex items-center gap-2 pt-2'>
						<Button onClick={handleDownloadCodes} size='sm' variant='secondary'>
							<Download className='mr-2 h-4 w-4' /> Download Codes
						</Button>
						<Button onClick={resetSetup} size='sm' variant='outline' disabled={!hasConfirmedSave}>
							Done
						</Button>
					</div>
				</div>
			)}

			{stage === 'error' && errorMessage && (
				<div className='space-y-3 pt-4'>
					<Alert variant='destructive'>
						<AlertCircle className='h-4 w-4' />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
					<Button onClick={resetSetup} size='sm' variant='outline'>
						Back to Settings
					</Button>
					{/* Optionally add retry button */}
					{!isEnabled && (
						<Button onClick={handleGenerateSecret} size='sm' variant='link'>
							Try Again
						</Button>
					)}
				</div>
			)}

			{isEnabled && stage === 'idle' && (
				<div className='pt-2'>
					<p className='text-sm text-muted-foreground mb-3'>Two-Factor Authentication is currently enabled for your account.</p>
					<Dialog open={isDisablingDialogOpen} onOpenChange={setIsDisablingDialogOpen}>
						<DialogTrigger asChild>
							<Button variant='destructive' size='sm'>
								Disable 2FA
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
								<DialogDescription>Disabling 2FA will reduce your account security. Please verify your identity below.</DialogDescription>
							</DialogHeader>
							<div className='space-y-4 py-4'>
								<p className='text-sm text-muted-foreground'>Enter your current password OR a code from your authenticator app.</p>
								<div className='space-y-2'>
									<Label htmlFor='disable-password'>Current Password (Optional)</Label>
									<Input id='disable-password' type='password' value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder='Enter your password' />
								</div>
								<div className='text-center text-sm text-muted-foreground'>OR</div>
								<div className='space-y-2'>
									<Label htmlFor='disable-otp'>Authenticator Code (Optional)</Label>
									<InputOTP maxLength={6} value={disableOtp} onChange={(value) => setDisableOtp(value)} id='disable-otp'>
										<InputOTPGroup>
											<InputOTPSlot index={0} />
											<InputOTPSlot index={1} />
											<InputOTPSlot index={2} />
											<InputOTPSlot index={3} />
											<InputOTPSlot index={4} />
											<InputOTPSlot index={5} />
										</InputOTPGroup>
									</InputOTP>
								</div>
								{errorMessage && stage === 'idle' && <p className='text-sm text-destructive'>{errorMessage}</p>} {/* Show error inside dialog */}
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button
										variant='outline'
										onClick={() => {
											setErrorMessage(null)
											setDisablePassword('')
											setDisableOtp('')
										}}>
										Cancel
									</Button>
								</DialogClose>
								<Button variant='destructive' onClick={handleDisable2FA} disabled={isLoading || (!disablePassword && disableOtp.length !== 6)}>
									{isLoading ? 'Disabling...' : 'Confirm Disable 2FA'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			)}
		</div>
	)
}

export default TwoFactorAuthManagement
