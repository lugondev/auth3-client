'use client'

import React, {useEffect, useState} from 'react'
import {useParams} from 'next/navigation'
import {getTenantById} from '@/services/tenantService'
import {TenantResponse} from '@/types/tenant'
import {toast} from 'sonner'

export default function TenantDashboardPage() {
	const params = useParams()
	const tenantId = params.tenantId as string
	const [tenant, setTenant] = useState<TenantResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!tenantId) {
			setError('Tenant ID is missing.')
			setLoading(false)
			return
		}

		const fetchTenantData = async () => {
			setLoading(true)
			setError(null)
			try {
				const tenantData = await getTenantById(tenantId)
				setTenant(tenantData)
			} catch (err) {
				console.error(`Failed to fetch tenant data for ${tenantId}:`, err)
				const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
				setError(errorMessage)
				toast.error(`Failed to load tenant dashboard: ${errorMessage}`)
			} finally {
				setLoading(false)
			}
		}

		fetchTenantData()
	}, [tenantId])

	if (loading) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Tenant Dashboard</h1>
				<p>Loading tenant information...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Tenant Dashboard</h1>
				<p className='text-red-500'>Error: {error}</p>
			</div>
		)
	}

	if (!tenant) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Tenant Dashboard</h1>
				<p>Tenant not found or could not be loaded.</p>
			</div>
		)
	}

	return (
		<div>
			<h1 className='text-2xl font-semibold mb-4'>
				Dashboard: {tenant.name} ({tenant.slug})
			</h1>
			<p className='mb-2'>Welcome to the dashboard for your organization.</p>
			<p className='mb-4'>Select an option from the sidebar to manage users, roles, or settings for this organization.</p>

			<div className='bg-white shadow rounded p-4'>
				<h2 className='text-xl font-semibold mb-2'>Organization Details</h2>
				<p>
					<strong>ID:</strong> {tenant.id}
				</p>
				<p>
					<strong>Status:</strong> {tenant.is_active ? 'Active' : 'Inactive'}
				</p>
				<p>
					<strong>Owner User ID:</strong> {tenant.owner_user_id}
				</p>
				<p>
					<strong>Created:</strong> {new Date(tenant.created_at).toLocaleString()}
				</p>
				{/* Add more details as needed */}
			</div>
		</div>
	)
}
