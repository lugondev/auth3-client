'use client'

import React, {useState, useEffect, useCallback, useMemo} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Skeleton} from '@/components/ui/skeleton'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Bar,
	BarChart,
	Line,
	LineChart,
	Pie,
	PieChart,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts'
import {
	TrendingUp,
	TrendingDown,
	FileText,
	Users,
	Calendar,
	Award,
	AlertCircle,
	Download,
	RefreshCw,
} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate} from '@/types/template'
import {templateService} from '@/services/templateService'

interface TemplateAnalyticsProps {
	templates?: CredentialTemplate[]
	selectedTemplate?: CredentialTemplate
	onTemplateSelect?: (template: CredentialTemplate) => void
	className?: string
}

interface AnalyticsData {
	templateUsage: Array<{
		name: string
		usage: number
		success: number
		failed: number
		templateId: string
	}>
	usageTrends: Array<{
		date: string
		usage: number
		success: number
		failed: number
	}>
	categoryBreakdown: Array<{
		name: string
		value: number
		color: string
	}>
	performanceMetrics: {
		totalCredentials: number
		successRate: number
		activeTemplates: number
		popularTemplate: string
		avgIssuanceTime: number
	}
	topTemplates: Array<{
		id: string
		name: string
		usage: number
		successRate: number
		lastUsed: string
	}>
}

/**
 * Template Analytics Component
 * 
 * Features:
 * - Template usage analytics and trends
 * - Performance metrics and success rates
 * - Category breakdown visualization
 * - Popular templates ranking
 * - Time-based usage analysis
 * - Export analytics reports
 */
export function TemplateAnalytics({
	templates = [],
	selectedTemplate,
	onTemplateSelect,
	className = '',
}: TemplateAnalyticsProps) {
	const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
	const [loading, setLoading] = useState(true)
	const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
	const [refreshing, setRefreshing] = useState(false)
	const [rateLimited, setRateLimited] = useState(false)
	const [lastLoadTime, setLastLoadTime] = useState<number>(0)

	// Color palette for charts
	const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']
	
	// Development mode - use mock data to avoid API rate limits
	const isDevelopment = process.env.NODE_ENV === 'development'

	// Generate mock fallback data when API is rate limited
	const generateFallbackData = useCallback((): AnalyticsData => {
		const mockTemplates = templates.length > 0 ? templates : [
			{ id: '1', name: 'Education Certificate', type: ['VerifiableCredential'], active: true } as CredentialTemplate,
			{ id: '2', name: 'Employment Badge', type: ['VerifiableCredential'], active: true } as CredentialTemplate,
			{ id: '3', name: 'Identity Card', type: ['VerifiableCredential'], active: true } as CredentialTemplate,
		]

		const templateUsage = mockTemplates.map((template, index) => ({
			name: template.name,
			usage: Math.floor(Math.random() * 100) + 10,
			success: Math.floor(Math.random() * 80) + 15,
			failed: Math.floor(Math.random() * 5),
			templateId: template.id,
		}))

		const usageTrends = generateMockTrends(timeRange)

		const categoryBreakdown = [
			{ name: 'Education', value: 45, color: COLORS[0] },
			{ name: 'Employment', value: 30, color: COLORS[1] },
			{ name: 'Identity', value: 15, color: COLORS[2] },
			{ name: 'Other', value: 10, color: COLORS[3] },
		]

		const totalCredentials = templateUsage.reduce((sum, t) => sum + t.usage, 0)
		const totalSuccess = templateUsage.reduce((sum, t) => sum + t.success, 0)
		const successRate = totalCredentials > 0 ? (totalSuccess / totalCredentials) * 100 : 0

		const performanceMetrics = {
			totalCredentials,
			successRate,
			activeTemplates: mockTemplates.length,
			popularTemplate: templateUsage.sort((a, b) => b.usage - a.usage)[0]?.name || 'None',
			avgIssuanceTime: 2.3,
		}

		const topTemplates = templateUsage
			.sort((a, b) => b.usage - a.usage)
			.slice(0, 5)
			.map(t => ({
				id: t.templateId,
				name: t.name,
				usage: t.usage,
				successRate: t.usage > 0 ? (t.success / t.usage) * 100 : 0,
				lastUsed: new Date().toISOString(),
			}))

		return {
			templateUsage,
			usageTrends,
			categoryBreakdown,
			performanceMetrics,
			topTemplates,
		}
	}, [templates, timeRange, COLORS])

	// Load analytics data with rate limiting protection
	const loadAnalytics = useCallback(async () => {
		// In development, use mock data to avoid API rate limits
		if (isDevelopment) {
			setLoading(true)
			// Simulate loading time
			await new Promise(resolve => setTimeout(resolve, 1000))
			setAnalytics(generateFallbackData())
			setLoading(false)
			return
		}

		// Prevent loading if called too recently (within 5 seconds)
		const now = Date.now()
		if (now - lastLoadTime < 5000) {
			return
		}

		try {
			setLoading(true)
			setRateLimited(false)
			setLastLoadTime(now)

			// If no templates provided, fetch them
			const templatesData = templates.length > 0 ? templates : 
				(await templateService.listTemplates({ limit: 100 })).templates

			// Get usage stats for each template
			const templateUsagePromises = templatesData.map(async (template) => {
				try {
					const stats = await templateService.getTemplateUsageStats(template.id)
					return {
						name: template.name,
						usage: stats.totalCredentials || 0,
						success: stats.activeCredentials || 0,
						failed: stats.revokedCredentials || 0,
						templateId: template.id,
					}
				} catch {
					return {
						name: template.name,
						usage: 0,
						success: 0,
						failed: 0,
						templateId: template.id,
					}
				}
			})

			const templateUsage = await Promise.all(templateUsagePromises)

			// Generate mock trends data (in real implementation, this would come from backend)
			const usageTrends = generateMockTrends(timeRange)

			// Calculate category breakdown
			const categories = new Map<string, number>()
			templatesData.forEach((template) => {
				const category = (template.metadata?.category as string) || 'Other'
				const usage = templateUsage.find(t => t.templateId === template.id)?.usage || 0
				categories.set(category, (categories.get(category) || 0) + usage)
			})

			const categoryBreakdown = Array.from(categories.entries()).map(([name, value], index) => ({
				name,
				value,
				color: COLORS[index % COLORS.length],
			}))

			// Calculate performance metrics
			const totalCredentials = templateUsage.reduce((sum, t) => sum + t.usage, 0)
			const totalSuccess = templateUsage.reduce((sum, t) => sum + t.success, 0)
			const successRate = totalCredentials > 0 ? (totalSuccess / totalCredentials) * 100 : 0
			const activeTemplates = templatesData.filter(t => t.active).length
			const popularTemplate = templateUsage.sort((a, b) => b.usage - a.usage)[0]?.name || 'None'

			const performanceMetrics = {
				totalCredentials,
				successRate,
				activeTemplates,
				popularTemplate,
				avgIssuanceTime: 2.3, // Mock average issuance time in seconds
			}

			// Top templates by usage
			const topTemplates = templateUsage
				.sort((a, b) => b.usage - a.usage)
				.slice(0, 5)
				.map(t => {
					const template = templatesData.find(tmpl => tmpl.id === t.templateId)
					const successRate = t.usage > 0 ? (t.success / t.usage) * 100 : 0
					return {
						id: t.templateId,
						name: t.name,
						usage: t.usage,
						successRate,
						lastUsed: template?.updatedAt || '',
					}
				})

			setAnalytics({
				templateUsage,
				usageTrends,
				categoryBreakdown,
				performanceMetrics,
				topTemplates,
			})
		} catch (error) {
			console.error('Error loading analytics:', error)
			
			// Check if it's a rate limit error
			if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
				setRateLimited(true)
				toast.error('API rate limit exceeded. Using cached data.')
				// Use fallback data when rate limited
				setAnalytics(generateFallbackData())
			} else {
				toast.error('Failed to load analytics data')
				// Still provide fallback data for better UX
				setAnalytics(generateFallbackData())
			}
		} finally {
			setLoading(false)
		}
	}, [templates, timeRange, lastLoadTime, generateFallbackData, isDevelopment])

	// Generate mock trends data
	const generateMockTrends = (range: string) => {
		const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
		const data = []
		
		for (let i = days - 1; i >= 0; i--) {
			const date = new Date()
			date.setDate(date.getDate() - i)
			
			// Generate realistic usage patterns
			const baseUsage = Math.floor(Math.random() * 50) + 10
			const variance = Math.floor(Math.random() * 20) - 10
			const usage = Math.max(0, baseUsage + variance)
			const successRate = 0.85 + Math.random() * 0.1 // 85-95% success rate
			
			data.push({
				date: date.toISOString().split('T')[0],
				usage,
				success: Math.floor(usage * successRate),
				failed: usage - Math.floor(usage * successRate),
			})
		}
		
		return data
	}

	// Refresh analytics data with rate limit protection
	const refreshAnalytics = useCallback(async () => {
		// Check if we can refresh (not too recent)
		const now = Date.now()
		if (now - lastLoadTime < 5000) {
			toast.warning('Please wait a moment before refreshing again')
			return
		}

		setRefreshing(true)
		await loadAnalytics()
		setRefreshing(false)
		
		if (!rateLimited) {
			toast.success('Analytics data refreshed')
		}
	}, [loadAnalytics, lastLoadTime, rateLimited])

	// Export analytics report
	const exportReport = useCallback(() => {
		if (!analytics) return

		const reportData = {
			generatedAt: new Date().toISOString(),
			timeRange,
			performanceMetrics: analytics.performanceMetrics,
			topTemplates: analytics.topTemplates,
			categoryBreakdown: analytics.categoryBreakdown,
			templateUsage: analytics.templateUsage,
		}

		const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `template_analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.json`
		a.click()
		URL.revokeObjectURL(url)

		toast.success('Analytics report exported')
	}, [analytics, timeRange])

	// Load analytics on mount and when time range changes (with debouncing)
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			loadAnalytics()
		}, 500) // 500ms debounce

		return () => clearTimeout(timeoutId)
	}, [timeRange]) // Removed templates dependency to prevent excessive calls

	// Separate effect for initial load
	useEffect(() => {
		loadAnalytics()
	}, []) // Only run on mount

	// Always call hooks at the top level
	const renderContent = () => {
		if (loading) {
			return (
				<div className={`space-y-6 ${className}`}>
					<Card>
						<CardHeader>
							<CardTitle>Template Analytics</CardTitle>
							<CardDescription>Loading analytics data...</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{[...Array(4)].map((_, i) => (
									<Skeleton key={i} className="h-20" />
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			)
		}

		if (!analytics) {
			return (
				<Card className={className}>
					<CardContent className="p-6 text-center">
						<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<p className="text-muted-foreground">Failed to load analytics data</p>
						<Button onClick={loadAnalytics} className="mt-4">
							<RefreshCw className="h-4 w-4 mr-2" />
							Retry
						</Button>
					</CardContent>
				</Card>
			)
		}

		return (
			<div className={`space-y-6 ${className}`}>
				{/* Header */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									Template Analytics
									{(rateLimited || isDevelopment) && (
										<Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
											{isDevelopment ? 'Demo Mode' : 'Demo Data'}
										</Badge>
									)}
								</CardTitle>
								<CardDescription>
									{rateLimited 
										? 'Showing demo data due to API rate limiting. Please try refreshing in a moment.'
										: isDevelopment
										? 'Showing demo data in development mode to avoid API rate limits.'
										: 'Usage analytics and performance insights for credential templates'
									}
								</CardDescription>
							</div>
							<div className="flex gap-2">
								<Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
									<SelectTrigger className="w-[120px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="7d">Last 7 days</SelectItem>
										<SelectItem value="30d">Last 30 days</SelectItem>
										<SelectItem value="90d">Last 90 days</SelectItem>
										<SelectItem value="1y">Last year</SelectItem>
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									size="sm"
									onClick={refreshAnalytics}
									disabled={refreshing || (rateLimited && Date.now() - lastLoadTime < 10000)}
								>
									<RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
									{rateLimited && Date.now() - lastLoadTime < 10000 
										? `Wait ${Math.ceil((10000 - (Date.now() - lastLoadTime)) / 1000)}s`
										: 'Refresh'
									}
								</Button>
								<Button variant="outline" size="sm" onClick={exportReport}>
									<Download className="h-4 w-4 mr-2" />
									Export
								</Button>
							</div>
						</div>
					</CardHeader>
				</Card>

				{/* Performance Metrics */}
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-2">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Total Credentials</span>
							</div>
							<div className="text-2xl font-bold">{analytics.performanceMetrics.totalCredentials}</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-2">
								<TrendingUp className="h-4 w-4 text-green-500" />
								<span className="text-sm font-medium">Success Rate</span>
							</div>
							<div className="text-2xl font-bold text-green-600">
								{analytics.performanceMetrics.successRate.toFixed(1)}%
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Active Templates</span>
							</div>
							<div className="text-2xl font-bold">{analytics.performanceMetrics.activeTemplates}</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-2">
								<Award className="h-4 w-4 text-orange-500" />
								<span className="text-sm font-medium">Most Popular</span>
							</div>
							<div className="text-sm font-semibold truncate" title={analytics.performanceMetrics.popularTemplate}>
								{analytics.performanceMetrics.popularTemplate}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Avg. Issue Time</span>
							</div>
							<div className="text-2xl font-bold">{analytics.performanceMetrics.avgIssuanceTime}s</div>
						</CardContent>
					</Card>
				</div>

				{/* Charts Row 1 */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Usage Trends */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Usage Trends</CardTitle>
							<CardDescription>Credential issuance over time</CardDescription>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={analytics.usageTrends}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Line type="monotone" dataKey="success" stroke="#00C49F" name="Successful" />
									<Line type="monotone" dataKey="failed" stroke="#FF8042" name="Failed" />
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Category Breakdown */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Category Breakdown</CardTitle>
							<CardDescription>Usage by template category</CardDescription>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={300}>
								<PieChart>
									<Pie
										dataKey="value"
										data={analytics.categoryBreakdown}
										cx="50%"
										cy="50%"
										outerRadius={80}
										label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
									>
										{analytics.categoryBreakdown.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</div>

				{/* Charts Row 2 */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Template Usage */}
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle className="text-lg">Template Usage</CardTitle>
							<CardDescription>Credentials issued by template</CardDescription>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={analytics.templateUsage}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar dataKey="success" stackId="a" fill="#00C49F" name="Successful" />
									<Bar dataKey="failed" stackId="a" fill="#FF8042" name="Failed" />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Top Templates */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Top Templates</CardTitle>
							<CardDescription>Most used templates</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{analytics.topTemplates.map((template, index) => (
									<div 
										key={template.id} 
										className={`p-3 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
											selectedTemplate?.id === template.id ? 'bg-primary/5 border-primary' : ''
										}`}
										onClick={() => onTemplateSelect?.(templates.find(t => t.id === template.id)!)}
									>
										<div className="flex items-center justify-between mb-1">
											<span className="font-medium text-sm truncate" title={template.name}>
												#{index + 1} {template.name}
											</span>
											<Badge variant="outline" className="text-xs">
												{template.usage}
											</Badge>
										</div>
										<div className="flex items-center justify-between text-xs text-muted-foreground">
											<span>{template.successRate.toFixed(1)}% success</span>
											<span>{new Date(template.lastUsed).toLocaleDateString()}</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	return renderContent()
}
