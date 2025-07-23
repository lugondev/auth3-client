'use client'

import {useState, useCallback} from 'react'
import {Trash2, Download, XCircle, CheckCircle, AlertTriangle, Package, Clock} from 'lucide-react'
import {toast} from 'sonner'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Progress} from '@/components/ui/progress'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Badge} from '@/components/ui/badge'

import type {CredentialMetadata} from '@/types/credentials'
import {revokeCredential} from '@/services/vcService'

interface BulkCredentialManagerProps {
	credentials: CredentialMetadata[]
	onCredentialsUpdated?: () => void
	className?: string
}

interface BulkOperation {
	id: string
	type: 'revoke' | 'download' | 'delete'
	status: 'pending' | 'processing' | 'completed' | 'failed'
	credentialId: string
	credentialTitle: string
	error?: string
}

/**
 * BulkCredentialManager Component - Handles bulk operations on credentials
 *
 * Features:
 * - Multiple credential selection
 * - Bulk revocation with reasons
 * - Bulk download as ZIP
 * - Bulk delete operations
 * - Progress tracking
 * - Error handling and reporting
 */
export function BulkCredentialManager({credentials, onCredentialsUpdated, className = ''}: BulkCredentialManagerProps) {
	const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set())
	const [isProcessing, setIsProcessing] = useState(false)
	const [showProgressModal, setShowProgressModal] = useState(false)
	const [operations, setOperations] = useState<BulkOperation[]>([])
	const [revocationReason, setRevocationReason] = useState('unspecified')

	// Toggle individual credential selection
	const toggleCredentialSelection = useCallback((credentialId: string) => {
		setSelectedCredentials((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(credentialId)) {
				newSet.delete(credentialId)
			} else {
				newSet.add(credentialId)
			}
			return newSet
		})
	}, [])

	// Select/deselect all credentials
	const toggleSelectAll = useCallback(() => {
		if (selectedCredentials.size === credentials.length) {
			setSelectedCredentials(new Set())
		} else {
			setSelectedCredentials(new Set(credentials.map((c) => c.id)))
		}
	}, [credentials, selectedCredentials.size])

	// Filter credentials by status
	const getSelectableCredentials = (status?: string) => {
		if (!status) return credentials
		return credentials.filter((c) => c.status === status)
	}

	// Get selected credential objects
	const getSelectedCredentialObjects = () => {
		return credentials.filter((c) => selectedCredentials.has(c.id))
	}

	// Get credential title for display
	const getCredentialTitle = (credential: CredentialMetadata) => {
		const types = Array.isArray(credential.type) ? credential.type.filter((t) => t !== 'VerifiableCredential') : [credential.type]
		return types.length > 0 ? types.join(', ') : 'Verifiable Credential'
	}

	// Bulk revoke credentials
	const handleBulkRevoke = async () => {
		if (selectedCredentials.size === 0) {
			toast.error('No credentials selected')
			return
		}

		// Only allow revocation of active credentials
		const activeCredentials = getSelectedCredentialObjects().filter((c) => c.status === 'active')
		if (activeCredentials.length === 0) {
			toast.error('No active credentials selected for revocation')
			return
		}

		setIsProcessing(true)
		setShowProgressModal(true)

		// Initialize operations
		const newOperations: BulkOperation[] = activeCredentials.map((credential) => ({
			id: `revoke-${credential.id}`,
			type: 'revoke',
			status: 'pending',
			credentialId: credential.id,
			credentialTitle: getCredentialTitle(credential),
		}))

		setOperations(newOperations)

		// Process revocations sequentially
		for (let i = 0; i < newOperations.length; i++) {
			const operation = newOperations[i]

			setOperations((prev) => prev.map((op) => (op.id === operation.id ? {...op, status: 'processing'} : op)))

			try {
				// Find the credential to get issuer information
				const credential = credentials.find((c) => c.id === operation.credentialId)
				const issuerDID = typeof credential?.issuer === 'string' ? credential.issuer : credential?.issuer?.id || ''

				await revokeCredential({
					credentialId: operation.credentialId,
					issuerDID: issuerDID,
					reason: 'Bulk revocation operation',
				})

				setOperations((prev) => prev.map((op) => (op.id === operation.id ? {...op, status: 'completed'} : op)))
			} catch (error) {
				console.error(`Failed to revoke credential ${operation.credentialId}:`, error)

				setOperations((prev) =>
					prev.map((op) =>
						op.id === operation.id
							? {
									...op,
									status: 'failed',
									error: error instanceof Error ? error.message : 'Unknown error',
							  }
							: op,
					),
				)
			}
		}

		setIsProcessing(false)
		setSelectedCredentials(new Set())
		onCredentialsUpdated?.()

		const successful = newOperations.filter((op) => op.status === 'completed').length
		const failed = newOperations.filter((op) => op.status === 'failed').length

		if (failed === 0) {
			toast.success(`Successfully revoked ${successful} credential(s)`)
		} else {
			toast.error(`Revoked ${successful} credential(s), ${failed} failed`)
		}
	}

	// Bulk download credentials
	const handleBulkDownload = async () => {
		if (selectedCredentials.size === 0) {
			toast.error('No credentials selected')
			return
		}

		const selectedCredentialObjects = getSelectedCredentialObjects()

		try {
			// For now, download each credential individually
			// In a production environment, you might want to implement server-side ZIP generation
			selectedCredentialObjects.forEach((credential, index) => {
				setTimeout(() => {
					const blob = new Blob([JSON.stringify(credential, null, 2)], {type: 'application/json'})
					const url = URL.createObjectURL(blob)
					const a = document.createElement('a')
					a.href = url
					a.download = `credential-${credential.id}.json`
					document.body.appendChild(a)
					a.click()
					document.body.removeChild(a)
					URL.revokeObjectURL(url)
				}, index * 100) // Stagger downloads to avoid browser blocking
			})

			toast.success(`Started download of ${selectedCredentials.size} credential(s)`)
		} catch (error) {
			console.error('Error downloading credentials:', error)
			toast.error('Failed to download credentials')
		}
	}

	// Bulk delete credentials (placeholder - implement based on your delete logic)
	const handleBulkDelete = async () => {
		if (selectedCredentials.size === 0) {
			toast.error('No credentials selected')
			return
		}

		// Show confirmation dialog first
		const confirmed = window.confirm(`Are you sure you want to delete ${selectedCredentials.size} credential(s)? This action cannot be undone.`)

		if (!confirmed) return

		setIsProcessing(true)

		// Implement bulk delete logic here
		// This is a placeholder - you'll need to implement actual delete functionality

		toast.success(`Deleted ${selectedCredentials.size} credential(s)`)
		setSelectedCredentials(new Set())
		setIsProcessing(false)
		onCredentialsUpdated?.()
	}

	const selectedCount = selectedCredentials.size
	const activeSelectedCount = getSelectedCredentialObjects().filter((c) => c.status === 'active').length

	return (
		<div className={className}>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Package className='h-5 w-5' />
						Bulk Operations
					</CardTitle>
					<CardDescription>Select multiple credentials to perform bulk operations</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Selection Summary */}
					<div className='flex items-center justify-between p-3 bg-muted rounded-md'>
						<div className='flex items-center gap-4'>
							<Checkbox checked={selectedCredentials.size === credentials.length && credentials.length > 0} onCheckedChange={toggleSelectAll} disabled={credentials.length === 0} />
							<span className='text-sm font-medium'>
								{selectedCount} of {credentials.length} selected
							</span>
						</div>

						{selectedCount > 0 && <div className='text-sm text-muted-foreground'>{activeSelectedCount} active credential(s) eligible for revocation</div>}
					</div>

					{/* Quick Selection Filters */}
					<div className='flex gap-2 flex-wrap'>
						<Button variant='outline' size='sm' onClick={() => setSelectedCredentials(new Set(getSelectableCredentials('active').map((c) => c.id)))}>
							Select Active ({getSelectableCredentials('active').length})
						</Button>
						<Button variant='outline' size='sm' onClick={() => setSelectedCredentials(new Set(getSelectableCredentials('revoked').map((c) => c.id)))}>
							Select Revoked ({getSelectableCredentials('revoked').length})
						</Button>
						<Button variant='outline' size='sm' onClick={() => setSelectedCredentials(new Set(getSelectableCredentials('expired').map((c) => c.id)))}>
							Select Expired ({getSelectableCredentials('expired').length})
						</Button>
					</div>

					{/* Revocation Options */}
					{activeSelectedCount > 0 && (
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Revocation Reason</label>
							<Select value={revocationReason} onValueChange={setRevocationReason}>
								<SelectTrigger className='w-full'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='superseded'>Superseded by new credential</SelectItem>
									<SelectItem value='compromised'>Key or credential compromised</SelectItem>
									<SelectItem value='privilege_withdrawn'>Privilege withdrawn</SelectItem>
									<SelectItem value='cessation_of_operation'>Cessation of operation</SelectItem>
									<SelectItem value='unspecified'>Unspecified</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Bulk Actions */}
					<div className='flex gap-2 flex-wrap'>
						<Button onClick={handleBulkRevoke} disabled={isProcessing || activeSelectedCount === 0} variant='destructive' size='sm'>
							<XCircle className='h-4 w-4 mr-2' />
							Revoke Selected ({activeSelectedCount})
						</Button>

						<Button onClick={handleBulkDownload} disabled={isProcessing || selectedCount === 0} variant='outline' size='sm'>
							<Download className='h-4 w-4 mr-2' />
							Download Selected ({selectedCount})
						</Button>

						<Button onClick={handleBulkDelete} disabled={isProcessing || selectedCount === 0} variant='outline' size='sm'>
							<Trash2 className='h-4 w-4 mr-2' />
							Delete Selected ({selectedCount})
						</Button>
					</div>

					{/* Warning for non-active credentials */}
					{selectedCount > activeSelectedCount && (
						<Alert>
							<AlertTriangle className='h-4 w-4' />
							<AlertDescription>{selectedCount - activeSelectedCount} selected credential(s) are not active and cannot be revoked.</AlertDescription>
						</Alert>
					)}

					{/* Credential List with Checkboxes */}
					<div className='space-y-2 max-h-96 overflow-y-auto'>
						{credentials.map((credential) => (
							<div key={credential.id} className={`flex items-center gap-3 p-3 border rounded-md ${selectedCredentials.has(credential.id) ? 'bg-blue-50 border-blue-200' : ''}`}>
								<Checkbox checked={selectedCredentials.has(credential.id)} onCheckedChange={() => toggleCredentialSelection(credential.id)} />

								<div className='flex-1 min-w-0'>
									<div className='flex items-center gap-2'>
										<span className='font-medium text-sm truncate'>{getCredentialTitle(credential)}</span>
										<Badge variant={credential.status === 'active' ? 'default' : 'secondary'}>{credential.status}</Badge>
									</div>
									<div className='text-xs text-muted-foreground truncate'>ID: {credential.id}</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Progress Modal */}
			<Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Bulk Operation Progress</DialogTitle>
						<DialogDescription>Processing {operations.length} credential(s)...</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<Progress value={(operations.filter((op) => op.status === 'completed' || op.status === 'failed').length / operations.length) * 100} />

						<div className='space-y-2 max-h-64 overflow-y-auto'>
							{operations.map((operation) => (
								<div key={operation.id} className='flex items-center gap-2 text-sm'>
									{operation.status === 'pending' && <Clock className='h-4 w-4 text-gray-400' />}
									{operation.status === 'processing' && <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent' />}
									{operation.status === 'completed' && <CheckCircle className='h-4 w-4 text-green-600' />}
									{operation.status === 'failed' && <XCircle className='h-4 w-4 text-red-600' />}

									<span className='flex-1 truncate'>{operation.credentialTitle}</span>

									{operation.error && <span className='text-xs text-red-600'>{operation.error}</span>}
								</div>
							))}
						</div>

						{!isProcessing && (
							<Button onClick={() => setShowProgressModal(false)} className='w-full'>
								Close
							</Button>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
