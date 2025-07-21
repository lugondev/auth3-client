'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, BarChart3, Users, Shield, Key } from 'lucide-react'

interface QuickAnalyticsWidgetProps {
	className?: string
}

export function QuickAnalyticsWidget({ className }: QuickAnalyticsWidgetProps) {
	const [selectedRange, setSelectedRange] = useState<'last_hour' | 'last_24h' | 'last_week' | 'last_month'>('last_24h')

	// Mock data for demonstration - replace with actual API calls
	const mockData = {
		oauth2: { total_flows: 1250, success_rate: 0.94, trend_percentage: 5.2 },
		did: { total_created: 340, success_rate: 0.98, trend_percentage: 12.5 },
		tenant: { active_tenants: 45, total_requests: 8900, growth_percentage: 8.3 },
		kms: { total_operations: 2100, success_rate: 0.99, trend_percentage: -2.1 }
	}

	const formatNumber = (num: number): string => {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
		return num.toString()
	}

	const TrendIndicator = ({ value }: { value: number }) => {
		const isPositive = value > 0
		const Icon = isPositive ? TrendingUp : TrendingDown
		const color = isPositive ? 'text-green-600' : 'text-red-600'
		
		return (
			<div className={`flex items-center gap-1 ${color}`}>
				<Icon className="h-3 w-3" />
				<span className="text-xs font-medium">{Math.abs(value).toFixed(1)}%</span>
			</div>
		)
	}

	return (
		<Card className={className}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div>
					<CardTitle className="text-base font-medium">Quick Analytics</CardTitle>
					<CardDescription>Key metrics overview</CardDescription>
				</div>
				<Select value={selectedRange} onValueChange={(value: 'last_hour' | 'last_24h' | 'last_week' | 'last_month') => setSelectedRange(value)}>
					<SelectTrigger className="w-32">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="last_hour">Last Hour</SelectItem>
						<SelectItem value="last_24h">Last 24h</SelectItem>
						<SelectItem value="last_week">Last Week</SelectItem>
						<SelectItem value="last_month">Last Month</SelectItem>
					</SelectContent>
				</Select>
			</CardHeader>
			
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					{/* OAuth2 Flows */}
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Shield className="h-3 w-3" />
							OAuth2 Flows
						</div>
						<div className="flex items-center justify-between">
							<span className="text-lg font-semibold">
								{formatNumber(mockData.oauth2.total_flows)}
							</span>
							<TrendIndicator value={mockData.oauth2.trend_percentage} />
						</div>
						<div className="text-xs text-muted-foreground">
							{(mockData.oauth2.success_rate * 100).toFixed(1)}% success
						</div>
					</div>

					{/* DID Creation */}
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Users className="h-3 w-3" />
							DIDs Created
						</div>
						<div className="flex items-center justify-between">
							<span className="text-lg font-semibold">
								{formatNumber(mockData.did.total_created)}
							</span>
							<TrendIndicator value={mockData.did.trend_percentage} />
						</div>
						<div className="text-xs text-muted-foreground">
							{(mockData.did.success_rate * 100).toFixed(1)}% success
						</div>
					</div>

					{/* Tenant Usage */}
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<BarChart3 className="h-3 w-3" />
							Active Tenants
						</div>
						<div className="flex items-center justify-between">
							<span className="text-lg font-semibold">
								{formatNumber(mockData.tenant.active_tenants)}
							</span>
							<TrendIndicator value={mockData.tenant.growth_percentage} />
						</div>
						<div className="text-xs text-muted-foreground">
							{formatNumber(mockData.tenant.total_requests)} requests
						</div>
					</div>

					{/* KMS Operations */}
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Key className="h-3 w-3" />
							KMS Operations
						</div>
						<div className="flex items-center justify-between">
							<span className="text-lg font-semibold">
								{formatNumber(mockData.kms.total_operations)}
							</span>
							<TrendIndicator value={mockData.kms.trend_percentage} />
						</div>
						<div className="text-xs text-muted-foreground">
							{(mockData.kms.success_rate * 100).toFixed(1)}% success
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
