'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
	Search, 
	Activity, 
	FileCheck, 
	Share2, 
	Shield, 
	ArrowRight,
	CheckCircle,
	XCircle
} from 'lucide-react'
import Link from 'next/link'

/**
 * Verification Dashboard Page - Main hub for all verification activities
 * 
 * Features:
 * - Quick access to verification tools
 * - Recent verification activity
 * - Verification statistics
 * - Links to specific verification features
 */
export default function VerificationPage() {
	const [activeTab, setActiveTab] = useState('overview')

	// Mock data for verification statistics
	const verificationStats = {
		totalVerifications: 245,
		successfulVerifications: 231,
		failedVerifications: 14,
		credentialsVerified: 189,
		presentationsVerified: 56,
		averageVerificationTime: '2.3s'
	}

	const recentVerifications = [
		{
			id: '1',
			type: 'credential',
			subject: 'University Degree',
			status: 'verified',
			timestamp: '2 minutes ago'
		},
		{
			id: '2',
			type: 'presentation',
			subject: 'Employment Verification',
			status: 'verified',
			timestamp: '15 minutes ago'
		},
		{
			id: '3',
			type: 'credential',
			subject: 'Identity Card',
			status: 'failed',
			timestamp: '1 hour ago'
		}
	]

	const verificationTools = [
		{
			title: 'Test Verification',
			description: 'Test credential and presentation verification',
			href: '/dashboard/test-verification',
			icon: Search,
			color: 'bg-blue-500'
		},
		{
			title: 'Demo Verification',
			description: 'Interactive verification demonstrations',
			href: '/dashboard/demo',
			icon: Activity,
			color: 'bg-green-500'
		},
		{
			title: 'Credential Verification',
			description: 'Verify individual credentials',
			href: '/dashboard/credentials?tab=verify',
			icon: FileCheck,
			color: 'bg-purple-500'
		},
		{
			title: 'Presentation Verification',
			description: 'Verify presentation packages',
			href: '/dashboard/presentations?tab=verify',
			icon: Share2,
			color: 'bg-orange-500'
		}
	]

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Verification Center</h1>
				<p className="text-muted-foreground mt-2">
					Verify credentials, presentations, and test verification workflows
				</p>
			</div>

			{/* Quick Stats */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{verificationStats.totalVerifications}</div>
						<p className="text-xs text-muted-foreground">
							+12% from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Success Rate</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{Math.round((verificationStats.successfulVerifications / verificationStats.totalVerifications) * 100)}%
						</div>
						<p className="text-xs text-muted-foreground">
							{verificationStats.successfulVerifications} successful
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Failed Verifications</CardTitle>
						<XCircle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{verificationStats.failedVerifications}
						</div>
						<p className="text-xs text-muted-foreground">
							Requires attention
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{verificationStats.averageVerificationTime}</div>
						<p className="text-xs text-muted-foreground">
							Per verification
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="tools">Verification Tools</TabsTrigger>
					<TabsTrigger value="activity">Recent Activity</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					{/* Verification Tools Grid */}
					<Card>
						<CardHeader>
							<CardTitle>Quick Access</CardTitle>
							<CardDescription>
								Access verification tools and features
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
								{verificationTools.map((tool) => {
									const Icon = tool.icon
									return (
										<Link key={tool.title} href={tool.href}>
											<Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
												<CardContent className="p-6">
													<div className="flex items-center gap-4">
														<div className={`p-3 rounded-lg ${tool.color}`}>
															<Icon className="h-6 w-6 text-white" />
														</div>
														<div className="flex-1">
															<h3 className="font-semibold text-sm">{tool.title}</h3>
															<p className="text-xs text-muted-foreground mt-1">
																{tool.description}
															</p>
														</div>
														<ArrowRight className="h-4 w-4 text-muted-foreground" />
													</div>
												</CardContent>
											</Card>
										</Link>
									)
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="tools" className="space-y-4">
					<div className="grid gap-6 md:grid-cols-2">
						{verificationTools.map((tool) => {
							const Icon = tool.icon
							return (
								<Card key={tool.title}>
									<CardHeader>
										<div className="flex items-center gap-3">
											<div className={`p-2 rounded-lg ${tool.color}`}>
												<Icon className="h-5 w-5 text-white" />
											</div>
											<CardTitle className="text-lg">{tool.title}</CardTitle>
										</div>
										<CardDescription>{tool.description}</CardDescription>
									</CardHeader>
									<CardContent>
										<Link href={tool.href}>
											<Button className="w-full">
												Launch Tool
												<ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										</Link>
									</CardContent>
								</Card>
							)
						})}
					</div>
				</TabsContent>

				<TabsContent value="activity" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Recent Verification Activity</CardTitle>
							<CardDescription>
								Latest verification attempts and results
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{recentVerifications.map((verification) => (
									<div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-3">
											{verification.status === 'verified' ? (
												<CheckCircle className="h-5 w-5 text-green-600" />
											) : (
												<XCircle className="h-5 w-5 text-red-600" />
											)}
											<div>
												<p className="font-medium">{verification.subject}</p>
												<p className="text-sm text-muted-foreground capitalize">
													{verification.type} verification
												</p>
											</div>
										</div>
										<div className="text-right">
											<div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
												verification.status === 'verified' 
													? 'bg-green-100 text-green-800' 
													: 'bg-red-100 text-red-800'
											}`}>
												{verification.status}
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												{verification.timestamp}
											</p>
										</div>
									</div>
								))}
							</div>

							<div className="mt-6 text-center">
								<Link href="/dashboard/admin/logs">
									<Button variant="outline">
										View All Activity
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
