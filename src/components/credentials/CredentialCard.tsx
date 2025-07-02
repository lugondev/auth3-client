'use client'

import {useState} from 'react'
import {MoreHorizontal, Eye, Download, Share2, Trash2, Shield, Calendar, User, AlertTriangle, CheckCircle, Clock, XCircle} from 'lucide-react'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'

import type {VerifiableCredential} from '@/types/credentials'
import {CredentialStatus} from '@/types/credentials'
import {CredentialViewer} from './CredentialViewer'
import {RevokeCredentialModal} from './RevokeCredentialModal'

interface CredentialCardProps {
	credential: VerifiableCredential
	status?: CredentialStatus
	onDelete?: (credentialId: string) => void
	onShare?: (credential: VerifiableCredential) => void
	onView?: () => void
	onDownload?: () => void
	onRevoke?: (credentialId: string) => void
	showActions?: boolean
	className?: string
}

/**
 * CredentialCard Component - Displays a credential in card format
 *
 * Features:
 * - Credential overview display
 * - Status indicators
 * - Action menu (view, download, share, delete)
 * - Credential details modal
 * - Responsive design
 */
export function CredentialCard({credential, status = CredentialStatus.ACTIVE, onDelete, onShare, onView, onDownload, onRevoke, showActions = true, className = ''}: CredentialCardProps) {
	const [showDetails, setShowDetails] = useState(false)
	const [showRevokeModal, setShowRevokeModal] = useState(false)
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

	// Extract subject information
	const getSubjectInfo = () => {
		if (Array.isArray(credential.credentialSubject)) {
			return credential.credentialSubject[0]
		}
		return credential.credentialSubject
	}

	// Format date for display
	const formatDate = (dateString: string) => {
		try {
			return new Date(dateString).toLocaleDateString()
		} catch {
			return dateString
		}
	}

	// Get status color and icon
	const getStatusDisplay = () => {
		switch (status) {
			case 'active':
				return {
					color: 'text-green-600',
					bgColor: 'bg-green-50',
					icon: <CheckCircle className='h-4 w-4' />,
					label: 'Active',
				}
			case 'expired':
				return {
					color: 'text-red-600',
					bgColor: 'bg-red-50',
					icon: <Clock className='h-4 w-4' />,
					label: 'Expired',
				}
			case 'revoked':
				return {
					color: 'text-red-600',
					bgColor: 'bg-red-50',
					icon: <AlertTriangle className='h-4 w-4' />,
					label: 'Revoked',
				}
			case 'suspended':
				return {
					color: 'text-yellow-600',
					bgColor: 'bg-yellow-50',
					icon: <AlertTriangle className='h-4 w-4' />,
					label: 'Suspended',
				}
			default:
				return {
					color: 'text-gray-600',
					bgColor: 'bg-gray-50',
					icon: <Clock className='h-4 w-4' />,
					label: 'Unknown',
				}
		}
	}

	// Check if credential is expired
	const isExpired = () => {
		if (!credential.expirationDate) return false
		return new Date(credential.expirationDate) < new Date()
	}

	// Download credential as JSON
	const downloadCredential = () => {
		if (onDownload) {
			onDownload()
			return
		}

		try {
			const blob = new Blob([JSON.stringify(credential, null, 2)], {type: 'application/json'})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `credential-${credential.id || Date.now()}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
			toast.success('Credential downloaded')
		} catch (error) {
			console.log('Error downloading credential', error)
			toast.error('Failed to download credential')
		}
	}

	// Handle delete
	const handleDelete = async () => {
		if (!onDelete || !credential.id) return

		setIsDeleting(true)
		try {
			onDelete(credential.id)
			toast.success('Credential deleted')
		} catch (error) {
			console.log('Error deleting credential', error)
			toast.error('Failed to delete credential')
		} finally {
			setIsDeleting(false)
		}
	}

	// Handle share
	const handleShare = () => {
		if (onShare) {
			onShare(credential)
		} else {
			// Default share behavior - copy to clipboard
			navigator.clipboard
				.writeText(JSON.stringify(credential, null, 2))
				.then(() => toast.success('Credential copied to clipboard'))
				.catch(() => toast.error('Failed to copy credential'))
		}
	}

	const credentialTypes = getCredentialTypes()
	const issuerInfo = getIssuerInfo()
	const subjectInfo = getSubjectInfo()
	const statusDisplay = getStatusDisplay()
	const expired = isExpired()

	return (
		<Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
			<CardHeader className='pb-3'>
				<div className='flex items-start justify-between'>
					<div className='space-y-1 flex-1'>
						<div className='flex items-center gap-2'>
							<CardTitle className='text-lg line-clamp-1'>{credentialTypes.length > 0 ? credentialTypes[0] : 'Verifiable Credential'}</CardTitle>
							<div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusDisplay.bgColor} ${statusDisplay.color}`}>
								{statusDisplay.icon}
								<span>{statusDisplay.label}</span>
							</div>
						</div>

						<CardDescription className='line-clamp-2'>Issued by {issuerInfo.name}</CardDescription>

						{/* Credential Types */}
						{credentialTypes.length > 1 && (
							<div className='flex flex-wrap gap-1 mt-2'>
								{credentialTypes.slice(1).map((type, index) => (
									<Badge key={index} variant='outline' className='text-xs'>
										{type}
									</Badge>
								))}
							</div>
						)}
					</div>

					{showActions && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
									<MoreHorizontal className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								{onView ? (
									<DropdownMenuItem onClick={onView}>
										<Eye className='h-4 w-4 mr-2' />
										View Details
									</DropdownMenuItem>
								) : (
									<Dialog open={showDetails} onOpenChange={setShowDetails}>
										<DialogTrigger asChild>
											<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
												<Eye className='h-4 w-4 mr-2' />
												View Details
											</DropdownMenuItem>
										</DialogTrigger>
									</Dialog>
								)}

								<DropdownMenuItem onClick={downloadCredential}>
									<Download className='h-4 w-4 mr-2' />
									Download
								</DropdownMenuItem>

								<DropdownMenuItem onClick={handleShare}>
									<Share2 className='h-4 w-4 mr-2' />
									Share
								</DropdownMenuItem>

								{/* Revoke option - only show for active credentials */}
								{onRevoke && status === 'active' && (
									<DropdownMenuItem 
										onClick={() => setShowRevokeModal(true)}
										className='text-red-600 focus:text-red-600'
									>
										<XCircle className='h-4 w-4 mr-2' />
										Revoke
									</DropdownMenuItem>
								)}

								{onDelete && (
									<div>
										<DropdownMenuSeparator />
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<DropdownMenuItem onSelect={(e) => e.preventDefault()} className='text-red-600 focus:text-red-600'>
													<Trash2 className='h-4 w-4 mr-2' />
													Delete
												</DropdownMenuItem>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Delete Credential</AlertDialogTitle>
													<AlertDialogDescription>Are you sure you want to delete this credential? This action cannot be undone.</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction onClick={handleDelete} disabled={isDeleting} className='bg-red-600 hover:bg-red-700'>
														{isDeleting ? 'Deleting...' : 'Delete'}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</CardHeader>

			<CardContent className='pt-0'>
				<div className='space-y-3'>
					{/* Subject Information */}
					<div className='flex items-center gap-2 text-sm text-muted-foreground'>
						<User className='h-4 w-4' />
						<span>Subject: {subjectInfo.id || 'Not specified'}</span>
					</div>

					{/* Dates */}
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
						{credential.issuanceDate && (
							<div className='flex items-center gap-2 text-muted-foreground'>
								<Calendar className='h-4 w-4' />
								<span>Issued: {formatDate(credential.issuanceDate)}</span>
							</div>
						)}

						{credential.expirationDate && (
							<div className={`flex items-center gap-2 ${expired ? 'text-red-600' : 'text-muted-foreground'}`}>
								<Calendar className='h-4 w-4' />
								<span>Expires: {formatDate(credential.expirationDate)}</span>
							</div>
						)}
					</div>

					{/* Credential Status */}
					{credential.credentialStatus && (
						<div className='flex items-center gap-2 text-sm text-muted-foreground'>
							<Shield className='h-4 w-4' />
							<span>Status: {credential.credentialStatus}</span>
						</div>
					)}

					{/* Subject Claims Preview */}
					{Object.keys(subjectInfo).length > 1 && (
						<div className='space-y-1'>
							<div className='text-sm font-medium text-muted-foreground'>Claims:</div>
							<div className='flex flex-wrap gap-1'>
								{Object.entries(subjectInfo)
									.filter(([key]) => key !== 'id')
									.slice(0, 3)
									.map(([key, value]) => (
										<Badge key={key} variant='outline' className='text-xs'>
											{key}: {typeof value === 'string' ? value.slice(0, 20) + (value.length > 20 ? '...' : '') : '...'}
										</Badge>
									))}
								{Object.keys(subjectInfo).length > 4 && (
									<Badge variant='outline' className='text-xs'>
										+{Object.keys(subjectInfo).length - 4} more
									</Badge>
								)}
							</div>
						</div>
					)}
				</div>
			</CardContent>

			{/* Credential Details Modal */}
			<Dialog open={showDetails} onOpenChange={setShowDetails}>
				<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Credential Details</DialogTitle>
						<DialogDescription>Complete information about this verifiable credential</DialogDescription>
					</DialogHeader>
					<CredentialViewer credential={credential} />
				</DialogContent>
			</Dialog>

			{/* Revoke Credential Modal */}
			<RevokeCredentialModal
				isOpen={showRevokeModal}
				credential={credential}
				onClose={() => setShowRevokeModal(false)}
				onRevoked={(credentialId) => {
					onRevoke?.(credentialId)
					setShowRevokeModal(false)
				}}
			/>
		</Card>
	)
}
