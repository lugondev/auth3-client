'use client'

import {useState, useEffect} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useRouter} from 'next/navigation'
import {Plus, Search, Eye, Shield, AlertTriangle} from 'lucide-react'
import Link from 'next/link'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'

import {listMyIssuedCredentials, listMyReceivedCredentials} from '@/services/vcService'
import * as vcService from '@/services/vcService'
import {useCredentialAnalytics, getAnalyticsQueryPresets} from '@/hooks/useCredentialAnalytics'
import type {CredentialStatus, ListCredentialsInput, CredentialMetadata} from '@/types/credentials'
import {CredentialMetadataCard, VerifyCredentialModal} from '@/components/credentials'
import {BulkCredentialManager} from '@/components/credentials/BulkCredentialManager'
import {RealTimeStatusMonitor} from '@/components/credentials/RealTimeStatusMonitor'
import {AnalyticsOverview} from '@/components/credentials/AnalyticsOverview'

/**
 * VC Dashboard Page - Main dashboard for managing Verifiable Credentials
 *
 * Features:
 * - List issued and received credentials
 * - Filter and search credentials
 * - Quick actions (view, verify, revoke)
 * - Credential statistics
 */
export default function CredentialsDashboard() {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<CredentialStatus | 'all'>('all')
	const [typeFilter, setTypeFilter] = useState<string>('all')
	const [activeTab, setActiveTab] = useState<'issued' | 'received' | 'bulk' | 'monitor' | 'analytics'>('issued')
	const [issuedPage, setIssuedPage] = useState(1)
	const [receivedPage, setReceivedPage] = useState(1)
	const [showVerifyModal, setShowVerifyModal] = useState(false)
	const limit = 10

	// Reset page to 1 when filters change
	useEffect(() => {
		setIssuedPage(1)
		setReceivedPage(1)
	}, [searchTerm, statusFilter, typeFilter])

	// Refetch data when page changes
	useEffect(() => {
		// This will automatically trigger the queries due to query key dependency
		// but we can also explicitly refetch if needed
		if (issuedPage > 1) {
			console.log('Issued page changed to:', issuedPage)
		}
		if (receivedPage > 1) {
			console.log('Received page changed to:', receivedPage)
		}
	}, [issuedPage, receivedPage])

	// Query parameters for issued credentials (credentials I issued)
	const issuedQueryParams: ListCredentialsInput = {
		page: issuedPage,
		limit,
		...(statusFilter !== 'all' && {status: statusFilter as CredentialStatus}),
		...(typeFilter !== 'all' && {type: typeFilter}),
		...(searchTerm && {search: searchTerm}),
		// TODO: Add issuer filter once we can get current user DID
	}

	// Query parameters for received credentials (credentials issued to me)
	const receivedQueryParams: ListCredentialsInput = {
		page: receivedPage,
		limit,
		...(statusFilter !== 'all' && {status: statusFilter as CredentialStatus}),
		...(typeFilter !== 'all' && {type: typeFilter}),
		...(searchTerm && {search: searchTerm}),
		// TODO: Add subject filter once we can get current user DID
	}

	/**
	 * Handle viewing a credential details page
	 * @param credentialId - The credential ID to view
	 */
	const handleViewCredential = (credentialId: string) => {
		router.push(`/dashboard/credentials/${credentialId}`)
	}

	/**
	 * Handle downloading a credential as JSON file
	 * @param credential - The credential to download
	 */
	const handleDownloadCredential = (credential: CredentialMetadata) => {
		try {
			// Create JSON blob with credential metadata
			const blob = new Blob([JSON.stringify(credential, null, 2)], {type: 'application/json'})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `credential-metadata-${credential.id}.json`
			a.click()
			URL.revokeObjectURL(url)
			toast.success('Credential metadata downloaded successfully')
		} catch (error) {
			console.error('Error downloading credential:', error)
			toast.error('Failed to download credential')
		}
	}

	/**
	 * Handle revoking a credential
	 * @param credentialId - The credential ID to revoke
	 */
	const handleRevokeCredential = async (credentialId: string) => {
		try {
			// Find the credential to get issuer DID from current tab's data
			const currentCredentials = activeTab === 'issued' ? issuedCredentialsData?.credentials : receivedCredentialsData?.credentials
			const credential = currentCredentials?.find((c) => c.id === credentialId)

			if (!credential) {
				toast.error('Credential not found')
				return
			}

			// Extract issuer DID from credential
			let issuerDID: string
			if (typeof credential.issuer === 'string') {
				issuerDID = credential.issuer
			} else {
				issuerDID = credential.issuer.id
			}

			await vcService.revokeCredential({
				credentialId: credentialId,
				issuerDID,
				reason: 'Revoked by issuer',
			})

			toast.success('Credential revoked successfully')
			// Refresh the appropriate credentials list
			if (activeTab === 'issued') {
				await refetchIssued()
			} else {
				await refetchReceived()
			}
		} catch (error) {
			console.error('Error revoking credential:', error)
			toast.error('Failed to revoke credential. Please check if you have permission to revoke this credential.')
		}
	}

	// Fetch issued credentials data (credentials I issued)
	const {
		data: issuedCredentialsData,
		isLoading: isLoadingIssued,
		error: errorIssued,
		refetch: refetchIssued,
	} = useQuery({
		queryKey: ['credentials', 'issued', issuedQueryParams],
		queryFn: () => listMyIssuedCredentials(issuedQueryParams),
		staleTime: 30000, // 30 seconds
	})

	// Fetch received credentials data (credentials issued to me)
	const {
		data: receivedCredentialsData,
		isLoading: isLoadingReceived,
		error: errorReceived,
		refetch: refetchReceived,
	} = useQuery({
		queryKey: ['credentials', 'received', receivedQueryParams],
		queryFn: () => listMyReceivedCredentials(receivedQueryParams),
		staleTime: 30000, // 30 seconds
	})

	// For backward compatibility and current tab logic
	const credentialsData = activeTab === 'issued' ? issuedCredentialsData : receivedCredentialsData
	const refetch = activeTab === 'issued' ? refetchIssued : refetchReceived

	// Get analytics query presets for different time periods
	const analyticsPresets = getAnalyticsQueryPresets()

	// Fetch analytics data for enhanced statistics
	const {data: analyticsData, isLoading: isLoadingAnalytics, error: analyticsError} = useCredentialAnalytics(analyticsPresets.lastMonth)

	// Calculate statistics with enhanced analytics data
	const stats = {
		total: analyticsData?.overview_metrics?.total_credentials || credentialsData?.total || 0,
		active: analyticsData?.overview_metrics?.active_credentials || credentialsData?.credentials.filter((c) => c.status === 'active').length || 0,
		revoked: analyticsData?.overview_metrics?.revoked_credentials || credentialsData?.credentials.filter((c) => c.status === 'revoked').length || 0,
		deactivated: analyticsData?.overview_metrics?.deactivated_credentials || 0,
		expired: credentialsData?.credentials.filter((c) => c.status === 'expired').length || 0,
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Verifiable Credentials</h1>
					<p className='text-muted-foreground'>Manage your issued and received verifiable credentials</p>
				</div>
				<div className='flex gap-2'>
					<Button asChild>
						<Link href='/dashboard/credentials/issue'>
							<Plus className='h-4 w-4 mr-2' />
							Issue Credential
						</Link>
					</Button>
					<Button variant='outline' onClick={() => setShowVerifyModal(true)}>
						<Shield className='h-4 w-4 mr-2' />
						Verify Credential
					</Button>
				</div>
			</div>

			{/* Time Period Filter */}
			<Card>
				<CardContent className='pt-6'>
					<div className='flex items-center gap-4'>
						<label className='text-sm font-medium'>Time Period:</label>
						<Select defaultValue='month'>
							<SelectTrigger className='w-[180px]'>
								<SelectValue placeholder='Select period' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='day'>Last 24 Hours</SelectItem>
								<SelectItem value='week'>Last 7 Days</SelectItem>
								<SelectItem value='month'>Last 30 Days</SelectItem>
								<SelectItem value='custom'>Custom Range</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Statistics Cards - VC Issued, VC Received, Revoked, Active */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<Card className='border-l-4 border-l-blue-500'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>VC Issued</p>
								<div className='text-3xl font-bold text-blue-600'>{isLoadingAnalytics ? <Skeleton className='h-8 w-16' /> : analyticsData?.issuance_metrics?.total_issued || 0}</div>
							</div>
							<div className='p-3 bg-blue-50 rounded-full'>
								<Plus className='h-6 w-6 text-blue-600' />
							</div>
						</div>
						<p className='text-xs text-muted-foreground mt-2'>+{analyticsData?.issuance_metrics?.issued_this_month || 0} this month</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-green-500'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>VC Received</p>
								<div className='text-3xl font-bold text-green-600'>{isLoadingAnalytics ? <Skeleton className='h-8 w-16' /> : analyticsData?.received_metrics?.total_received || 0}</div>
							</div>
							<div className='p-3 bg-green-50 rounded-full'>
								<Eye className='h-6 w-6 text-green-600' />
							</div>
						</div>
						<p className='text-xs text-muted-foreground mt-2'>+{analyticsData?.received_metrics?.received_this_month || 0} this month</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-red-500'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Revoked</p>
								<div className='text-3xl font-bold text-red-600'>{isLoadingAnalytics ? <Skeleton className='h-8 w-16' /> : analyticsData?.overview_metrics?.revoked_credentials || stats.revoked}</div>
							</div>
							<div className='p-3 bg-red-50 rounded-full'>
								<AlertTriangle className='h-6 w-6 text-red-600' />
							</div>
						</div>
						<p className='text-xs text-muted-foreground mt-2'>{analyticsData?.status_metrics?.revoked_credentials?.revoked_this_month || 0} this month</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-orange-500'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Deactivated</p>
								<div className='text-3xl font-bold text-orange-600'>{isLoadingAnalytics ? <Skeleton className='h-8 w-16' /> : analyticsData?.overview_metrics?.deactivated_credentials || stats.deactivated}</div>
							</div>
							<div className='p-3 bg-orange-50 rounded-full'>
								<AlertTriangle className='h-6 w-6 text-orange-600' />
							</div>
						</div>
						<p className='text-xs text-muted-foreground mt-2'>{analyticsData?.status_metrics?.deactivated_credentials?.deactivated_this_month || 0} this month</p>
					</CardContent>
				</Card>

				{/* Analytics Error Alert */}
				{analyticsError && (
					<div className='col-span-full'>
						<Alert variant='default'>
							<AlertTriangle className='h-4 w-4' />
							<AlertDescription>Enhanced analytics temporarily unavailable. Showing basic statistics.</AlertDescription>
						</Alert>
					</div>
				)}
			</div>

			{/* Filters and Search */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Credentials</CardTitle>
					<CardDescription>View and manage your verifiable credentials</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col sm:flex-row gap-4 mb-6'>
						<div className='flex-1'>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
								<Input placeholder='Search credentials...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
							</div>
						</div>

						<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CredentialStatus | 'all')}>
							<SelectTrigger className='w-[180px]'>
								<SelectValue placeholder='Filter by status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Status</SelectItem>
								<SelectItem value='active'>Active</SelectItem>
								<SelectItem value='revoked'>Revoked</SelectItem>
								<SelectItem value='suspended'>Suspended</SelectItem>
								<SelectItem value='expired'>Expired</SelectItem>
							</SelectContent>
						</Select>

						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className='w-[180px]'>
								<SelectValue placeholder='Filter by type' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Types</SelectItem>
								<SelectItem value='VerifiableCredential'>Basic Credential</SelectItem>
								<SelectItem value='UniversityDegreeCredential'>University Degree</SelectItem>
								<SelectItem value='DriverLicenseCredential'>Driver License</SelectItem>
								<SelectItem value='EmploymentCredential'>Employment</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Tabs for Issued/Received/Bulk/Monitor/Analytics */}
					<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'issued' | 'received' | 'bulk' | 'monitor' | 'analytics')}>
						<TabsList className='grid w-full grid-cols-5'>
							<TabsTrigger value='issued'>Issued by Me</TabsTrigger>
							<TabsTrigger value='received'>Received by Me</TabsTrigger>
							<TabsTrigger value='bulk'>Bulk Management</TabsTrigger>
							<TabsTrigger value='monitor'>Status Monitor</TabsTrigger>
							<TabsTrigger value='analytics'>Analytics</TabsTrigger>
						</TabsList>

						<TabsContent value='issued' className='mt-6'>
							{isLoadingIssued ? (
								<div className='space-y-4'>
									{[...Array(3)].map((_, i) => (
										<Skeleton key={i} className='h-32 w-full' />
									))}
								</div>
							) : errorIssued ? (
								<Alert variant='destructive'>
									<AlertTriangle className='h-4 w-4' />
									<AlertDescription>Failed to load issued credentials. Please try again.</AlertDescription>
								</Alert>
							) : !issuedCredentialsData?.credentials || issuedCredentialsData.credentials.length === 0 ? (
								<div className='text-center py-12'>
									<Shield className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
									<h3 className='text-lg font-semibold mb-2'>No issued credentials found</h3>
									<p className='text-muted-foreground mb-4'>{searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 'No credentials match your current filters.' : "You haven't issued any credentials yet."}</p>
									{!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
										<Button asChild>
											<Link href='/dashboard/credentials/issue'>
												<Plus className='h-4 w-4 mr-2' />
												Issue Your First Credential
											</Link>
										</Button>
									)}
								</div>
							) : (
								<>
									<div className={`space-y-4 ${isLoadingIssued ? 'opacity-60 pointer-events-none' : ''}`}>
										{issuedCredentialsData.credentials.map((credential) => (
											<CredentialMetadataCard key={credential.id} credential={credential} onView={() => handleViewCredential(credential.id)} onDownload={() => handleDownloadCredential(credential)} onRevoke={handleRevokeCredential} showRevokeOption={true} />
										))}
									</div>

									{/* Pagination for Issued Credentials */}
									{issuedCredentialsData && issuedCredentialsData.total > limit && (
										<div className='flex justify-center mt-6'>
											<div className='flex gap-2'>
												<Button
													variant='outline'
													onClick={() => {
														setIssuedPage((p) => Math.max(1, p - 1))
													}}
													disabled={issuedPage <= 1 || isLoadingIssued}>
													{isLoadingIssued && issuedPage > 1 ? 'Loading...' : 'Previous'}
												</Button>
												<span className='flex items-center px-4'>
													Page {issuedPage} of {Math.ceil(issuedCredentialsData.total / limit)}
												</span>
												<Button
													variant='outline'
													onClick={() => {
														setIssuedPage((p) => p + 1)
													}}
													disabled={issuedPage >= Math.ceil(issuedCredentialsData.total / limit) || isLoadingIssued}>
													{isLoadingIssued ? 'Loading..' : 'Next'}
												</Button>
											</div>
										</div>
									)}
								</>
							)}
						</TabsContent>

						<TabsContent value='received' className='mt-6'>
							{isLoadingReceived ? (
								<div className='space-y-4'>
									{[...Array(3)].map((_, i) => (
										<Skeleton key={i} className='h-32 w-full' />
									))}
								</div>
							) : errorReceived ? (
								<Alert variant='destructive'>
									<AlertTriangle className='h-4 w-4' />
									<AlertDescription>Failed to load received credentials. Please try again.</AlertDescription>
								</Alert>
							) : !receivedCredentialsData?.credentials || receivedCredentialsData.credentials.length === 0 ? (
								<div className='text-center py-12'>
									<Shield className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
									<h3 className='text-lg font-semibold mb-2'>No received credentials found</h3>
									<p className='text-muted-foreground mb-4'>{searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 'No credentials match your current filters.' : "You haven't received any credentials yet."}</p>
								</div>
							) : (
								<>
									<div className={`space-y-4 ${isLoadingReceived ? 'opacity-60 pointer-events-none' : ''}`}>
										{receivedCredentialsData.credentials.map((credential) => (
											<CredentialMetadataCard
												key={credential.id}
												credential={credential}
												onView={() => handleViewCredential(credential.id)}
												onDownload={() => handleDownloadCredential(credential)}
												onRevoke={handleRevokeCredential}
												showRevokeOption={true} // Cho phép holder revoke credentials họ nhận được
											/>
										))}
									</div>

									{/* Pagination for Received Credentials */}
									{receivedCredentialsData && receivedCredentialsData.total > limit && (
										<div className='flex justify-center mt-6'>
											<div className='flex gap-2'>
												<Button
													variant='outline'
													onClick={() => {
														setReceivedPage((p) => Math.max(1, p - 1))
													}}
													disabled={receivedPage <= 1 || isLoadingReceived}>
													{isLoadingReceived && receivedPage > 1 ? 'Loading...' : 'Previous'}
												</Button>
												<span className='flex items-center px-4'>
													Page {receivedPage} of {Math.ceil(receivedCredentialsData.total / limit)}
												</span>
												<Button
													variant='outline'
													onClick={() => {
														setReceivedPage((p) => p + 1)
													}}
													disabled={receivedPage >= Math.ceil(receivedCredentialsData.total / limit) || isLoadingReceived}>
													{isLoadingReceived ? 'Loading...' : 'Next'}
												</Button>
											</div>
										</div>
									)}
								</>
							)}
						</TabsContent>

						<TabsContent value='bulk' className='mt-6'>
							<BulkCredentialManager credentials={credentialsData?.credentials || []} onCredentialsUpdated={() => refetch()} />
						</TabsContent>

						<TabsContent value='monitor' className='mt-6'>
							<RealTimeStatusMonitor credentials={credentialsData?.credentials || []} onStatusChange={() => refetch()} />
						</TabsContent>

						<TabsContent value='analytics' className='mt-6'>
							<AnalyticsOverview />
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Verify Credential Modal */}
			<VerifyCredentialModal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} />
		</div>
	)
}
