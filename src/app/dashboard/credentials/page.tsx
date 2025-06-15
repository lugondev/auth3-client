'use client'

import {useState} from 'react'
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
import type {CredentialStatus, ListCredentialsInput, VerifiableCredential} from '@/types/credentials'
import {CredentialCard} from '@/components/credentials/CredentialCard'

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
	const [activeTab, setActiveTab] = useState<'issued' | 'received'>('issued')
	const [page, setPage] = useState(1)
	const limit = 10

	// Query parameters for API call
	const queryParams: ListCredentialsInput = {
		page,
		limit,
		...(statusFilter !== 'all' && {status: statusFilter as CredentialStatus}),
		...(typeFilter !== 'all' && {type: typeFilter}),
		sortBy: 'issuedAt',
		sortOrder: 'desc',
	}

	/**
	 * Handle downloading a credential as JSON file
	 * @param credential - The credential to download
	 */
	const handleDownloadCredential = (credential: VerifiableCredential) => {
		try {
			// Create JSON blob with formatted credential data
			const credentialData = {
				'@context': credential['@context'] || ['https://www.w3.org/2018/credentials/v1'],
				id: credential.id,
				type: credential.type,
				issuer: credential.issuer,
				issuanceDate: credential.issuanceDate,
				...(credential.expirationDate && { expirationDate: credential.expirationDate }),
				credentialSubject: credential.credentialSubject,
				...(credential.proof && { proof: credential.proof }),
				...(credential.credentialStatus && { credentialStatus: credential.credentialStatus })
			}

			const dataStr = JSON.stringify(credentialData, null, 2)
			const dataBlob = new Blob([dataStr], { type: 'application/json' })
			const url = URL.createObjectURL(dataBlob)
			
			// Create download link
			const link = document.createElement('a')
			link.href = url
			link.download = `credential-${credential.id || Date.now()}.json`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			URL.revokeObjectURL(url)

			toast.success('Credential downloaded successfully')
		} catch (error) {
			console.error('Error downloading credential:', error)
			toast.error('Failed to download credential')
		}
	}

	// Fetch credentials data
	const {
		data: credentialsData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['credentials', activeTab, queryParams],
		queryFn: () => listCredentials(queryParams),
		staleTime: 30000, // 30 seconds
	})

	// Filter credentials based on search term
	const filteredCredentials =
		credentialsData?.credentials.filter((credential) => {
			if (!searchTerm) return true
			const searchLower = searchTerm.toLowerCase()
			return credential.id.toLowerCase().includes(searchLower) || credential.type.some((type) => type.toLowerCase().includes(searchLower)) || credential.issuer.toLowerCase().includes(searchLower) || credential.subject.toLowerCase().includes(searchLower)
		}) || []

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
					<Button variant='outline' asChild>
						<Link href='/dashboard/credentials/verify'>
							<Shield className='h-4 w-4 mr-2' />
							Verify Credential
						</Link>
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

					{/* Tabs for Issued/Received */}
					<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'issued' | 'received')}>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='issued'>Issued by Me</TabsTrigger>
							<TabsTrigger value='received'>Received by Me</TabsTrigger>
						</TabsList>

						<TabsContent value='issued' className='mt-6'>
							{isLoading ? (
								<div className='space-y-4'>
									{[...Array(3)].map((_, i) => (
										<Skeleton key={i} className='h-32 w-full' />
									))}
								</div>
							) : error ? (
								<Alert variant='destructive'>
									<AlertTriangle className='h-4 w-4' />
									<AlertDescription>Failed to load credentials. Please try again.</AlertDescription>
								</Alert>
							) : filteredCredentials.length === 0 ? (
								<div className='text-center py-12'>
									<Shield className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
									<h3 className='text-lg font-semibold mb-2'>No credentials found</h3>
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
								<div className='space-y-4'>
									{filteredCredentials.map((credential) => (
										<CredentialCard
											key={credential.id}
											credential={credential}
											onView={() => window.open(`/dashboard/credentials/${credential.id}`, '_blank')}
											onDownload={() => handleDownloadCredential(credential)}
										/>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value='received' className='mt-6'>
							{/* Similar content for received credentials */}
							<div className='text-center py-12'>
								<Shield className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
								<h3 className='text-lg font-semibold mb-2'>Received credentials</h3>
								<p className='text-muted-foreground'>Credentials received from other issuers will appear here.</p>
							</div>
						</TabsContent>
					</Tabs>

					{/* Pagination */}
					{credentialsData && credentialsData.total > limit && (
						<div className='flex justify-center mt-6'>
							<div className='flex gap-2'>
								<Button variant='outline' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
									Previous
								</Button>
								<span className='flex items-center px-4'>
									Page {page} of {Math.ceil(credentialsData.total / limit)}
								</span>
								<Button variant='outline' onClick={() => setPage((p) => p + 1)} disabled={!credentialsData.hasNext}>
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
