'use client'

import React, {Suspense} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {ShieldX, ArrowLeft, Home, RefreshCw, AlertTriangle, Info} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Badge} from '@/components/ui/badge'
import {useAuth} from '@/contexts/AuthContext'
import {usePermissions} from '@/contexts/PermissionContext'

function PermissionDeniedPageContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const {user, currentTenantId} = useAuth()
	const {refreshPermissions, loading} = usePermissions()

	const requestedPath = searchParams.get('path') || 'the requested resource'
	const requiredPermission = searchParams.get('permission')
	const requiredRole = searchParams.get('role')

	const [retryCount, setRetryCount] = React.useState(0)
	const [isRetrying, setIsRetrying] = React.useState(false)

	const handleGoBack = () => {
		if (window.history.length > 1) {
			router.back()
		} else {
			router.push('/dashboard')
		}
	}

	const handleGoHome = () => {
		router.push('/dashboard')
	}

	const handleRetry = async () => {
		setIsRetrying(true)
		setRetryCount((prev) => prev + 1)

		try {
			// Refresh permissions
			await refreshPermissions()

			// Wait a bit for permissions to update
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Try to navigate back to the requested path
			if (requestedPath && requestedPath !== 'the requested resource') {
				router.push(requestedPath)
			} else {
				router.push('/dashboard')
			}
		} catch (error) {
			console.error('Failed to retry:', error)
		} finally {
			setIsRetrying(false)
		}
	}

	const getErrorMessage = () => {
		if (requiredPermission) {
			return `You need the "${requiredPermission}" permission to access this resource.`
		}
		if (requiredRole) {
			return `You need the "${requiredRole}" role to access this resource.`
		}
		return 'You do not have sufficient permissions to access this resource.'
	}

	const getSuggestions = () => {
		const suggestions = []

		if (currentTenantId) {
			suggestions.push('Contact your organization administrator to request access')
		} else {
			suggestions.push('Join an organization to access this feature')
		}

		if (retryCount < 3) {
			suggestions.push('Try refreshing your permissions')
		}

		return suggestions
	}

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4'>
			<Card className='w-full max-w-lg'>
				<CardHeader className='text-center'>
					<div className='mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center'>
						<ShieldX className='h-8 w-8 text-red-600 dark:text-red-400' />
					</div>
					<CardTitle className='text-2xl font-bold text-gray-900 dark:text-gray-100'>Access Denied</CardTitle>
					<CardDescription className='text-gray-600 dark:text-gray-400'>{getErrorMessage()}</CardDescription>
				</CardHeader>

				<CardContent className='space-y-4'>
					{/* Error Details */}
					<Alert>
						<AlertTriangle className='h-4 w-4' />
						<AlertDescription>
							<strong>Requested Resource:</strong> {requestedPath}
							{requiredPermission && (
								<div>
									<br />
									<strong>Required Permission:</strong> {requiredPermission}
								</div>
							)}
							{requiredRole && (
								<div>
									<br />
									<strong>Required Role:</strong> {requiredRole}
								</div>
							)}
						</AlertDescription>
					</Alert>

					{/* User Info */}
					{user && (
						<Alert>
							<Info className='h-4 w-4' />
							<AlertDescription>
								<strong>Current User:</strong> {user.email}
								{currentTenantId && (
									<div>
										<br />
										<strong>Organization:</strong> {currentTenantId}
									</div>
								)}
							</AlertDescription>
						</Alert>
					)}

					{/* Suggestions */}
					<div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
						<h4 className='font-medium text-blue-900 dark:text-blue-100 mb-2'>What you can do:</h4>
						<ul className='text-sm text-blue-800 dark:text-blue-200 space-y-1'>
							{getSuggestions().map((suggestion, index) => (
								<li key={index} className='flex items-start'>
									<span className='mr-2'>•</span>
									{suggestion}
								</li>
							))}
						</ul>
					</div>

					{/* Action Buttons */}
					<div className='flex flex-col sm:flex-row gap-3'>
						<Button variant='outline' onClick={handleGoBack} className='flex-1'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Go Back
						</Button>

						<Button variant='outline' onClick={handleGoHome} className='flex-1'>
							<Home className='mr-2 h-4 w-4' />
							Dashboard
						</Button>

						{retryCount < 3 && (
							<Button onClick={handleRetry} disabled={isRetrying || loading} className='flex-1'>
								<RefreshCw className={`mr-2 h-4 w-4 ${isRetrying || loading ? 'animate-spin' : ''}`} />
								{isRetrying ? 'Retrying...' : 'Retry'}
							</Button>
						)}
					</div>

					{/* Retry Counter */}
					{retryCount > 0 && <div className='text-center text-sm text-gray-500 dark:text-gray-400'>Retry attempts: {retryCount}/3</div>}
				</CardContent>
			</Card>
		</div>
	)
}

export default function PermissionDeniedPage() {
	return (
		<Suspense>
			<PermissionDeniedPageContent />
		</Suspense>
	)
}
