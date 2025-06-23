'use client'

import React from 'react'
import {IssuanceStatistics, IssuerStat, TemplateStat} from '@/services/analyticsService'
import {AnalyticsCard} from '@/components/analytics/AnalyticsCard'
import {AnalyticsChart} from '@/components/analytics/AnalyticsChart'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {TrendingUp, Clock} from 'lucide-react'

interface IssuanceMetricsProps {
	statistics: IssuanceStatistics | null
}

export function IssuanceMetrics({statistics}: IssuanceMetricsProps) {
	if (!statistics) {
		return <div className='text-center p-6'>No issuance data available for the selected timeframe</div>
	}

	// Process time series data for chart compatibility
	const issuanceByTimeData = statistics.issuanceByTime.map((item) => ({
		date: new Date(item.timestamp).toLocaleDateString(),
		count: item.count,
	}))

	// Format the credential type data for pie chart
	const credentialTypeData = statistics.issuanceByCredentialType.map((item) => ({
		name: item.typeUri.split('#').pop() || item.typeUri,
		value: item.count,
	}))

	// Format status data for the bar chart
	const statusData = statistics.issuanceByStatus.map((item) => ({
		name: item.status,
		count: item.count,
	}))

	return (
		<div className='space-y-6'>
			{/* Key metrics */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				<AnalyticsCard title='Total Issued' value={statistics.totalIssued.toLocaleString()} icon={TrendingUp} />
				<AnalyticsCard title='Issued Today' value={statistics.issuedToday.toLocaleString()} icon={TrendingUp} />
				<AnalyticsCard title='This Week' value={statistics.issuedThisWeek.toLocaleString()} icon={TrendingUp} />
				<AnalyticsCard title='Average Time' value={`${statistics.avgIssuanceTime.toFixed(2)}s`} icon={Clock} />
			</div>

			{/* Issuance trend chart */}
			<AnalyticsChart title='Issuance Trend' data={issuanceByTimeData} type='area' dataKey='count' xAxisKey='date' height={300} colors={['#8884d8']} />

			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				{/* Credential Types Distribution */}
				<AnalyticsChart title='Credential Types Distribution' data={credentialTypeData} type='pie' dataKey='value' height={300} />

				{/* Status Distribution */}
				<AnalyticsChart title='Status Distribution' data={statusData} type='bar' dataKey='count' xAxisKey='name' height={300} colors={['#82ca9d']} />
			</div>

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
								<TableHead>DID</TableHead>
								<TableHead className='text-right'>Credentials</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{statistics.topIssuers.map((issuer: IssuerStat, index: number) => (
								<TableRow key={index}>
									<TableCell>{issuer.issuerName || 'Unknown'}</TableCell>
									<TableCell className='font-mono text-xs'>{issuer.issuerDid}</TableCell>
									<TableCell className='text-right'>{issuer.count.toLocaleString()}</TableCell>
								</TableRow>
							))}
							{statistics.topIssuers.length === 0 && (
								<TableRow>
									<TableCell colSpan={3} className='text-center'>
										No issuer data available
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Top Templates */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg font-semibold'>Top Templates</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Template Name</TableHead>
								<TableHead>ID</TableHead>
								<TableHead className='text-right'>Usage Count</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{statistics.topTemplates.map((template: TemplateStat, index: number) => (
								<TableRow key={index}>
									<TableCell>{template.templateName || 'Unknown'}</TableCell>
									<TableCell className='font-mono text-xs'>{template.templateId}</TableCell>
									<TableCell className='text-right'>{template.count.toLocaleString()}</TableCell>
								</TableRow>
							))}
							{statistics.topTemplates.length === 0 && (
								<TableRow>
									<TableCell colSpan={3} className='text-center'>
										No template data available
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	)
}
