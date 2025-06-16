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
import {Award, Shield, TrendingUp, Activity, Settings, Search, MoreHorizontal, Eye, Ban, CheckCircle, XCircle, Clock, FileText, Plus} from 'lucide-react'
import {getCredentialStatistics, listCredentials, listTemplates} from '@/services/vcService'
import type {CredentialStatistics} from '@/services/vcService'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

// Types for VC administration
interface VCStats {
	totalCredentials: number
	activeCredentials: number
	revokedCredentials: number
	expiredCredentials: number
	templateCount: number
	recentActivity: {
		issued: number
		verified: number
		revoked: number
	}
	typeDistribution: {
		[type: string]: number
	}
}

/**
 * Transform CredentialStatistics to VCStats format
 */
const transformStatsToVCStats = (stats: CredentialStatistics, templateCount: number): VCStats => {
	return {
		totalCredentials: stats.totalCredentials,
		activeCredentials: stats.activeCredentials,
		revokedCredentials: stats.revokedCredentials,
		expiredCredentials: stats.expiredCredentials,
		templateCount,
		recentActivity: {
			issued: stats.issuedToday,
			verified: 0, // Not available in CredentialStatistics
			revoked: 0, // Not available in CredentialStatistics
		},
		typeDistribution: {}, // Would need additional API call to get this data
	}
}

// Use CredentialMetadata from types instead of custom interface
import type {CredentialTemplate, VerifiableCredential} from '@/types/credentials'

// CredentialTemplate is imported from types/credentials.ts

export default function VCAdminDashboard() {
	const [stats, setStats] = useState<VCStats | null>(null)
	const [credentials, setCredentials] = useState<VerifiableCredential[]>([])
	const [templates, setTemplates] = useState<CredentialTemplate[]>([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [typeFilter, setTypeFilter] = useState<string>('all')
	const [currentPage] = useState(1)
	const [pageSize] = useState(20)

	// Fetch VC statistics and records
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true)

				// Fetch actual data from API
				const [statsResponse, credentialsResponse, templatesResponse] = await Promise.all([getCredentialStatistics(), listCredentials({page: currentPage, limit: pageSize}), listTemplates()])

				// Transform and set the data
				const transformedStats = transformStatsToVCStats(statsResponse, templatesResponse.templates.length)
				setStats(transformedStats)
				setCredentials(credentialsResponse.credentials || [])
				setTemplates(templatesResponse.templates || [])
			} catch (error) {
				console.error('Failed to fetch VC admin data:', error)
				// Set empty states on error
				setStats({
					totalCredentials: 0,
					activeCredentials: 0,
					revokedCredentials: 0,
					expiredCredentials: 0,
					templateCount: 0,
					recentActivity: {
						issued: 0,
						verified: 0,
						revoked: 0,
					},
					typeDistribution: {},
				})
				setCredentials([])
				setTemplates([])
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [currentPage, pageSize])

	// Filter credentials based on search and filters
	const filteredCredentials = credentials.filter((cred) => {
		const matchesSearch = searchTerm === '' || cred.id.toLowerCase().includes(searchTerm.toLowerCase()) || (typeof cred.credentialSubject === 'object' && cred.credentialSubject.id && cred.credentialSubject.id.toLowerCase().includes(searchTerm.toLowerCase())) || (typeof cred.issuer === 'string' ? cred.issuer.toLowerCase().includes(searchTerm.toLowerCase()) : false)

		const matchesStatus = statusFilter === 'all' || cred.credentialStatus === statusFilter
		const matchesType = typeFilter === 'all' || (Array.isArray(cred.type) ? cred.type.includes(typeFilter) : cred.type === typeFilter)

		return matchesSearch && matchesStatus && matchesType
	})

	// Get status badge variant
	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'active':
				return 'default'
			case 'revoked':
				return 'destructive'
			case 'expired':
				return 'secondary'
			case 'suspended':
				return 'outline'
			default:
				return 'outline'
		}
	}

	// Get status icon
	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'active':
				return <CheckCircle className='h-4 w-4 text-green-500' />
			case 'revoked':
				return <XCircle className='h-4 w-4 text-red-500' />
			case 'expired':
				return <Clock className='h-4 w-4 text-gray-500' />
			case 'suspended':
				return <Ban className='h-4 w-4 text-yellow-500' />
			default:
				return <Clock className='h-4 w-4' />
		}
	}

	if (loading) {
		return (
			<div className='space-y-6'>
				<PageHeader title='Credential Administration' description='Manage and monitor all verifiable credentials across the system' />
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
				title='Credential Administration'
				description='Manage and monitor all verifiable credentials across the system'
				actions={
					<div className='flex space-x-2'>
						<Link href='/dashboard/credentials/issue'>
							<Button>
								<Plus className='mr-2 h-4 w-4' />
								Create Credential
							</Button>
						</Link>
						<Link href='/dashboard/admin/credentials/templates'>
							<Button variant='outline'>
								<FileText className='mr-2 h-4 w-4' />
								Templates
							</Button>
						</Link>
						<Link href='/dashboard/admin/credentials/revocation'>
							<Button variant='outline'>
								<Ban className='mr-2 h-4 w-4' />
								Revocation
							</Button>
						</Link>
					</div>
				}
			/>

			{/* Statistics Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Credentials</CardTitle>
						<Award className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.totalCredentials.toLocaleString()}</div>
						<p className='text-xs text-muted-foreground'>
							<TrendingUp className='inline h-3 w-3 mr-1' />+{stats?.recentActivity.issued} issued this week
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Active Credentials</CardTitle>
						<CheckCircle className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.activeCredentials.toLocaleString()}</div>
						<p className='text-xs text-muted-foreground'>{(((stats?.activeCredentials || 0) / (stats?.totalCredentials || 1)) * 100).toFixed(1)}% of total</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Verifications</CardTitle>
						<Shield className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.recentActivity.verified}</div>
						<p className='text-xs text-muted-foreground'>This week</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Templates</CardTitle>
						<FileText className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.templateCount}</div>
						<p className='text-xs text-muted-foreground'>Active templates</p>
					</CardContent>
				</Card>
			</div>

			{/* Credential Type Distribution and Management */}
			<Tabs defaultValue='overview' className='space-y-4'>
				<TabsList>
					<TabsTrigger value='overview'>Overview</TabsTrigger>
					<TabsTrigger value='credentials'>All Credentials</TabsTrigger>
					<TabsTrigger value='templates'>Templates</TabsTrigger>
					<TabsTrigger value='analytics'>Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value='overview' className='space-y-4'>
					<div className='grid gap-4 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle>Credential Type Distribution</CardTitle>
								<CardDescription>Distribution of credential types across the system</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-3'>
									{Object.entries(stats?.typeDistribution || {}).map(([type, count]) => (
										<div key={type} className='flex items-center justify-between'>
											<div className='flex items-center space-x-2'>
												<Award className='h-4 w-4' />
												<span>{type.replace('Credential', '')}</span>
											</div>
											<div className='flex items-center space-x-2'>
												<span className='font-medium'>{count}</span>
												<div className='w-20 bg-muted rounded-full h-2'>
													<div className='bg-primary h-2 rounded-full' style={{width: `${(count / (stats?.totalCredentials || 1)) * 100}%`}} />
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
								<CardDescription>Credential operations in the last 7 days</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center space-x-2'>
											<TrendingUp className='h-4 w-4 text-green-500' />
											<span>Issued</span>
										</div>
										<span className='font-medium'>{stats?.recentActivity.issued}</span>
									</div>
									<div className='flex items-center justify-between'>
										<div className='flex items-center space-x-2'>
											<Shield className='h-4 w-4 text-blue-500' />
											<span>Verified</span>
										</div>
										<span className='font-medium'>{stats?.recentActivity.verified}</span>
									</div>
									<div className='flex items-center justify-between'>
										<div className='flex items-center space-x-2'>
											<XCircle className='h-4 w-4 text-red-500' />
											<span>Revoked</span>
										</div>
										<span className='font-medium'>{stats?.recentActivity.revoked}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value='credentials' className='space-y-4'>
					{/* Search and Filters */}
					<Card>
						<CardHeader>
							<CardTitle>Credential Management</CardTitle>
							<CardDescription>Search and manage all verifiable credentials in the system</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='flex flex-col sm:flex-row gap-4 mb-6'>
								<div className='flex-1'>
									<div className='relative'>
										<Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
										<Input placeholder='Search by credential ID, holder, or issuer...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
									</div>
								</div>
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className='w-[180px]'>
										<SelectValue placeholder='Type' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Types</SelectItem>
										<SelectItem value='EducationCredential'>Education</SelectItem>
										<SelectItem value='EmploymentCredential'>Employment</SelectItem>
										<SelectItem value='IdentityCredential'>Identity</SelectItem>
										<SelectItem value='CertificationCredential'>Certification</SelectItem>
									</SelectContent>
								</Select>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className='w-[150px]'>
										<SelectValue placeholder='Status' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Status</SelectItem>
										<SelectItem value='active'>Active</SelectItem>
										<SelectItem value='revoked'>Revoked</SelectItem>
										<SelectItem value='expired'>Expired</SelectItem>
										<SelectItem value='suspended'>Suspended</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Credential Table */}
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Credential ID</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Holder</TableHead>
											<TableHead>Issuer</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Issued</TableHead>
											<TableHead>Verifications</TableHead>
											<TableHead className='w-[50px]'></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredCredentials.map((cred) => (
											<TableRow key={cred.id}>
												<TableCell className='font-mono text-sm'>{cred.id.length > 30 ? `${cred.id.substring(0, 30)}...` : cred.id}</TableCell>
												<TableCell>
													<Badge variant='outline'>{Array.isArray(cred.type) ? cred.type.filter((t) => t !== 'VerifiableCredential').join(', ') : cred.type}</Badge>
												</TableCell>
												<TableCell>
													<div>
														<div className='font-medium'>{cred.credentialSubject?.id || 'N/A'}</div>
													</div>
												</TableCell>
												<TableCell>
													<div className='font-medium'>{typeof cred.issuer === 'string' ? cred.issuer : cred.issuer?.id || 'N/A'}</div>
												</TableCell>
												<TableCell>
													<div className='flex items-center space-x-2'>
														{getStatusIcon(cred.credentialStatus || 'active')}
														<Badge variant={getStatusVariant(cred.credentialStatus || 'active')}>{cred.credentialStatus || 'active'}</Badge>
													</div>
												</TableCell>
												<TableCell>{new Date(cred.issuanceDate).toLocaleDateString()}</TableCell>
												<TableCell>
													<div className='text-center'>
														<div className='font-medium'>-</div>
														<div className='text-xs text-muted-foreground'>Not available</div>
													</div>
												</TableCell>
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
															{cred.credentialStatus === 'active' && (
																<DropdownMenuItem>
																	<Ban className='mr-2 h-4 w-4' />
																	Suspend
																</DropdownMenuItem>
															)}
															{(cred.credentialStatus === 'active' || cred.credentialStatus === 'suspended') && (
																<DropdownMenuItem className='text-destructive'>
																	<XCircle className='mr-2 h-4 w-4' />
																	Revoke
																</DropdownMenuItem>
															)}
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

				<TabsContent value='templates' className='space-y-4'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle>Credential Templates</CardTitle>
									<CardDescription>Manage credential templates and schemas</CardDescription>
								</div>
								<Button>
									<Plus className='mr-2 h-4 w-4' />
									New Template
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
								{templates.map((template) => (
									<Card key={template.id} className='relative'>
										<CardHeader>
											<div className='flex items-center justify-between'>
												<CardTitle className='text-lg'>{template.name}</CardTitle>
												<Badge variant={template.isActive ? 'default' : 'secondary'}>{template.isActive ? 'Active' : 'Inactive'}</Badge>
											</div>
											<CardDescription>{Array.isArray(template.type) ? template.type.join(', ') : template.type}</CardDescription>
										</CardHeader>
										<CardContent>
											<div className='space-y-2'>
												<div className='flex justify-between text-sm'>
													<span className='text-muted-foreground'>Usage Count:</span>
													<span className='font-medium'>{template.issuanceCount || 0}</span>
												</div>
												<div className='flex justify-between text-sm'>
													<span className='text-muted-foreground'>Created:</span>
													<span>{new Date(template.createdAt).toLocaleDateString()}</span>
												</div>
												<div className='flex justify-between text-sm'>
													<span className='text-muted-foreground'>Updated:</span>
													<span>{new Date(template.updatedAt).toLocaleDateString()}</span>
												</div>
											</div>
											<div className='flex space-x-2 mt-4'>
												<Button variant='outline' size='sm' className='flex-1'>
													<Eye className='mr-1 h-3 w-3' />
													View
												</Button>
												<Button variant='outline' size='sm' className='flex-1'>
													<Settings className='mr-1 h-3 w-3' />
													Edit
												</Button>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='analytics' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Credential Analytics</CardTitle>
							<CardDescription>Usage metrics and trends</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='text-center py-8 text-muted-foreground'>
								<Activity className='mx-auto h-12 w-12 mb-4' />
								<p>Analytics charts will be implemented here</p>
								<p className='text-sm'>Including issuance trends, verification patterns, and credential lifecycle metrics</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
