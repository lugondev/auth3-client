'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
	BarChart3, 
	Activity, 
	Shield, 
	Users, 
	Key, 
	FileText, 
	Database, 
	Server, 
	TrendingUp, 
	AlertTriangle,
	CheckCircle,
	ExternalLink
} from 'lucide-react'

interface AnalyticsSummaryProps {
	userRoles?: string[]
}

export function AnalyticsSummary({ userRoles = [] }: AnalyticsSummaryProps) {
	const isAdmin = userRoles.includes('admin') || userRoles.includes('system_admin')
	const isSystemAdmin = userRoles.includes('system_admin')

	const analyticsModules = [
		{
			title: 'OAuth2 Analytics',
			description: 'Monitor OAuth2 authorization flows, success rates, and performance metrics',
			href: '/dashboard/analytics/oauth2',
			icon: Shield,
			color: 'text-blue-600',
			bgColor: 'bg-blue-50 dark:bg-blue-900/20',
			borderColor: 'border-blue-200 dark:border-blue-800',
			metrics: {
				total: '12,345',
				trend: '+5.2%',
				status: 'healthy'
			},
			features: ['Authorization tracking', 'Success rate monitoring', 'Client analytics', 'Token metrics'],
			roles: ['admin', 'system_admin']
		},
		{
			title: 'DID Analytics',
			description: 'Track DID creation, resolution, and lifecycle management metrics',
			href: '/dashboard/analytics/did',
			icon: FileText,
			color: 'text-purple-600',
			bgColor: 'bg-purple-50 dark:bg-purple-900/20',
			borderColor: 'border-purple-200 dark:border-purple-800',
			metrics: {
				total: '8,921',
				trend: '+3.1%',
				status: 'healthy'
			},
			features: ['DID creation tracking', 'Resolution analytics', 'Method distribution', 'Lifecycle metrics'],
			roles: ['admin', 'system_admin']
		},
		{
			title: 'Tenant Analytics',
			description: 'Monitor tenant usage, growth patterns, and resource consumption',
			href: '/dashboard/analytics/tenant',
			icon: Users,
			color: 'text-green-600',
			bgColor: 'bg-green-50 dark:bg-green-900/20',
			borderColor: 'border-green-200 dark:border-green-800',
			metrics: {
				total: '2,456',
				trend: '+12.8%',
				status: 'growing'
			},
			features: ['Usage tracking', 'Growth analytics', 'Resource monitoring', 'Billing insights'],
			roles: ['admin', 'system_admin']
		},
		{
			title: 'KMS Analytics',
			description: 'Track key management operations, security metrics, and compliance',
			href: '/dashboard/analytics/kms',
			icon: Key,
			color: 'text-orange-600',
			bgColor: 'bg-orange-50 dark:bg-orange-900/20',
			borderColor: 'border-orange-200 dark:border-orange-800',
			metrics: {
				total: '45,678',
				trend: '+1.4%',
				status: 'secure'
			},
			features: ['Key lifecycle tracking', 'Security analytics', 'Compliance reporting', 'Usage patterns'],
			roles: ['admin', 'system_admin']
		},
		{
			title: 'System Analytics',
			description: 'Comprehensive system health, performance, and operational metrics',
			href: '/dashboard/analytics/system',
			icon: Server,
			color: 'text-red-600',
			bgColor: 'bg-red-50 dark:bg-red-900/20',
			borderColor: 'border-red-200 dark:border-red-800',
			metrics: {
				total: '99.9%',
				trend: 'stable',
				status: 'operational'
			},
			features: ['Health monitoring', 'Performance metrics', 'Resource analytics', 'Alert management'],
			roles: ['system_admin']
		}
	]

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'healthy':
			case 'secure':
			case 'operational':
				return <CheckCircle className='h-4 w-4 text-green-500' />
			case 'growing':
				return <TrendingUp className='h-4 w-4 text-green-500' />
			default:
				return <Activity className='h-4 w-4 text-blue-500' />
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'healthy':
			case 'secure':
			case 'operational':
				return 'text-green-600 dark:text-green-400'
			case 'growing':
				return 'text-green-600 dark:text-green-400'
			default:
				return 'text-blue-600 dark:text-blue-400'
		}
	}

	const hasAccess = (moduleRoles: string[]) => {
		return moduleRoles.some(role => userRoles.includes(role))
	}

	const accessibleModules = analyticsModules.filter(module => hasAccess(module.roles))

	if (!isAdmin) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BarChart3 className='h-5 w-5' />
						Analytics Overview
					</CardTitle>
					<CardDescription>
						Analytics features are available for administrators
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='text-center py-8'>
						<AlertTriangle className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
						<h3 className='text-lg font-semibold mb-2'>Access Restricted</h3>
						<p className='text-muted-foreground mb-4'>
							You need administrator privileges to access analytics features.
						</p>
						<p className='text-sm text-muted-foreground'>
							Contact your system administrator to request access.
						</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<BarChart3 className='h-5 w-5' />
							Analytics Overview
						</CardTitle>
						<CardDescription>
							Comprehensive analytics and monitoring across all system modules
						</CardDescription>
					</div>
					<Badge variant='secondary' className='text-xs'>
						{accessibleModules.length} module{accessibleModules.length !== 1 ? 's' : ''} available
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{/* Quick Stats */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
					<div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
						<Database className='h-8 w-8 text-blue-600 mx-auto mb-2' />
						<p className='text-2xl font-bold text-blue-600'>68,400</p>
						<p className='text-sm text-blue-600'>Total Operations</p>
					</div>
					<div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
						<TrendingUp className='h-8 w-8 text-green-600 mx-auto mb-2' />
						<p className='text-2xl font-bold text-green-600'>99.8%</p>
						<p className='text-sm text-green-600'>Success Rate</p>
					</div>
					<div className='text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800'>
						<Activity className='h-8 w-8 text-orange-600 mx-auto mb-2' />
						<p className='text-2xl font-bold text-orange-600'>24/7</p>
						<p className='text-sm text-orange-600'>Monitoring</p>
					</div>
				</div>

				{/* Analytics Modules */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{accessibleModules.map((module) => {
						const Icon = module.icon
						return (
							<Card key={module.href} className={`border-l-4 ${module.borderColor} hover:shadow-md transition-shadow`}>
								<CardHeader className='pb-3'>
									<div className='flex items-start justify-between'>
										<div className='flex items-center gap-3'>
											<div className={`p-2 rounded-lg ${module.bgColor}`}>
												<Icon className={`h-5 w-5 ${module.color}`} />
											</div>
											<div>
												<CardTitle className='text-lg'>{module.title}</CardTitle>
												<CardDescription className='text-sm mt-1'>
													{module.description}
												</CardDescription>
											</div>
										</div>
										{getStatusIcon(module.metrics.status)}
									</div>
								</CardHeader>
								<CardContent className='pt-0'>
									{/* Metrics */}
									<div className='flex items-center justify-between mb-4'>
										<div>
											<p className={`text-2xl font-bold ${module.color}`}>
												{module.metrics.total}
											</p>
											<p className={`text-sm ${getStatusColor(module.metrics.status)} capitalize`}>
												{module.metrics.status}
											</p>
										</div>
										{module.metrics.trend !== 'stable' && (
											<Badge variant='outline' className='text-xs'>
												{module.metrics.trend}
											</Badge>
										)}
									</div>

									{/* Features */}
									<div className='mb-4'>
										<p className='text-sm font-medium mb-2'>Key Features:</p>
										<div className='grid grid-cols-2 gap-1'>
											{module.features.map((feature, index) => (
												<div key={index} className='flex items-center gap-1'>
													<div className='w-1 h-1 bg-gray-400 rounded-full' />
													<span className='text-xs text-muted-foreground'>{feature}</span>
												</div>
											))}
										</div>
									</div>

									{/* Action Button */}
									<Link href={module.href}>
										<Button variant='outline' size='sm' className='w-full'>
											View Analytics
											<ExternalLink className='h-3 w-3 ml-2' />
										</Button>
									</Link>
								</CardContent>
							</Card>
						)
					})}
				</div>

				{/* Quick Actions */}
				<div className='mt-8 pt-6 border-t'>
					<h4 className='font-medium mb-4'>Quick Actions</h4>
					<div className='flex flex-wrap gap-2'>
						<Link href='/dashboard/analytics'>
							<Button variant='outline' size='sm'>
								<BarChart3 className='h-4 w-4 mr-2' />
								View All Analytics
							</Button>
						</Link>
						{isSystemAdmin && (
							<>
								<Link href='/dashboard/analytics/system'>
									<Button variant='outline' size='sm'>
										<Server className='h-4 w-4 mr-2' />
										System Health
									</Button>
								</Link>
								<Link href='/dashboard/analytics/reports'>
									<Button variant='outline' size='sm'>
										<FileText className='h-4 w-4 mr-2' />
										Generate Report
									</Button>
								</Link>
							</>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
