'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Skeleton} from '@/components/ui/skeleton'
import {Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Download} from 'lucide-react'

interface SecurityEvent {
	id: string
	type: 'critical' | 'warning' | 'info'
	message: string
	timestamp: string
	source: string
}

interface SecurityOverview {
	total_events: number
	critical_alerts: number
	warnings: number
	info_events: number
	security_score: number
}

interface SecurityDashboardProps {
	className?: string
}

export function SecurityDashboard({className}: SecurityDashboardProps) {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [overview, setOverview] = useState<SecurityOverview | null>(null)
	const [events, setEvents] = useState<SecurityEvent[]>([])

	const fetchSecurityData = async () => {
		try {
			setLoading(true)
			setError(null)

			// TODO: Implement with proper security API
			// Mock data for now
			await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

			const mockOverview = {
				total_events: 1250,
				critical_alerts: 3,
				warnings: 15,
				info_events: 1232,
				security_score: 95,
			}

			const mockEvents = [
				{
					id: '1',
					type: 'warning' as const,
					message: 'Multiple failed login attempts detected',
					timestamp: new Date().toISOString(),
					source: 'auth-service',
				},
				{
					id: '2',
					type: 'info' as const,
					message: 'Security scan completed successfully',
					timestamp: new Date().toISOString(),
					source: 'security-service',
				},
			]

			setOverview(mockOverview)
			setEvents(mockEvents)
		} catch (err) {
			console.error('Failed to fetch security data:', err)
			setError(err instanceof Error ? err.message : 'Failed to load security data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchSecurityData()
	}, [])

	const getEventIcon = (type: string) => {
		switch (type) {
			case 'critical':
				return <XCircle className='h-4 w-4 text-red-600' />
			case 'warning':
				return <AlertTriangle className='h-4 w-4 text-yellow-600' />
			case 'info':
				return <CheckCircle className='h-4 w-4 text-green-600' />
			default:
				return <CheckCircle className='h-4 w-4' />
		}
	}

	const getEventBadgeVariant = (type: string) => {
		switch (type) {
			case 'critical':
				return 'destructive'
			case 'warning':
				return 'secondary'
			case 'info':
				return 'default'
			default:
				return 'default'
		}
	}

	if (error) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className='text-red-600'>Security Dashboard Error</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertTriangle className='h-4 w-4' />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
					<Button onClick={fetchSecurityData} className='mt-4'>
						<RefreshCw className='h-4 w-4 mr-2' />
						Retry
					</Button>
				</CardContent>
			</Card>
		)
	}

	if (loading) {
		return (
			<div className={`space-y-4 ${className}`}>
				<Card>
					<CardHeader>
						<Skeleton className='h-6 w-48' />
						<Skeleton className='h-4 w-64' />
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
							{[...Array(4)].map((_, i) => (
								<div key={i} className='space-y-2'>
									<Skeleton className='h-8 w-16' />
									<Skeleton className='h-4 w-20' />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Security Overview */}
			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<div>
						<CardTitle className='text-lg font-medium flex items-center gap-2'>
							<Shield className='h-5 w-5' />
							Security Overview
						</CardTitle>
						<CardDescription>System security status and recent events</CardDescription>
					</div>
					<div className='flex gap-2'>
						<Button variant='outline' size='sm'>
							<Download className='h-4 w-4 mr-2' />
							Export
						</Button>
						<Button onClick={fetchSecurityData} variant='outline' size='sm'>
							<RefreshCw className='h-4 w-4 mr-2' />
							Refresh
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{overview && (
						<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
							<div className='text-center'>
								<div className='text-2xl font-bold'>{overview.total_events.toLocaleString()}</div>
								<p className='text-sm text-muted-foreground'>Total Events</p>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-red-600'>{overview.critical_alerts}</div>
								<p className='text-sm text-muted-foreground'>Critical Alerts</p>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-yellow-600'>{overview.warnings}</div>
								<p className='text-sm text-muted-foreground'>Warnings</p>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-green-600'>{overview.security_score}</div>
								<p className='text-sm text-muted-foreground'>Security Score</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Recent Security Events */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<AlertTriangle className='h-5 w-5' />
						Recent Security Events
					</CardTitle>
					<CardDescription>Latest security events and alerts</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{events.length > 0 ? (
							events.map((event) => (
								<div key={event.id} className='flex items-center justify-between p-3 border rounded-lg'>
									<div className='flex items-center gap-3'>
										{getEventIcon(event.type)}
										<div>
											<p className='font-medium'>{event.message}</p>
											<p className='text-sm text-muted-foreground'>
												{new Date(event.timestamp).toLocaleString()} • {event.source}
											</p>
										</div>
									</div>
									<Badge variant={getEventBadgeVariant(event.type)}>{event.type}</Badge>
								</div>
							))
						) : (
							<div className='text-center py-8 text-muted-foreground'>
								<Shield className='h-8 w-8 mx-auto mb-2 opacity-50' />
								<p className='text-sm'>No security events found</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
