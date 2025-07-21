'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EnhancedAnalyticsService } from '@/services/enhancedAnalyticsService'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Calendar, Download, RefreshCw, TrendingUp, Users, Key, FileText } from 'lucide-react'

interface AnalyticsChartsProps {
	timeRange?: 'day' | 'week' | 'month'
	onTimeRangeChange?: (range: 'day' | 'week' | 'month') => void
}

interface ChartData {
	oauth2Trends: Array<{ date: string; authorizations: number; success_rate: number }>
	didCreationTrends: Array<{ date: string; count: number; type: string }>
	tenantActivity: Array<{ date: string; active: number; new: number }>
	moduleUsage: Array<{ name: string; value: number; color: string }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AnalyticsCharts({ timeRange = 'week', onTimeRangeChange }: AnalyticsChartsProps) {
	const [loading, setLoading] = useState(true)
	const [chartData, setChartData] = useState<ChartData | null>(null)
	const [selectedChart, setSelectedChart] = useState<'oauth2' | 'did' | 'tenant' | 'usage'>('oauth2')

	const fetchChartData = async () => {
		try {
			setLoading(true)

			const endDate = new Date()
			const startDate = new Date()
			const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30
			startDate.setDate(endDate.getDate() - days)

			const query = {
				time_range: {
					start_date: startDate.toISOString().split('T')[0],
					end_date: endDate.toISOString().split('T')[0]
				},
				interval: timeRange
			}

			// For demo purposes, using mock data. In production, replace with actual API calls
			const mockData: ChartData = {
				oauth2Trends: Array.from({ length: days }, (_, i) => ({
					date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
					authorizations: Math.floor(Math.random() * 1000) + 500,
					success_rate: Math.random() * 10 + 90
				})),
				didCreationTrends: Array.from({ length: days }, (_, i) => ({
					date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
					count: Math.floor(Math.random() * 50) + 10,
					type: 'standard'
				})),
				tenantActivity: Array.from({ length: days }, (_, i) => ({
					date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
					active: Math.floor(Math.random() * 200) + 100,
					new: Math.floor(Math.random() * 20) + 5
				})),
				moduleUsage: [
					{ name: 'OAuth2', value: 45, color: COLORS[0] },
					{ name: 'DID', value: 25, color: COLORS[1] },
					{ name: 'KMS', value: 20, color: COLORS[2] },
					{ name: 'Analytics', value: 10, color: COLORS[3] }
				]
			}

			setChartData(mockData)
		} catch (error) {
			console.error('Failed to fetch chart data:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchChartData()
	}, [timeRange])

	const exportData = async () => {
		try {
			// In production, implement actual data export
			const dataStr = JSON.stringify(chartData, null, 2)
			const dataBlob = new Blob([dataStr], { type: 'application/json' })
			const url = URL.createObjectURL(dataBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
			link.click()
			URL.revokeObjectURL(url)
		} catch (error) {
			console.error('Failed to export data:', error)
		}
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BarChart className='h-5 w-5' />
						Analytics Charts
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Skeleton className='h-80' />
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='flex items-center gap-2'>
						<BarChart className='h-5 w-5' />
						Analytics Charts
					</CardTitle>
					<div className='flex items-center gap-2'>
						{/* Time Range Selector */}
						<div className='flex gap-1'>
							{['day', 'week', 'month'].map((range) => (
								<Button
									key={range}
									variant={timeRange === range ? 'default' : 'outline'}
									size='sm'
									onClick={() => onTimeRangeChange?.(range as 'day' | 'week' | 'month')}
								>
									{range === 'day' ? '24h' : range === 'week' ? '7d' : '30d'}
								</Button>
							))}
						</div>
						
						<Button variant='outline' size='sm' onClick={fetchChartData}>
							<RefreshCw className='h-4 w-4' />
						</Button>
						
						<Button variant='outline' size='sm' onClick={exportData}>
							<Download className='h-4 w-4' />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{/* Chart Type Selector */}
				<div className='flex gap-2 mb-6 overflow-x-auto'>
					<Button
						variant={selectedChart === 'oauth2' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setSelectedChart('oauth2')}
						className='flex items-center gap-2'
					>
						<TrendingUp className='h-4 w-4' />
						OAuth2 Trends
					</Button>
					<Button
						variant={selectedChart === 'did' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setSelectedChart('did')}
						className='flex items-center gap-2'
					>
						<FileText className='h-4 w-4' />
						DID Creation
					</Button>
					<Button
						variant={selectedChart === 'tenant' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setSelectedChart('tenant')}
						className='flex items-center gap-2'
					>
						<Users className='h-4 w-4' />
						Tenant Activity
					</Button>
					<Button
						variant={selectedChart === 'usage' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setSelectedChart('usage')}
						className='flex items-center gap-2'
					>
						<Key className='h-4 w-4' />
						Module Usage
					</Button>
				</div>

				{/* Chart Display */}
				<div className='h-80'>
					{selectedChart === 'oauth2' && chartData?.oauth2Trends && (
						<ResponsiveContainer width='100%' height='100%'>
							<LineChart data={chartData.oauth2Trends}>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis dataKey='date' />
								<YAxis yAxisId='left' />
								<YAxis yAxisId='right' orientation='right' />
								<Tooltip />
								<Bar yAxisId='left' dataKey='authorizations' fill='#8884d8' name='Authorizations' />
								<Line yAxisId='right' type='monotone' dataKey='success_rate' stroke='#82ca9d' name='Success Rate %' />
							</LineChart>
						</ResponsiveContainer>
					)}

					{selectedChart === 'did' && chartData?.didCreationTrends && (
						<ResponsiveContainer width='100%' height='100%'>
							<BarChart data={chartData.didCreationTrends}>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis dataKey='date' />
								<YAxis />
								<Tooltip />
								<Bar dataKey='count' fill='#82ca9d' name='DIDs Created' />
							</BarChart>
						</ResponsiveContainer>
					)}

					{selectedChart === 'tenant' && chartData?.tenantActivity && (
						<ResponsiveContainer width='100%' height='100%'>
							<LineChart data={chartData.tenantActivity}>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis dataKey='date' />
								<YAxis />
								<Tooltip />
								<Line type='monotone' dataKey='active' stroke='#8884d8' name='Active Tenants' />
								<Line type='monotone' dataKey='new' stroke='#82ca9d' name='New Tenants' />
							</LineChart>
						</ResponsiveContainer>
					)}

					{selectedChart === 'usage' && chartData?.moduleUsage && (
						<ResponsiveContainer width='100%' height='100%'>
							<PieChart>
								<Pie
									data={chartData.moduleUsage}
									cx='50%'
									cy='50%'
									labelLine={false}
									label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
									outerRadius={80}
									fill='#8884d8'
									dataKey='value'
								>
									{chartData.moduleUsage.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					)}
				</div>

				{/* Chart Summary */}
				<div className='mt-6 pt-4 border-t'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						{selectedChart === 'oauth2' && chartData?.oauth2Trends && (
							<>
								<div className='text-center'>
									<p className='text-2xl font-bold text-blue-600'>
										{chartData.oauth2Trends.reduce((sum, item) => sum + item.authorizations, 0).toLocaleString()}
									</p>
									<p className='text-sm text-gray-600'>Total Authorizations</p>
								</div>
								<div className='text-center'>
									<p className='text-2xl font-bold text-green-600'>
										{(chartData.oauth2Trends.reduce((sum, item) => sum + item.success_rate, 0) / chartData.oauth2Trends.length).toFixed(1)}%
									</p>
									<p className='text-sm text-gray-600'>Avg Success Rate</p>
								</div>
							</>
						)}

						{selectedChart === 'did' && chartData?.didCreationTrends && (
							<>
								<div className='text-center'>
									<p className='text-2xl font-bold text-purple-600'>
										{chartData.didCreationTrends.reduce((sum, item) => sum + item.count, 0)}
									</p>
									<p className='text-sm text-gray-600'>DIDs Created</p>
								</div>
								<div className='text-center'>
									<p className='text-2xl font-bold text-indigo-600'>
										{(chartData.didCreationTrends.reduce((sum, item) => sum + item.count, 0) / chartData.didCreationTrends.length).toFixed(0)}
									</p>
									<p className='text-sm text-gray-600'>Daily Average</p>
								</div>
							</>
						)}

						{selectedChart === 'tenant' && chartData?.tenantActivity && (
							<>
								<div className='text-center'>
									<p className='text-2xl font-bold text-blue-600'>
										{chartData.tenantActivity[chartData.tenantActivity.length - 1]?.active || 0}
									</p>
									<p className='text-sm text-gray-600'>Active Tenants</p>
								</div>
								<div className='text-center'>
									<p className='text-2xl font-bold text-green-600'>
										{chartData.tenantActivity.reduce((sum, item) => sum + item.new, 0)}
									</p>
									<p className='text-sm text-gray-600'>New Tenants</p>
								</div>
							</>
						)}

						{selectedChart === 'usage' && chartData?.moduleUsage && (
							<>
								{chartData.moduleUsage.slice(0, 2).map((module) => (
									<div key={module.name} className='text-center'>
										<p className='text-2xl font-bold' style={{ color: module.color }}>
											{module.value}%
										</p>
										<p className='text-sm text-gray-600'>{module.name} Usage</p>
									</div>
								))}
							</>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
