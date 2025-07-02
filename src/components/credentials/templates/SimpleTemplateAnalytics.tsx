'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {BarChart3, TrendingUp, Users, FileText, Calendar, Award} from 'lucide-react'

/**
 * Simple Template Analytics Component
 * Lightweight version without external API calls for development
 */
export function SimpleTemplateAnalytics() {
	const [analytics, setAnalytics] = useState({
		totalCredentials: 0,
		successRate: 0,
		activeTemplates: 0,
		popularTemplate: 'Loading...',
		avgIssuanceTime: 0,
	})
	const [loaded, setLoaded] = useState(false)

	useEffect(() => {
		// Simulate loading with mock data
		const timer = setTimeout(() => {
			setAnalytics({
				totalCredentials: 1247,
				successRate: 94.2,
				activeTemplates: 8,
				popularTemplate: 'Education Certificate',
				avgIssuanceTime: 2.3,
			})
			setLoaded(true)
		}, 1000)

		return () => clearTimeout(timer)
	}, [])

	const mockChartData = [
		{ name: 'Education Certificate', usage: 85, success: 80, failed: 5 },
		{ name: 'Employment Badge', usage: 67, success: 62, failed: 5 },
		{ name: 'Identity Card', usage: 45, success: 42, failed: 3 },
		{ name: 'License Document', usage: 32, success: 30, failed: 2 },
	]

	return (
		<div className="space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Template Analytics
						<Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
							Demo
						</Badge>
					</CardTitle>
					<CardDescription>
						Simplified analytics dashboard for development testing
					</CardDescription>
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
						<div className="text-2xl font-bold">
							{loaded ? analytics.totalCredentials.toLocaleString() : '...'}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<TrendingUp className="h-4 w-4 text-green-500" />
							<span className="text-sm font-medium">Success Rate</span>
						</div>
						<div className="text-2xl font-bold text-green-600">
							{loaded ? `${analytics.successRate}%` : '...'}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<Users className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Active Templates</span>
						</div>
						<div className="text-2xl font-bold">
							{loaded ? analytics.activeTemplates : '...'}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<Award className="h-4 w-4 text-orange-500" />
							<span className="text-sm font-medium">Most Popular</span>
						</div>
						<div className="text-sm font-semibold truncate" title={analytics.popularTemplate}>
							{loaded ? analytics.popularTemplate : 'Loading...'}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Avg. Issue Time</span>
						</div>
						<div className="text-2xl font-bold">
							{loaded ? `${analytics.avgIssuanceTime}s` : '...'}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Simple Template Usage Table */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Template Usage Summary</CardTitle>
					<CardDescription>Most active templates and their performance</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{mockChartData.map((template, index) => (
							<div key={template.name} className="flex items-center justify-between p-3 rounded border">
								<div className="flex items-center gap-3">
									<span className="font-medium text-sm">#{index + 1}</span>
									<div>
										<p className="font-medium text-sm">{template.name}</p>
										<p className="text-xs text-muted-foreground">
											{template.success} successful, {template.failed} failed
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant="outline">{template.usage} issued</Badge>
									<div className="text-right">
										<p className="text-sm font-medium text-green-600">
											{((template.success / template.usage) * 100).toFixed(1)}%
										</p>
										<p className="text-xs text-muted-foreground">success rate</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Status */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 bg-green-500 rounded-full"></div>
							<span className="text-sm text-muted-foreground">
								Analytics system operational - Demo mode
							</span>
						</div>
						<Button variant="outline" size="sm" disabled>
							Export Report
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
