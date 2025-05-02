'use client'

import React from 'react'
import {UserOutput} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {AlertCircle, CheckCircle} from 'lucide-react'
import {toast} from 'sonner'
// import { resendVerificationEmail } from '@/services/authService' // TODO: Uncomment when service function exists

interface EmailVerificationStatusProps {
	userData: UserOutput | null
	// onUpdate: (updatedUser: UserOutput) => void; // May not be needed if status updates via full user refresh
}

const EmailVerificationStatus: React.FC<EmailVerificationStatusProps> = ({userData}) => {
	const isVerified = !!userData?.email_verified_at
	const [isResending, setIsResending] = React.useState(false)

	const handleResendVerification = async () => {
		setIsResending(true)
		try {
			// await resendVerificationEmail(); // TODO: Call the actual service function
			toast.info('Verification email resend request sent (placeholder).') // Placeholder message
			// Optionally: Add logic to prevent rapid resends
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
			<p className='text-sm text-muted-foreground'>{isVerified ? `Your email address (${userData?.email}) is verified.` : `Your email address (${userData?.email}) is not verified. Please check your inbox for the verification link.`}</p>
			{!isVerified && (
				<Button onClick={handleResendVerification} disabled={isResending} size='sm' variant='outline'>
					{isResending ? 'Sending...' : 'Resend Verification Email'}
				</Button>
			)}
			{/* TODO: Add a note if the resend function isn't implemented yet */}
			<p className='text-xs text-muted-foreground pt-2'>(Note: Resend functionality is currently a placeholder.)</p>
		</div>
	)
}

export default EmailVerificationStatus
