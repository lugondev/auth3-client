import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {SystemAnalyticsService} from '@/services/analyticsService'
import type {SystemDashboardAnalytics} from '@/types/analytics'
import {Users, Activity, Building, TrendingUp} from 'lucide-react'
import {Skeleton} from '@/components/ui/skeleton'

interface SystemAnalyticsDashboardProps {
	onRefresh?: () => void
}

export function SystemAnalyticsDashboard({onRefresh}: SystemAnalyticsDashboardProps) {
	const [analytics, setAnalytics] = useState<SystemDashboardAnalytics | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchData() {
			try {
				const data = await SystemAnalyticsService.getSystemDashboard()
				setAnalytics(data)
				onRefresh?.()
			} catch (error) {
				console.error('Failed to load system analytics:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [onRefresh])

	if (loading) {
		return (
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{Array.from({length: 8}).map((_, i) => (
					<Card key={i}>
						<CardHeader className='pb-2'>
							<Skeleton className='h-4 w-24' />
						</CardHeader>
						<CardContent>
							<Skeleton className='h-8 w-16' />
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Total Users</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{analytics?.total_users?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Active Users</CardTitle>
						<Activity className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>{analytics?.active_users?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Total Tenants</CardTitle>
						<Building className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{analytics?.total_tenants?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>New Users Today</CardTitle>
						<TrendingUp className='h-4 w-4 text-blue-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-blue-600'>{analytics?.new_users_today?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
