import React from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {CheckCircle, Clock, XCircle, AlertTriangle, Ban, FileText, TrendingUp, Users, Calendar} from 'lucide-react'
import {PresentationStatus} from '@/types/presentations'

interface PresentationStatsProps {
	stats: {
		total: number
		verified: number
		pending: number
		rejected: number
		expired: number
		revoked: number
		draft: number
		submitted: number
	}
	timeframe?: string
	className?: string
}

/**
 * PresentationStats - Dashboard statistics for presentations
 */
export function PresentationStats({stats, timeframe = 'All time', className = ''}: PresentationStatsProps) {
	const statItems = [
		{
			label: 'Total Presentations',
			value: stats.total,
			icon: FileText,
			color: 'text-blue-600',
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-200',
		},
		{
			label: 'Verified',
			value: stats.verified,
			icon: CheckCircle,
			color: 'text-green-600',
			bgColor: 'bg-green-50',
			borderColor: 'border-green-200',
		},
		{
			label: 'Pending',
			value: stats.pending,
			icon: Clock,
			color: 'text-yellow-600',
			bgColor: 'bg-yellow-50',
			borderColor: 'border-yellow-200',
		},
		{
			label: 'Submitted',
			value: stats.submitted,
			icon: TrendingUp,
			color: 'text-blue-600',
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-200',
		},
	]

	const warningStats = [
		{
			label: 'Rejected',
			value: stats.rejected,
			icon: XCircle,
			color: 'text-red-600',
		},
		{
			label: 'Expired',
			value: stats.expired,
			icon: AlertTriangle,
			color: 'text-orange-600',
		},
		{
			label: 'Revoked',
			value: stats.revoked,
			icon: Ban,
			color: 'text-red-600',
		},
	]

	const verificationRate = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h3 className='text-lg font-semibold'>Presentation Statistics</h3>
					<p className='text-sm text-muted-foreground flex items-center gap-1'>
						<Calendar className='h-4 w-4' />
						{timeframe}
					</p>
				</div>
				<Badge variant='outline' className='text-sm'>
					{verificationRate}% verified
				</Badge>
			</div>

			{/* Main Stats Grid */}
			<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
				{statItems.map((stat, index) => {
					const Icon = stat.icon
					return (
						<Card key={index} className={`${stat.borderColor} border-2`}>
							<CardContent className='p-4'>
								<div className='flex items-center space-x-2'>
									<div className={`p-2 rounded-lg ${stat.bgColor}`}>
										<Icon className={`h-4 w-4 ${stat.color}`} />
									</div>
									<div>
										<p className='text-2xl font-bold'>{stat.value}</p>
										<p className='text-xs text-muted-foreground'>{stat.label}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{/* Warning Stats (if any exist) */}
			{(stats.rejected > 0 || stats.expired > 0 || stats.revoked > 0) && (
				<Card className='border-orange-200 bg-orange-50/50'>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium flex items-center gap-2'>
							<AlertTriangle className='h-4 w-4 text-orange-600' />
							Issues Requiring Attention
						</CardTitle>
					</CardHeader>
					<CardContent className='pt-0'>
						<div className='grid grid-cols-3 gap-4'>
							{warningStats.map((stat, index) => {
								if (stat.value === 0) return null
								const Icon = stat.icon
								return (
									<div key={index} className='flex items-center space-x-2'>
										<Icon className={`h-4 w-4 ${stat.color}`} />
										<div>
											<p className='font-semibold'>{stat.value}</p>
											<p className='text-xs text-muted-foreground'>{stat.label}</p>
										</div>
									</div>
								)
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Quick Insights */}
			<Card>
				<CardHeader className='pb-3'>
					<CardTitle className='text-sm font-medium flex items-center gap-2'>
						<Users className='h-4 w-4' />
						Quick Insights
					</CardTitle>
				</CardHeader>
				<CardContent className='pt-0'>
					<div className='space-y-2 text-sm'>
						{stats.total === 0 && <p className='text-muted-foreground'>No presentations created yet.</p>}
						{stats.pending > 0 && (
							<p className='text-yellow-600'>
								{stats.pending} presentation{stats.pending > 1 ? 's' : ''} awaiting verification.
							</p>
						)}
						{verificationRate >= 80 && stats.total > 0 && <p className='text-green-600'>Great verification rate!</p>}
						{stats.expired > 0 && (
							<p className='text-orange-600'>
								{stats.expired} presentation{stats.expired > 1 ? 's' : ''} have expired and may need renewal.
							</p>
						)}
						{stats.draft > 0 && (
							<p className='text-blue-600'>
								{stats.draft} draft presentation{stats.draft > 1 ? 's' : ''} ready to submit.
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
