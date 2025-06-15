'use client'

import React, {useState, useEffect} from 'react'
import {PageHeader} from '@/components/layout/PageHeader'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Users, Key, Globe, Coins, Network, TrendingUp,  Activity, Settings, Search,  MoreHorizontal, Eye, Trash2, Power} from 'lucide-react'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { getDIDStatistics, listDIDs } from '@/services/didService'
import type { DIDStatisticsOutput, ListDIDsOutput, DIDResponse } from '@/types/did'

// Types for DID administration
interface DIDStats {
	totalDIDs: number
	activeUsers: number
	methodDistribution: Record<string, number>
	recentActivity: {
		created: number
		deactivated: number
		revoked: number
	}
}

interface DIDRecord {
	id: string
	did: string
	method: string
	status: string
	owner: {
		id: string
		email: string
		username?: string
	}
	createdAt: string
	updatedAt: string
	lastUsed?: string
}

export default function DIDAdminDashboard() {
	const [stats, setStats] = useState<DIDStats | null>(null)
	const [dids, setDids] = useState<DIDRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [methodFilter, setMethodFilter] = useState<string>('all')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [currentPage, ] = useState(1)
	const [pageSize] = useState(20)
	const [, setTotalPages] = useState(1)

	// Fetch DID statistics and records
	useEffect(() => {
		const fetchData = async () => {
			try {
					setLoading(true)
					// Fetch DID statistics
					const statsData: DIDStatisticsOutput = await getDIDStatistics()
					
					// Transform statistics to match component interface
					const transformedStats: DIDStats = {
						totalDIDs: statsData.total,
						activeUsers: statsData.user_count || 0,
						methodDistribution: statsData.by_method,
						recentActivity: {
							created: statsData.recent_activity.filter(a => a.action === 'created').length,
							deactivated: statsData.deactivated,
							revoked: statsData.revoked,
						},
					}

					// Fetch DIDs list
					const didsData: ListDIDsOutput = await listDIDs({
						limit: pageSize,
						offset: (currentPage - 1) * pageSize,
						status: statusFilter !== 'all' ? statusFilter : undefined,
						method: methodFilter !== 'all' ? methodFilter : undefined,
					})

					// Transform DIDs to match component interface
					const transformedDIDs: DIDRecord[] = didsData.dids.map((did: DIDResponse) => ({
						id: did.id,
						did: did.did,
						method: did.method,
						status: did.status,
						owner: {
							id: did.user_id,
							email: `user@example.com`, // TODO: Get actual user email from user service
							username: undefined,
						},
						createdAt: did.created_at,
						updatedAt: did.updated_at,
						lastUsed: undefined, // TODO: Add last used tracking
					}))

					setStats(transformedStats)
					setDids(transformedDIDs)
					setTotalPages(Math.ceil(didsData.total / pageSize))
			} catch (error) {
				console.error('Failed to fetch DID admin data:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [currentPage, pageSize, statusFilter, methodFilter])

	// Filter DIDs based on search and filters
	const filteredDIDs = dids.filter((did) => {
		const matchesSearch = searchTerm === '' || did.did.toLowerCase().includes(searchTerm.toLowerCase()) || did.owner.email.toLowerCase().includes(searchTerm.toLowerCase()) || (did.owner.username && did.owner.username.toLowerCase().includes(searchTerm.toLowerCase()))

		const matchesMethod = methodFilter === 'all' || did.method === methodFilter
		const matchesStatus = statusFilter === 'all' || did.status === statusFilter

		return matchesSearch && matchesMethod && matchesStatus
	})

	// Get status badge variant
	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'active':
				return 'default'
			case 'deactivated':
				return 'secondary'
			case 'revoked':
				return 'destructive'
			default:
				return 'outline'
		}
	}

	// Get method icon
	const getMethodIcon = (method: string) => {
		switch (method) {
			case 'key':
				return <Key className='h-4 w-4' />
			case 'web':
				return <Globe className='h-4 w-4' />
			case 'ethr':
				return <Coins className='h-4 w-4' />
			case 'ion':
				return <Network className='h-4 w-4' />
			case 'peer':
				return <Users className='h-4 w-4' />
			default:
				return <Key className='h-4 w-4' />
		}
	}

	if (loading) {
		return (
			<div className='space-y-6'>
				<PageHeader title='DID Administration' description='Manage and monitor all DIDs across the system' />
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
					{Array.from({length: 4}).map((_, i) => (
						<Card key={i}>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<div className='h-4 w-20 bg-muted animate-pulse rounded' />
								<div className='h-4 w-4 bg-muted animate-pulse rounded' />
							</CardHeader>
							<CardContent>
								<div className='h-8 w-16 bg-muted animate-pulse rounded mb-2' />
								<div className='h-3 w-24 bg-muted animate-pulse rounded' />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='DID Administration'
				description='Manage and monitor all DIDs across the system'
				actions={
					<Link href='/dashboard/admin/dids/config'>
						<Button>
							<Settings className='mr-2 h-4 w-4' />
							Method Configuration
						</Button>
					</Link>
				}
			/>

			{/* Statistics Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total DIDs</CardTitle>
						<Key className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.totalDIDs.toLocaleString()}</div>
						<p className='text-xs text-muted-foreground'>
							<TrendingUp className='inline h-3 w-3 mr-1' />+{stats?.recentActivity.created} this week
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Active Users</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.activeUsers.toLocaleString()}</div>
						<p className='text-xs text-muted-foreground'>{(((stats?.activeUsers || 0) / (stats?.totalDIDs || 1)) * 100).toFixed(1)}% of total DIDs</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Deactivated</CardTitle>
						<Power className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.recentActivity.deactivated}</div>
						<p className='text-xs text-muted-foreground'>This week</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Revoked</CardTitle>
						<Trash2 className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.recentActivity.revoked}</div>
						<p className='text-xs text-muted-foreground'>This week</p>
					</CardContent>
				</Card>
			</div>

			{/* Method Distribution and DID Management */}
			<Tabs defaultValue='overview' className='space-y-4'>
				<TabsList>
					<TabsTrigger value='overview'>Overview</TabsTrigger>
					<TabsTrigger value='dids'>All DIDs</TabsTrigger>
					<TabsTrigger value='analytics'>Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value='overview' className='space-y-4'>
					<div className='grid gap-4 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle>DID Method Distribution</CardTitle>
								<CardDescription>Distribution of DID methods across the system</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-3'>
									{Object.entries(stats?.methodDistribution || {}).map(([method, count]) => (
										<div key={method} className='flex items-center justify-between'>
											<div className='flex items-center space-x-2'>
												{getMethodIcon(method)}
												<span className='capitalize'>{method}</span>
											</div>
											<div className='flex items-center space-x-2'>
												<span className='font-medium'>{count}</span>
												<div className='w-20 bg-muted rounded-full h-2'>
													<div className='bg-primary h-2 rounded-full' style={{width: `${(count / (stats?.totalDIDs || 1)) * 100}%`}} />
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Recent Activity</CardTitle>
								<CardDescription>DID operations in the last 7 days</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center space-x-2'>
											<TrendingUp className='h-4 w-4 text-green-500' />
											<span>Created</span>
										</div>
										<span className='font-medium'>{stats?.recentActivity.created}</span>
									</div>
									<div className='flex items-center justify-between'>
										<div className='flex items-center space-x-2'>
											<Power className='h-4 w-4 text-yellow-500' />
											<span>Deactivated</span>
										</div>
										<span className='font-medium'>{stats?.recentActivity.deactivated}</span>
									</div>
									<div className='flex items-center justify-between'>
										<div className='flex items-center space-x-2'>
											<Trash2 className='h-4 w-4 text-red-500' />
											<span>Revoked</span>
										</div>
										<span className='font-medium'>{stats?.recentActivity.revoked}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value='dids' className='space-y-4'>
					{/* Search and Filters */}
					<Card>
						<CardHeader>
							<CardTitle>DID Management</CardTitle>
							<CardDescription>Search and manage all DIDs in the system</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='flex flex-col sm:flex-row gap-4 mb-6'>
								<div className='flex-1'>
									<div className='relative'>
										<Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
										<Input placeholder='Search by DID, email, or username...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
									</div>
								</div>
								<Select value={methodFilter} onValueChange={setMethodFilter}>
									<SelectTrigger className='w-[150px]'>
										<SelectValue placeholder='Method' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Methods</SelectItem>
										<SelectItem value='key'>Key</SelectItem>
										<SelectItem value='web'>Web</SelectItem>
										<SelectItem value='ethr'>Ethereum</SelectItem>
										<SelectItem value='ion'>ION</SelectItem>
										<SelectItem value='peer'>Peer</SelectItem>
									</SelectContent>
								</Select>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className='w-[150px]'>
										<SelectValue placeholder='Status' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Status</SelectItem>
										<SelectItem value='active'>Active</SelectItem>
										<SelectItem value='deactivated'>Deactivated</SelectItem>
										<SelectItem value='revoked'>Revoked</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* DID Table */}
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>DID</TableHead>
											<TableHead>Method</TableHead>
											<TableHead>Owner</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Created</TableHead>
											<TableHead>Last Used</TableHead>
											<TableHead className='w-[50px]'></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredDIDs.map((did) => (
											<TableRow key={did.id}>
												<TableCell className='font-mono text-sm'>{did.did.length > 40 ? `${did.did.substring(0, 40)}...` : did.did}</TableCell>
												<TableCell>
													<div className='flex items-center space-x-2'>
														{getMethodIcon(did.method)}
														<span className='capitalize'>{did.method}</span>
													</div>
												</TableCell>
												<TableCell>
													<div>
														<div className='font-medium'>{did.owner.username || did.owner.email}</div>
														{did.owner.username && <div className='text-sm text-muted-foreground'>{did.owner.email}</div>}
													</div>
												</TableCell>
												<TableCell>
													<Badge variant={getStatusVariant(did.status)}>{did.status}</Badge>
												</TableCell>
												<TableCell>{new Date(did.createdAt).toLocaleDateString()}</TableCell>
												<TableCell>{did.lastUsed ? new Date(did.lastUsed).toLocaleDateString() : 'Never'}</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant='ghost' className='h-8 w-8 p-0'>
																<MoreHorizontal className='h-4 w-4' />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align='end'>
															<DropdownMenuItem>
																<Eye className='mr-2 h-4 w-4' />
																View Details
															</DropdownMenuItem>
															{did.status === 'active' && (
																<DropdownMenuItem>
																	<Power className='mr-2 h-4 w-4' />
																	Deactivate
																</DropdownMenuItem>
															)}
															<DropdownMenuItem className='text-destructive'>
																<Trash2 className='mr-2 h-4 w-4' />
																Revoke
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='analytics' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>DID Analytics</CardTitle>
							<CardDescription>Usage metrics and trends</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='text-center py-8 text-muted-foreground'>
								<Activity className='mx-auto h-12 w-12 mb-4' />
								<p>Analytics charts will be implemented here</p>
								<p className='text-sm'>Including DID creation trends, method popularity, and usage patterns</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
