'use client'

import React, {useState, useEffect} from 'react'
import {TemplateUsageStats, IssuerStat} from '@/services/analyticsService'
import {AnalyticsCard} from '@/components/analytics/AnalyticsCard'
import {AnalyticsChart} from '@/components/analytics/AnalyticsChart'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {FileText, Clock, TrendingUp} from 'lucide-react'
import {Skeleton} from '@/components/ui/skeleton'

interface TemplateUsageChartsProps {
	statistics: TemplateUsageStats | null
	selectedTemplate: string | null
	onSelectTemplate: (templateId: string) => void
}

interface TemplateOption {
	id: string
	name: string
}

export function TemplateUsageCharts({statistics, selectedTemplate, onSelectTemplate}: TemplateUsageChartsProps) {
	const [templates, setTemplates] = useState<TemplateOption[]>([])
	const [loading, setLoading] = useState<boolean>(false)

	// Effect to fetch available templates
	useEffect(() => {
		const fetchTemplates = async () => {
			try {
				setLoading(true)
				// Here we would normally call an API to get all templates
				// For now, using mock data until backend endpoint is ready
				setTemplates([
					{id: 'template-1', name: 'Educational Credential'},
					{id: 'template-2', name: 'Employment Certificate'},
					{id: 'template-3', name: 'Identity Verification'},
					{id: 'template-4', name: 'Membership Card'},
					{id: 'template-5', name: 'Professional License'},
				])

				// Select the first template if none is selected
				if (!selectedTemplate && templates.length > 0) {
					onSelectTemplate(templates[0].id)
				}
			} catch (err) {
				console.error('Failed to fetch templates', err)
			} finally {
				setLoading(false)
			}
		}

		fetchTemplates()
	}, [onSelectTemplate, selectedTemplate, templates])

	if (loading) {
		return (
			<div className='space-y-6'>
				<Skeleton className='h-10 w-40 mb-6' />
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					{[...Array(3)].map((_, i) => (
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
			</div>
		)
	}

	if (!selectedTemplate) {
		return (
			<div className='text-center p-6'>
				Please select a template to view analytics
				<div className='w-[300px] mx-auto mt-4'>
					<Select value={selectedTemplate || ''} onValueChange={onSelectTemplate}>
						<SelectTrigger>
							<SelectValue placeholder='Select a template' />
						</SelectTrigger>
						<SelectContent>
							{templates.map((template) => (
								<SelectItem key={template.id} value={template.id}>
									{template.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		)
	}

	if (!statistics) {
		return <div className='text-center p-6'>No usage data available for the selected template</div>
	}

	// Process time series data for chart compatibility
	const issuanceByTimeData = statistics.issuanceByTime.map((item) => ({
		date: new Date(item.timestamp).toLocaleDateString(),
		count: item.count,
	}))

	// Format the usage distribution data for pie chart
	const distributionData = statistics.usageDistribution.map((item) => ({
		name: item.category,
		value: item.count,
	}))

	return (
		<div className='space-y-6'>
			{/* Template selector */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<h2 className='text-xl font-semibold'>{statistics.templateName}</h2>
				<div className='w-[300px]'>
					<Select value={selectedTemplate} onValueChange={onSelectTemplate}>
						<SelectTrigger>
							<SelectValue placeholder='Select a template' />
						</SelectTrigger>
						<SelectContent>
							{templates.map((template) => (
								<SelectItem key={template.id} value={template.id}>
									{template.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Key metrics */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<AnalyticsCard title='Total Credentials' value={statistics.totalCredentialsIssued.toLocaleString()} icon={FileText} />
				<AnalyticsCard title='This Month' value={statistics.issuedThisMonth.toLocaleString()} icon={TrendingUp} />
				<AnalyticsCard title='Average Time' value={`${statistics.avgIssuanceTime.toFixed(2)}s`} icon={Clock} />
			</div>

			{/* Issuance trend chart */}
			<AnalyticsChart title='Issuance Trend' data={issuanceByTimeData} type='area' dataKey='count' xAxisKey='date' height={300} colors={['#8884d8']} />

			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				{/* Usage Distribution */}
				<Card>
					<CardHeader>
						<CardTitle className='text-lg font-semibold'>Usage Distribution</CardTitle>
					</CardHeader>
					<CardContent>{statistics.usageDistribution.length > 0 ? <AnalyticsChart title='' data={distributionData} type='pie' dataKey='value' height={300} className='mt-0 border-0 shadow-none' /> : <p className='text-center text-muted-foreground'>No distribution data available</p>}</CardContent>
				</Card>

				{/* Top Issuers */}
				<Card>
					<CardHeader>
						<CardTitle className='text-lg font-semibold'>Top Issuers</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Issuer</TableHead>
									<TableHead className='text-right'>Count</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{statistics.topIssuers.map((issuer: IssuerStat, index: number) => (
									<TableRow key={index}>
										<TableCell>{issuer.issuerName || issuer.issuerDid}</TableCell>
										<TableCell className='text-right'>{issuer.count.toLocaleString()}</TableCell>
									</TableRow>
								))}
								{statistics.topIssuers.length === 0 && (
									<TableRow>
										<TableCell colSpan={2} className='text-center'>
											No issuer data available
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
