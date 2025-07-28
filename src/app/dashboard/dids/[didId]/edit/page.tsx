'use client'

import React from 'react'
import {useParams, useRouter} from 'next/navigation'
import {PageHeader} from '@/components/layout/PageHeader'
import {DIDEdit} from '@/components/did/DIDEdit'
import type {DIDResponse} from '@/types/did'

/**
 * DID Edit Page - Dedicated page for editing DID information
 * Provides a focused environment for DID editing
 */
export default function DIDEditPage() {
	const params = useParams()
	const router = useRouter()
	const didId = decodeURIComponent(params.didId as string)

	/**
	 * Handle successful DID update
	 */
	const handleSave = (updatedDID: DIDResponse) => {
		// Navigate back to DID details page
		router.push(`/dashboard/dids/${encodeURIComponent(didId)}`)
	}

	/**
	 * Handle cancel action
	 */
	const handleCancel = () => {
		// Navigate back to DID details page
		router.push(`/dashboard/dids/${encodeURIComponent(didId)}`)
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Edit DID'
				description='Update your DID information'
				backButton={{
					href: `/dashboard/dids/${encodeURIComponent(didId)}`,
					text: 'Back to DID Details',
				}}
			/>

			<DIDEdit didId={didId} onSave={handleSave} onCancel={handleCancel} />
		</div>
	)
}
