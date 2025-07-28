import React from 'react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible'
import {Copy, Download, ExternalLink, Trash2, Eye, EyeOff, ChevronDown, ChevronRight} from 'lucide-react'

import {CredentialWithStatusInfo} from '../helpers/credential-helpers'
import {formatDate} from '@/lib/utils'

interface CollapsibleCredentialCardProps {
	credential: CredentialWithStatusInfo
	isCollapsed: boolean
	showProof: boolean
	onToggleCollapse: () => void
	onViewCredential: () => void
	onCopyId: () => void
	onDownload: () => void
	onRevoke: () => void
	onToggleProof: () => void
	getCredentialStatus: (vc: CredentialWithStatusInfo) => string
	formatIssuer: (issuer: string | {id: string; name?: string}) => string
}

export function CollapsibleCredentialCard({credential, isCollapsed, showProof, onToggleCollapse, onViewCredential, onCopyId, onDownload, onRevoke, onToggleProof, getCredentialStatus, formatIssuer}: CollapsibleCredentialCardProps) {
	const status = getCredentialStatus(credential)
	console.log('CollapsibleCredentialCard status:', credential)

	return (
		<Card>
			<Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='space-y-1 flex-1'>
							<div className='flex items-center gap-2'>
								<CollapsibleTrigger asChild>
									<Button variant='ghost' size='sm' className='p-0 h-auto'>
										{isCollapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
									</Button>
								</CollapsibleTrigger>
								<CardTitle className='text-lg'>Verifiable Credential</CardTitle>
								<Badge variant={status === 'active' ? 'default' : 'secondary'}>{status}</Badge>
							</div>
							<p className='text-sm text-muted-foreground font-mono ml-6'>{credential.id}</p>
						</div>

						<div className='flex gap-2'>
							<Button variant='outline' size='sm' onClick={onViewCredential} title='View Details'>
								<ExternalLink className='h-4 w-4' />
							</Button>
							<Button variant='outline' size='sm' onClick={onCopyId} title='Copy ID'>
								<Copy className='h-4 w-4' />
							</Button>
							<Button variant='outline' size='sm' onClick={onDownload} title='Download JSON'>
								<Download className='h-4 w-4' />
							</Button>
							{status === 'active' && (
								<Button variant='outline' size='sm' onClick={onRevoke} className='text-red-600 hover:text-red-700 hover:bg-red-50' title='Revoke Credential'>
									<Trash2 className='h-4 w-4' />
								</Button>
							)}
						</div>
					</div>
				</CardHeader>

				<CollapsibleContent>
					<CardContent className='space-y-4'>
						{/* Credential Types */}
						<div>
							<Label className='text-sm font-medium'>Credential Types</Label>
							<div className='flex flex-wrap gap-2 mt-1'>
								{credential.type.map((type) => (
									<Badge key={type} variant='outline'>
										{type}
									</Badge>
								))}
							</div>
						</div>

						{/* Basic Info */}
						<div className='grid grid-cols-1 gap-4 text-sm'>
							<div>
								<Label className='text-xs text-muted-foreground'>Issuer DID</Label>
								<p className='font-mono'>{formatIssuer(credential.issuer)}</p>
							</div>
							<div>
								<Label className='text-xs text-muted-foreground'>Subject DID</Label>
								<p className='font-mono'>{credential.subjectDID || 'Unknown'}</p>
							</div>
							<div>
								<Label className='text-xs text-muted-foreground'>Issued at</Label>
								<p>{formatDate(credential.issuedAt)}</p>
							</div>
							<div>
								<Label className='text-xs text-muted-foreground'>Expires</Label>
								<p>{credential.expirationDate ? formatDate(credential.expirationDate) : 'Never'}</p>
							</div>
						</div>

						{/* Credential Subject */}
						<div>
							<Label className='text-sm font-medium'>Credential Subject</Label>
							<div className='mt-1'>
								<pre className='pre-code-json'>{JSON.stringify(credential.credentialSubject, null, 2)}</pre>
							</div>
						</div>

						{/* Proof */}
						{!!credential.proof && (
							<div>
								<div className='flex items-center justify-between'>
									<Label className='text-sm font-medium'>Cryptographic Proof</Label>
									<Button variant='ghost' size='sm' onClick={onToggleProof}>
										{showProof ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
									</Button>
								</div>
								<div className='mt-1'>
									{showProof ? (
										<pre className='pre-code-json'>{JSON.stringify(credential.proof, null, 2)}</pre>
									) : (
										<div className='bg-gray-50 p-3 rounded-md border'>
											<p className='text-xs text-gray-600'>Proof hidden for security - click to reveal</p>
										</div>
									)}
								</div>
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	)
}
