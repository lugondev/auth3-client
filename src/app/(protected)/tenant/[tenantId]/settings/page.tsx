'use client'

import React, {useEffect, useState, FormEvent} from 'react'
import {useParams} from 'next/navigation' // Removed useRouter
import {getTenantById, updateTenant} from '@/services/tenantService'
import {TenantResponse, UpdateTenantRequest} from '@/types/tenant'
import {toast} from 'sonner'
import {useAuth} from '@/contexts/AuthContext'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Checkbox} from '@/components/ui/checkbox'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Skeleton} from '@/components/ui/skeleton'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'

export default function TenantSettingsPage() {
	const params = useParams()
	// const router = useRouter(); // Removed unused router
	const {fetchUserTenants} = useAuth() // To refresh tenant list in sidebar/dashboard if name changes
	const tenantId = params.tenantId as string

	const [tenant, setTenant] = useState<TenantResponse | null>(null)
	const [name, setName] = useState('')
	const [isActive, setIsActive] = useState(true)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!tenantId) {
			setError('Tenant ID is missing.')
			setLoading(false)
			return
		}

		const fetchTenantSettings = async () => {
			setLoading(true)
			setError(null)
			try {
				const tenantData = await getTenantById(tenantId)
				setTenant(tenantData)
				setName(tenantData.name)
				setIsActive(tenantData.is_active)
			} catch (err) {
				console.error(`Failed to fetch settings for tenant ${tenantId}:`, err)
				const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
				setError(errorMessage)
				toast.error(`Failed to load tenant settings: ${errorMessage}`)
			} finally {
				setLoading(false)
			}
		}

		fetchTenantSettings()
	}, [tenantId])

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!tenant) return

		setSaving(true)
		const updateData: UpdateTenantRequest = {}
		if (name !== tenant.name) {
			updateData.name = name
		}
		if (isActive !== tenant.is_active) {
			updateData.is_active = isActive
		}

		if (Object.keys(updateData).length === 0) {
			toast.info('No changes to save.')
			setSaving(false)
			return
		}

		try {
			const updatedTenant = await updateTenant(tenantId, updateData)
			setTenant(updatedTenant) // Update local state with response
			setName(updatedTenant.name)
			setIsActive(updatedTenant.is_active)
			toast.success('Tenant settings updated successfully!')
			await fetchUserTenants() // Refresh global tenant list if name changed
			// Potentially refresh sidebar if tenant name is displayed there directly
		} catch (err) {
			console.error(`Failed to update tenant ${tenantId}:`, err)
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
			toast.error(`Failed to update settings: ${errorMessage}`)
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<Card className='w-full max-w-2xl mx-auto'>
				<CardHeader>
					<Skeleton className='h-8 w-3/5' />
					<Skeleton className='h-4 w-4/5 mt-2' />
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='space-y-2'>
						<Skeleton className='h-4 w-1/4' />
						<Skeleton className='h-10 w-full' />
					</div>
					<div className='space-y-2'>
						<Skeleton className='h-4 w-1/4' />
						<Skeleton className='h-6 w-1/2' />
					</div>
				</CardContent>
				<CardFooter>
					<Skeleton className='h-10 w-24' />
				</CardFooter>
			</Card>
		)
	}

	if (error) {
		return (
			<div className='w-full max-w-2xl mx-auto'>
				<h1 className='text-2xl font-semibold mb-4'>Tenant Settings ({tenantId || 'N/A'})</h1>
				<Alert variant='destructive'>
					<AlertTitle>Error Loading Settings</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		)
	}

	if (!tenant) {
		return (
			<div className='w-full max-w-2xl mx-auto'>
				<h1 className='text-2xl font-semibold mb-4'>Tenant Settings</h1>
				<Alert variant='default'>
					<AlertTitle>Not Found</AlertTitle>
					<AlertDescription>Tenant not found or could not be loaded.</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<Card className='w-full max-w-2xl mx-auto'>
			<CardHeader>
				<CardTitle>Settings for {tenant.name}</CardTitle>
				<CardDescription>Manage your organization&#39;s details and status. Slug: {tenant.slug}</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className='space-y-6'>
					<div className='space-y-2'>
						<Label htmlFor='tenantName'>Organization Name</Label>
						<Input id='tenantName' type='text' placeholder='Enter organization name' value={name} onChange={(e) => setName(e.target.value)} />
					</div>

					<div className='flex items-center space-x-2'>
						<Checkbox id='tenantIsActive' checked={isActive} onCheckedChange={(checked) => setIsActive(checked as boolean)} />
						<Label htmlFor='tenantIsActive' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
							Organization is active
						</Label>
					</div>
				</CardContent>
				<CardFooter className='flex justify-between items-center'>
					<Button type='submit' disabled={saving || loading}>
						{saving ? 'Saving...' : 'Save Settings'}
					</Button>
					<p className='text-xs text-gray-600'>Owner User ID: {tenant.owner_user_id}</p>
				</CardFooter>
			</form>
		</Card>
	)
}
