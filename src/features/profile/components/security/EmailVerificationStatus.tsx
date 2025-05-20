'use client'

import React from 'react'
import {UserOutput} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {AlertCircle, CheckCircle} from 'lucide-react'
import {toast} from 'sonner'
import {resendVerificationEmail} from '@/services/authService' // TODO: Uncomment when service function exists

interface EmailVerificationStatusProps {
	userData: UserOutput | null
}

const EmailVerificationStatus: React.FC<EmailVerificationStatusProps> = ({userData}) => {
	// Check for the timestamp field
	const isVerified = !!userData?.is_email_verified
	const verifiedAt = userData?.email_verified_at ? new Date(userData.email_verified_at) : null
	const [isResending, setIsResending] = React.useState(false)

	const handleResendVerification = async () => {
		setIsResending(true)
		try {
			await resendVerificationEmail()
			toast.info('Verification email resent. Please check your inbox.')
		} catch (error: unknown) {
			console.error('Error resending verification email:', error)
			const message = error instanceof Error ? error.message : 'Failed to resend verification email.'
			toast.error(`Resend failed: ${message}`)
		} finally {
			setIsResending(false)
		}
	}

	return (
		<div className='space-y-3 rounded-md border p-4'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-2'>
					{isVerified ? <CheckCircle className='h-5 w-5 text-green-600' /> : <AlertCircle className='h-5 w-5 text-yellow-600' />}
					<span className='font-medium'>Email Verification</span>
				</div>
				<Badge variant={isVerified ? 'default' : 'secondary'} className={isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
					{isVerified ? 'Verified' : 'Not Verified'}
				</Badge>
			</div>
			{isVerified && verifiedAt ? (
				<p className='text-sm text-muted-foreground'>
					Your email address ({userData?.email}) was verified on {new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'}).format(verifiedAt)}. {/* Format: January 1, 2023, 12:00 PM */}
				</p>
			) : (
				<p className='text-sm text-muted-foreground'>Your email address ({userData?.email}) is not verified. Please check your inbox for the verification link.</p>
			)}
			{!isVerified && (
				<Button onClick={handleResendVerification} disabled={isResending} size='sm' variant='outline'>
					{isResending ? 'Sending...' : 'Resend Verification Email'}
				</Button>
			)}
		</div>
	)
}

export default EmailVerificationStatus
