'use client'

import {useState, useEffect} from 'react'
import {useQuery} from '@tanstack/react-query'
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

import {listCredentials} from '@/services/vcService'
import * as vcService from '@/services/vcService'
import type {CredentialStatus, ListCredentialsInput, CredentialMetadata} from '@/types/credentials'
import {CredentialMetadataCard, VerifyCredentialModal} from '@/components/credentials'
import {BulkCredentialManager} from '@/components/credentials/BulkCredentialManager'
import {RealTimeStatusMonitor} from '@/components/credentials/RealTimeStatusMonitor'

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
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<CredentialStatus | 'all'>('all')
	const [typeFilter, setTypeFilter] = useState<string>('all')
	const [activeTab, setActiveTab] = useState<'issued' | 'received' | 'bulk' | 'monitor'>('issued')
	const [issuedPage, setIssuedPage] = useState(1)
	const [receivedPage, setReceivedPage] = useState(1)
	const [showVerifyModal, setShowVerifyModal] = useState(false)
	const limit = 10

	// Reset page to 1 when filters change
	useEffect(() => {
		setIssuedPage(1)
		setReceivedPage(1)
	}, [searchTerm, statusFilter, typeFilter])

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
			const currentCredentials = activeTab === 'issued' 
				? issuedCredentialsData?.credentials 
				: receivedCredentialsData?.credentials
			const credential = currentCredentials?.find(c => c.id === credentialId)
			
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
				reason: 'Revoked by issuer'
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
		queryFn: () => listCredentials(issuedQueryParams),
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
		queryFn: () => listCredentials(receivedQueryParams),
		staleTime: 30000, // 30 seconds
	})

	// For backward compatibility and current tab logic
	const credentialsData = activeTab === 'issued' ? issuedCredentialsData : receivedCredentialsData
	const isLoading = activeTab === 'issued' ? isLoadingIssued : isLoadingReceived
	const error = activeTab === 'issued' ? errorIssued : errorReceived
	const refetch = activeTab === 'issued' ? refetchIssued : refetchReceived

	// Calculate statistics
	const stats = {
		total: credentialsData?.total || 0,
		active: credentialsData?.credentials.filter((c) => c.status === 'active').length || 0,
		revoked: credentialsData?.credentials.filter((c) => c.status === 'revoked').length || 0,
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

			{/* Statistics Cards */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Credentials</CardTitle>
						<Eye className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats.total}</div>
						<p className='text-xs text-muted-foreground'>All credentials in your wallet</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Active</CardTitle>
						<Shield className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>{stats.active}</div>
						<p className='text-xs text-muted-foreground'>Valid and active credentials</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Revoked</CardTitle>
						<AlertTriangle className='h-4 w-4 text-red-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-red-600'>{stats.revoked}</div>
						<p className='text-xs text-muted-foreground'>Revoked credentials</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Expired</CardTitle>
						<AlertTriangle className='h-4 w-4 text-orange-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-orange-600'>{stats.expired}</div>
						<p className='text-xs text-muted-foreground'>Expired credentials</p>
					</CardContent>
				</Card>
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

					{/* Tabs for Issued/Received/Bulk */}
					<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'issued' | 'received' | 'bulk' | 'monitor')}>
						<TabsList className='grid w-full grid-cols-4'>
							<TabsTrigger value='issued'>Issued by Me</TabsTrigger>
							<TabsTrigger value='received'>Received by Me</TabsTrigger>
							<TabsTrigger value='bulk'>Bulk Management</TabsTrigger>
							<TabsTrigger value='monitor'>Status Monitor</TabsTrigger>
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
									<p className='text-muted-foreground mb-4'>
										{searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
											? 'No credentials match your current filters.' 
											: "You haven't issued any credentials yet."
										}
									</p>
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
									<div className='space-y-4'>
										{issuedCredentialsData.credentials.map((credential) => (
											<CredentialMetadataCard 
												key={credential.id} 
												credential={credential} 
												onView={() => (window.location.href = `/dashboard/credentials/${credential.id}`)} 
												onDownload={() => handleDownloadCredential(credential)}
												onRevoke={handleRevokeCredential}
												showRevokeOption={true} // Hiện revoke option cho credentials do user issue
											/>
										))}
									</div>
									
									{/* Pagination for Issued Credentials */}
									{issuedCredentialsData && issuedCredentialsData.total > limit && (
										<div className='flex justify-center mt-6'>
											<div className='flex gap-2'>
												<Button 
													variant='outline' 
													onClick={() => setIssuedPage((p) => Math.max(1, p - 1))} 
													disabled={!issuedCredentialsData.hasPrev}
												>
													Previous
												</Button>
												<span className='flex items-center px-4'>
													Page {issuedPage} of {Math.ceil(issuedCredentialsData.total / limit)}
												</span>
												<Button 
													variant='outline' 
													onClick={() => setIssuedPage((p) => p + 1)} 
													disabled={!issuedCredentialsData.hasNext}
												>
													Next
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
									<p className='text-muted-foreground mb-4'>
										{searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
											? 'No credentials match your current filters.' 
											: "You haven't received any credentials yet."
										}
									</p>
								</div>
							) : (
								<>
									<div className='space-y-4'>
										{receivedCredentialsData.credentials.map((credential) => (
											<CredentialMetadataCard 
												key={credential.id} 
												credential={credential} 
												onView={() => (window.location.href = `/dashboard/credentials/${credential.id}`)} 
												onDownload={() => handleDownloadCredential(credential)}
												showRevokeOption={false} // No revoke option for received credentials
											/>
										))}
									</div>
									
									{/* Pagination for Received Credentials */}
									{receivedCredentialsData && receivedCredentialsData.total > limit && (
										<div className='flex justify-center mt-6'>
											<div className='flex gap-2'>
												<Button 
													variant='outline' 
													onClick={() => setReceivedPage((p) => Math.max(1, p - 1))} 
													disabled={!receivedCredentialsData.hasPrev}
												>
													Previous
												</Button>
												<span className='flex items-center px-4'>
													Page {receivedPage} of {Math.ceil(receivedCredentialsData.total / limit)}
												</span>
												<Button 
													variant='outline' 
													onClick={() => setReceivedPage((p) => p + 1)} 
													disabled={!receivedCredentialsData.hasNext}
												>
													Next
												</Button>
											</div>
										</div>
									)}
								</>
							)}
						</TabsContent>

						<TabsContent value='bulk' className='mt-6'>
							<BulkCredentialManager
								credentials={credentialsData?.credentials || []}
								onCredentialsUpdated={() => refetch()}
							/>
						</TabsContent>

						<TabsContent value='monitor' className='mt-6'>
							<RealTimeStatusMonitor
								credentials={credentialsData?.credentials || []}
								onStatusChange={() => refetch()}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Verify Credential Modal */}
			<VerifyCredentialModal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} />
		</div>
	)
}
