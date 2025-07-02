'use client'

import {useState, useEffect} from 'react'
import {useQuery} from '@tanstack/react-query'
import {Shield, Plus, FileDown, CheckCircle, XCircle, AlertTriangle, Clock, Import} from 'lucide-react'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Badge} from '@/components/ui/badge'

import {getCredentialsBySubject} from '@/services/vcService'
import {listDIDs} from '@/services/didService'
import {useAuth} from '@/contexts/AuthContext'
import {CredentialStatus, CredentialMetadata} from '@/types/credentials'
import {CredentialsBySubjectResponse} from '@/types/vc'
import {CredentialMetadataCard} from './CredentialMetadataCard'
import {ImportCredentialModal} from './ImportCredentialModal'
import {CredentialAcceptanceModal} from './CredentialAcceptanceModal'

interface ReceivedCredentialsTabProps {
	searchTerm: string
	statusFilter: CredentialStatus | 'all'
	typeFilter: string
	onDownload?: (credential: CredentialMetadata) => void
}

interface ReceivedCredential extends CredentialMetadata {
	origin: 'external' | 'imported' | 'shared'
	issuerTrustLevel?: 'verified' | 'unverified' | 'trusted'
	isAccepted?: boolean
	receivedAt?: string
	source?: string
}

/**
 * ReceivedCredentialsTab Component - Manages credentials received from external issuers
 * 
 * Features:
 * - Display received credentials with trust indicators
 * - Import external credentials from JSON/files
 * - Accept/reject credential workflow
 * - Credential origin tracking
 * - Trust level indicators
 */
export function ReceivedCredentialsTab({
	searchTerm,
	statusFilter,
	typeFilter,
	onDownload
}: ReceivedCredentialsTabProps) {
	const {user} = useAuth()
	const [showImportModal, setShowImportModal] = useState(false)
	const [showAcceptanceModal, setShowAcceptanceModal] = useState(false)
	const [selectedCredential, setSelectedCredential] = useState<ReceivedCredential | null>(null)
	const [pendingCredentials, setPendingCredentials] = useState<ReceivedCredential[]>([])
	const [userDIDs, setUserDIDs] = useState<string[]>([])

	// Get user's primary DID from their DIDs list
	useEffect(() => {
		const fetchUserDIDs = async () => {
			try {
				const didsResponse = await listDIDs({limit: 100})
				if (didsResponse.dids && didsResponse.dids.length > 0) {
					const didStrings = didsResponse.dids.map((did: any) => did.did)
					setUserDIDs(didStrings)
				}
			} catch (error) {
				console.error('Error fetching user DIDs:', error)
			}
		}

		if (user) {
			fetchUserDIDs()
		}
	}, [user])

	// Use the first DID as primary for now
	const userDID = userDIDs.length > 0 ? userDIDs[0] : null

	// Fetch received credentials by subject DID
	const {
		data: receivedCredentialsData,
		isLoading,
		error,
		refetch
	} = useQuery<CredentialsBySubjectResponse>({
		queryKey: ['received-credentials', userDID],
		queryFn: () => userDID ? getCredentialsBySubject(userDID) : Promise.resolve({credentials: [], total: 0}),
		enabled: !!userDID,
		staleTime: 30000,
	})

	// Transform and filter credentials
	const receivedCredentials: ReceivedCredential[] = receivedCredentialsData?.credentials?.map((cred: CredentialMetadata) => ({
		...cred,
		origin: 'external' as const,
		issuerTrustLevel: determineTrustLevel(cred),
		isAccepted: true, // Assume already accepted if in system
		receivedAt: cred.createdAt
	})) || []

	// Combine with pending credentials
	const allCredentials = [...receivedCredentials, ...pendingCredentials]

	// Filter credentials based on search and filters
	const filteredCredentials = allCredentials.filter((credential) => {
		// Status filter
		if (statusFilter !== 'all' && credential.status !== statusFilter) return false
		
		// Type filter  
		if (typeFilter !== 'all' && !credential.type.includes(typeFilter)) return false
		
		// Search filter
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase()
			const issuerString = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id || ''
			const subjectString = credential.subject || ''
			
			return (
				credential.id.toLowerCase().includes(searchLower) ||
				credential.type.some((type) => type.toLowerCase().includes(searchLower)) ||
				issuerString.toLowerCase().includes(searchLower) ||
				subjectString.toLowerCase().includes(searchLower)
			)
		}
		
		return true
	})

	// Determine trust level for issuer
	function determineTrustLevel(credential: CredentialMetadata): 'verified' | 'unverified' | 'trusted' {
		const issuerString = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id || ''
		
		// You can implement more sophisticated trust logic here
		// For now, simple heuristics
		if (issuerString.includes('did:web:') || issuerString.includes('.edu') || issuerString.includes('.gov')) {
			return 'verified'
		}
		if (issuerString.startsWith('did:key:') || issuerString.startsWith('did:ethr:')) {
			return 'trusted'
		}
		return 'unverified'
	}

	// Handle credential acceptance
	const handleAcceptCredential = async (credential: ReceivedCredential, accepted: boolean) => {
		try {
			if (accepted) {
				// Here you would typically save the credential to your wallet
				// For now, just update the local state
				credential.isAccepted = true
				toast.success('Credential accepted and added to your wallet')
			} else {
				// Remove from pending list
				setPendingCredentials(prev => prev.filter(c => c.id !== credential.id))
				toast.success('Credential rejected')
			}
			setShowAcceptanceModal(false)
			setSelectedCredential(null)
		} catch (error) {
			console.error('Error handling credential acceptance:', error)
			toast.error('Failed to process credential')
		}
	}

	// Handle credential import
	const handleImportCredential = async (credentialData: any, source?: string) => {
		try {
			// Create a new received credential entry
			const importedCredential: ReceivedCredential = {
				id: credentialData.id || `imported-${Date.now()}`,
				issuer: credentialData.issuer,
				subject: credentialData.credentialSubject?.id || userDID || '',
				type: credentialData.type || ['VerifiableCredential'],
				issuanceDate: credentialData.issuanceDate || new Date().toISOString(),
				expirationDate: credentialData.expirationDate,
				status: 'active' as CredentialStatus,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				origin: 'imported',
				issuerTrustLevel: determineTrustLevel({
					id: credentialData.id,
					issuer: credentialData.issuer,
					subject: credentialData.credentialSubject?.id || '',
					type: credentialData.type || [],
					issuanceDate: credentialData.issuanceDate || '',
					status: 'active' as CredentialStatus,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				}),
				isAccepted: false, // Requires acceptance
				receivedAt: new Date().toISOString(),
				source
			}

			// Add to pending credentials
			setPendingCredentials(prev => [...prev, importedCredential])
			
			// Show acceptance modal
			setSelectedCredential(importedCredential)
			setShowAcceptanceModal(true)
			setShowImportModal(false)
			
			toast.success('Credential imported successfully. Please review and accept.')
		} catch (error) {
			console.error('Error importing credential:', error)
			toast.error('Failed to import credential')
		}
	}

	// Get trust level badge
	const getTrustBadge = (trustLevel?: 'verified' | 'unverified' | 'trusted') => {
		switch (trustLevel) {
			case 'verified':
				return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
			case 'trusted':
				return <Badge variant="outline" className="border-blue-200 text-blue-800"><Shield className="h-3 w-3 mr-1" />Trusted</Badge>
			case 'unverified':
				return <Badge variant="outline" className="border-orange-200 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Unverified</Badge>
			default:
				return null
		}
	}

	// Get origin badge
	const getOriginBadge = (origin: 'external' | 'imported' | 'shared') => {
		switch (origin) {
			case 'external':
				return <Badge variant="outline">External</Badge>
			case 'imported':
				return <Badge variant="outline" className="border-purple-200 text-purple-800"><Import className="h-3 w-3 mr-1" />Imported</Badge>
			case 'shared':
				return <Badge variant="outline" className="border-blue-200 text-blue-800">Shared</Badge>
			default:
				return null
		}
	}

	if (!userDID) {
		return (
			<Alert>
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription>
					You need a DID to receive credentials. Please create a DID first.
				</AlertDescription>
			</Alert>
		)
	}

	return (
		<div className="space-y-4">
			{/* Header Actions */}
			<div className="flex justify-between items-center">
				<div>
					<p className="text-sm text-muted-foreground">
						Showing credentials received for: <span className="font-mono">{userDID}</span>
					</p>
				</div>
				<Button onClick={() => setShowImportModal(true)} variant="outline">
					<Plus className="h-4 w-4 mr-2" />
					Import Credential
				</Button>
			</div>

			{/* Loading State */}
			{isLoading ? (
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<Skeleton key={i} className="h-32 w-full" />
					))}
				</div>
			) : error ? (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						Failed to load received credentials. Please try again.
					</AlertDescription>
				</Alert>
			) : filteredCredentials.length === 0 ? (
				<div className="text-center py-12">
					<Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 className="text-lg font-semibold mb-2">No received credentials</h3>
					<p className="text-muted-foreground mb-4">
						{searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
							? 'No credentials match your current filters.'
							: "You haven't received any credentials yet."
						}
					</p>
					<Button onClick={() => setShowImportModal(true)} variant="outline">
						<Import className="h-4 w-4 mr-2" />
						Import Your First Credential
					</Button>
				</div>
			) : (
				<div className="space-y-4">
					{filteredCredentials.map((credential) => (
						<div key={credential.id} className="relative">
							<CredentialMetadataCard
								credential={credential}
								onView={() => window.location.href = `/dashboard/credentials/${credential.id}`}
								onDownload={() => onDownload?.(credential)}
							/>
							
							{/* Additional badges for received credentials */}
							<div className="absolute top-4 right-16 flex gap-2">
								{getTrustBadge(credential.issuerTrustLevel)}
								{getOriginBadge(credential.origin)}
								{!credential.isAccepted && (
									<Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
										<Clock className="h-3 w-3 mr-1" />
										Pending
									</Badge>
								)}
							</div>

							{/* Acceptance actions for pending credentials */}
							{!credential.isAccepted && (
								<div className="absolute bottom-4 right-4 flex gap-2">
									<Button
										size="sm"
										onClick={() => {
											setSelectedCredential(credential)
											setShowAcceptanceModal(true)
										}}
									>
										Review
									</Button>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* Import Credential Modal */}
			<ImportCredentialModal
				isOpen={showImportModal}
				onClose={() => setShowImportModal(false)}
				onImport={handleImportCredential}
			/>

			{/* Credential Acceptance Modal */}
			<CredentialAcceptanceModal
				isOpen={showAcceptanceModal}
				credential={selectedCredential}
				onClose={() => {
					setShowAcceptanceModal(false)
					setSelectedCredential(null)
				}}
				onAccept={(accepted: boolean) => selectedCredential && handleAcceptCredential(selectedCredential, accepted)}
			/>
		</div>
	)
}
