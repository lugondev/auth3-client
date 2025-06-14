'use client'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {MoreHorizontal, Copy, Eye, Trash2, Power} from 'lucide-react'
import {DIDResponse, DIDStatus} from '@/types/did'
import {toast} from 'sonner'
import {DIDStatusBadge} from './DIDStatusBadge'

interface DIDCardProps {
	did: DIDResponse
	onView?: (did: DIDResponse) => void
	onDeactivate?: (did: DIDResponse) => void
	onRevoke?: (did: DIDResponse) => void
	onDelete?: (did: DIDResponse) => void
}

/**
 * DIDCard component displays DID information in a card format
 * with quick actions for management operations
 */
export function DIDCard({did, onView, onDeactivate, onRevoke, onDelete}: DIDCardProps) {
	// Extract DID method from the DID string
	const getMethodFromDID = (didString: string): string => {
		const parts = didString.split(':')
		return parts.length >= 2 ? parts[1] : 'unknown'
	}

	// Copy DID to clipboard
	const handleCopyDID = async () => {
		try {
			await navigator.clipboard.writeText(did.did)
			toast.success('DID copied to clipboard')
		} catch {
			toast.error('Failed to copy DID')
		}
	}

	// Format date for display
	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	// Truncate DID for display
	const truncateDID = (didString: string, maxLength: number = 40): string => {
		if (didString.length <= maxLength) return didString
		return `${didString.substring(0, maxLength)}...`
	}

	return (
		<Card className='hover:shadow-md transition-shadow'>
			<CardHeader className='pb-3'>
				<div className='flex items-start justify-between'>
					<div className='space-y-1'>
						<CardTitle className='text-lg font-semibold'>DID {getMethodFromDID(did.did).toUpperCase()}</CardTitle>
						<CardDescription className='font-mono text-sm'>{truncateDID(did.did)}</CardDescription>
					</div>
					<div className='flex items-center gap-2'>
						<DIDStatusBadge status={did.status as DIDStatus} />
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
									<MoreHorizontal className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem onClick={() => onView?.(did)}>
									<Eye className='mr-2 h-4 w-4' />
									View Details
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleCopyDID}>
									<Copy className='mr-2 h-4 w-4' />
									Copy DID
								</DropdownMenuItem>
								{did.status === 'active' && (
									<DropdownMenuItem onClick={() => onDeactivate?.(did)}>
										<Power className='mr-2 h-4 w-4' />
										Deactivate
									</DropdownMenuItem>
								)}
								{did.status !== 'revoked' && (
									<DropdownMenuItem onClick={() => onRevoke?.(did)} className='text-destructive'>
										<Trash2 className='mr-2 h-4 w-4' />
										Revoke
									</DropdownMenuItem>
								)}
								<DropdownMenuItem onClick={() => onDelete?.(did)} className='text-destructive'>
									<Trash2 className='mr-2 h-4 w-4' />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className='space-y-2'>
					<div className='flex justify-between text-sm'>
						<span className='text-muted-foreground'>Method:</span>
						<Badge variant='outline'>{did.method}</Badge>
					</div>
					<div className='flex justify-between text-sm'>
						<span className='text-muted-foreground'>Created:</span>
						<span>{formatDate(did.created_at)}</span>
					</div>
					{did.updated_at !== did.created_at && (
						<div className='flex justify-between text-sm'>
							<span className='text-muted-foreground'>Updated:</span>
							<span>{formatDate(did.updated_at)}</span>
						</div>
					)}
					{did.document.verificationMethod && (
						<div className='flex justify-between text-sm'>
							<span className='text-muted-foreground'>Verification Methods:</span>
							<span>{did.document.verificationMethod.length}</span>
						</div>
					)}
					{did.document.service && (
						<div className='flex justify-between text-sm'>
							<span className='text-muted-foreground'>Service Endpoints:</span>
							<span>{did.document.service.length}</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
