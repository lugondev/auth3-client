'use client'

import React, {useEffect, useState} from 'react'
import {useSearchParams} from 'next/navigation'
import OAuth2ClientListComponent from './OAuth2ClientListComponent'
import {Alert, AlertDescription} from '@/components/ui/alert'

/**
 * Container component for OAuth2 client list page
 * Handles URL parameters and displays success messages
 */
const OAuth2ClientList: React.FC = () => {
	const searchParams = useSearchParams()
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	useEffect(() => {
		// Check for success message in URL parameters
		const success = searchParams.get('success')
		if (success) {
			setSuccessMessage(success)
			// Auto-clear message after 5 seconds
			const timer = setTimeout(() => setSuccessMessage(null), 5000)
			return () => clearTimeout(timer)
		}
	}, [searchParams])

	return (
		<div className='space-y-4'>
			{successMessage && (
				<Alert>
					<AlertDescription>{successMessage}</AlertDescription>
				</Alert>
			)}
			<OAuth2ClientListComponent />
		</div>
	)
}

export default OAuth2ClientList
