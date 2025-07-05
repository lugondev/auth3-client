'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Share2, Shield, Trash2, RefreshCw, Eye, Calendar, User, FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

import { VerifiablePresentation, PresentationStatus, VerifyPresentationResponse, EnhancedVerificationResponse } from '@/types/presentations'
import { getPresentation, deletePresentation, verifyPresentationEnhanced } from '@/services/presentationService'
import { useAuth } from '@/contexts/AuthContext'
import { PresentationViewer } from '@/components/presentations/PresentationViewer'
import { VPStateTimeline } from '@/components/presentations/VPStateTimeline'
import { VerificationResultModal } from '@/components/presentations/VerificationResultModal'
import { SharePresentationModal } from '@/components/presentations/SharePresentationModal'

/**
 * PresentationDetailPage - Detailed view for a specific presentation
 * 
 * Features:
 * - Full presentation details view
 * - Verification actions and results
 * - State timeline
 * - Share functionality
 * - Delete capability
 */
export default function PresentationDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { user } = useAuth()
	const presentationId = params.id as string

	const [presentation, setPresentation] = useState<VerifiablePresentation | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isVerifying, setIsVerifying] = useState(false)

	// Current status from state transitions (real-time)
	const [currentStatus, setCurrentStatus] = useState<string | null>(null)

	// Verification result state
	const [showVerificationResult, setShowVerificationResult] = useState(false)
	const [verificationResults, setVerificationResults] = useState<VerifyPresentationResponse | EnhancedVerificationResponse | null>(null)

	// Share modal state
	const [showShareModal, setShowShareModal] = useState(false)

	// Load presentation data
	useEffect(() => {
		const loadPresentation = async () => {
			if (!presentationId || !user?.id) return

			try {
				setLoading(true)
				setError(null)
				const data = await getPresentation(presentationId)
				setPresentation(data.presentation)
			} catch (err) {
				console.error('Failed to load presentation:', err)
				setError('Failed to load presentation details')
				toast.error('Failed to load presentation')
			} finally {
				setLoading(false)
			}
		}

		loadPresentation()
	}, [presentationId, user?.id])

	// Get presentation types (excluding VerifiablePresentation)
	const getPresentationTypes = () => {
		if (!presentation?.type) return []
		if (Array.isArray(presentation.type)) {
			return presentation.type.filter((type) => type !== 'VerifiablePresentation')
		}
		return presentation.type === 'VerifiablePresentation' ? [] : [presentation.type]
	}

	// Get credential count
	const getCredentialCount = () => {
		if (!presentation?.verifiableCredential) return 0
		if (Array.isArray(presentation.verifiableCredential)) {
			return presentation.verifiableCredential.length
		}
		return 1
	}

	// Get status display info - uses real-time status from timeline
	const getStatusDisplay = () => {
		// Prioritize current status from state transitions, fallback to presentation status
		const status = currentStatus || presentation?.status || PresentationStatus.DRAFT
		
		switch (status.toLowerCase()) {
			case 'draft':
			case PresentationStatus.DRAFT:
				return { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Draft' }
			case 'pending':
				return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' }
			case 'submitted':
			case PresentationStatus.SUBMITTED:
				return { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Submitted' }
			case 'verified':
			case PresentationStatus.VERIFIED:
				return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Verified' }
			case 'rejected':
			case PresentationStatus.REJECTED:
				return { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Rejected' }
			case 'expired':
				return { color: 'bg-gray-100 text-gray-600', icon: AlertTriangle, label: 'Expired' }
			case 'revoked':
				return { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Revoked' }
			default:
				return { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Unknown' }
		}
	}

	const handleDelete = async () => {
		if (!presentation?.id) return

		setIsDeleting(true)
		try {
			await deletePresentation(presentation.id)
			toast.success('Presentation deleted successfully')
			router.push('/dashboard/presentations')
		} catch (error) {
			console.error('Delete error:', error)
			toast.error('Failed to delete presentation')
		} finally {
			setIsDeleting(false)
		}
	}

	const handleVerify = async () => {
		if (!presentation) return

		setIsVerifying(true)
		try {
			toast.info('Verifying presentation...')

			const verificationRequest = {
				presentation,
				verificationOptions: {
					verifySignature: true,
					verifyExpiration: true,
					verifyRevocation: true,
					verifyIssuerTrust: true,
					verifySchema: true,
					verifyChallenge: true,
					verifyDomain: true,
					strictMode: false,
					recordVerification: true,
				},
				metadata: {
					source: 'presentation_detail',
					timestamp: new Date().toISOString(),
					userAgent: navigator.userAgent,
				},
			}

			const results = await verifyPresentationEnhanced(verificationRequest)

			if (results.valid) {
				const trustScore = results.trustScore ? Math.round(results.trustScore * 100) : 0
				toast.success(`Verification completed! Trust Score: ${trustScore}%`)
			} else {
				toast.error('Verification failed - see results for details')
			}

			setVerificationResults(results)
			setShowVerificationResult(true)
		} catch (error) {
			console.error('Verification error:', error)
			toast.error('Failed to verify presentation')

			const errorResult: EnhancedVerificationResponse = {
				valid: false,
				trustScore: 0,
				presentationResults: {
					signatureValid: false,
					proofValid: false,
					challengeValid: false,
					domainValid: false,
					holderVerified: false,
					credentialsValid: false,
					message: 'Verification service error',
				},
				errors: [error instanceof Error ? error.message : 'Unknown verification error'],
				verifiedAt: new Date().toISOString(),
			}

			setVerificationResults(errorResult)
			setShowVerificationResult(true)
		} finally {
			setIsVerifying(false)
		}
	}

	const handleDownload = () => {
		if (!presentation) return
		
		const dataStr = JSON.stringify(presentation, null, 2)
		const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
		
		const exportFileDefaultName = `presentation-${presentation.id}.json`
		
		const linkElement = document.createElement('a')
		linkElement.setAttribute('href', dataUri)
		linkElement.setAttribute('download', exportFileDefaultName)
		linkElement.click()
		
		toast.success('Presentation downloaded successfully')
	}

	const handleShare = () => {
		setShowShareModal(true)
	}

	if (loading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center min-h-[400px]">
					<RefreshCw className="h-8 w-8 animate-spin mr-3" />
					<span className="text-lg">Loading presentation...</span>
				</div>
			</div>
		)
	}

	if (error || !presentation) {
		return (
			<div className="container mx-auto p-6">
				<div className="text-center min-h-[400px] flex items-center justify-center">
					<div>
						<h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
						<p className="text-muted-foreground mb-6">{error || 'Presentation not found'}</p>
						<Button onClick={() => router.push('/dashboard/presentations')} variant="outline">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Presentations
						</Button>
					</div>
				</div>
			</div>
		)
	}

	const statusDisplay = getStatusDisplay()
	const StatusIcon = statusDisplay.icon
	const credentialCount = getCredentialCount()
	const presentationTypes = getPresentationTypes()

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Button 
						onClick={() => router.push('/dashboard/presentations')} 
						variant="outline" 
						size="sm"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Presentation Details</h1>
						<p className="text-muted-foreground">
							View and manage your verifiable presentation
						</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex items-center space-x-2">
					<Button 
						onClick={handleVerify} 
						variant="outline" 
						size="sm"
						disabled={isVerifying}
					>
						<Shield className="h-4 w-4 mr-2" />
						{isVerifying ? 'Verifying...' : 'Verify'}
					</Button>
					<Button 
						onClick={handleDownload} 
						variant="outline" 
						size="sm"
					>
						<Download className="h-4 w-4 mr-2" />
						Download
					</Button>
					<Button 
						onClick={handleShare} 
						variant="outline" 
						size="sm"
					>
						<Share2 className="h-4 w-4 mr-2" />
						Share
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" size="sm" disabled={isDeleting}>
								<Trash2 className="h-4 w-4 mr-2" />
								{isDeleting ? 'Deleting...' : 'Delete'}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Presentation</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete this presentation? This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction 
									onClick={handleDelete} 
									className="bg-red-600 hover:bg-red-700"
									disabled={isDeleting}
								>
									{isDeleting ? 'Deleting...' : 'Delete'}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			{/* Overview Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<StatusIcon className="h-6 w-6" />
							<div>
								<CardTitle>Presentation Overview</CardTitle>
								<p className="text-sm text-muted-foreground">
									ID: {presentation.id}
								</p>
							</div>
						</div>
						<Badge className={statusDisplay.color}>
							{statusDisplay.label}
						</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Basic Info */}
						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<User className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Holder</p>
									<p className="text-sm text-muted-foreground font-mono">
										{presentation.holder?.length > 20 
											? `${presentation.holder.slice(0, 20)}...` 
											: presentation.holder || 'Unknown'
										}
									</p>
								</div>
							</div>
							
							<div className="flex items-center space-x-2">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Credentials</p>
									<p className="text-sm text-muted-foreground">
										{credentialCount} credential{credentialCount !== 1 ? 's' : ''}
									</p>
								</div>
							</div>

							<div className="flex items-center space-x-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Created</p>
									<p className="text-sm text-muted-foreground">
										{presentation.createdAt 
											? new Date(presentation.createdAt).toLocaleDateString()
											: 'Unknown'
										}
									</p>
								</div>
							</div>
						</div>

						{/* Types */}
						<div className="space-y-2">
							<p className="text-sm font-medium">Types</p>
							<div className="flex flex-wrap gap-1">
								{presentationTypes.length > 0 ? (
									presentationTypes.map((type, index) => (
										<Badge key={index} variant="secondary" className="text-xs">
											{type}
										</Badge>
									))
								) : (
									<Badge variant="secondary" className="text-xs">
										VerifiablePresentation
									</Badge>
								)}
							</div>
						</div>

						{/* Challenge & Domain */}
						<div className="space-y-4">
							{presentation.challenge && (
								<div>
									<p className="text-sm font-medium">Challenge</p>
									<p className="text-sm text-muted-foreground font-mono">
										{presentation.challenge.length > 20 
											? `${presentation.challenge.slice(0, 20)}...` 
											: presentation.challenge
										}
									</p>
								</div>
							)}

							{presentation.domain && (
								<div>
									<p className="text-sm font-medium">Domain</p>
									<p className="text-sm text-muted-foreground">
										{presentation.domain}
									</p>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Presentation Content */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Eye className="h-5 w-5" />
						<span>Presentation Content</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<PresentationViewer presentation={presentation} />
				</CardContent>
			</Card>

			{/* State Timeline */}
			<Card>
				<CardHeader>
					<CardTitle>State Timeline</CardTitle>
				</CardHeader>
				<CardContent>
					<VPStateTimeline 
						presentationId={presentation.id || ''} 
						onStatusChange={setCurrentStatus}
						autoRefresh={true}
					/>
				</CardContent>
			</Card>

			{/* Verification Result Modal */}
			{presentation && (
				<VerificationResultModal 
					isOpen={showVerificationResult} 
					onClose={() => {
						setShowVerificationResult(false)
						setVerificationResults(null)
					}} 
					results={verificationResults} 
					presentation={presentation} 
				/>
			)}

			{/* Share Modal */}
			{presentation && (
				<SharePresentationModal
					isOpen={showShareModal}
					onClose={() => setShowShareModal(false)}
					presentation={presentation}
				/>
			)}
		</div>
	)
}
