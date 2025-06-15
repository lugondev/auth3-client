'use client'

import React from 'react'
import {Card, CardContent} from '@/components/ui/card'
import {FileText, Users, Calendar, CheckCircle} from 'lucide-react'

interface TemplateStats {
	totalTemplates: number
	activeTemplates: number
	draftTemplates: number
	totalUsage: number
	recentActivity: number
}

export function TemplateStatistics({stats, loading}: {stats: TemplateStats | null; loading: boolean}) {
	if (loading) {
		return (
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardContent className='p-6'>
							<div className='animate-pulse'>
								<div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
								<div className='h-8 bg-gray-200 rounded w-1/2'></div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	if (!stats) {
		return null
	}

	const statisticsCards = [
		{
			title: 'Total Templates',
			value: stats.totalTemplates,
			icon: FileText,
			color: 'text-blue-600',
			bgColor: 'bg-blue-100',
		},
		{
			title: 'Active Templates',
			value: stats.activeTemplates,
			icon: CheckCircle,
			color: 'text-green-600',
			bgColor: 'bg-green-100',
		},
		{
			title: 'Total Usage',
			value: stats.totalUsage,
			icon: Users,
			color: 'text-purple-600',
			bgColor: 'bg-purple-100',
		},
		{
			title: 'Recent Activity',
			value: stats.recentActivity,
			icon: Calendar,
			color: 'text-orange-600',
			bgColor: 'bg-orange-100',
		},
	]

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
			{statisticsCards.map((stat, index) => {
				const Icon = stat.icon
				return (
					<Card key={index}>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600'>{stat.title}</p>
									<p className='text-2xl font-bold text-gray-900'>{stat.value}</p>
								</div>
								<div className={`p-3 rounded-full ${stat.bgColor}`}>
									<Icon className={`w-6 h-6 ${stat.color}`} />
								</div>
							</div>
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
