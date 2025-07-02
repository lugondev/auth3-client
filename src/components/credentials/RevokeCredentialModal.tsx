'use client'

import {useState} from 'react'
import {AlertTriangle, XCircle, Info} from 'lucide-react'
import {toast} from 'sonner'

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Separator} from '@/components/ui/separator'

import {revokeCredential} from '@/services/vcService'
import type {VerifiableCredential} from '@/types/credentials'

interface RevokeCredentialModalProps {
	isOpen: boolean
	credential: VerifiableCredential | null
	onClose: () => void
	onRevoked?: (credentialId: string) => void
}

// Common revocation reasons
const REVOCATION_REASONS = [
	{value: 'superseded', label: 'Superseded by new credential'},
	{value: 'compromised', label: 'Key or credential compromised'},
	{value: 'privilege_withdrawn', label: 'Privilege withdrawn'},
	{value: 'cessation_of_operation', label: 'Cessation of operation'},
	{value: 'certificate_hold', label: 'Certificate hold'},
	{value: 'unspecified', label: 'Unspecified'},
	{value: 'affiliation_changed', label: 'Affiliation changed'},
	{value: 'ca_compromise', label: 'CA compromise'},
	{value: 'key_compromise', label: 'Key compromise'},
	{value: 'other', label: 'Other (specify in notes)'}
] as const

/**
 * RevokeCredentialModal Component - Handles credential revocation workflow
 *
 * Features:
 * - Revocation reason selection
 * - Additional notes/comments
 * - Warning about irreversibility
 * - Confirmation process
 */
export function RevokeCredentialModal({
	isOpen,
	credential,
	onClose,
	onRevoked
}: RevokeCredentialModalProps) {
	const [reason, setReason] = useState<string>('')
	const [notes, setNotes] = useState('')
	const [loading, setLoading] = useState(false)
	const [confirmed, setConfirmed] = useState(false)

	// Reset state when modal opens/closes
	const handleClose = () => {
		setReason('')
		setNotes('')
		setConfirmed(false)
		onClose()
	}

	// Get credential types for display
	const getCredentialTypes = () => {
		if (!credential) return []
		if (Array.isArray(credential.type)) {
			return credential.type.filter((type) => type !== 'VerifiableCredential')
		}
		return credential.type === 'VerifiableCredential' ? [] : [credential.type]
	}

	// Get issuer name for display
	const getIssuerName = () => {
		if (!credential) return ''
		if (typeof credential.issuer === 'string') {
			return credential.issuer
		}
		return credential.issuer.name || credential.issuer.id
	}

	// Handle revocation
	const handleRevoke = async () => {
		if (!credential?.id) {
			toast.error('Invalid credential')
			return
		}

		if (!reason) {
			toast.error('Please select a revocation reason')
			return
		}

		if (!confirmed) {
			toast.error('Please confirm that you understand the consequences')
			return
		}

		setLoading(true)
		try {
			await revokeCredential({
				credentialId: credential.id,
				issuerDID: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
				reason: reason || 'Revoked by user'
			})
			toast.success('Credential revoked successfully')
			onRevoked?.(credential.id)
			handleClose()
		} catch (error) {
			console.error('Error revoking credential:', error)
			toast.error('Failed to revoke credential')
		} finally {
			setLoading(false)
		}
	}

	if (!credential) return null

	const credentialTypes = getCredentialTypes()
	const issuerName = getIssuerName()

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<XCircle className="h-5 w-5" />
						Revoke Credential
					</DialogTitle>
					<DialogDescription>
						This action will permanently revoke the credential and cannot be undone.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Warning Alert */}
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							<strong>Warning:</strong> Revoking this credential will immediately invalidate it. 
							This action is permanent and cannot be reversed.
						</AlertDescription>
					</Alert>

					{/* Credential Info */}
					<div className="bg-muted p-3 rounded-md space-y-2">
						<div className="text-sm font-medium">Credential Details</div>
						<div className="text-sm space-y-1">
							<div><strong>Type:</strong> {credentialTypes.length > 0 ? credentialTypes.join(', ') : 'Verifiable Credential'}</div>
							<div><strong>ID:</strong> <span className="font-mono text-xs">{credential.id}</span></div>
							<div><strong>Issuer:</strong> {issuerName}</div>
							<div><strong>Issued:</strong> {new Date(credential.issuanceDate).toLocaleDateString()}</div>
						</div>
					</div>

					<Separator />

					{/* Revocation Reason */}
					<div className="space-y-2">
						<Label htmlFor="revocation-reason" className="text-sm font-medium">
							Revocation Reason *
						</Label>
						<Select value={reason} onValueChange={setReason}>
							<SelectTrigger>
								<SelectValue placeholder="Select a reason for revocation" />
							</SelectTrigger>
							<SelectContent>
								{REVOCATION_REASONS.map((reasonOption) => (
									<SelectItem key={reasonOption.value} value={reasonOption.value}>
										{reasonOption.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Additional Notes */}
					<div className="space-y-2">
						<Label htmlFor="revocation-notes" className="text-sm font-medium">
							Additional Notes (Optional)
						</Label>
						<Textarea
							id="revocation-notes"
							placeholder="Provide additional context for the revocation..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
						/>
					</div>

					{/* Confirmation */}
					<div className="flex items-start space-x-2">
						<input
							type="checkbox"
							id="revocation-confirm"
							checked={confirmed}
							onChange={(e) => setConfirmed(e.target.checked)}
							className="mt-1"
						/>
						<Label htmlFor="revocation-confirm" className="text-sm leading-relaxed">
							I understand that revoking this credential will permanently invalidate it and 
							this action cannot be undone.
						</Label>
					</div>

					<Separator />

					{/* Actions */}
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={handleClose} disabled={loading}>
							Cancel
						</Button>
						<Button 
							variant="destructive" 
							onClick={handleRevoke}
							disabled={!reason || !confirmed || loading}
						>
							{loading ? 'Revoking...' : 'Revoke Credential'}
						</Button>
					</div>

					{/* Information Alert */}
					<Alert>
						<Info className="h-4 w-4" />
						<AlertDescription className="text-xs">
							Once revoked, this credential will appear as invalid to all verifiers. 
							The credential holder will be notified of the revocation status.
						</AlertDescription>
					</Alert>
				</div>
			</DialogContent>
		</Dialog>
	)
}
