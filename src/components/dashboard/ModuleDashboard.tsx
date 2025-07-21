'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EnhancedAnalyticsService, OAuth2DashboardData, DIDDashboardData, TenantDashboardData, KMSDashboardData } from '@/services/enhancedAnalyticsService'
import {
	BarChart3,
	Shield,
	Users,
	Key,
	Activity,
	AlertTriangle,
	CheckCircle,
	Clock,
	Globe,
	Lock,
	Zap,
	TrendingUp,
	TrendingDown,
	Database,
	Settings,
	RefreshCw
} from 'lucide-react'

interface ModuleDashboardProps {
	onRefresh?: () => void
}

export function ModuleDashboard({ onRefresh }: ModuleDashboardProps) {
	const [loading, setLoading] = useState(true)
	const [oauth2Data, setOAuth2Data] = useState<OAuth2DashboardData | null>(null)
	const [didData, setDIDData] = useState<DIDDashboardData | null>(null)
	const [tenantData, setTenantData] = useState<TenantDashboardData | null>(null)
	const [kmsData, setKMSData] = useState<KMSDashboardData | null>(null)
	const [error, setError] = useState<string | null>(null)

	const fetchData = async () => {
		try {
			setLoading(true)
			setError(null)

			const [oauth2Response, didResponse, tenantResponse, kmsResponse] = await Promise.allSettled([
				EnhancedAnalyticsService.getOAuth2DashboardData(),
				EnhancedAnalyticsService.getDIDDashboardData(),
				EnhancedAnalyticsService.getTenantDashboardData(),
				EnhancedAnalyticsService.getKMSDashboardData()
			])

			if (oauth2Response.status === 'fulfilled') {
				setOAuth2Data(oauth2Response.value)
			}
			if (didResponse.status === 'fulfilled') {
				setDIDData(didResponse.value)
			}
			if (tenantResponse.status === 'fulfilled') {
				setTenantData(tenantResponse.value)
			}
			if (kmsResponse.status === 'fulfilled') {
				setKMSData(kmsResponse.value)
			}
		} catch (err) {
			console.error('Failed to fetch module analytics:', err)
			setError('Failed to load analytics data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	const handleRefresh = () => {
		fetchData()
		onRefresh?.()
	}

	if (loading) {
		return (
			<div className='space-y-6'>
				<div className='flex items-center justify-between'>
					<h2 className='text-2xl font-semibold'>Module Analytics</h2>
					<Skeleton className='h-10 w-24' />
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className='h-64' />
					))}
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<Card className='border-red-200'>
				<CardContent className='p-6'>
					<div className='flex items-center gap-3 text-red-600'>
						<AlertTriangle className='h-5 w-5' />
						<span>{error}</span>
						<Button variant='outline' size='sm' onClick={handleRefresh}>
							Try Again
						</Button>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h2 className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>Module Analytics</h2>
				<Button variant='outline' size='sm' onClick={handleRefresh} className='gap-2'>
					<RefreshCw className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				{/* OAuth2 Module */}
				<Card className='border-blue-200 dark:border-blue-800'>
					<CardHeader className='pb-3'>
						<CardTitle className='flex items-center gap-2 text-blue-700 dark:text-blue-300'>
							<Shield className='h-5 w-5' />
							OAuth2
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						{oauth2Data ? (
							<>
								<div className='grid grid-cols-2 gap-3 text-sm'>
									<div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg'>
										<p className='text-blue-600 dark:text-blue-400 font-medium'>Authorizations</p>
										<p className='text-2xl font-bold text-blue-700 dark:text-blue-300'>
											{oauth2Data.overview.total_authorizations.toLocaleString()}
										</p>
									</div>
									<div className='bg-green-50 dark:bg-green-900/20 p-3 rounded-lg'>
										<p className='text-green-600 dark:text-green-400 font-medium'>Success Rate</p>
										<p className='text-2xl font-bold text-green-700 dark:text-green-300'>
											{oauth2Data.overview.success_rate.toFixed(1)}%
										</p>
									</div>
								</div>
								<div className='space-y-2'>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Tokens Issued</span>
										<span className='font-medium'>{oauth2Data.overview.total_tokens_issued.toLocaleString()}</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Active Clients</span>
										<span className='font-medium'>{oauth2Data.overview.total_clients.toLocaleString()}</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Today</span>
										<Badge variant='secondary'>
											{oauth2Data.recent_activity.authorizations_today} auth
										</Badge>
									</div>
								</div>
							</>
						) : (
							<div className='text-center text-muted-foreground py-4'>
								<Shield className='h-8 w-8 mx-auto mb-2 opacity-50' />
								<p className='text-sm'>OAuth2 data unavailable</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* DID Module */}
				<Card className='border-purple-200 dark:border-purple-800'>
					<CardHeader className='pb-3'>
						<CardTitle className='flex items-center gap-2 text-purple-700 dark:text-purple-300'>
							<Globe className='h-5 w-5' />
							DID
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						{didData ? (
							<>
								<div className='grid grid-cols-2 gap-3 text-sm'>
									<div className='bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg'>
										<p className='text-purple-600 dark:text-purple-400 font-medium'>Total DIDs</p>
										<p className='text-2xl font-bold text-purple-700 dark:text-purple-300'>
											{didData.overview.total_dids.toLocaleString()}
										</p>
									</div>
									<div className='bg-green-50 dark:bg-green-900/20 p-3 rounded-lg'>
										<p className='text-green-600 dark:text-green-400 font-medium'>Success Rate</p>
										<p className='text-2xl font-bold text-green-700 dark:text-green-300'>
											{didData.overview.success_rate.toFixed(1)}%
										</p>
									</div>
								</div>
								<div className='space-y-2'>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Active DIDs</span>
										<span className='font-medium'>{didData.overview.active_dids.toLocaleString()}</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Resolutions</span>
										<span className='font-medium'>{didData.overview.total_resolutions.toLocaleString()}</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Created Today</span>
										<Badge variant='secondary'>
											{didData.recent_activity.created_today}
										</Badge>
									</div>
								</div>
							</>
						) : (
							<div className='text-center text-muted-foreground py-4'>
								<Globe className='h-8 w-8 mx-auto mb-2 opacity-50' />
								<p className='text-sm'>DID data unavailable</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Tenant Module */}
				<Card className='border-green-200 dark:border-green-800'>
					<CardHeader className='pb-3'>
						<CardTitle className='flex items-center gap-2 text-green-700 dark:text-green-300'>
							<Users className='h-5 w-5' />
							Tenants
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						{tenantData ? (
							<>
								<div className='grid grid-cols-2 gap-3 text-sm'>
									<div className='bg-green-50 dark:bg-green-900/20 p-3 rounded-lg'>
										<p className='text-green-600 dark:text-green-400 font-medium'>Total</p>
										<p className='text-2xl font-bold text-green-700 dark:text-green-300'>
											{tenantData.overview.total_tenants.toLocaleString()}
										</p>
									</div>
									<div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg'>
										<p className='text-blue-600 dark:text-blue-400 font-medium'>Growth</p>
										<div className='flex items-center gap-1'>
											{tenantData.overview.growth_rate > 0 ? (
												<TrendingUp className='h-4 w-4 text-green-500' />
											) : (
												<TrendingDown className='h-4 w-4 text-red-500' />
											)}
											<p className='text-lg font-bold text-blue-700 dark:text-blue-300'>
												{tenantData.overview.growth_rate.toFixed(1)}%
											</p>
										</div>
									</div>
								</div>
								<div className='space-y-2'>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Active</span>
										<span className='font-medium'>{tenantData.overview.active_tenants.toLocaleString()}</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Revenue</span>
										<span className='font-medium text-green-600'>${tenantData.overview.revenue_this_month.toLocaleString()}</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Most Active</span>
										<Badge variant='outline' className='text-xs'>
											{tenantData.tenant_activity.most_active_tenant.name}
										</Badge>
									</div>
								</div>
							</>
						) : (
							<div className='text-center text-muted-foreground py-4'>
								<Users className='h-8 w-8 mx-auto mb-2 opacity-50' />
								<p className='text-sm'>Tenant data unavailable</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* KMS Module */}
				<Card className='border-orange-200 dark:border-orange-800'>
					<CardHeader className='pb-3'>
						<CardTitle className='flex items-center gap-2 text-orange-700 dark:text-orange-300'>
							<Key className='h-5 w-5' />
							KMS
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						{kmsData ? (
							<>
								<div className='grid grid-cols-2 gap-3 text-sm'>
									<div className='bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg'>
										<p className='text-orange-600 dark:text-orange-400 font-medium'>Total Keys</p>
										<p className='text-2xl font-bold text-orange-700 dark:text-orange-300'>
											{kmsData.overview.total_keys.toLocaleString()}
										</p>
									</div>
									<div className='bg-green-50 dark:bg-green-900/20 p-3 rounded-lg'>
										<p className='text-green-600 dark:text-green-400 font-medium'>Security</p>
										<div className='flex items-center gap-1'>
											<Lock className='h-4 w-4 text-green-500' />
											<p className='text-lg font-bold text-green-700 dark:text-green-300'>
												{kmsData.overview.security_score}/100
											</p>
										</div>
									</div>
								</div>
								<div className='space-y-2'>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Active Keys</span>
										<span className='font-medium'>{kmsData.overview.active_keys.toLocaleString()}</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Operations</span>
										<span className='font-medium'>{kmsData.overview.total_operations.toLocaleString()}</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>Health</span>
										<div className='flex gap-1'>
											<Badge variant='outline' className='text-xs bg-green-50 text-green-700'>
												{kmsData.key_health.healthy_keys} OK
											</Badge>
											{kmsData.key_health.expiring_soon > 0 && (
												<Badge variant='outline' className='text-xs bg-yellow-50 text-yellow-700'>
													{kmsData.key_health.expiring_soon} exp
												</Badge>
											)}
										</div>
									</div>
								</div>
							</>
						) : (
							<div className='text-center text-muted-foreground py-4'>
								<Key className='h-8 w-8 mx-auto mb-2 opacity-50' />
								<p className='text-sm'>KMS data unavailable</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Module Performance Summary */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5' />
						Module Performance Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
						<div className='text-center'>
							<div className='mb-2'>
								<Shield className='h-8 w-8 text-blue-600 mx-auto' />
							</div>
							<h3 className='font-medium mb-1'>OAuth2</h3>
							<div className='flex items-center justify-center gap-2'>
								<CheckCircle className='h-4 w-4 text-green-500' />
								<Badge variant='outline' className='bg-green-50 text-green-700'>Healthy</Badge>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								{oauth2Data?.recent_activity.authorizations_today || 0} auth today
							</p>
						</div>

						<div className='text-center'>
							<div className='mb-2'>
								<Globe className='h-8 w-8 text-purple-600 mx-auto' />
							</div>
							<h3 className='font-medium mb-1'>DID</h3>
							<div className='flex items-center justify-center gap-2'>
								<CheckCircle className='h-4 w-4 text-green-500' />
								<Badge variant='outline' className='bg-green-50 text-green-700'>Healthy</Badge>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								{didData?.recent_activity.created_today || 0} created today
							</p>
						</div>

						<div className='text-center'>
							<div className='mb-2'>
								<Users className='h-8 w-8 text-green-600 mx-auto' />
							</div>
							<h3 className='font-medium mb-1'>Tenants</h3>
							<div className='flex items-center justify-center gap-2'>
								<CheckCircle className='h-4 w-4 text-green-500' />
								<Badge variant='outline' className='bg-green-50 text-green-700'>Healthy</Badge>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								{tenantData?.overview.growth_rate.toFixed(1) || 0}% growth
							</p>
						</div>

						<div className='text-center'>
							<div className='mb-2'>
								<Key className='h-8 w-8 text-orange-600 mx-auto' />
							</div>
							<h3 className='font-medium mb-1'>KMS</h3>
							<div className='flex items-center justify-center gap-2'>
								{(kmsData?.overview.security_score || 0) > 80 ? (
									<CheckCircle className='h-4 w-4 text-green-500' />
								) : (
									<AlertTriangle className='h-4 w-4 text-yellow-500' />
								)}
								<Badge 
									variant='outline' 
									className={`${(kmsData?.overview.security_score || 0) > 80 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}
								>
									{(kmsData?.overview.security_score || 0) > 80 ? 'Secure' : 'Warning'}
								</Badge>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								{kmsData?.overview.security_score || 0}/100 security score
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
