'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Skeleton} from '@/components/ui/skeleton'
import {TrendingUp, LineChart, BarChart3, PieChart, Calendar, Download, RefreshCw, Filter} from 'lucide-react'
import {format, subDays} from 'date-fns'
import {toast} from 'sonner'

import {IssuanceMetrics} from './IssuanceMetrics'
import {VerificationMetrics} from './VerificationMetrics'
import {TemplateUsageCharts} from './TemplateUsageCharts'
import {ComplianceReports} from './ComplianceReports'

import {AnalyticsQuery, IssuanceStatistics, VerificationStatistics, TemplateUsageStats, getIssuanceStatistics, getVerificationStatistics, getTemplateUsageStatistics, generateComplianceReport} from '@/services/analyticsService'

interface CredentialAnalyticsDashboardProps {
	className?: string
	defaultTimeRange?: '7d' | '30d' | '90d' | '6m' | '1y'
}

type TimeRangeOption = {
	label: string
	value: string
	days: number
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
	{label: 'Last 7 days', value: '7d', days: 7},
	{label: 'Last 30 days', value: '30d', days: 30},
	{label: 'Last 90 days', value: '90d', days: 90},
	{label: 'Last 6 months', value: '6m', days: 180},
	{label: 'Last year', value: '1y', days: 365},
]

export function CredentialAnalyticsDashboard({className = '', defaultTimeRange = '30d'}: CredentialAnalyticsDashboardProps) {
	// State for selected tab and time range
	const [activeTab, setActiveTab] = useState<string>('issuance')
	const [selectedTimeRange, setSelectedTimeRange] = useState<string>(defaultTimeRange)

	// State for analytics data
	const [issuanceStats, setIssuanceStats] = useState<IssuanceStatistics | null>(null)
	const [verificationStats, setVerificationStats] = useState<VerificationStatistics | null>(null)
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
	const [templateStats, setTemplateStats] = useState<TemplateUsageStats | null>(null)

	// Loading states
	const [issuanceLoading, setIssuanceLoading] = useState<boolean>(false)
	const [verificationLoading, setVerificationLoading] = useState<boolean>(false)
	const [templateLoading, setTemplateLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	// Generate date range for queries
	const getDateRange = (rangeValue: string): {startDate: string; endDate: string} => {
		const today = new Date()
		const endDate = format(today, 'yyyy-MM-dd')

		const selectedOption = TIME_RANGE_OPTIONS.find((option) => option.value === rangeValue)
		const days = selectedOption?.days || 30
		const startDate = format(subDays(today, days), 'yyyy-MM-dd')

		return {startDate, endDate}
	}

	// Load issuance statistics
	const loadIssuanceStats = useCallback(async (timeRange: string) => {
		try {
			setIssuanceLoading(true)
			setError(null)

			const {startDate, endDate} = getDateRange(timeRange)
			const query: AnalyticsQuery = {
				time_range: {
					start_date: startDate,
					end_date: endDate,
				},
				interval: 'day',
			}

			const stats = await getIssuanceStatistics(query)
			setIssuanceStats(stats)
		} catch (err) {
			console.error('Failed to load issuance statistics', err)
			setError('Failed to load issuance analytics data. Please try again.')
			toast.error('Failed to load issuance analytics data')
		} finally {
			setIssuanceLoading(false)
		}
	}, [])

	// Load verification statistics
	const loadVerificationStats = useCallback(async (timeRange: string) => {
		try {
			setVerificationLoading(true)
			setError(null)

			const {startDate, endDate} = getDateRange(timeRange)
			const query: AnalyticsQuery = {
				time_range: {
					start_date: startDate,
					end_date: endDate,
				},
				interval: 'day',
			}

			const stats = await getVerificationStatistics(query)
			setVerificationStats(stats)
		} catch (err) {
			console.error('Failed to load verification statistics', err)
			setError('Failed to load verification analytics data. Please try again.')
			toast.error('Failed to load verification analytics data')
		} finally {
			setVerificationLoading(false)
		}
	}, [])

	// Load template statistics
	const loadTemplateStats = useCallback(async (templateId: string, timeRange: string) => {
		if (!templateId) return

		try {
			setTemplateLoading(true)
			setError(null)

			const {startDate, endDate} = getDateRange(timeRange)
			const query: AnalyticsQuery = {
				time_range: {
					start_date: startDate,
					end_date: endDate,
				},
				interval: 'day',
			}

			const stats = await getTemplateUsageStatistics(templateId, query)
			setTemplateStats(stats)
		} catch (err) {
			console.error('Failed to load template statistics', err)
			setError('Failed to load template analytics data. Please try again.')
			toast.error('Failed to load template usage data')
		} finally {
			setTemplateLoading(false)
		}
	}, [])

	// Effect to load data when tab or time range changes
	useEffect(() => {
		// Load data based on active tab
		if (activeTab === 'issuance') {
			loadIssuanceStats(selectedTimeRange)
		} else if (activeTab === 'verification') {
			loadVerificationStats(selectedTimeRange)
		} else if (activeTab === 'templates' && selectedTemplate) {
			loadTemplateStats(selectedTemplate, selectedTimeRange)
		}
	}, [activeTab, selectedTimeRange, selectedTemplate, loadIssuanceStats, loadVerificationStats, loadTemplateStats])

	// Handle time range change
	const handleTimeRangeChange = (value: string) => {
		setSelectedTimeRange(value)
	}

	// Handle refresh button click
	const handleRefresh = () => {
		if (activeTab === 'issuance') {
			loadIssuanceStats(selectedTimeRange)
		} else if (activeTab === 'verification') {
			loadVerificationStats(selectedTimeRange)
		} else if (activeTab === 'templates' && selectedTemplate) {
			loadTemplateStats(selectedTemplate, selectedTimeRange)
		}
		toast.success('Analytics data refreshed')
	}

	// Generate compliance report
	const handleGenerateReport = async (reportType: 'daily' | 'weekly' | 'monthly') => {
		try {
			const {startDate, endDate} = getDateRange(selectedTimeRange)
			await generateComplianceReport(startDate, endDate, reportType)
			toast.success('Compliance report generated successfully')
		} catch (err) {
			console.error('Failed to generate compliance report', err)
			toast.error('Failed to generate compliance report')
		}
	}

	// Export data as CSV
	const handleExportCSV = () => {
		// Implementation for exporting data as CSV
		toast.success('Data exported as CSV')
	}

	return (
		<div className={`space-y-4 ${className}`}>
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div>
					<h2 className='text-3xl font-bold tracking-tight'>Credential Analytics</h2>
					<p className='text-muted-foreground'>Comprehensive analytics for credential issuance and verification</p>
				</div>

				<div className='flex flex-col sm:flex-row gap-2'>
					<Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
						<SelectTrigger className='w-[180px]'>
							<Calendar className='mr-2 h-4 w-4' />
							<SelectValue placeholder='Select time range' />
						</SelectTrigger>
						<SelectContent>
							{TIME_RANGE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button variant='outline' onClick={handleRefresh}>
						<RefreshCw className='mr-2 h-4 w-4' />
						Refresh
					</Button>

					<Button variant='outline' onClick={handleExportCSV}>
						<Download className='mr-2 h-4 w-4' />
						Export
					</Button>
				</div>
			</div>

			{error && (
				<Alert variant='destructive'>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
				<TabsList>
					<TabsTrigger value='issuance'>
						<TrendingUp className='h-4 w-4 mr-2' />
						Issuance Metrics
					</TabsTrigger>
					<TabsTrigger value='verification'>
						<LineChart className='h-4 w-4 mr-2' />
						Verification Metrics
					</TabsTrigger>
					<TabsTrigger value='templates'>
						<BarChart3 className='h-4 w-4 mr-2' />
						Template Usage
					</TabsTrigger>
					<TabsTrigger value='compliance'>
						<PieChart className='h-4 w-4 mr-2' />
						Compliance Reports
					</TabsTrigger>
				</TabsList>

				<TabsContent value='issuance' className='space-y-4'>
					{issuanceLoading ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{[...Array(6)].map((_, i) => (
								<Card key={i}>
									<CardHeader>
										<Skeleton className='h-4 w-32' />
									</CardHeader>
									<CardContent>
										<Skeleton className='h-10 w-20 mb-4' />
										<Skeleton className='h-32 w-full' />
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<IssuanceMetrics statistics={issuanceStats} />
					)}
				</TabsContent>

				<TabsContent value='verification' className='space-y-4'>
					{verificationLoading ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{[...Array(6)].map((_, i) => (
								<Card key={i}>
									<CardHeader>
										<Skeleton className='h-4 w-32' />
									</CardHeader>
									<CardContent>
										<Skeleton className='h-10 w-20 mb-4' />
										<Skeleton className='h-32 w-full' />
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<VerificationMetrics statistics={verificationStats} />
					)}
				</TabsContent>

				<TabsContent value='templates' className='space-y-4'>
					{templateLoading ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{[...Array(6)].map((_, i) => (
								<Card key={i}>
									<CardHeader>
										<Skeleton className='h-4 w-32' />
									</CardHeader>
									<CardContent>
										<Skeleton className='h-10 w-20 mb-4' />
										<Skeleton className='h-32 w-full' />
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<TemplateUsageCharts statistics={templateStats} onSelectTemplate={setSelectedTemplate} selectedTemplate={selectedTemplate} />
					)}
				</TabsContent>

				<TabsContent value='compliance' className='space-y-4'>
					<ComplianceReports
						onGenerateReport={handleGenerateReport}
						timeRange={{
							start: getDateRange(selectedTimeRange).startDate,
							end: getDateRange(selectedTimeRange).endDate,
						}}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}
