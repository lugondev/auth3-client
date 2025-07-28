'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {useParams, useRouter} from 'next/navigation'
import {useToast} from '@/hooks/use-toast'

// UI Components
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'

// Icons
import {FileText, Plus, RefreshCw, Shield, Settings} from 'lucide-react'

// Types and Services
import {
	getTenantCredentials,
	revokeCredential,
	CredentialWithStatusInfo, // Import the type from the helper
} from './helpers/credential-helpers'
import {CollapsibleCredentialCard} from './components/CollapsibleCredentialCard'

/**
 * TenantVCPage Component
 * Displays a list of verifiable credentials for a tenant
 */
export default function TenantVCPage() {
	const params = useParams()
	const router = useRouter()
	const {toast} = useToast()
	const tenantId = params.tenantId as string

	// Component state
	const [credentials, setCredentials] = useState<CredentialWithStatusInfo[]>([])
	const [loading, setLoading] = useState(true)
	const [showProof, setShowProof] = useState<string | null>(null)
	const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set())

	// Modal state for revocation confirmation
	const [showRevokeModal, setShowRevokeModal] = useState(false)
	const [credentialToRevoke, setCredentialToRevoke] = useState<CredentialWithStatusInfo | null>(null)

	/**
	 * Fetch tenant credentials
	 * Memoized callback to prevent recreation on each render
	 */
	const fetchCredentials = useCallback(async () => {
		try {
			setLoading(true)
			const results = await getTenantCredentials(tenantId)
			setCredentials(results)
		} catch (error) {
			console.error('Error fetching credentials:', error)
			toast({
				title: 'Error',
				description: 'Failed to load verifiable credentials. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setLoading(false)
		}
	}, [tenantId, toast])

	// Load credentials on component mount
	useEffect(() => {
		if (tenantId) {
			fetchCredentials()
		}
	}, [fetchCredentials, tenantId])

	/**
	 * Navigate to credential details page
	 */
	const handleViewCredential = (credentialId: string) => {
		router.push(`/dashboard/tenant/${tenantId}/vc/${credentialId}`)
	}

	/**
	 * Toggle collapse state for a credential card
	 */
	const toggleCardCollapse = (credentialId: string) => {
		setCollapsedCards((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(credentialId)) {
				newSet.delete(credentialId)
			} else {
				newSet.add(credentialId)
			}
			return newSet
		})
	}

	/**
	 * Check if card is collapsed
	 */
	const isCardCollapsed = (credentialId: string) => {
		return !collapsedCards.has(credentialId) // Default is collapsed, so inverted logic
	}

	/**
	 * Expand all cards
	 */
	const expandAllCards = () => {
		setCollapsedCards(new Set(credentials.map((c) => c.id)))
	}

	/**
	 * Collapse all cards
	 */
	const collapseAllCards = () => {
		setCollapsedCards(new Set())
	}

	/**
	 * Check if all cards are expanded
	 */
	const areAllCardsExpanded = () => {
		return collapsedCards.size === credentials.length
	}

	/**
	 * Copy text to clipboard
	 */
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast({
				title: 'Copied',
				description: 'Copied to clipboard successfully!',
			})
		} catch (error) {
			console.error('Failed to copy:', error)
		}
	}

	/**
	 * Download credential as JSON
	 */
	const downloadVC = (vc: CredentialWithStatusInfo) => {
		const blob = new Blob([JSON.stringify(vc, null, 2)], {
			type: 'application/json',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `vc-${vc.id.split(':').pop()}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	/**
	 * Revoke a credential
	 */
	const handleRevokeVC = async (vcId: string) => {
		try {
			// Get the credential to get issuer DID
			const credential = credentials.find((c) => c.id === vcId)
			if (!credential) {
				throw new Error('Credential not found')
			}

			const issuerDID = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id

			await revokeCredential(tenantId, vcId, issuerDID)

			toast({
				title: 'Success',
				description: 'Verifiable Credential revoked successfully!',
			})

			// Refresh the credentials list
			await fetchCredentials()
		} catch (error) {
			console.error('Error revoking VC:', error)
			toast({
				title: 'Error',
				description: 'Failed to revoke credential. Please try again.',
				variant: 'destructive',
			})
		}
	}

	/**
	 * Handle revoke modal trigger
	 */
	const handleRevokeModalOpen = (vc: CredentialWithStatusInfo) => {
		setCredentialToRevoke(vc)
		setShowRevokeModal(true)
	}

	/**
	 * Handle revoke confirmation from modal
	 */
	const handleRevokeConfirm = async () => {
		if (credentialToRevoke) {
			setShowRevokeModal(false)
			await handleRevokeVC(credentialToRevoke.id)
			setCredentialToRevoke(null)
		}
	}

	/**
	 * Get credential status from credentialStatus property
	 */
	const getCredentialStatus = (vc: CredentialWithStatusInfo): string => {
		// First check expiration date
		if (vc.expirationDate && new Date(vc.expirationDate) < new Date()) {
			return 'expired'
		}

		// Check if credentialStatus is available
		if (vc.credentialStatus) {
			// Our helper always returns an object with a status property
			if (vc.credentialStatus.status) {
				return vc.credentialStatus.status
			}
		}

		return 'active' // Default status
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
	 * Loading state
	 */
	if (loading) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='flex items-center justify-center h-64'>
					<RefreshCw className='h-8 w-8 animate-spin' />
				</div>
			</div>
		)
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='space-y-6'>
				{/* Header */}
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold tracking-tight'>Verifiable Credentials</h1>
						<p className='text-muted-foreground'>Manage Verifiable Credentials</p>
					</div>

					<div className='flex gap-2'>
						{credentials.length > 0 && (
							<Button variant='outline' size='sm' onClick={areAllCardsExpanded() ? collapseAllCards : expandAllCards}>
								{areAllCardsExpanded() ? 'Collapse All' : 'Expand All'}
							</Button>
						)}
						<Button onClick={() => router.push(`/dashboard/tenant/${tenantId}/vc/actions`)}>
							<Settings className='mr-2 h-4 w-4' />
							Actions
						</Button>
					</div>
				</div>

				{/* Stats Cards */}
				<div className='grid gap-4 md:grid-cols-4'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Total Credentials</CardTitle>
							<FileText className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{credentials.length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Active</CardTitle>
							<Shield className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{credentials.filter((c) => getCredentialStatus(c) === 'active').length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Credential Types</CardTitle>
							<FileText className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{new Set(credentials.flatMap((c) => c.type)).size}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Tenant ID</CardTitle>
							<FileText className='h-4 w-4 text-blue-600' />
						</CardHeader>
						<CardContent>
							<div className='text-sm font-medium truncate'>{tenantId}</div>
						</CardContent>
					</Card>
				</div>

				{/* Credentials List */}
				<div className='space-y-4'>
					{credentials.map((vc) => (
						<CollapsibleCredentialCard key={vc.id} credential={vc} isCollapsed={isCardCollapsed(vc.id)} showProof={showProof === vc.id} onToggleCollapse={() => toggleCardCollapse(vc.id)} onViewCredential={() => handleViewCredential(vc.id)} onCopyId={() => copyToClipboard(vc.id)} onDownload={() => downloadVC(vc)} onRevoke={() => handleRevokeModalOpen(vc)} onToggleProof={() => setShowProof(showProof === vc.id ? null : vc.id)} getCredentialStatus={getCredentialStatus} formatIssuer={formatIssuer} />
					))}

					{credentials.length === 0 && (
						<Card>
							<CardContent className='py-12 text-center'>
								<FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
								<h3 className='text-lg font-medium mb-2'>No Credentials Found</h3>
								<p className='text-muted-foreground mb-4'>Issue your first verifiable credential to get started.</p>
								<Dialog>
									<DialogTrigger asChild>
										<Button>
											<Plus className='mr-2 h-4 w-4' />
											Issue First Credential
										</Button>
									</DialogTrigger>
								</Dialog>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Revocation Confirmation Modal */}
				<Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Revoke Credential</DialogTitle>
							<DialogDescription>
								Are you sure you want to revoke this verifiable credential?
								<br />
								<br />
								<strong>Credential ID:</strong> {credentialToRevoke?.id}
								<br />
								<br />
								⚠️ <strong>WARNING:</strong> This action cannot be undone!
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowRevokeModal(false)}>
								Cancel
							</Button>
							<Button variant='destructive' onClick={handleRevokeConfirm}>
								Revoke Credential
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
