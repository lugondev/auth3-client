/**
 * Recent Activity Widget Component for Dashboard
 * Displays recent DID and Credential activities
 */

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Activity, Award, MessageSquare, Plus, Trash2, Eye, Shield, Clock, User, ExternalLink} from 'lucide-react'

interface RecentActivityWidgetProps {
	className?: string
}

export type ActivityType = 'did_created' | 'did_deactivated' | 'did_revoked' | 'credential_issued' | 'credential_received' | 'credential_verified' | 'credential_revoked' | 'message_sent' | 'message_received' | 'connection_created' | 'connection_accepted'

export interface ActivityItem {
	id: string
	type: ActivityType
	title: string
	description: string
	timestamp: string
	metadata?: {
		did?: string
		credentialId?: string
		messageId?: string
		connectionId?: string
		method?: string
		status?: string
		[key: string]: unknown
	}
}

/**
 * Get icon for activity type
 */
const getActivityIcon = (type: ActivityType) => {
	switch (type) {
		case 'did_created':
			return <Plus className='h-4 w-4 text-green-600' />
		case 'did_deactivated':
		case 'did_revoked':
			return <Trash2 className='h-4 w-4 text-red-600' />
		case 'credential_issued':
			return <Award className='h-4 w-4 text-blue-600' />
		case 'credential_received':
			return <Shield className='h-4 w-4 text-green-600' />
		case 'credential_verified':
			return <Eye className='h-4 w-4 text-purple-600' />
		case 'credential_revoked':
			return <Trash2 className='h-4 w-4 text-red-600' />
		case 'message_sent':
		case 'message_received':
			return <MessageSquare className='h-4 w-4 text-blue-600' />
		case 'connection_created':
		case 'connection_accepted':
			return <User className='h-4 w-4 text-green-600' />
		default:
			return <Activity className='h-4 w-4 text-gray-600' />
	}
}

/**
 * Get color for activity type badge
 */
const getActivityColor = (type: ActivityType) => {
	switch (type) {
		case 'did_created':
		case 'credential_received':
		case 'connection_accepted':
			return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
		case 'did_deactivated':
		case 'did_revoked':
		case 'credential_revoked':
			return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
		case 'credential_issued':
		case 'credential_verified':
		case 'message_sent':
		case 'message_received':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
		case 'connection_created':
			return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
	}
}

/**
 * Format activity type for display
 */
const formatActivityType = (type: ActivityType): string => {
	return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Format relative time
 */
const formatRelativeTime = (timestamp: string): string => {
	const now = new Date()
	const time = new Date(timestamp)
	const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

	if (diffInSeconds < 60) {
		return 'Just now'
	} else if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60)
		return `${minutes}m ago`
	} else if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600)
		return `${hours}h ago`
	} else {
		const days = Math.floor(diffInSeconds / 86400)
		return `${days}d ago`
	}
}

/**
 * Mock data for demonstration
 * In real implementation, this would come from an API
 */
const mockActivities: ActivityItem[] = [
	{
		id: '1',
		type: 'did_created',
		title: 'DID Created',
		description: 'Created new DID using key method',
		timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
		metadata: {
			did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
			method: 'key',
		},
	},
	{
		id: '2',
		type: 'credential_received',
		title: 'Credential Received',
		description: 'Received University Degree credential',
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
		metadata: {
			credentialId: 'cred_123',
			status: 'active',
		},
	},
	{
		id: '3',
		type: 'message_sent',
		title: 'Message Sent',
		description: 'Sent connection request to Alice',
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
		metadata: {
			messageId: 'msg_456',
			connectionId: 'conn_789',
		},
	},
	{
		id: '4',
		type: 'credential_verified',
		title: 'Credential Verified',
		description: 'Verified ID Card credential',
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
		metadata: {
			credentialId: 'cred_789',
			status: 'verified',
		},
	},
	{
		id: '5',
		type: 'connection_accepted',
		title: 'Connection Accepted',
		description: 'Connection with Bob was accepted',
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
		metadata: {
			connectionId: 'conn_101',
		},
	},
]

export function RecentActivityWidget({className}: RecentActivityWidgetProps) {
	const [activities, setActivities] = useState<ActivityItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchActivities = async () => {
			try {
				setLoading(true)
				setError(null)

				// Simulate API call
				await new Promise((resolve) => setTimeout(resolve, 1000))

				// In real implementation, fetch from API
				// const activities = await activityService.getRecentActivities()
				setActivities(mockActivities)
			} catch (err) {
				console.error('Failed to fetch activities:', err)
				setError('Failed to load recent activities')
			} finally {
				setLoading(false)
			}
		}

		fetchActivities()
	}, [])

	if (loading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5' />
						<Skeleton className='h-6 w-32' />
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						{[...Array(5)].map((_, i) => (
							<div key={i} className='flex items-start gap-3'>
								<Skeleton className='h-8 w-8 rounded-full' />
								<div className='flex-1 space-y-1'>
									<Skeleton className='h-4 w-3/4' />
									<Skeleton className='h-3 w-1/2' />
								</div>
								<Skeleton className='h-4 w-12' />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className='flex items-center gap-2 text-red-600'>
						<Activity className='h-5 w-5' />
						Recent Activity
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-sm text-red-600'>{error}</p>
					<Button variant='outline' size='sm' className='mt-2' onClick={() => window.location.reload()}>
						Retry
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Activity className='h-5 w-5' />
					Recent Activity
				</CardTitle>
			</CardHeader>
			<CardContent>
				{activities.length === 0 ? (
					<div className='text-center py-8'>
						<Clock className='h-12 w-12 mx-auto text-gray-400 mb-2' />
						<p className='text-sm text-gray-600 dark:text-gray-400'>No recent activity found.</p>
					</div>
				) : (
					<ScrollArea className='h-[300px]'>
						<div className='space-y-3'>
							{activities.map((activity) => (
								<div key={activity.id} className='flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
									<div className='flex-shrink-0 mt-1'>{getActivityIcon(activity.type)}</div>
									<div className='flex-1 min-w-0'>
										<div className='flex items-center gap-2 mb-1'>
											<h4 className='text-sm font-medium truncate'>{activity.title}</h4>
											<Badge variant='secondary' className={`text-xs ${getActivityColor(activity.type)}`}>
												{formatActivityType(activity.type)}
											</Badge>
										</div>
										<p className='text-xs text-gray-600 dark:text-gray-400 mb-1'>{activity.description}</p>
										{activity.metadata?.did && <p className='text-xs font-mono text-gray-500 truncate'>{activity.metadata.did}</p>}
									</div>
									<div className='flex-shrink-0 text-right'>
										<span className='text-xs text-gray-500'>{formatRelativeTime(activity.timestamp)}</span>
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				)}

				{/* View All Button */}
				{activities.length > 0 && (
					<div className='mt-4 pt-4 border-t'>
						<Button variant='outline' size='sm' className='w-full'>
							<ExternalLink className='h-4 w-4 mr-2' />
							View All Activity
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
