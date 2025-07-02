'use client'

import {useState, useEffect} from 'react'
import {Shield, AlertTriangle, CheckCircle, Clock, Eye, EyeOff, User, Calendar, FileText} from 'lucide-react'
import {toast} from 'sonner'

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Separator} from '@/components/ui/separator'

interface CredentialAcceptanceModalProps {
	isOpen: boolean
	credential: any // ReceivedCredential type
	onClose: () => void
	onAccept: (accepted: boolean, notes?: string) => void
}

/**
 * CredentialAcceptanceModal Component - Review and accept/reject received credentials
 *
 * Features:
 * - Detailed credential review
 * - Trust level assessment
 * - Security warnings
 * - Accept/reject with notes
 * - Credential preview
 */
export function CredentialAcceptanceModal({
	isOpen,
	credential,
	onClose,
	onAccept
}: CredentialAcceptanceModalProps) {
	const [showDetails, setShowDetails] = useState(false)
	const [notes, setNotes] = useState('')
	const [loading, setLoading] = useState(false)

	// Reset state when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setShowDetails(false)
			setNotes('')
		}
	}, [isOpen])

	if (!credential) return null

	// Extract issuer information
	const getIssuerInfo = () => {
		if (typeof credential.issuer === 'string') {
			return {id: credential.issuer, name: credential.issuer}
		}
		return {
			id: credential.issuer.id,
			name: credential.issuer.name || credential.issuer.id,
		}
	}

	// Get trust level color and description
	const getTrustInfo = () => {
		switch (credential.issuerTrustLevel) {
			case 'verified':
				return {
					color: 'text-green-600',
					bgColor: 'bg-green-50 border-green-200',
					icon: <CheckCircle className="h-5 w-5" />,
					label: 'Verified Issuer',
					description: 'This issuer has been verified and is considered trustworthy.'
				}
			case 'trusted':
				return {
					color: 'text-blue-600',
					bgColor: 'bg-blue-50 border-blue-200',
					icon: <Shield className="h-5 w-5" />,
					label: 'Trusted Issuer',
					description: 'This issuer uses established DID methods and appears legitimate.'
				}
			case 'unverified':
				return {
					color: 'text-orange-600',
					bgColor: 'bg-orange-50 border-orange-200',
					icon: <AlertTriangle className="h-5 w-5" />,
					label: 'Unverified Issuer',
					description: 'This issuer has not been verified. Exercise caution.'
				}
			default:
				return {
					color: 'text-gray-600',
					bgColor: 'bg-gray-50 border-gray-200',
					icon: <AlertTriangle className="h-5 w-5" />,
					label: 'Unknown Issuer',
					description: 'Unable to determine issuer trust level.'
				}
		}
	}

	// Format date for display
	const formatDate = (dateString: string) => {
		try {
			return new Date(dateString).toLocaleString()
		} catch {
			return dateString
		}
	}

	// Check if credential is expired
	const isExpired = () => {
		if (!credential.expirationDate) return false
		return new Date(credential.expirationDate) < new Date()
	}

	// Handle accept action
	const handleAccept = async () => {
		setLoading(true)
		try {
			await onAccept(true, notes.trim() || undefined)
		} finally {
			setLoading(false)
		}
	}

	// Handle reject action
	const handleReject = async () => {
		setLoading(true)
		try {
			await onAccept(false, notes.trim() || undefined)
		} finally {
			setLoading(false)
		}
	}

	const issuerInfo = getIssuerInfo()
	const trustInfo = getTrustInfo()
	const expired = isExpired()

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Review Credential
					</DialogTitle>
					<DialogDescription>
						Please review this credential before accepting it into your wallet.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Trust Level Alert */}
					<Alert className={trustInfo.bgColor}>
						<div className={`flex items-center gap-2 ${trustInfo.color}`}>
							{trustInfo.icon}
							<div>
								<div className="font-medium">{trustInfo.label}</div>
								<div className="text-sm opacity-90">{trustInfo.description}</div>
							</div>
						</div>
					</Alert>

					{/* Expiration Warning */}
					{expired && (
						<Alert variant="destructive">
							<Clock className="h-4 w-4" />
							<AlertDescription>
								<strong>Warning:</strong> This credential appears to be expired.
							</AlertDescription>
						</Alert>
					)}

					{/* Credential Overview */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Credential Overview</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Credential Types */}
							<div>
								<Label className="text-sm font-medium">Type</Label>
								<div className="flex flex-wrap gap-1 mt-1">
									{credential.type.filter((t: string) => t !== 'VerifiableCredential').map((type: string, index: number) => (
										<Badge key={index} variant="outline">
											{type}
										</Badge>
									))}
								</div>
							</div>

							{/* Issuer */}
							<div>
								<Label className="text-sm font-medium">Issued By</Label>
								<div className="flex items-center gap-2 mt-1">
									<User className="h-4 w-4 text-muted-foreground" />
									<span className="font-mono text-sm">{issuerInfo.name}</span>
								</div>
							</div>

							{/* Dates */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label className="text-sm font-medium">Issued Date</Label>
									<div className="flex items-center gap-2 mt-1">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">{formatDate(credential.issuanceDate)}</span>
									</div>
								</div>
								
								{credential.expirationDate && (
									<div>
										<Label className="text-sm font-medium">Expiration Date</Label>
										<div className={`flex items-center gap-2 mt-1 ${expired ? 'text-red-600' : ''}`}>
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm">{formatDate(credential.expirationDate)}</span>
										</div>
									</div>
								)}
							</div>

							{/* Origin */}
							<div>
								<Label className="text-sm font-medium">Source</Label>
								<div className="flex items-center gap-2 mt-1">
									<FileText className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm capitalize">{credential.origin}</span>
									{credential.source && (
										<span className="text-xs text-muted-foreground">({credential.source})</span>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Credential Details Toggle */}
					<div>
						<Button
							variant="outline"
							onClick={() => setShowDetails(!showDetails)}
							className="w-full"
						>
							{showDetails ? (
								<>
									<EyeOff className="h-4 w-4 mr-2" />
									Hide Details
								</>
							) : (
								<>
									<Eye className="h-4 w-4 mr-2" />
									Show Details
								</>
							)}
						</Button>

						{showDetails && (
							<Card className="mt-4">
								<CardHeader>
									<CardTitle className="text-lg">Full Credential Data</CardTitle>
									<CardDescription>
										Complete JSON representation of the credential
									</CardDescription>
								</CardHeader>
								<CardContent>
									<pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
										{JSON.stringify(credential, null, 2)}
									</pre>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Notes Section */}
					<div className="space-y-2">
						<Label htmlFor="acceptance-notes">Notes (Optional)</Label>
						<Textarea
							id="acceptance-notes"
							placeholder="Add any notes about this credential..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
						/>
					</div>

					<Separator />

					{/* Actions */}
					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={onClose} disabled={loading}>
							Cancel
						</Button>
						<Button 
							variant="destructive" 
							onClick={handleReject}
							disabled={loading}
						>
							Reject
						</Button>
						<Button 
							onClick={handleAccept}
							disabled={loading}
							className="bg-green-600 hover:bg-green-700"
						>
							{loading ? 'Processing...' : 'Accept & Add to Wallet'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
