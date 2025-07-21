'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EnhancedAnalyticsService, OAuth2FlowAnalytics, DIDCreationAnalytics, TenantUsageMetrics, KMSKeyManagementMetrics } from '@/services/enhancedAnalyticsService'
import { BarChart3, Activity, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface AnalyticsTimeRange {
	label: string
	value: 'day' | 'week' | 'month'
	days: number
}

const timeRanges: AnalyticsTimeRange[] = [
	{ label: '24h', value: 'day', days: 1 },
	{ label: '7d', value: 'week', days: 7 },
	{ label: '30d', value: 'month', days: 30 }
]

export function QuickAnalyticsWidget() {
	const [selectedRange, setSelectedRange] = useState<AnalyticsTimeRange>(timeRanges[1])
	const [loading, setLoading] = useState(true)
	const [oauth2Data, setOAuth2Data] = useState<OAuth2FlowAnalytics | null>(null)
	const [didData, setDIDData] = useState<DIDCreationAnalytics | null>(null)
	const [tenantData, setTenantData] = useState<TenantUsageMetrics | null>(null)
	const [kmsData, setKMSData] = useState<KMSKeyManagementMetrics | null>(null)

	const fetchData = async () => {
		try {
			setLoading(true)

			const endDate = new Date()
			const startDate = new Date()
			startDate.setDate(endDate.getDate() - selectedRange.days)

			const query = {
				time_range: {
					start_date: startDate.toISOString().split('T')[0],
					end_date: endDate.toISOString().split('T')[0]
				},
				interval: selectedRange.value
			}

			const [oauth2Response, didResponse, tenantResponse, kmsResponse] = await Promise.allSettled([
				EnhancedAnalyticsService.getOAuth2FlowAnalytics(query),
				EnhancedAnalyticsService.getDIDCreationAnalytics(query),
				EnhancedAnalyticsService.getTenantUsageMetrics(query),
				EnhancedAnalyticsService.getKMSKeyManagementMetrics(query)
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
		} catch (error) {
			console.error('Failed to fetch quick analytics:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [selectedRange])

	const getTrendIcon = (current: number, previous: number) => {
		if (current > previous) {
			return <TrendingUp className='h-4 w-4 text-green-500' />
		} else if (current < previous) {
			return <TrendingDown className='h-4 w-4 text-red-500' />
		}
		return <Activity className='h-4 w-4 text-gray-500' />
	}

	const getTrendPercentage = (current: number, previous: number) => {
		if (previous === 0) return 0
		return ((current - previous) / previous) * 100
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BarChart3 className='h-5 w-5' />
						Quick Analytics
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						{[...Array(4)].map((_, i) => (
							<Skeleton key={i} className='h-20' />
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='flex items-center gap-2'>
						<BarChart3 className='h-5 w-5' />
						Quick Analytics
					</CardTitle>
					<div className='flex gap-1'>
						{timeRanges.map((range) => (
							<button
								key={range.value}
								onClick={() => setSelectedRange(range)}
								className={`px-3 py-1 text-sm rounded-md transition-colors ${
									selectedRange.value === range.value
										? 'bg-primary text-primary-foreground'
										: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
								}`}
							>
								{range.label}
							</button>
						))}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
					{/* OAuth2 Analytics */}
					<div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800'>
						<div className='flex items-center justify-between mb-2'>
							<h3 className='font-medium text-blue-700 dark:text-blue-300'>OAuth2</h3>
							{oauth2Data?.time_series && oauth2Data.time_series.length > 1 && 
								getTrendIcon(
									oauth2Data.time_series[oauth2Data.time_series.length - 1]?.authorizations || 0,
									oauth2Data.time_series[oauth2Data.time_series.length - 2]?.authorizations || 0
								)
							}
						</div>
						<div className='space-y-1'>
							<p className='text-2xl font-bold text-blue-700 dark:text-blue-300'>
								{oauth2Data?.total_authorizations?.toLocaleString() || 0}
							</p>
							<p className='text-sm text-blue-600 dark:text-blue-400'>
								{oauth2Data?.successful_authorizations?.toLocaleString() || 0} successful
							</p>
							<Badge variant='outline' className='bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'>
								{oauth2Data?.success_rate?.toFixed(1) || 0}% success rate
							</Badge>
						</div>
					</div>

					{/* DID Analytics */}
					<div className='bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800'>
						<div className='flex items-center justify-between mb-2'>
							<h3 className='font-medium text-purple-700 dark:text-purple-300'>DIDs</h3>
							{didData?.creation_trends && didData.creation_trends.length > 1 && 
								getTrendIcon(
									didData.creation_trends[didData.creation_trends.length - 1]?.count || 0,
									didData.creation_trends[didData.creation_trends.length - 2]?.count || 0
								)
							}
						</div>
						<div className='space-y-1'>
							<p className='text-2xl font-bold text-purple-700 dark:text-purple-300'>
								{didData?.total_dids?.toLocaleString() || 0}
							</p>
							<p className='text-sm text-purple-600 dark:text-purple-400'>
								+{didData?.dids_created_this_month?.toLocaleString() || 0} this month
							</p>
							<Badge variant='outline' className='bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'>
								{didData?.success_rate?.toFixed(1) || 0}% success rate
							</Badge>
						</div>
					</div>

					{/* Tenant Analytics */}
					<div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800'>
						<div className='flex items-center justify-between mb-2'>
							<h3 className='font-medium text-green-700 dark:text-green-300'>Tenants</h3>
							{tenantData?.tenant_growth_rate !== undefined && (
								tenantData.tenant_growth_rate > 0 ? 
									<TrendingUp className='h-4 w-4 text-green-500' /> :
									<TrendingDown className='h-4 w-4 text-red-500' />
							)}
						</div>
						<div className='space-y-1'>
							<p className='text-2xl font-bold text-green-700 dark:text-green-300'>
								{tenantData?.total_tenants?.toLocaleString() || 0}
							</p>
							<p className='text-sm text-green-600 dark:text-green-400'>
								{tenantData?.active_tenants?.toLocaleString() || 0} active
							</p>
							<Badge variant='outline' className='bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'>
								{tenantData?.tenant_growth_rate?.toFixed(1) || 0}% growth
							</Badge>
						</div>
					</div>

					{/* KMS Analytics */}
					<div className='bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800'>
						<div className='flex items-center justify-between mb-2'>
							<h3 className='font-medium text-orange-700 dark:text-orange-300'>KMS</h3>
							{kmsData?.keys_created_today !== undefined && (
								kmsData.keys_created_today > 0 ? 
									<TrendingUp className='h-4 w-4 text-green-500' /> :
									<Activity className='h-4 w-4 text-gray-500' />
							)}
						</div>
						<div className='space-y-1'>
							<p className='text-2xl font-bold text-orange-700 dark:text-orange-300'>
								{kmsData?.total_keys?.toLocaleString() || 0}
							</p>
							<p className='text-sm text-orange-600 dark:text-orange-400'>
								{kmsData?.active_keys?.toLocaleString() || 0} active
							</p>
							<div className='flex gap-1'>
								<Badge variant='outline' className='bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs'>
									+{kmsData?.keys_created_today || 0} today
								</Badge>
								{(kmsData?.revoked_keys || 0) > 0 && (
									<Badge variant='destructive' className='text-xs'>
										{kmsData?.revoked_keys} revoked
									</Badge>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Quick Insights */}
				<div className='mt-6 pt-4 border-t'>
					<h4 className='font-medium mb-3 text-gray-700 dark:text-gray-300'>Quick Insights</h4>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
						{oauth2Data && oauth2Data.success_rate < 95 && (
							<div className='flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded'>
								<AlertTriangle className='h-4 w-4 text-yellow-600' />
								<span className='text-yellow-700 dark:text-yellow-300'>
									OAuth2 success rate below 95%
								</span>
							</div>
						)}
						{tenantData && tenantData.tenant_growth_rate > 10 && (
							<div className='flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded'>
								<TrendingUp className='h-4 w-4 text-green-600' />
								<span className='text-green-700 dark:text-green-300'>
									Strong tenant growth this period
								</span>
							</div>
						)}
						{kmsData && (kmsData.revoked_keys || 0) > (kmsData.total_keys || 0) * 0.1 && (
							<div className='flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded'>
								<AlertTriangle className='h-4 w-4 text-red-600' />
								<span className='text-red-700 dark:text-red-300'>
									High key revocation rate detected
								</span>
							</div>
						)}
						{didData && didData.success_rate > 98 && (
							<div className='flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded'>
								<Activity className='h-4 w-4 text-blue-600' />
								<span className='text-blue-700 dark:text-blue-300'>
									DID operations performing excellently
								</span>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
