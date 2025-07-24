// Tenant Access Guard
// Protects tenant routes by validating tokens and triggering re-authentication when needed

'use client'

import React, {useEffect, useState} from 'react'
import {useRouter, useParams} from 'next/navigation'
import {validateTenantTokens} from '@/lib/multi-tenant-token-manager'
import {getCurrentContextMode} from '@/lib/context-manager'
import {loginTenantContext} from '@/services/authService'
import {useAuth} from '@/contexts/AuthContext'
import {Loader2, AlertCircle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {toast} from 'sonner'

interface TenantGuardProps {
	children: React.ReactNode
	tenantId?: string // Can be passed as prop or extracted from URL
	requiredPermissions?: string[] // Optional permissions check
	fallbackPath?: string // Where to redirect if access denied
}

interface GuardState {
	status: 'loading' | 'validating' | 'authenticated' | 'needs_login' | 'access_denied' | 'error'
	error?: string
	isRefreshing?: boolean
}

export const TenantGuard: React.FC<TenantGuardProps> = ({children, tenantId: propTenantId, requiredPermissions = [], fallbackPath = '/dashboard/tenant-management'}) => {
	const router = useRouter()
	const params = useParams()
	const {user, isAuthenticated, switchToTenant} = useAuth()
	const [guardState, setGuardState] = useState<GuardState>({status: 'loading'})

	// Request deduplication to prevent multiple login-tenant calls
	const [activeRequests, setActiveRequests] = useState<Set<string>>(new Set())

	const withRequestDeduplication = async (key: string, fn: () => Promise<void>) => {
		if (activeRequests.has(key)) {
			console.log(`🔄 Request ${key} already in progress, skipping...`)
			return
		}

		setActiveRequests((prev) => new Set(prev).add(key))

		try {
			return await fn()
		} finally {
			setActiveRequests((prev) => {
				const newSet = new Set(prev)
				newSet.delete(key)
				return newSet
			})
		}
	}

	// Extract tenant ID from props or URL params
	const tenantId = propTenantId || (params?.tenantId as string) || (params?.id as string)

	useEffect(() => {
		if (!isAuthenticated || !user || !tenantId) {
			setGuardState({status: 'access_denied', error: 'Authentication required'})
			return
		}

		// Skip validation if we're already authenticated in this tenant space
		// This prevents validation errors when navigating between pages in tenant space
		const currentMode = getCurrentContextMode?.() || 'global'
		if (currentMode === 'tenant' && user?.tenant_id === tenantId && guardState.status === 'authenticated') {
			console.log(`🔄 Skipping validation - already authenticated in tenant ${tenantId}`)
			return
		}

		withRequestDeduplication(`validate-${tenantId}`, validateTenantAccess)
	}, [isAuthenticated, user, tenantId])

	const validateTenantAccess = async () => {
		if (!tenantId) {
			setGuardState({status: 'access_denied', error: 'Tenant ID is required'})
			return
		}

		console.log('🔍 TenantGuard validation debug:', {
			tenantId,
			userTenantId: user?.tenant_id,
			currentMode: getCurrentContextMode(),
			guardStatus: guardState.status,
		})

		setGuardState({status: 'validating'})

		try {
			// First check if we're already in the right tenant context
			if (user?.tenant_id === tenantId) {
				console.log(`✅ Already in tenant ${tenantId} context`)
				setGuardState({status: 'authenticated'})
				return
			}

			// Check if we have valid tokens for this tenant
			const tokenValidation = validateTenantTokens(tenantId)

			console.log(`🔍 Token validation result for ${tenantId}:`, tokenValidation)

			if (tokenValidation.isValid) {
				console.log(`✅ Valid tokens found for tenant ${tenantId}`)

				// Switch to tenant context if not already
				await switchToTenant(tenantId)

				setGuardState({status: 'authenticated'})
				return
			}

			console.log(`⚠️ Invalid/expired tokens for tenant ${tenantId}:`, tokenValidation)

			// Try to refresh or re-authenticate
			if (!tokenValidation.isExpired) {
				// Token exists but invalid (maybe wrong tenant)
				setGuardState({status: 'needs_login', error: 'Invalid tenant access token'})
			} else {
				// Token expired, try refresh
				await attemptTokenRefresh()
			}
		} catch (error) {
			console.error('Tenant access validation error:', error)

			// Better error handling for different types of errors
			let errorMessage = 'Unknown error'
			if (error instanceof Error) {
				if (error.message.includes('Context switch validation failed')) {
					errorMessage = 'Unable to validate tenant access. Please try logging in again.'
				} else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
					errorMessage = 'Network error. Please check your connection and try again.'
				} else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
					errorMessage = 'Authentication expired. Please log in again.'
				} else if (error.message.includes('403') || error.message.includes('Forbidden')) {
					errorMessage = 'You do not have permission to access this tenant.'
				} else {
					errorMessage = error.message
				}
			}

			setGuardState({
				status: 'error',
				error: errorMessage,
			})
		}
	}

	const attemptTokenRefresh = async () => {
		return withRequestDeduplication(`refresh-${tenantId}`, async () => {
			try {
				console.log(`🔄 Attempting to refresh tokens for tenant ${tenantId}`)

				// Always skip validation when refreshing tokens because:
				// 1. We're trying to create/refresh the tenant context
				// 2. Validation expects tenant context to already exist
				// 3. This creates a chicken-and-egg problem
				const result = await loginTenantContext(tenantId, true, false)

				if (result.success) {
					console.log(`✅ Successfully refreshed tokens for tenant ${tenantId}`)
					setGuardState({status: 'authenticated'})
				} else {
					console.log(`❌ Failed to refresh tokens for tenant ${tenantId}:`, result.error)
					setGuardState({status: 'needs_login', error: result.error || 'Token refresh failed'})
				}
			} catch (error) {
				console.error('Token refresh error:', error)
				setGuardState({status: 'needs_login', error: 'Token refresh failed'})
			}
		})
	}

	const handleLoginToTenant = async () => {
		if (!tenantId) return

		return withRequestDeduplication(`login-${tenantId}`, async () => {
			setGuardState({status: 'validating', isRefreshing: true})

			try {
				console.log(`🔐 Logging into tenant ${tenantId}...`)

				// Use switchToTenant which internally calls loginTenantContext
				// Set preserveGlobalContext to false to avoid validation conflicts
				const result = await switchToTenant(tenantId, {preserveGlobalContext: false})

				if (result.success) {
					console.log(`✅ Successfully switched to tenant ${tenantId}`)
					toast.success(`Successfully logged into tenant ${tenantId}`)
					setGuardState({status: 'authenticated'})
				} else {
					console.error(`❌ Switch failed for tenant ${tenantId}:`, result.error)
					toast.error(`Switch failed: ${result.error || 'Unknown error'}`)
					setGuardState({
						status: 'needs_login',
						error: result.error || 'Switch failed',
					})
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error'
				console.error('Login error:', error)
				toast.error(`Login error: ${errorMessage}`)
				setGuardState({
					status: 'needs_login',
					error: errorMessage,
				})
			} finally {
				setGuardState((prev) => ({...prev, isRefreshing: false}))
			}
		})
	}

	const handleGoBack = () => {
		router.push(fallbackPath)
	}

	// Render loading state
	if (guardState.status === 'loading' || guardState.status === 'validating') {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<Card className='w-96'>
					<CardContent className='pt-6'>
						<div className='flex flex-col items-center space-y-4'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
							<div className='text-center'>
								<h3 className='text-lg font-semibold'>{guardState.status === 'loading' ? 'Loading...' : 'Validating Access...'}</h3>
								<p className='text-sm text-muted-foreground mt-1'>{guardState.status === 'loading' ? 'Preparing tenant access' : `Checking access to tenant ${tenantId}`}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Render needs login state
	if (guardState.status === 'needs_login') {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<Card className='w-96'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertCircle className='h-5 w-5 text-yellow-500' />
							Tenant Access Required
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<p className='text-sm text-muted-foreground'>
								You need to authenticate to access tenant <strong>{tenantId}</strong>.
							</p>
							{guardState.error && <p className='text-sm text-red-600 bg-red-50 p-2 rounded'>{guardState.error}</p>}
							<div className='flex gap-2'>
								<Button onClick={handleLoginToTenant} disabled={guardState.isRefreshing} className='flex-1'>
									{guardState.isRefreshing ? (
										<>
											<Loader2 className='h-4 w-4 mr-2 animate-spin' />
											Logging in...
										</>
									) : (
										'Login to Tenant'
									)}
								</Button>
								<Button variant='outline' onClick={handleGoBack}>
									Go Back
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Render access denied state
	if (guardState.status === 'access_denied' || guardState.status === 'error') {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<Card className='w-96'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2 text-red-600'>
							<AlertCircle className='h-5 w-5' />
							Tenant Access Required
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<p className='text-sm text-muted-foreground'>
								You need to authenticate to access tenant <strong>{tenantId}</strong>.
							</p>
							{guardState.error && <p className='text-sm text-red-600 bg-red-50 p-2 rounded'>{guardState.error}</p>}

							<div className='flex gap-2'>
								<Button onClick={() => router.push('/dashboard')} variant='outline' className='flex-1'>
									Back to Dashboard
								</Button>
								<Button onClick={() => router.push('/dashboard/tenant-management')} variant='default' className='flex-1'>
									Tenant Management
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Render authenticated content
	if (guardState.status === 'authenticated') {
		return <>{children}</>
	}

	// Fallback
	return null
}

export default TenantGuard
