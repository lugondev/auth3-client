'use client'

import React, {useState, useEffect} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {useParams, useRouter} from 'next/navigation'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {ArrowLeft, Download, Share2, Shield, Clock, User, Building, FileText, Copy, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, RefreshCw} from 'lucide-react'
import {toast} from 'sonner'
import {Label} from '@/components/ui/label'

import {getTenantCredentialById, revokeCredential, CredentialWithStatusInfo} from '../helpers/credential-helpers'
import {formatDate} from '@/lib/utils'

/**
 * Tenant Credential Details Page Component
 * Displays comprehensive information about a specific verifiable credential for a tenant
 */
export default function TenantCredentialDetailsPage() {
	const params = useParams()
	const router = useRouter()
	const tenantId = params.tenantId as string
	const credentialId = params.credentialId as string

	// State management
	const [credential, setCredential] = useState<CredentialWithStatusInfo | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState('overview')
	const [showProof, setShowProof] = useState(false)

	/**
	 * Load credential details
	 */
	useEffect(() => {
		const loadCredentialDetails = async () => {
			try {
				setLoading(true)
				setError(null)

				// Load credential details
				const credentialData = await getTenantCredentialById(tenantId, credentialId)
				setCredential(credentialData)
			} catch (err) {
				console.error('Error loading credential:', err)
				setError('Failed to load credential details. Please try again.')
			} finally {
				setLoading(false)
			}
		}

		if (tenantId && credentialId) {
			loadCredentialDetails()
		}
	}, [tenantId, credentialId])

	/**
	 * Copy text to clipboard
	 */
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast.success('Copied to clipboard successfully!')
		} catch (error) {
			console.error('Failed to copy:', error)
			toast.error('Failed to copy to clipboard')
		}
	}

	/**
	 * Download credential as JSON
	 */
	const downloadVC = () => {
		if (!credential) return

		const blob = new Blob([JSON.stringify(credential, null, 2)], {
			type: 'application/json',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `vc-${credential.id.split(':').pop()}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	/**
	 * Share credential
	 */
	const shareCredential = async () => {
		if (!credential) return

		const credentialUrl = `${window.location.origin}/dashboard/tenant/${tenantId}/vc/${credential.id}`

		if (navigator.share) {
			try {
				await navigator.share({
					title: 'Verifiable Credential',
					text: `Credential: ${credential.id}`,
					url: credentialUrl,
				})
			} catch {
				// User cancelled sharing
			}
		} else {
			await copyToClipboard(credentialUrl)
			toast.success('Credential URL copied to clipboard')
		}
	}

	// Modal state for revoke confirmation
	const [showRevokeModal, setShowRevokeModal] = useState(false)
	const [revokeLoading, setRevokeLoading] = useState(false)

	const handleRevokeVC = () => {
		setShowRevokeModal(true)
	}

	const confirmRevokeVC = async () => {
		if (!credential) return
		setRevokeLoading(true)
		try {
			await revokeCredential(tenantId, credential.id, typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id, 'Revoked from tenant dashboard')
			toast.success('Verifiable Credential revoked successfully!')
			// Refresh credential data
			const updatedCredential = await getTenantCredentialById(tenantId, credentialId)
			setCredential(updatedCredential)
			setShowRevokeModal(false)
		} catch (error) {
			console.error('Error revoking VC:', error)
			toast.error('Failed to revoke credential. Please try again.')
		} finally {
			setRevokeLoading(false)
		}
	}

	/**
	 * Get credential status
	 */
	const getCredentialStatus = (): string => {
		if (!credential) return 'unknown'

		// Check expiration date
		if (credential.expirationDate && new Date(credential.expirationDate) < new Date()) {
			return 'expired'
		}

		// Check credential status
		if (credential.credentialStatus?.status) {
			return credential.credentialStatus.status
		}

		return 'active'
	}

	/**
	 * Format issuer display string
	 */
	const formatIssuer = (issuer: string | {id: string; name?: string}): string => {
		if (typeof issuer === 'string') {
			return issuer
		}
		return issuer.name || issuer.id
	}

	/**
	 * Get status badge variant
	 */
	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case 'active':
				return 'default'
			case 'revoked':
				return 'destructive'
			case 'expired':
				return 'secondary'
			default:
				return 'outline'
		}
	}

	/**
	 * Get status icon
	 */
	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'active':
				return <CheckCircle className='h-4 w-4 text-green-600' />
			case 'revoked':
				return <XCircle className='h-4 w-4 text-red-600' />
			case 'expired':
				return <Clock className='h-4 w-4 text-orange-600' />
			default:
				return <AlertTriangle className='h-4 w-4 text-yellow-600' />
		}
	}

	// Loading state
	if (loading) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='flex items-center justify-center h-64'>
					<RefreshCw className='h-8 w-8 animate-spin' />
				</div>
			</div>
		)
	}

	// Error state
	if (error || !credential) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<Alert variant='destructive'>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>{error || 'Credential not found'}</AlertDescription>
				</Alert>
				<div className='mt-4'>
					<Button variant='outline' onClick={() => router.back()}>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Go Back
					</Button>
				</div>
			</div>
		)
	}

	const status = getCredentialStatus()

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='space-y-6'>
				{/* Header */}
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<Button variant='outline' size='sm' onClick={() => router.back()}>
							<ArrowLeft className='h-4 w-4' />
						</Button>
						<div>
							<div className='flex items-center gap-2'>
								<h1 className='text-2xl font-bold'>Credential Details</h1>
								{getStatusIcon(status)}
								<Badge variant={getStatusBadgeVariant(status)}>{status.toUpperCase()}</Badge>
							</div>
							<p className='text-muted-foreground'>Tenant: {tenantId}</p>
						</div>
					</div>

					<div className='flex gap-2'>
						<Button variant='outline' onClick={shareCredential}>
							<Share2 className='h-4 w-4 mr-2' />
							Share
						</Button>
						<Button variant='outline' onClick={downloadVC}>
							<Download className='h-4 w-4 mr-2' />
							Download
						</Button>
						{status === 'active' && (
							<Button variant='destructive' onClick={handleRevokeVC}>
								<XCircle className='h-4 w-4 mr-2' />
								Revoke
							</Button>
						)}
					</div>
				</div>

				{/* Revoke Confirmation Modal */}
				<Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Revoke Credential</DialogTitle>
							<DialogDescription>Are you sure you want to revoke this credential? This action cannot be undone.</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowRevokeModal(false)} disabled={revokeLoading}>
								Cancel
							</Button>
							<Button variant='destructive' onClick={confirmRevokeVC} disabled={revokeLoading}>
								{revokeLoading ? 'Revoking...' : 'Confirm Revoke'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList className='grid w-full grid-cols-3'>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='details'>Details</TabsTrigger>
						<TabsTrigger value='security'>Security</TabsTrigger>
					</TabsList>

					{/* Overview Tab */}
					<TabsContent value='overview' className='space-y-4'>
						<div className='grid gap-4 md:grid-cols-2'>
							{/* Basic Information */}
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<FileText className='h-5 w-5' />
										Basic Information
									</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<Label className='text-sm font-medium'>Credential ID</Label>
										<div className='flex items-center gap-2 mt-1'>
											<code className='text-sm bg-muted px-2 py-1 rounded flex-1 truncate'>{credential.id}</code>
											<Button variant='outline' size='sm' onClick={() => copyToClipboard(credential.id)}>
												<Copy className='h-4 w-4' />
											</Button>
										</div>
									</div>

									<div>
										<Label className='text-sm font-medium'>Types</Label>
										<div className='flex flex-wrap gap-1 mt-1'>
											{credential.type.map((type: string, index: number) => (
												<Badge key={index} variant='outline' className='text-xs'>
													{type}
												</Badge>
											))}
										</div>
									</div>

									<div>
										<Label className='text-sm font-medium'>Issuer</Label>
										<p className='text-sm text-muted-foreground mt-1 font-mono break-all'>{formatIssuer(credential.issuer)}</p>
									</div>

									<div>
										<Label className='text-sm font-medium'>Subject</Label>
										<p className='text-sm text-muted-foreground mt-1 font-mono break-all'>{'id' in credential.credentialSubject ? (credential.credentialSubject.id as string) : 'Unknown'}</p>
									</div>
								</CardContent>
							</Card>

							{/* Validity Information */}
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<Clock className='h-5 w-5' />
										Validity Information
									</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<Label className='text-sm font-medium'>Status</Label>
										<div className='flex items-center gap-2 mt-1'>
											{getStatusIcon(status)}
											<Badge variant={getStatusBadgeVariant(status)}>{status.toUpperCase()}</Badge>
										</div>
									</div>

									<div>
										<Label className='text-sm font-medium'>Issued Date</Label>
										<p className='text-sm text-muted-foreground mt-1'>{formatDate(credential.issuanceDate || credential.issuedAt)}</p>
									</div>

									<div>
										<Label className='text-sm font-medium'>Expiration Date</Label>
										<p className='text-sm text-muted-foreground mt-1'>{credential.expirationDate ? formatDate(credential.expirationDate) : 'Never expires'}</p>
									</div>

									{credential.credentialStatus && (
										<div>
											<Label className='text-sm font-medium'>Status Type</Label>
											<p className='text-sm text-muted-foreground mt-1'>{credential.credentialStatus.type || 'N/A'}</p>
										</div>
									)}
								</CardContent>
							</Card>
						</div>

						{/* Credential Subject */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<User className='h-5 w-5' />
									Credential Subject
								</CardTitle>
								<CardDescription>The claims and data contained in this credential</CardDescription>
							</CardHeader>
							<CardContent>
								<ScrollArea className='h-64'>
									<pre className='text-sm bg-muted p-4 rounded-lg overflow-auto'>{JSON.stringify(credential.credentialSubject, null, 2)}</pre>
								</ScrollArea>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Details Tab */}
					<TabsContent value='details' className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle>Full Credential Data</CardTitle>
								<CardDescription>Complete JSON representation of the verifiable credential</CardDescription>
							</CardHeader>
							<CardContent>
								<ScrollArea className='h-96'>
									<pre className='text-sm bg-muted p-4 rounded-lg overflow-auto'>{JSON.stringify(credential, null, 2)}</pre>
								</ScrollArea>
								<div className='flex gap-2 mt-4'>
									<Button variant='outline' onClick={() => copyToClipboard(JSON.stringify(credential, null, 2))}>
										<Copy className='h-4 w-4 mr-2' />
										Copy JSON
									</Button>
									<Button variant='outline' onClick={downloadVC}>
										<Download className='h-4 w-4 mr-2' />
										Download JSON
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Security Tab */}
					<TabsContent value='security' className='space-y-4'>
						{/* Cryptographic Proof */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Shield className='h-5 w-5' />
									Cryptographic Proof
								</CardTitle>
								<CardDescription>Digital signature and proof information</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<Label className='text-sm font-medium'>Proof Data</Label>
										<Button variant='ghost' size='sm' onClick={() => setShowProof(!showProof)}>
											{showProof ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
											{showProof ? 'Hide' : 'Show'} Proof
										</Button>
									</div>

									{showProof ? (
										<ScrollArea className='h-64'>
											<pre className='text-sm bg-muted p-4 rounded-lg overflow-auto'>{JSON.stringify(credential.proof, null, 2)}</pre>
										</ScrollArea>
									) : (
										<div className='bg-muted p-4 rounded-lg'>
											<p className='text-sm text-muted-foreground'>Proof data is hidden for security. Click "Show Proof" to reveal.</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Status Information */}
						{credential.credentialStatus && (
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<Building className='h-5 w-5' />
										Status Information
									</CardTitle>
									<CardDescription>Credential status and revocation information</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<Label className='text-sm font-medium'>Status ID</Label>
										<div className='flex items-center gap-2 mt-1'>
											<code className='text-sm bg-muted px-2 py-1 rounded flex-1 truncate'>{credential.credentialStatus.id || 'N/A'}</code>
											{credential.credentialStatus.id && (
												<Button variant='outline' size='sm' onClick={() => copyToClipboard(credential.credentialStatus?.id || '')}>
													<Copy className='h-4 w-4' />
												</Button>
											)}
										</div>
									</div>

									<div>
										<Label className='text-sm font-medium'>Status Type</Label>
										<p className='text-sm text-muted-foreground mt-1'>{credential.credentialStatus.type || 'N/A'}</p>
									</div>

									<div>
										<Label className='text-sm font-medium'>Current Status</Label>
										<div className='flex items-center gap-2 mt-1'>
											{getStatusIcon(credential.credentialStatus.status || 'unknown')}
											<Badge variant={getStatusBadgeVariant(credential.credentialStatus.status || 'unknown')}>{(credential.credentialStatus.status || 'unknown').toUpperCase()}</Badge>
										</div>
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
