'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Skeleton} from '@/components/ui/skeleton'
import {BarChart3, TrendingUp, Users, Shield, Key, Download, RefreshCw, Calendar, Filter} from 'lucide-react'
import {toast} from 'sonner'
import {DateRange} from 'react-day-picker'
import {addDays, subDays, format} from 'date-fns'
import {AnalyticsCard} from './AnalyticsCard'
import {AnalyticsChart} from './AnalyticsChart'
import * as analyticsService from '@/services/analyticsService'
import type {PersonalDashboardAnalytics, SystemDashboardAnalytics, UserGrowthItem, AnalyticsQuery} from '@/services/analyticsService'

/**
 * Analytics Dashboard Component
 *
 * Provides comprehensive analytics interface with:
 * - System and personal dashboard views
 * - User growth analytics
 * - Interactive charts and metrics
 * - Data export functionality
 * - Time range filtering
 */

interface AnalyticsDashboardProps {
	className?: string
	isAdmin?: boolean
}

// String literal type for time range selection
type AnalyticsTimeRangeValue = '7d' | '30d' | '90d' | '6m' | '1y'

type TimeRangeOption = {
	label: string
	value: AnalyticsTimeRangeValue
	days: number
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
	{label: 'Last 7 days', value: '7d', days: 7},
	{label: 'Last 30 days', value: '30d', days: 30},
	{label: 'Last 90 days', value: '90d', days: 90},
	{label: 'Last 6 months', value: '6m', days: 180},
	{label: 'Last year', value: '1y', days: 365},
]

function getDateRangeFromOption(option: TimeRangeOption): DateRange {
	const to = new Date()
	const from = subDays(to, option.days)
	return {from, to}
}

export function AnalyticsDashboard({className = '', isAdmin = false}: AnalyticsDashboardProps) {
	const [personalAnalytics, setPersonalAnalytics] = useState<PersonalDashboardAnalytics | null>(null)
	const [systemAnalytics, setSystemAnalytics] = useState<SystemDashboardAnalytics | null>(null)
	const [userGrowthData, setUserGrowthData] = useState<UserGrowthItem[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [timeRange, setTimeRange] = useState<AnalyticsTimeRangeValue>('30d')
	const [dateRange, setDateRange] = useState<DateRange | undefined>(getDateRangeFromOption(TIME_RANGE_OPTIONS[1]))
	const [activeTab, setActiveTab] = useState(isAdmin ? 'system' : 'personal')

	const fetchAnalyticsData = async () => {
		try {
			setLoading(true)

			const promises = []

			// Convert timeRange to proper AnalyticsQuery format
			const query: AnalyticsQuery = {
				time_range: dateRange ? {
					start_date: dateRange.from?.toISOString().split('T')[0],
					end_date: dateRange.to?.toISOString().split('T')[0]
				} : undefined
			}

			if (isAdmin) {
				promises.push(analyticsService.getSystemDashboardAnalytics(query), analyticsService.getUserGrowthData(query))
			}

			promises.push(analyticsService.getPersonalDashboardAnalytics(query))

			const results = await Promise.all(promises)

			if (isAdmin) {
				setSystemAnalytics(results[0] as SystemDashboardAnalytics)
				setUserGrowthData(results[1] as UserGrowthItem[])
				setPersonalAnalytics(results[2] as PersonalDashboardAnalytics)
			} else {
				setPersonalAnalytics(results[0] as PersonalDashboardAnalytics)
			}
		} catch (error) {
			console.error('Failed to fetch analytics data:', error)
			toast.error('Failed to load analytics data')
		} finally {
			setLoading(false)
		}
	}

	const handleRefresh = async () => {
		setRefreshing(true)
		await fetchAnalyticsData()
		setRefreshing(false)
		toast.success('Analytics data refreshed')
	}

	const handleTimeRangeChange = (value: AnalyticsTimeRangeValue) => {
		setTimeRange(value)
		const option = TIME_RANGE_OPTIONS.find((opt) => opt.value === value)
		if (option) {
			setDateRange(getDateRangeFromOption(option))
		}
	}

	const handleExportData = () => {
		// Implement data export functionality
		const data = {
			personal: personalAnalytics,
			system: systemAnalytics,
			userGrowth: userGrowthData,
			timeRange,
			exportedAt: new Date().toISOString(),
		}

		const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)

		toast.success('Analytics data exported')
	}

	useEffect(() => {
		fetchAnalyticsData()
	}, [timeRange, isAdmin])

	// Prepare chart data
	const userGrowthChartData = userGrowthData.map((item) => ({
		name: format(new Date(item.date), 'MMM dd'),
		users: item.total_users,
		newUsers: item.new_users,
		activeUsers: item.active_users,
	}))

	const personalStatsData = personalAnalytics
		? [
				{name: 'DIDs', value: personalAnalytics.total_dids},
				{name: 'Credentials', value: personalAnalytics.total_credentials},
				{name: 'Messages', value: personalAnalytics.total_messages},
				{name: 'Connections', value: personalAnalytics.total_connections},
		  ]
		: []

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>Analytics Dashboard</h2>
					<p className='text-muted-foreground'>{isAdmin ? 'System-wide analytics and insights' : 'Your personal analytics and activity'}</p>
				</div>
				<div className='flex items-center gap-2'>
					<Select value={timeRange} onValueChange={handleTimeRangeChange}>
						<SelectTrigger className='w-40'>
							<Calendar className='h-4 w-4 mr-2' />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TIME_RANGE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button variant='outline' size='sm' onClick={handleRefresh} disabled={refreshing}>
						<RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
						Refresh
					</Button>
					<Button variant='outline' size='sm' onClick={handleExportData}>
						<Download className='h-4 w-4 mr-2' />
						Export
					</Button>
				</div>
			</div>

			{/* Main Content Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
				<TabsList>
					<TabsTrigger value='personal'>Personal Analytics</TabsTrigger>
					{isAdmin && <TabsTrigger value='system'>System Analytics</TabsTrigger>}
					{isAdmin && <TabsTrigger value='growth'>User Growth</TabsTrigger>}
				</TabsList>

				{/* Personal Analytics Tab */}
				<TabsContent value='personal' className='space-y-4'>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<AnalyticsCard title='Total DIDs' value={personalAnalytics?.total_dids || 0} icon={Key} loading={loading} description='Decentralized identifiers created' />
						<AnalyticsCard title='Credentials' value={personalAnalytics?.total_credentials || 0} icon={Shield} loading={loading} description='Verifiable credentials issued' />
						<AnalyticsCard title='Messages' value={personalAnalytics?.total_messages || 0} icon={Users} loading={loading} description='DIDComm messages exchanged' />
						<AnalyticsCard title='Connections' value={personalAnalytics?.total_connections || 0} icon={TrendingUp} loading={loading} description='Active connections' />
					</div>

					<div className='grid gap-4 md:grid-cols-2'>
						<AnalyticsChart title='Personal Activity Overview' data={personalStatsData} type='bar' dataKey='value' xAxisKey='name' loading={loading} />
						<Card>
							<CardHeader>
								<CardTitle>Recent Activity</CardTitle>
								<CardDescription>Your recent activity summary</CardDescription>
							</CardHeader>
							<CardContent>
								{loading ? (
									<div className='space-y-2'>
										{[...Array(4)].map((_, i) => (
											<Skeleton key={i} className='h-8 w-full' />
										))}
									</div>
								) : (
									<div className='space-y-3'>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>DIDs created this month</span>
											<span className='font-medium'>{personalAnalytics?.dids_this_month || 0}</span>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Credentials issued this month</span>
											<span className='font-medium'>{personalAnalytics?.credentials_this_month || 0}</span>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Messages sent this month</span>
											<span className='font-medium'>{personalAnalytics?.messages_this_month || 0}</span>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Last activity</span>
											<span className='font-medium'>{personalAnalytics?.last_activity ? format(new Date(personalAnalytics.last_activity), 'MMM dd, yyyy') : 'No activity'}</span>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* System Analytics Tab (Admin only) */}
				{isAdmin && (
					<TabsContent value='system' className='space-y-4'>
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
							<AnalyticsCard
								title='Total Users'
								value={systemAnalytics?.total_users || 0}
								icon={Users}
								loading={loading}
								description='Registered users'
								trend={{
									value: systemAnalytics?.user_growth_percentage || 0,
									isPositive: (systemAnalytics?.user_growth_percentage || 0) >= 0,
								}}
							/>
							<AnalyticsCard title='Active Users' value={systemAnalytics?.active_users || 0} icon={TrendingUp} loading={loading} description='Users active this month' />
							<AnalyticsCard title='Total DIDs' value={systemAnalytics?.total_dids || 0} icon={Key} loading={loading} description='System-wide DIDs' />
							<AnalyticsCard title='Total Credentials' value={systemAnalytics?.total_credentials || 0} icon={Shield} loading={loading} description='Credentials issued' />
						</div>

						<div className='grid gap-4 md:grid-cols-2'>
							<AnalyticsChart
								title='System Activity Trend'
								data={[
									{name: 'Users', value: systemAnalytics?.total_users || 0},
									{name: 'DIDs', value: systemAnalytics?.total_dids || 0},
									{name: 'Credentials', value: systemAnalytics?.total_credentials || 0},
									{name: 'Messages', value: systemAnalytics?.total_messages || 0},
								]}
								type='area'
								dataKey='value'
								xAxisKey='name'
								loading={loading}
							/>
							<AnalyticsChart
								title='User Distribution'
								data={[
									{name: 'Active', value: systemAnalytics?.active_users || 0},
									{name: 'Inactive', value: (systemAnalytics?.total_users || 0) - (systemAnalytics?.active_users || 0)},
								]}
								type='pie'
								loading={loading}
							/>
						</div>
					</TabsContent>
				)}

				{/* User Growth Tab (Admin only) */}
				{isAdmin && (
					<TabsContent value='growth' className='space-y-4'>
						<div className='grid gap-4'>
							<AnalyticsChart title='User Growth Over Time' data={userGrowthChartData} type='line' dataKey='users' xAxisKey='name' loading={loading} height={400} />
							<div className='grid gap-4 md:grid-cols-2'>
								<AnalyticsChart title='New Users' data={userGrowthChartData} type='bar' dataKey='newUsers' xAxisKey='name' loading={loading} />
								<AnalyticsChart title='Active Users' data={userGrowthChartData} type='area' dataKey='activeUsers' xAxisKey='name' loading={loading} />
							</div>
						</div>
					</TabsContent>
				)}
			</Tabs>
		</div>
	)
}

export default AnalyticsDashboard
