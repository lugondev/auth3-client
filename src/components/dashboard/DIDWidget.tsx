/**
 * DID Widget Component for Dashboard
 * Displays user's DID overview and quick actions
 */

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {DIDResponse, DIDStatus} from '@/types/did'
import * as didService from '@/services/didService'
import {Key, Globe, Coins, Hash, Users, Plus, Eye} from 'lucide-react'
import Link from 'next/link'

interface DIDWidgetProps {
	className?: string
}

interface DIDStats {
	total: number
	active: number
	methods: {
		key: number
		web: number
		ethr: number
		ion: number
		peer: number
	}
}

/**
 * Get icon for DID method
 */
const getMethodIcon = (method: string) => {
	switch (method) {
		case 'key':
			return <Key className='h-4 w-4' />
		case 'web':
			return <Globe className='h-4 w-4' />
		case 'ethr':
			return <Coins className='h-4 w-4' />
		case 'ion':
			return <Hash className='h-4 w-4' />
		case 'peer':
			return <Users className='h-4 w-4' />
		default:
			return <Key className='h-4 w-4' />
	}
}

/**
 * Get color for DID method badge
 */
const getMethodColor = (method: string) => {
	switch (method) {
		case 'key':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
		case 'web':
			return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
		case 'ethr':
			return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
		case 'ion':
			return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
		case 'peer':
			return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
	}
}

export function DIDWidget({className}: DIDWidgetProps) {
	const [dids, setDids] = useState<DIDResponse[]>([])
	const [stats, setStats] = useState<DIDStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchDIDs = async () => {
			try {
				setLoading(true)
				setError(null)

				// Fetch user's DIDs
				const response = await didService.listDIDs()
				const userDIDs = response.dids || []
				setDids(userDIDs)

				// Calculate stats
				const stats: DIDStats = {
					total: userDIDs.length,
					active: userDIDs.filter((did) => did.status === DIDStatus.ACTIVE).length,
					methods: {
						key: userDIDs.filter((did) => did.method === 'key').length,
						web: userDIDs.filter((did) => did.method === 'web').length,
						ethr: userDIDs.filter((did) => did.method === 'ethr').length,
						ion: userDIDs.filter((did) => did.method === 'ion').length,
						peer: userDIDs.filter((did) => did.method === 'peer').length,
					},
				}
				setStats(stats)
			} catch (err) {
				console.error('Failed to fetch DIDs:', err)
				setError('Failed to load DIDs')
			} finally {
				setLoading(false)
			}
		}

		fetchDIDs()
	}, [])

	if (loading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Key className='h-5 w-5' />
						<Skeleton className='h-6 w-32' />
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-2 gap-4'>
						<Skeleton className='h-16' />
						<Skeleton className='h-16' />
					</div>
					<Skeleton className='h-8' />
					<div className='space-y-2'>
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-3/4' />
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
						<Key className='h-5 w-5' />
						DID Overview
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
					<Key className='h-5 w-5' />
					DID Overview
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* Stats Grid */}
				<div className='grid grid-cols-2 gap-4'>
					<div className='text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg'>
						<div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{stats?.total || 0}</div>
						<div className='text-sm text-blue-600 dark:text-blue-400'>Total DIDs</div>
					</div>
					<div className='text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg'>
						<div className='text-2xl font-bold text-green-600 dark:text-green-400'>{stats?.active || 0}</div>
						<div className='text-sm text-green-600 dark:text-green-400'>Active</div>
					</div>
				</div>

				{/* Method Distribution */}
				{stats && stats.total > 0 && (
					<div>
						<h4 className='text-sm font-medium mb-2'>Methods</h4>
						<div className='flex flex-wrap gap-1'>
							{Object.entries(stats.methods).map(([method, count]) => {
								if (count === 0) return null
								return (
									<Badge key={method} variant='secondary' className={`text-xs ${getMethodColor(method)}`}>
										<span className='flex items-center gap-1'>
											{getMethodIcon(method)}
											{method}: {count}
										</span>
									</Badge>
								)
							})}
						</div>
					</div>
				)}

				{/* Recent DIDs */}
				{dids.length > 0 && (
					<div>
						<h4 className='text-sm font-medium mb-2'>Recent DIDs</h4>
						<div className='space-y-2'>
							{dids.slice(0, 2).map((did) => (
								<div key={did.id} className='flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded'>
									<div className='flex items-center gap-2'>
										{getMethodIcon(did.method)}
										<span className='text-sm font-mono truncate max-w-[120px]'>{did.did.did}</span>
									</div>
									<Badge variant={did.status === DIDStatus.ACTIVE ? 'default' : 'secondary'} className='text-xs'>
										{did.status}
									</Badge>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className='flex gap-2'>
					<Button asChild size='sm' className='flex-1'>
						<Link href='/dashboard/dids/create'>
							<Plus className='h-4 w-4 mr-1' />
							Create DID
						</Link>
					</Button>
					<Button asChild variant='outline' size='sm' className='flex-1'>
						<Link href='/dashboard/dids'>
							<Eye className='h-4 w-4 mr-1' />
							View All
						</Link>
					</Button>
				</div>

				{/* Empty State */}
				{dids.length === 0 && (
					<div className='text-center py-4'>
						<Key className='h-12 w-12 mx-auto text-gray-400 mb-2' />
						<p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>No DIDs found. Create your first DID to get started.</p>
						<Button asChild size='sm'>
							<Link href='/dashboard/dids/create'>
								<Plus className='h-4 w-4 mr-1' />
								Create First DID
							</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
