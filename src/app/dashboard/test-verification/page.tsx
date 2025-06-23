'use client'

import React from 'react'
import {VerificationInterface} from '@/components/verification/VerificationInterface'
import {EnhancedVerificationResponse} from '@/types/presentations'

export default function VerificationTestPage() {
	const handleVerificationComplete = (result: EnhancedVerificationResponse) => {
		console.log('Verification completed:', result)
	}

	return (
		<div className='container mx-auto py-8'>
			<h1 className='text-3xl font-bold mb-8'>Verification History Test</h1>
			<VerificationInterface onVerificationComplete={handleVerificationComplete} />
		</div>
	)
}
