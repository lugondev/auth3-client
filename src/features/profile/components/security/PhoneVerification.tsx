'use client'

import React, {useState} from 'react'
import {UserOutput, VerifyPhoneInput} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot} from '@/components/ui/input-otp'
import {AlertCircle, CheckCircle} from 'lucide-react'
import {toast} from 'sonner'
import {requestPhoneVerification, verifyPhone} from '@/services/authService'
import {Label} from '@/components/ui/label' // Added Label import

interface PhoneVerificationProps {
	userData: UserOutput | null
	onUpdate: (updatedUser: UserOutput) => void // Callback to refresh user data
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({userData, onUpdate}) => {
	const hasPhoneNumber = !!userData?.phone
	// Check for the timestamp field
	const isVerified = !!userData?.is_phone_verified
	const verifiedAt = userData?.phone_verified_at ? new Date(userData.phone_verified_at) : null
	const [isRequestingOtp, setIsRequestingOtp] = useState(false)
	const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
	const [otpRequested, setOtpRequested] = useState(false)
	const [otp, setOtp] = useState('')

	const handleRequestOtp = async () => {
		if (!hasPhoneNumber) {
			toast.error('Please add a phone number in the General Info tab first.')
			return
		}
		setIsRequestingOtp(true)
		setOtpRequested(false) // Reset in case of retry
		try {
			await requestPhoneVerification()
			toast.success('OTP sent to your phone number.')
			setOtpRequested(true) // Show OTP input field
		} catch (error: unknown) {
			console.error('Error requesting phone verification OTP:', error)
			const message = error instanceof Error ? error.message : 'Failed to send OTP.'
			toast.error(`Request failed: ${message}`)
		} finally {
			setIsRequestingOtp(false)
		}
	}

	const handleVerifyOtp = async () => {
		if (otp.length !== 6) {
			// Assuming a 6-digit OTP
			toast.warning('Please enter the 6-digit OTP.')
			return
		}
		setIsVerifyingOtp(true)
		const payload: VerifyPhoneInput = {otp}
		try {
			await verifyPhone(payload)
			toast.success('Phone number verified successfully!')
			// Trigger a refresh of user data in the parent component
			// We need a way to fetch the updated user data, getCurrentUser might be suitable
			// For now, we assume onUpdate handles this refresh logic based on its implementation
			// onUpdate(updatedUserData); // This needs the actual updated user data
			// Let's signal a refresh is needed - parent should refetch.
			if (onUpdate) {
				// A simple way is to pass back the current user, assuming parent refetches
				// Or ideally, modify onUpdate or add another callback
				onUpdate(userData!) // Pass current user, parent useEffect dependency should trigger refetch
			}
			setOtp('')
			setOtpRequested(false) // Hide OTP input after success
		} catch (error: unknown) {
			console.error('Error verifying phone OTP:', error)
			let message = 'Failed to verify OTP.'
			// Check if the error response has a specific message
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
			toast.error(`Verification failed: ${message}`)
		} finally {
			setIsVerifyingOtp(false)
		}
	}

	return (
		<div className='space-y-3 rounded-md border p-4'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-2'>
					{isVerified ? <CheckCircle className='h-5 w-5 text-green-600' /> : <AlertCircle className='h-5 w-5 text-yellow-600' />}
					<span className='font-medium'>Phone Verification</span>
				</div>
				{hasPhoneNumber && (
					<Badge variant={isVerified ? 'default' : 'secondary'} className={isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
						{isVerified ? 'Verified' : 'Not Verified'}
					</Badge>
				)}
			</div>

			{hasPhoneNumber ? (
				<>
					{isVerified && verifiedAt ? (
						<p className='text-sm text-muted-foreground'>
							Your phone number ({userData?.phone}) was verified on {new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'}).format(verifiedAt)}. {/* Format: January 1, 2023, 12:00 PM */}
						</p>
					) : (
						<p className='text-sm text-muted-foreground'>Your phone number ({userData?.phone}) is not verified.</p>
					)}
					{!isVerified && !otpRequested && (
						<Button onClick={handleRequestOtp} disabled={isRequestingOtp} size='sm' variant='outline'>
							{isRequestingOtp ? 'Sending OTP...' : 'Verify Phone Number'}
						</Button>
					)}
					{otpRequested && !isVerified && (
						<div className='space-y-3 pt-2'>
							<Label htmlFor='otp-input'>Enter OTP Code</Label>
							<InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)} id='otp-input'>
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
							<Button onClick={handleVerifyOtp} disabled={isVerifyingOtp || otp.length !== 6} size='sm'>
								{isVerifyingOtp ? 'Verifying...' : 'Submit OTP'}
							</Button>
							<Button variant='link' size='sm' onClick={() => setOtpRequested(false)} className='pl-2'>
								Cancel
							</Button>
						</div>
					)}
				</>
			) : (
				<p className='text-sm text-muted-foreground'>
					Please add a phone number in the <span className='font-medium'>General Info</span> tab to enable phone verification.
				</p>
			)}
		</div>
	)
}

export default PhoneVerification
