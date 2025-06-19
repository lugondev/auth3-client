'use client'

import {useState} from 'react'
import {MoreHorizontal, Eye, Download, Share2, Trash2, Shield, Calendar, User, AlertTriangle, CheckCircle, Clock} from 'lucide-react'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'

import type {CredentialMetadata, CredentialStatus} from '@/types/credentials'
import {CredentialStatusBadge} from './CredentialStatusBadge'

interface CredentialMetadataCardProps {
	credential: CredentialMetadata
	onDelete?: (credentialId: string) => void
	onShare?: (credential: CredentialMetadata) => void
	onView?: () => void
	onDownload?: () => void
	showActions?: boolean
	className?: string
}

/**
 * CredentialMetadataCard Component - Displays credential metadata in card format
 *
 * Features:
 * - Credential overview display
 * - Status indicators
 * - Action menu (view, download, share, delete)
 * - Responsive design
 */
export function CredentialMetadataCard({credential, onDelete, onShare, onView, onDownload, showActions = true, className = ''}: CredentialMetadataCardProps) {
	const [isDeleting, setIsDeleting] = useState(false)

	// Get credential types (excluding VerifiableCredential)
	const getCredentialTypes = () => {
		if (Array.isArray(credential.type)) {
			return credential.type.filter((type) => type !== 'VerifiableCredential')
		}
		return credential.type === 'VerifiableCredential' ? [] : [credential.type]
	}

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

	// Format date for display
	const formatDate = (dateString: string) => {
		try {
			return new Date(dateString).toLocaleDateString()
		} catch {
			return dateString
		}
	}

	// Handle delete action
	const handleDelete = async () => {
		if (!onDelete) return

		try {
			setIsDeleting(true)
			await onDelete(credential.id)
			toast.success('Credential deleted successfully')
		} catch (error) {
			console.error('Error deleting credential:', error)
			toast.error('Failed to delete credential')
		} finally {
			setIsDeleting(false)
		}
	}

	// Handle share action
	const handleShare = () => {
		if (onShare) {
			onShare(credential)
		} else {
			// Default share behavior
			if (navigator.share) {
				navigator.share({
					title: `Credential: ${getCredentialTypes().join(', ')}`,
					text: `Verifiable Credential issued by ${getIssuerInfo().name}`,
					url: window.location.href,
				})
			} else {
				// Fallback: copy to clipboard
				navigator.clipboard.writeText(window.location.href)
				toast.success('Link copied to clipboard')
			}
		}
	}

	const credentialTypes = getCredentialTypes()
	const issuerInfo = getIssuerInfo()

	return (
		<Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
			<CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
				<div className='space-y-1 flex-1'>
					<CardTitle className='text-base font-medium line-clamp-1'>
						{credentialTypes.length > 0 ? credentialTypes.join(', ') : 'Verifiable Credential'}
					</CardTitle>
					<CardDescription className='text-sm text-muted-foreground line-clamp-1'>ID: {credential.id}</CardDescription>
				</div>
				<div className='flex items-center space-x-2'>
					<CredentialStatusBadge status={credential.status} size='sm' />
					{showActions && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' className='h-8 w-8 p-0'>
									<span className='sr-only'>Open menu</span>
									<MoreHorizontal className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								{onView && (
									<DropdownMenuItem onClick={onView}>
										<Eye className='mr-2 h-4 w-4' />
										View Details
									</DropdownMenuItem>
								)}
								{onDownload && (
									<DropdownMenuItem onClick={onDownload}>
										<Download className='mr-2 h-4 w-4' />
										Download
									</DropdownMenuItem>
								)}
								<DropdownMenuItem onClick={handleShare}>
									<Share2 className='mr-2 h-4 w-4' />
									Share
								</DropdownMenuItem>
								{onDelete && (
									<>
										<DropdownMenuSeparator />
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
													<Trash2 className='mr-2 h-4 w-4' />
													Delete
												</DropdownMenuItem>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Delete Credential</AlertDialogTitle>
													<AlertDialogDescription>
														Are you sure you want to delete this credential? This action cannot be undone.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
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
					{/* Issuer Information */}
					<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
						<User className='h-4 w-4' />
						<span className='line-clamp-1'>Issued by: {issuerInfo.name}</span>
					</div>

					{/* Subject Information */}
					<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
						<Shield className='h-4 w-4' />
						<span className='line-clamp-1'>Subject: {credential.subject}</span>
					</div>

					{/* Dates */}
					<div className='grid grid-cols-1 gap-2 text-sm text-muted-foreground'>
						<div className='flex items-center space-x-2'>
							<Calendar className='h-4 w-4' />
							<span>Issued: {formatDate(credential.issuanceDate)}</span>
						</div>
						{credential.expirationDate && (
							<div className='flex items-center space-x-2'>
								<Clock className='h-4 w-4' />
								<span>Expires: {formatDate(credential.expirationDate)}</span>
							</div>
						)}
					</div>

					{/* Status Reason */}
					{credential.statusReason && (
						<div className='flex items-start space-x-2 text-sm'>
							<AlertTriangle className='h-4 w-4 text-amber-500 mt-0.5' />
							<span className='text-amber-700'>{credential.statusReason}</span>
						</div>
					)}

					{/* Last Updated */}
					<div className='text-xs text-muted-foreground'>
						Last updated: {formatDate(credential.lastUpdated)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}