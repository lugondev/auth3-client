'use client'

import React from 'react'
import {VerificationStatistics, VerifierStat} from '@/services/analyticsService'
import {AnalyticsCard} from '@/components/analytics/AnalyticsCard'
import {AnalyticsChart} from '@/components/analytics/AnalyticsChart'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {CheckCircle, Clock, LineChart} from 'lucide-react'

interface VerificationMetricsProps {
	statistics: VerificationStatistics | null
}

export function VerificationMetrics({statistics}: VerificationMetricsProps) {
	if (!statistics) {
		return <div className='text-center p-6'>No verification data available for the selected timeframe</div>
	}

	// Process time series data for chart compatibility
	const verificationsByTimeData = statistics.verificationsByTime.map((item) => ({
		date: new Date(item.timestamp).toLocaleDateString(),
		count: item.count,
	}))

	// Format the verification result data for pie chart
	const resultData = statistics.verificationsByResult.map((item) => ({
		name: item.result,
		value: item.count,
	}))

	// Format method data for the bar chart
	const methodData = statistics.verificationsByMethod.map((item) => ({
		name: item.method,
		count: item.count,
	}))

	// Format failure reasons data for bar chart
	const failureData = statistics.commonFailureReasons.map((item) => ({
		name: item.reason,
		count: item.count,
	}))

	return (
		<div className='space-y-6'>
			{/* Key metrics */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				<AnalyticsCard title='Total Verifications' value={statistics.totalVerifications.toLocaleString()} icon={LineChart} />
				<AnalyticsCard title='Success Rate' value={`${(statistics.successRate * 100).toFixed(1)}%`} icon={CheckCircle} trend={statistics.successRate >= 0.9 ? {value: statistics.successRate * 100, isPositive: true} : {value: 100 - statistics.successRate * 100, isPositive: false}} />
				<AnalyticsCard title='Today' value={statistics.verificationsToday.toLocaleString()} icon={LineChart} />
				<AnalyticsCard title='Average Time' value={`${statistics.avgVerificationTime.toFixed(2)}s`} icon={Clock} />
			</div>

			{/* Verification trend chart */}
			<AnalyticsChart title='Verification Trend' data={verificationsByTimeData} type='area' dataKey='count' xAxisKey='date' height={300} colors={['#82ca9d']} />

			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				{/* Results Distribution */}
				<AnalyticsChart title='Verification Results' data={resultData} type='pie' dataKey='value' height={300} colors={['#82ca9d', '#ff7c7c', '#ffc658']} />

				{/* Verification Methods */}
				<AnalyticsChart title='Verification Methods' data={methodData} type='bar' dataKey='count' xAxisKey='name' height={300} colors={['#8884d8']} />
			</div>

			{/* Failure Reasons */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg font-semibold'>Common Failure Reasons</CardTitle>
				</CardHeader>
				<CardContent>{statistics.commonFailureReasons.length > 0 ? <AnalyticsChart title='' data={failureData} type='bar' dataKey='count' xAxisKey='name' height={200} colors={['#ff7c7c']} className='mt-0 border-0 shadow-none' /> : <p className='text-center text-muted-foreground'>No failure data available</p>}</CardContent>
			</Card>

			{/* Top Verifiers */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg font-semibold'>Top Verifiers</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Verifier</TableHead>
								<TableHead>DID</TableHead>
								<TableHead className='text-right'>Verifications</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{statistics.topVerifiers.map((verifier: VerifierStat, index: number) => (
								<TableRow key={index}>
									<TableCell>{verifier.verifierName || 'Unknown'}</TableCell>
									<TableCell className='font-mono text-xs'>{verifier.verifierDid}</TableCell>
									<TableCell className='text-right'>{verifier.count.toLocaleString()}</TableCell>
								</TableRow>
							))}
							{statistics.topVerifiers.length === 0 && (
								<TableRow>
									<TableCell colSpan={3} className='text-center'>
										No verifier data available
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
