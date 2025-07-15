'use client'

import { useState } from 'react'
import { XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { credentialService } from '@/services/credentialService'
import type { VerifiableCredential } from '@/services/credentialService'

interface RevocationButtonProps {
	credential: VerifiableCredential
	variant?: 'dropdown' | 'button'
	onRevoked?: (credentialId: string) => void
	className?: string
}

// Common revocation reasons
const REVOCATION_REASONS = [
	{ value: 'superseded', label: 'Superseded by new credential' },
	{ value: 'compromised', label: 'Key or credential compromised' },
	{ value: 'privilege_withdrawn', label: 'Privilege withdrawn' },
	{ value: 'cessation_of_operation', label: 'Cessation of operation' },
	{ value: 'certificate_hold', label: 'Certificate hold' },
	{ value: 'unspecified', label: 'Unspecified' },
	{ value: 'affiliation_changed', label: 'Affiliation changed' },
	{ value: 'ca_compromise', label: 'CA compromise' },
	{ value: 'key_compromise', label: 'Key compromise' },
	{ value: 'other', label: 'Other (specify in notes)' }
] as const

/**
 * RevocationButton Component - Handles credential revocation workflow
 * 
 * Features:
 * - Revocation reason selection
 * - Additional notes/comments
 * - Warning about irreversibility
 * - Confirmation process
 */
export function RevocationButton({ 
	credential, 
	variant = 'dropdown',
	onRevoked,
	className = '' 
}: RevocationButtonProps) {
	const [showModal, setShowModal] = useState(false)
	const [reason, setReason] = useState<string>('')
	const [notes, setNotes] = useState('')
	const [loading, setLoading] = useState(false)
	const [confirmed, setConfirmed] = useState(false)

	// Reset state when modal opens/closes
	const handleClose = () => {
		setReason('')
		setNotes('')
		setConfirmed(false)
		setShowModal(false)
	}

	// Get credential types for display
	const getCredentialTypes = () => {
		if (Array.isArray(credential.type)) {
			return credential.type.filter((type) => type !== 'VerifiableCredential')
		}
		return credential.type === 'VerifiableCredential' ? [] : [credential.type]
	}

	// Get issuer name for display
	const getIssuerName = () => {
		if (typeof credential.issuer === 'string') {
			return credential.issuer
		}
		// Handle object issuer
		if (credential.issuer && typeof credential.issuer === 'object') {
			const issuerObj = credential.issuer as { name?: string; id?: string }
			return issuerObj.name || issuerObj.id || 'Unknown'
		}
		return 'Unknown'
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
			const combinedReason = notes ? `${reason}: ${notes}` : reason
			await credentialService.revokeCredential(credential.id, combinedReason)
			
			toast.success('Credential revoked successfully', {
				description: 'The credential has been permanently revoked'
			})
			
			onRevoked?.(credential.id)
			handleClose()
		} catch (error) {
			console.error('Revocation error:', error)
			toast.error('Failed to revoke credential', {
				description: 'Please try again or contact support'
			})
		} finally {
			setLoading(false)
		}
	}

	const credentialTypes = getCredentialTypes()
	const issuerName = getIssuerName()

	const triggerElement = variant === 'dropdown' ? (
		<DropdownMenuItem 
			onClick={(e) => {
				e.preventDefault()
				setShowModal(true)
			}}
			className="text-red-600 focus:text-red-600"
		>
			<XCircle className="h-4 w-4 mr-2" />
			Revoke
		</DropdownMenuItem>
	) : (
		<Button
			variant="destructive"
			size="sm"
			onClick={() => setShowModal(true)}
			className={className}
		>
			<XCircle className="h-4 w-4 mr-2" />
			Revoke
		</Button>
	)

	return (
		<>
			{triggerElement}
			
			<Dialog open={showModal} onOpenChange={setShowModal}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600">
							<XCircle className="h-5 w-5" />
							Revoke Credential
						</DialogTitle>
						<DialogDescription>
							This action permanently revokes the credential and cannot be undone.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{/* Credential Info */}
						<div className="rounded-lg border p-3 bg-muted/50">
							<div className="font-medium text-sm">
								{credentialTypes.length > 0 ? credentialTypes.join(', ') : 'Verifiable Credential'}
							</div>
							<div className="text-sm text-muted-foreground">
								Issued by: {issuerName}
							</div>
							<div className="text-xs text-muted-foreground">
								ID: {credential.id}
							</div>
						</div>

						{/* Warning */}
						<Alert>
							<AlertDescription>
								<strong>Warning:</strong> Once revoked, this credential will be permanently invalid 
								and cannot be restored. This action will be logged and may be visible to verifiers.
							</AlertDescription>
						</Alert>

						{/* Revocation Reason */}
						<div className="space-y-2">
							<Label htmlFor="reason">Reason for Revocation *</Label>
							<Select value={reason} onValueChange={setReason}>
								<SelectTrigger>
									<SelectValue placeholder="Select a reason..." />
								</SelectTrigger>
								<SelectContent>
									{REVOCATION_REASONS.map((reason) => (
										<SelectItem key={reason.value} value={reason.value}>
											{reason.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Additional Notes */}
						<div className="space-y-2">
							<Label htmlFor="notes">Additional Notes (optional)</Label>
							<Textarea
								id="notes"
								placeholder="Provide additional context for the revocation..."
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={3}
							/>
						</div>

						{/* Confirmation */}
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="confirm"
								checked={confirmed}
								onChange={(e) => setConfirmed(e.target.checked)}
								className="rounded border-gray-300"
							/>
							<Label htmlFor="confirm" className="text-sm">
								I understand this action cannot be undone
							</Label>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={handleClose} disabled={loading}>
							Cancel
						</Button>
						<Button 
							variant="destructive" 
							onClick={handleRevoke}
							disabled={loading || !reason || !confirmed}
						>
							{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Revoke Credential
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
