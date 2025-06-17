'use client'

import React, {Suspense} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {ShieldX, ArrowLeft, Home, RefreshCw} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {useAuth} from '@/contexts/AuthContext'
import {usePermissions} from '@/contexts/PermissionContext'

function AccessDeniedPageContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const {user, currentTenantId} = useAuth()
	const {refreshPermissions, loading} = usePermissions()

	const requestedPath = searchParams.get('path') || 'the requested resource'
	const reason = searchParams.get('reason') || 'insufficient permissions'

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

	const handleRefreshPermissions = async () => {
		await refreshPermissions()

		// Check for previously saved URL in sessionStorage
		const previousUrl = sessionStorage.getItem('previousUrl')

		// Prioritize using the URL saved in sessionStorage
		if (previousUrl) {
			sessionStorage.removeItem('previousUrl') // Remove URL after using
			router.push(previousUrl)
		}
		// If no URL in sessionStorage, use requestedPath from query params
		else if (requestedPath && requestedPath !== 'the requested resource') {
			router.push(requestedPath)
		}
	}

	return (
		<div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center'>
					<div className='mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
						<ShieldX className='h-8 w-8 text-red-600' />
					</div>
					<CardTitle className='text-2xl font-bold text-gray-900'>Access Denied</CardTitle>
					<CardDescription className='text-gray-600'>You don&#39;t have permission to access {requestedPath}</CardDescription>
				</CardHeader>

				<CardContent className='space-y-6'>
					{/* Error Details */}
					<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
						<h4 className='text-sm font-medium text-red-800 mb-2'>Reason</h4>
						<p className='text-sm text-red-700 capitalize'>{reason}</p>
					</div>

					{/* User Info */}
					{user && (
						<div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
							<h4 className='text-sm font-medium text-gray-800 mb-2'>Current User</h4>
							<div className='space-y-1 text-sm text-gray-600'>
								<p>
									<span className='font-medium'>Email:</span> {user.email}
								</p>
								{user.roles && user.roles.length > 0 && (
									<p>
										<span className='font-medium'>Roles:</span> {user.roles.join(', ')}
									</p>
								)}
								{currentTenantId && (
									<p>
										<span className='font-medium'>Tenant:</span> {currentTenantId}
									</p>
								)}
							</div>
						</div>
					)}

					{/* Suggestions */}
					<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
						<h4 className='text-sm font-medium text-blue-800 mb-2'>What you can do:</h4>
						<ul className='text-sm text-blue-700 space-y-1'>
							<li>• Contact your administrator to request access</li>
							<li>• Check if you&#39;re in the correct tenant context</li>
							<li>• Try refreshing your permissions</li>
							<li>• Go back to a page you have access to</li>
						</ul>
					</div>

					{/* Action Buttons */}
					<div className='flex flex-col space-y-3'>
						<Button onClick={handleRefreshPermissions} disabled={loading} variant='default' className='w-full'>
							{loading ? (
								<>
									<RefreshCw className='mr-2 h-4 w-4 animate-spin' />
									Refreshing...
								</>
							) : (
								<>
									<RefreshCw className='mr-2 h-4 w-4' />
									Refresh Permissions
								</>
							)}
						</Button>

						<div className='flex space-x-3'>
							<Button onClick={handleGoBack} variant='outline' className='flex-1'>
								<ArrowLeft className='mr-2 h-4 w-4' />
								Go Back
							</Button>

							<Button onClick={handleGoHome} variant='outline' className='flex-1'>
								<Home className='mr-2 h-4 w-4' />
								Dashboard
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default function AccessDeniedPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AccessDeniedPageContent />
		</Suspense>
	)
}
