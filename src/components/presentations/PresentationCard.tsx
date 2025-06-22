'use client'

import {useState} from 'react'
import {MoreHorizontal, Eye, Download, Share2, Trash2, Shield, Calendar, User, CheckCircle, AlertTriangle, Clock, FileText} from 'lucide-react'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'

import {VerifiablePresentation, PresentationStatus} from '@/types/presentations'
import {PresentationViewer} from './PresentationViewer'

interface PresentationCardProps {
	presentation: VerifiablePresentation
	status?: PresentationStatus
	onDelete?: (presentationId: string) => void
	onShare?: (presentation: VerifiablePresentation) => void
	onView?: () => void
	onVerify?: () => void
	onDownload?: () => void
	showActions?: boolean
	className?: string
}

/**
 * PresentationCard Component - Displays a verifiable presentation in card format
 *
 * Features:
 * - Presentation overview display
 * - Status indicators with trust scores
 * - Action menu (view, verify, download, share, delete)
 * - Presentation details modal
 * - Responsive design
 */
export function PresentationCard({presentation, status = PresentationStatus.DRAFT, onDelete, onShare, onView, onVerify, onDownload, showActions = true, className = ''}: PresentationCardProps) {
	const [showDetails, setShowDetails] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

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

	// Get status color and icon
	const getStatusDisplay = () => {
		switch (status) {
			case PresentationStatus.DRAFT:
				return {color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Draft'}
			case PresentationStatus.SUBMITTED:
				return {color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Submitted'}
			case PresentationStatus.VERIFIED:
				return {color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Verified'}
			case PresentationStatus.REJECTED:
				return {color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Rejected'}
			default:
				return {color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Unknown'}
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
		} else {
			setShowDetails(true)
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

	return (
		<>
			<Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
				<CardHeader className='pb-3'>
					<div className='flex items-start justify-between'>
						<div className='space-y-2 flex-1'>
							<div className='flex items-center gap-2'>
								<Shield className='h-4 w-4 text-blue-600' />
								<CardTitle className='text-lg leading-none'>{presentation.id ? `Presentation ${presentation.id.slice(0, 8)}...` : 'New Presentation'}</CardTitle>
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
									<Button variant='ghost' className='h-8 w-8 p-0'>
										<span className='sr-only'>Open menu</span>
										<MoreHorizontal className='h-4 w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem onClick={handleView}>
										<Eye className='mr-2 h-4 w-4' />
										View Details
									</DropdownMenuItem>
									{onVerify && (
										<DropdownMenuItem onClick={onVerify}>
											<Shield className='mr-2 h-4 w-4' />
											Verify
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
									<span>Created: {new Date(presentation.createdAt).toLocaleDateString()}</span>
								</div>
							)}
						</div>

						{/* Context */}
						{presentation['@context'] && Array.isArray(presentation['@context']) && presentation['@context'].length > 1 && <div className='text-xs text-muted-foreground'>Context: {presentation['@context'].slice(1).join(', ')}</div>}
					</div>
				</CardContent>
			</Card>

			{/* Details Modal */}
			<Dialog open={showDetails} onOpenChange={setShowDetails}>
				<DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Presentation Details</DialogTitle>
						<DialogDescription>View the complete presentation data and structure</DialogDescription>
					</DialogHeader>

					<PresentationViewer presentation={presentation} status={status} className='mt-4' />
				</DialogContent>
			</Dialog>
		</>
	)
}
