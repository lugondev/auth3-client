'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, Download, Share2, Trash2, Shield, Calendar, User, CheckCircle, AlertTriangle, Clock, FileText, RefreshCw, XCircle, Ban } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { VerifiablePresentation, PresentationStatus } from '@/types/presentations'
import { getCurrentVPState, revokePresentation, rejectPresentation } from '@/services/vpStateMachineService'
import { formatDate } from '@/lib/utils'

interface PresentationCardProps {
	presentation: VerifiablePresentation
	status?: PresentationStatus
	onDelete?: (presentationId: string) => void
	onShare?: (presentation: VerifiablePresentation) => void
	onView?: () => void
	onVerify?: () => void
	onDownload?: () => void
	onRevoke?: (presentationId: string, reason: string) => void
	onReject?: (presentationId: string, reason: string) => void
	showActions?: boolean
	showRevokeOption?: boolean
	showRejectOption?: boolean
	isVerifying?: boolean
	className?: string
}

/**
 * PresentationCard Component - Displays a verifiable presentation in card format
 *
 * Features:
 * - Presentation overview display
 * - Status indicators with trust scores
 * - Action menu (view, verify, download, share, delete)
 * - Navigation to detail page
 * - Responsive design
 */
export function PresentationCard({ 
	presentation, 
	status = PresentationStatus.DRAFT, 
	onDelete, 
	onShare, 
	onView, 
	onVerify, 
	onDownload, 
	onRevoke,
	onReject,
	showActions = true, 
	showRevokeOption = false,
	showRejectOption = false,
	isVerifying = false, 
	className = '' 
}: PresentationCardProps) {
	const router = useRouter()
	const [isDeleting, setIsDeleting] = useState(false)
	const [currentStatus, setCurrentStatus] = useState<string | null>(null)
	const [revokeReason, setRevokeReason] = useState('')
	const [rejectReason, setRejectReason] = useState('')
	const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

	// Load current status from VP state machine
	useEffect(() => {
		const loadCurrentStatus = async () => {
			if (!presentation.id) return

			try {
				const response = await getCurrentVPState(presentation.id)
				if (response.currentState) {
					setCurrentStatus(response.currentState)
				}
			} catch (error) {
				// Silently fail and use default status
				console.debug('Failed to load current VP state:', error)
			}
		}

		loadCurrentStatus()
	}, [presentation.id])

	// Get presentation types (excluding VerifiablePresentation)
	const getPresentationTypes = () => {
		if (Array.isArray(presentation.type)) {
			return presentation.type.filter((type) => type !== 'VerifiablePresentation')
		}
		return presentation.type === 'VerifiablePresentation' ? [] : [presentation.type]
	}

	// Get credential count
	const getCredentialCount = () => {
		if (Array.isArray(presentation.verifiableCredential)) {
			return presentation.verifiableCredential.length
		}
		return presentation.verifiableCredential ? 1 : 0
	}

	// Get status color and icon - uses real-time status from VP state machine
	const getStatusDisplay = () => {
		// Prioritize current status from VP state machine, fallback to prop status, then presentation status
		const effectiveStatus = currentStatus || status || presentation.status || PresentationStatus.DRAFT
		
		switch (effectiveStatus.toLowerCase()) {
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

	const statusDisplay = getStatusDisplay()
	const StatusIcon = statusDisplay.icon
	const credentialCount = getCredentialCount()
	const presentationTypes = getPresentationTypes()

	const handleDelete = async () => {
		if (!presentation.id || !onDelete) return

		setIsDeleting(true)
		try {
			await onDelete(presentation.id)
			toast.success('Presentation deleted successfully')
		} catch (error) {
			toast.error('Failed to delete presentation')
			console.error('Delete error:', error)
		} finally {
			setIsDeleting(false)
		}
	}

	const handleShare = () => {
		if (onShare) {
			onShare(presentation)
		}
	}

	const handleView = () => {
		if (onView) {
			onView()
		} else if (presentation.id) {
			// Navigate to the detail page
			router.push(`/dashboard/presentations/${presentation.id}`)
		}
	}

	const handleCardClick = () => {
		// Navigate to detail page when clicking on the card (not on action buttons)
		if (presentation.id) {
			router.push(`/dashboard/presentations/${presentation.id}`)
		}
	}

	const handleDownload = async () => {
		if (onDownload) {
			onDownload()
		} else {
			// Default download behavior
			try {
				const dataStr = JSON.stringify(presentation, null, 2)
				const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

				const exportFileDefaultName = `presentation-${presentation.id || 'unknown'}.json`

				const linkElement = document.createElement('a')
				linkElement.setAttribute('href', dataUri)
				linkElement.setAttribute('download', exportFileDefaultName)
				linkElement.click()

				toast.success('Presentation downloaded')
			} catch (error) {
				toast.error('Failed to download presentation')
				console.error('Download error:', error)
			}
		}
	}

	const handleRevoke = async (reason: string) => {
		if (!presentation.id) return

		try {
			if (onRevoke) {
				await onRevoke(presentation.id, reason)
			} else {
				// Use direct API call
				await revokePresentation(presentation.id, reason)
			}
			toast.success('Presentation revoked successfully')
		} catch (error: any) {
			console.error('Revoke error:', error)
			toast.error(error.message || 'Failed to revoke presentation')
		}
	}

	const handleReject = async (reason: string) => {
		if (!presentation.id) return

		try {
			if (onReject) {
				await onReject(presentation.id, reason)
			} else {
				// Use direct API call
				await rejectPresentation(presentation.id, reason)
			}
			toast.success('Presentation rejected successfully')
		} catch (error: any) {
			console.error('Reject error:', error)
			toast.error(error.message || 'Failed to reject presentation')
		}
	}

	return (
		<Card 
			className={`transition-all duration-200 hover:shadow-md cursor-pointer ${className}`}
			onClick={handleCardClick}
		>
			<CardHeader className='pb-3'>
				<div className='flex items-start justify-between'>
					<div className='space-y-2 flex-1'>
						<div className='flex items-center gap-2'>
							<Shield className='h-4 w-4 text-blue-600' />
							<CardTitle className='text-lg leading-none'>{presentation.metadata?.name || presentation.id ? `Presentation ${presentation.id.slice(0, 8)}...` : 'New Presentation'}</CardTitle>
						</div>
						<div className='flex items-center gap-2'>
							<Badge variant='outline' className={`${statusDisplay.color} border-0 text-xs`}>
								<StatusIcon className='h-3 w-3 mr-1' />
								{statusDisplay.label}
							</Badge>
							{credentialCount > 0 && (
								<Badge variant='secondary' className='text-xs'>
									{credentialCount} credential{credentialCount !== 1 ? 's' : ''}
								</Badge>
							)}
						</div>
					</div>
					{showActions && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button 
									variant='ghost' 
									className='h-8 w-8 p-0'
									onClick={(e) => e.stopPropagation()} // Prevent card click
								>
									<span className='sr-only'>Open menu</span>
									<MoreHorizontal className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' onClick={(e) => e.stopPropagation()}>
								<DropdownMenuItem onClick={handleView}>
									<Eye className='mr-2 h-4 w-4' />
									View Details
								</DropdownMenuItem>
								{onVerify && (
									<DropdownMenuItem onClick={onVerify} disabled={isVerifying}>
										{isVerifying ? (
											<>
												<RefreshCw className='mr-2 h-4 w-4 animate-spin' />
												Verifying...
											</>
										) : (
											<>
												<Shield className='mr-2 h-4 w-4' />
												Verify
											</>
										)}
									</DropdownMenuItem>
								)}
								<DropdownMenuItem onClick={handleDownload}>
									<Download className='mr-2 h-4 w-4' />
									Download
								</DropdownMenuItem>
								{onShare && (
									<DropdownMenuItem onClick={handleShare}>
										<Share2 className='mr-2 h-4 w-4' />
										Share
									</DropdownMenuItem>
								)}
								
								{/* Revoke option */}
								{showRevokeOption && (
									<Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
										<DialogTrigger asChild>
											<DropdownMenuItem className='text-orange-600 focus:text-orange-600' onSelect={(e) => e.preventDefault()}>
												<Ban className='mr-2 h-4 w-4' />
												Revoke
											</DropdownMenuItem>
										</DialogTrigger>
										<DialogContent onClick={(e) => e.stopPropagation()}>
											<DialogHeader>
												<DialogTitle>Revoke Presentation</DialogTitle>
												<DialogDescription>
													Please provide a reason for revoking this presentation. This action cannot be undone.
												</DialogDescription>
											</DialogHeader>
											<div className="grid gap-4 py-4">
												<div className="grid grid-cols-4 items-center gap-4">
													<Label htmlFor="revoke-reason" className="text-right">
														Reason
													</Label>
													<Input
														id="revoke-reason"
														value={revokeReason}
														onChange={(e) => setRevokeReason(e.target.value)}
														placeholder="Enter revocation reason..."
														className="col-span-3"
													/>
												</div>
											</div>
											<DialogFooter>
												<Button variant="outline" onClick={() => {
													setIsRevokeDialogOpen(false)
													setRevokeReason('')
												}}>
													Cancel
												</Button>
												<Button 
													variant="destructive" 
													onClick={async () => {
														if (revokeReason.trim()) {
															await handleRevoke(revokeReason.trim())
															setIsRevokeDialogOpen(false)
															setRevokeReason('')
														}
													}}
													disabled={!revokeReason.trim()}
												>
													Revoke
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								)}

								{/* Reject option */}
								{showRejectOption && (
									<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
										<DialogTrigger asChild>
											<DropdownMenuItem className='text-red-600 focus:text-red-600' onSelect={(e) => e.preventDefault()}>
												<XCircle className='mr-2 h-4 w-4' />
												Reject
											</DropdownMenuItem>
										</DialogTrigger>
										<DialogContent onClick={(e) => e.stopPropagation()}>
											<DialogHeader>
												<DialogTitle>Reject Presentation</DialogTitle>
												<DialogDescription>
													Please provide a reason for rejecting this presentation. This action cannot be undone.
												</DialogDescription>
											</DialogHeader>
											<div className="grid gap-4 py-4">
												<div className="grid grid-cols-4 items-center gap-4">
													<Label htmlFor="reject-reason" className="text-right">
														Reason
													</Label>
													<Input
														id="reject-reason"
														value={rejectReason}
														onChange={(e) => setRejectReason(e.target.value)}
														placeholder="Enter rejection reason..."
														className="col-span-3"
													/>
												</div>
											</div>
											<DialogFooter>
												<Button variant="outline" onClick={() => {
													setIsRejectDialogOpen(false)
													setRejectReason('')
												}}>
													Cancel
												</Button>
												<Button 
													variant="destructive" 
													onClick={async () => {
														if (rejectReason.trim()) {
															await handleReject(rejectReason.trim())
															setIsRejectDialogOpen(false)
															setRejectReason('')
														}
													}}
													disabled={!rejectReason.trim()}
												>
													Reject
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								)}
								{onDelete && (
									<>
										<DropdownMenuSeparator />
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<DropdownMenuItem className='text-red-600 focus:text-red-600' onSelect={(e) => e.preventDefault()}>
													<Trash2 className='mr-2 h-4 w-4' />
													Delete
												</DropdownMenuItem>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Delete Presentation</AlertDialogTitle>
													<AlertDialogDescription>Are you sure you want to delete this presentation? This action cannot be undone.</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction onClick={handleDelete} className='bg-red-600 hover:bg-red-700' disabled={isDeleting}>
														{isDeleting ? 'Deleting...' : 'Delete'}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</CardHeader>

			<CardContent className='pt-0'>
				<div className='space-y-3'>
					{/* Presentation Types */}
					{presentationTypes.length > 0 && (
						<div className='flex flex-wrap gap-1'>
							{presentationTypes.map((type) => (
								<Badge key={type} variant='outline' className='text-xs'>
									{type}
								</Badge>
							))}
						</div>
					)}

					{/* Metadata */}
					<div className='space-y-2 text-sm text-muted-foreground'>
						{presentation.holder && (
							<div className='flex items-center gap-2'>
								<User className='h-4 w-4' />
								<span className='truncate'>Holder: {typeof presentation.holder === 'string' ? presentation.holder.slice(0, 20) + '...' : 'Unknown'}</span>
							</div>
						)}

						{presentation.createdAt && (
							<div className='flex items-center gap-2'>
								<Calendar className='h-4 w-4' />
								<span>Created: {formatDate(presentation.createdAt)}</span>
							</div>
						)}
					</div>

					{/* Context */}
					{presentation['@context'] && Array.isArray(presentation['@context']) && presentation['@context'].length > 1 && <div className='text-xs text-muted-foreground'>Context: {presentation['@context'].slice(1).join(', ')}</div>}
				</div>
			</CardContent>
		</Card>
	)
}
