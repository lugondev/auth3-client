'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {CreditCard, Plus, Eye, MoreHorizontal} from 'lucide-react'
import Link from 'next/link'
import {useTenantCredentials, useTenantCredentialAnalytics} from '@/hooks/useTenantHooks'

export default function TenantCredentialsPage() {
	const {currentTenantId, currentMode} = useAuth()

	// Use tenant-specific hooks - must be called before any early returns
	const {data: credentialsData, isLoading: credentialsLoading, error: credentialsError} = useTenantCredentials(currentTenantId || undefined, {page: 1, limit: 10}, {enabled: !!currentTenantId})

	const {data: analyticsData, isLoading: analyticsLoading} = useTenantCredentialAnalytics(currentTenantId || undefined, {}, {enabled: !!currentTenantId})

	// Redirect to global if not in tenant context
	if (currentMode !== 'tenant' || !currentTenantId) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<Card>
					<CardHeader>
						<CardTitle>Access Denied</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>This page requires tenant context. Please select a tenant first.</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='space-y-6'>
				{/* Page Header */}
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold tracking-tight'>Credentials</h1>
						<p className='text-muted-foreground'>Manage verifiable credentials for {currentTenantId}</p>
					</div>
					<Button asChild>
						<Link href='/dashboard/tenant/credentials/create'>
							<Plus className='mr-2 h-4 w-4' />
							Issue Credential
						</Link>
					</Button>
				</div>

				{/* Analytics Cards */}
				{!analyticsLoading && analyticsData?.overview_metrics && (
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>Total Credentials</CardTitle>
								<CreditCard className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>{analyticsData.overview_metrics.total_credentials || 0}</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>Active</CardTitle>
								<CreditCard className='h-4 w-4 text-green-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>{analyticsData.overview_metrics.active_credentials || 0}</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>Revoked</CardTitle>
								<CreditCard className='h-4 w-4 text-red-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>{analyticsData.overview_metrics.revoked_credentials || 0}</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>Deactivated</CardTitle>
								<CreditCard className='h-4 w-4 text-orange-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>{analyticsData.overview_metrics.deactivated_credentials || 0}</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Credentials List */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<CreditCard className='h-5 w-5' />
							Tenant Credentials
						</CardTitle>
					</CardHeader>
					<CardContent>
						{credentialsLoading && (
							<div className='text-center py-8'>
								<p className='text-muted-foreground'>Loading credentials...</p>
							</div>
						)}

						{credentialsError && (
							<div className='text-center py-8'>
								<p className='text-red-500'>Error loading credentials: {credentialsError.message}</p>
							</div>
						)}

						{credentialsData && (
							<>
								{credentialsData.credentials.length === 0 ? (
									<div className='text-center py-8'>
										<CreditCard className='mx-auto h-12 w-12 text-muted-foreground' />
										<h3 className='mt-2 text-sm font-semibold text-gray-900'>No credentials</h3>
										<p className='mt-1 text-sm text-muted-foreground'>Get started by issuing your first credential.</p>
										<div className='mt-6'>
											<Button asChild>
												<Link href='/dashboard/tenant/credentials/create'>
													<Plus className='mr-2 h-4 w-4' />
													Issue Credential
												</Link>
											</Button>
										</div>
									</div>
								) : (
									<div className='space-y-4'>
										{credentialsData.credentials.map((credential) => (
											<div key={credential.id} className='flex items-center justify-between p-4 border rounded-lg'>
												<div className='flex items-center space-x-4'>
													<CreditCard className='h-8 w-8 text-muted-foreground' />
													<div>
														<p className='text-sm font-medium'>{credential.type?.[1] || 'Verifiable Credential'}</p>
														<p className='text-xs text-muted-foreground'>Issued: {new Date(credential.issuanceDate).toLocaleDateString()}</p>
													</div>
												</div>
												<div className='flex items-center space-x-2'>
													<Badge variant={credential.credentialStatus?.status === 'active' ? 'default' : credential.credentialStatus?.status === 'revoked' ? 'destructive' : 'secondary'}>{credential.credentialStatus?.status || 'active'}</Badge>
													<Button variant='ghost' size='sm'>
														<Eye className='h-4 w-4' />
													</Button>
													<Button variant='ghost' size='sm'>
														<MoreHorizontal className='h-4 w-4' />
													</Button>
												</div>
											</div>
										))}

										{/* Pagination */}
										{credentialsData.pagination && credentialsData.pagination.totalPages > 1 && (
											<div className='flex items-center justify-between pt-4'>
												<p className='text-sm text-muted-foreground'>
													Showing {(credentialsData.pagination.page - 1) * credentialsData.pagination.limit + 1} to {Math.min(credentialsData.pagination.page * credentialsData.pagination.limit, credentialsData.pagination.total)} of {credentialsData.pagination.total} credentials
												</p>
												<div className='flex space-x-2'>
													<Button variant='outline' size='sm' disabled={credentialsData.pagination.page === 1}>
														Previous
													</Button>
													<Button variant='outline' size='sm' disabled={credentialsData.pagination.page === credentialsData.pagination.totalPages}>
														Next
													</Button>
												</div>
											</div>
										)}
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
