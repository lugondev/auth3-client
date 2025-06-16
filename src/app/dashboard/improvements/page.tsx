'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {BarChart3, Shield, Key, TrendingUp, Users, Activity, Info} from 'lucide-react'
import {SecurityDashboard} from '@/components/security/SecurityDashboard'
import {AnalyticsDashboard} from '@/components/analytics/AnalyticsDashboard'
import {DIDManagementDashboard} from '@/components/did/DIDManagementDashboard'
import {useAuth} from '@/hooks/useAuth'

/**
 * UI/UX Improvements Dashboard Page
 *
 * This page showcases the completed UI/UX improvements including:
 * - Security Dashboard with events, alerts, and recommendations
 * - Analytics Dashboard with system and personal analytics
 * - DID Management Dashboard with comprehensive DID lifecycle management
 *
 * Features:
 * - Tabbed interface for easy navigation
 * - Role-based access control
 * - Responsive design
 * - Modern UI components
 */

interface DashboardOverview {
	totalUsers: number
	totalDids: number
	securityEvents: number
	activeConnections: number
}

const MOCK_OVERVIEW: DashboardOverview = {
	totalUsers: 1247,
	totalDids: 3891,
	securityEvents: 23,
	activeConnections: 156,
}

export default function UIUXImprovementsPage() {
	const {isAdmin} = useAuth()
	const [activeTab, setActiveTab] = useState('overview')
	const [overview] = useState<DashboardOverview>(MOCK_OVERVIEW)

	return (
		<div className='container mx-auto p-6 space-y-6'>
			{/* Page Header */}
			<div className='space-y-2'>
				<div className='flex items-center gap-2'>
					<h1 className='text-3xl font-bold tracking-tight'>UI/UX Improvements</h1>
					<Badge variant='secondary'>Enhanced</Badge>
				</div>
				<p className='text-muted-foreground'>Comprehensive dashboard suite with improved user experience and modern interface design</p>
			</div>

			{/* Quick Overview Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Users</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{overview.totalUsers.toLocaleString()}</div>
						<p className='text-xs text-muted-foreground'>Registered in the system</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total DIDs</CardTitle>
						<Key className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{overview.totalDids.toLocaleString()}</div>
						<p className='text-xs text-muted-foreground'>Decentralized identifiers</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Security Events</CardTitle>
						<Shield className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{overview.securityEvents}</div>
						<p className='text-xs text-muted-foreground'>Events in last 24h</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Active Connections</CardTitle>
						<Activity className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{overview.activeConnections}</div>
						<p className='text-xs text-muted-foreground'>Currently online</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Dashboard Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
				<TabsList className='grid w-full grid-cols-4'>
					<TabsTrigger value='overview' className='flex items-center gap-2'>
						<Info className='h-4 w-4' />
						Overview
					</TabsTrigger>
					<TabsTrigger value='security' className='flex items-center gap-2'>
						<Shield className='h-4 w-4' />
						Security
					</TabsTrigger>
					<TabsTrigger value='analytics' className='flex items-center gap-2'>
						<BarChart3 className='h-4 w-4' />
						Analytics
					</TabsTrigger>
					<TabsTrigger value='did-management' className='flex items-center gap-2'>
						<Key className='h-4 w-4' />
						DID Management
					</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value='overview' className='space-y-6'>
					<div className='grid gap-6 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Shield className='h-5 w-5' />
									Security Dashboard
								</CardTitle>
								<CardDescription>Monitor security events, alerts, and recommendations with real-time updates</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<h4 className='font-semibold'>Key Features:</h4>
									<ul className='text-sm text-muted-foreground space-y-1'>
										<li>• Real-time security event monitoring</li>
										<li>• Active alerts and notifications</li>
										<li>• Security recommendations</li>
										<li>• Interactive analytics charts</li>
										<li>• Event filtering and search</li>
									</ul>
								</div>
								<Button onClick={() => setActiveTab('security')} className='w-full'>
									View Security Dashboard
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<BarChart3 className='h-5 w-5' />
									Analytics Dashboard
								</CardTitle>
								<CardDescription>Comprehensive analytics with personal and system-wide insights</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<h4 className='font-semibold'>Key Features:</h4>
									<ul className='text-sm text-muted-foreground space-y-1'>
										<li>• Personal activity analytics</li>
										{isAdmin && <li>• System-wide statistics</li>}
										<li>• User growth tracking</li>
										<li>• Interactive charts and graphs</li>
										<li>• Data export functionality</li>
									</ul>
								</div>
								<Button onClick={() => setActiveTab('analytics')} className='w-full'>
									View Analytics Dashboard
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Key className='h-5 w-5' />
									DID Management
								</CardTitle>
								<CardDescription>Complete DID lifecycle management with advanced features</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<h4 className='font-semibold'>Key Features:</h4>
									<ul className='text-sm text-muted-foreground space-y-1'>
										<li>• Create and manage DIDs</li>
										<li>• Multiple DID method support</li>
										<li>• Status management</li>
										<li>• Bulk operations</li>
										<li>• Advanced filtering and search</li>
									</ul>
								</div>
								<Button onClick={() => setActiveTab('did-management')} className='w-full'>
									View DID Management
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<TrendingUp className='h-5 w-5' />
									Improvements Summary
								</CardTitle>
								<CardDescription>Overview of UI/UX enhancements implemented</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<h4 className='font-semibold'>Enhancements:</h4>
									<ul className='text-sm text-muted-foreground space-y-1'>
										<li>• Modern, responsive design</li>
										<li>• Improved navigation and UX</li>
										<li>• Enhanced data visualization</li>
										<li>• Better accessibility</li>
										<li>• Consistent design system</li>
									</ul>
								</div>
								<div className='flex gap-2'>
									<Badge variant='secondary'>Responsive</Badge>
									<Badge variant='secondary'>Accessible</Badge>
									<Badge variant='secondary'>Modern</Badge>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Security Dashboard Tab */}
				<TabsContent value='security'>
					<SecurityDashboard />
				</TabsContent>

				{/* Analytics Dashboard Tab */}
				<TabsContent value='analytics'>
					<AnalyticsDashboard isAdmin={isAdmin} />
				</TabsContent>

				{/* DID Management Tab */}
				<TabsContent value='did-management'>
					<DIDManagementDashboard isAdmin={isAdmin} />
				</TabsContent>
			</Tabs>

			{/* Footer Information */}
			<Card>
				<CardContent className='pt-6'>
					<div className='text-center space-y-2'>
						<h3 className='font-semibold'>UI/UX Improvements Completed</h3>
						<p className='text-sm text-muted-foreground'>This dashboard showcases the enhanced user interface and experience improvements implemented across the Auth3 application, including modern design patterns, improved accessibility, and comprehensive functionality.</p>
						<div className='flex justify-center gap-2 mt-4'>
							<Badge variant='outline'>Security Enhanced</Badge>
							<Badge variant='outline'>Analytics Improved</Badge>
							<Badge variant='outline'>DID Management Upgraded</Badge>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
