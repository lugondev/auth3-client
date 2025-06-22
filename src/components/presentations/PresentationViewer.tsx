'use client'

import {useState} from 'react'
import {ChevronDown, ChevronRight, Copy, Shield, FileText, Link, Hash} from 'lucide-react'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible'
import {ScrollArea} from '@/components/ui/scroll-area'

import {VerifiablePresentation, PresentationStatus} from '@/types/presentations'
import type {VerifiableCredential} from '@/types/credentials'

interface PresentationViewerProps {
	presentation: VerifiablePresentation
	status?: PresentationStatus
	showCredentials?: boolean
	className?: string
}

/**
 * PresentationViewer Component - Displays detailed presentation data
 *
 * Features:
 * - Structured presentation data display
 * - Collapsible sections for better organization
 * - Credential preview within presentation
 * - JSON raw data view
 * - Copy functionality for various fields
 * - Status indicators
 */
export function PresentationViewer({presentation, status, showCredentials = true, className = ''}: PresentationViewerProps) {
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		basic: true,
		credentials: true,
		proof: false,
		context: false,
		raw: false,
	})

	const toggleSection = (section: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}))
	}

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast.success(`${label} copied to clipboard`)
		} catch {
			toast.error('Failed to copy to clipboard')
		}
	}

	const getCredentials = (): VerifiableCredential[] => {
		if (!presentation.verifiableCredential) return []

		if (Array.isArray(presentation.verifiableCredential)) {
			return presentation.verifiableCredential
		}

		return [presentation.verifiableCredential]
	}

	const credentials = getCredentials()

	const formatDateTime = (dateString: string) => {
		try {
			return new Date(dateString).toLocaleString()
		} catch {
			return dateString
		}
	}

	const getStatusColor = (status?: PresentationStatus) => {
		switch (status) {
			case PresentationStatus.DRAFT:
				return 'bg-gray-100 text-gray-800'
			case PresentationStatus.PENDING:
				return 'bg-yellow-100 text-yellow-800'
			case PresentationStatus.SUBMITTED:
				return 'bg-blue-100 text-blue-800'
			case PresentationStatus.VERIFIED:
				return 'bg-green-100 text-green-800'
			case PresentationStatus.REJECTED:
				return 'bg-red-100 text-red-800'
			case PresentationStatus.EXPIRED:
				return 'bg-orange-100 text-orange-800'
			case PresentationStatus.REVOKED:
				return 'bg-red-100 text-red-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Status Badge */}
			{status && (
				<div className='flex justify-center'>
					<Badge className={`${getStatusColor(status)} border-0`}>
						<Shield className='h-3 w-3 mr-1' />
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</Badge>
				</div>
			)}

			{/* Basic Information */}
			<Card>
				<Collapsible open={expandedSections.basic} onOpenChange={() => toggleSection('basic')}>
					<CollapsibleTrigger asChild>
						<CardHeader className='cursor-pointer hover:bg-muted/50 transition-colors'>
							<CardTitle className='flex items-center justify-between'>
								<span className='flex items-center gap-2'>
									<FileText className='h-5 w-5' />
									Basic Information
								</span>
								{expandedSections.basic ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
							</CardTitle>
						</CardHeader>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<CardContent className='pt-0'>
							<div className='space-y-4'>
								{/* ID */}
								<div className='flex items-center justify-between'>
									<span className='text-sm font-medium'>ID:</span>
									<div className='flex items-center gap-2'>
										<span className='text-sm font-mono bg-muted px-2 py-1 rounded'>{presentation.id || 'N/A'}</span>
										{presentation.id && (
											<Button variant='ghost' size='sm' onClick={() => copyToClipboard(presentation.id, 'Presentation ID')}>
												<Copy className='h-3 w-3' />
											</Button>
										)}
									</div>
								</div>

								{/* Holder */}
								<div className='flex items-center justify-between'>
									<span className='text-sm font-medium'>Holder:</span>
									<div className='flex items-center gap-2'>
										<span className='text-sm font-mono bg-muted px-2 py-1 rounded max-w-xs truncate'>{presentation.holder || 'N/A'}</span>
										{presentation.holder && (
											<Button variant='ghost' size='sm' onClick={() => copyToClipboard(presentation.holder, 'Holder DID')}>
												<Copy className='h-3 w-3' />
											</Button>
										)}
									</div>
								</div>

								{/* Type */}
								<div className='flex items-center justify-between'>
									<span className='text-sm font-medium'>Type:</span>
									<div className='flex flex-wrap gap-1'>
										{Array.isArray(presentation.type) ? (
											presentation.type.map((type) => (
												<Badge key={type} variant='outline' className='text-xs'>
													{type}
												</Badge>
											))
										) : (
											<Badge variant='outline' className='text-xs'>
												{presentation.type}
											</Badge>
										)}
									</div>
								</div>

								{/* Challenge & Domain */}
								{(presentation.challenge || presentation.domain) && (
									<>
										{presentation.challenge && (
											<div className='flex items-center justify-between'>
												<span className='text-sm font-medium'>Challenge:</span>
												<div className='flex items-center gap-2'>
													<span className='text-sm font-mono bg-muted px-2 py-1 rounded max-w-xs truncate'>{presentation.challenge}</span>
													<Button variant='ghost' size='sm' onClick={() => copyToClipboard(presentation.challenge!, 'Challenge')}>
														<Copy className='h-3 w-3' />
													</Button>
												</div>
											</div>
										)}
										{presentation.domain && (
											<div className='flex items-center justify-between'>
												<span className='text-sm font-medium'>Domain:</span>
												<div className='flex items-center gap-2'>
													<span className='text-sm font-mono bg-muted px-2 py-1 rounded max-w-xs truncate'>{presentation.domain}</span>
													<Button variant='ghost' size='sm' onClick={() => copyToClipboard(presentation.domain!, 'Domain')}>
														<Copy className='h-3 w-3' />
													</Button>
												</div>
											</div>
										)}
									</>
								)}
							</div>
						</CardContent>
					</CollapsibleContent>
				</Collapsible>
			</Card>

			{/* Credentials */}
			{showCredentials && credentials.length > 0 && (
				<Card>
					<Collapsible open={expandedSections.credentials} onOpenChange={() => toggleSection('credentials')}>
						<CollapsibleTrigger asChild>
							<CardHeader className='cursor-pointer hover:bg-muted/50 transition-colors'>
								<CardTitle className='flex items-center justify-between'>
									<span className='flex items-center gap-2'>
										<Shield className='h-5 w-5' />
										Verifiable Credentials ({credentials.length})
									</span>
									{expandedSections.credentials ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
								</CardTitle>
							</CardHeader>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<CardContent className='pt-0'>
								<div className='space-y-4'>
									{credentials.map((credential, index) => (
										<Card key={credential.id || index} className='border-muted'>
											<CardHeader className='pb-2'>
												<div className='flex items-center justify-between'>
													<div className='flex items-center gap-2'>
														<Badge variant='secondary' className='text-xs'>
															#{index + 1}
														</Badge>
														<span className='text-sm font-medium'>{credential.id ? `${credential.id.slice(0, 20)}...` : `Credential ${index + 1}`}</span>
													</div>
													{credential.id && (
														<Button variant='ghost' size='sm' onClick={() => copyToClipboard(credential.id!, 'Credential ID')}>
															<Copy className='h-3 w-3' />
														</Button>
													)}
												</div>
											</CardHeader>
											<CardContent className='pt-0'>
												<div className='space-y-2 text-sm'>
													{/* Credential Type */}
													<div className='flex items-center gap-2'>
														<span className='text-muted-foreground'>Type:</span>
														<div className='flex flex-wrap gap-1'>
															{Array.isArray(credential.type)
																? credential.type
																		.filter((t) => t !== 'VerifiableCredential')
																		.map((type) => (
																			<Badge key={type} variant='outline' className='text-xs'>
																				{type}
																			</Badge>
																		))
																: credential.type !== 'VerifiableCredential' && (
																		<Badge variant='outline' className='text-xs'>
																			{credential.type}
																		</Badge>
																  )}
														</div>
													</div>

													{/* Issuer */}
													{credential.issuer && (
														<div className='flex items-center gap-2'>
															<span className='text-muted-foreground'>Issuer:</span>
															<span className='font-mono text-xs bg-muted px-2 py-1 rounded max-w-xs truncate'>{typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id}</span>
														</div>
													)}

													{/* Dates */}
													{credential.issuanceDate && (
														<div className='flex items-center gap-2'>
															<span className='text-muted-foreground'>Issued:</span>
															<span className='text-xs'>{formatDateTime(credential.issuanceDate)}</span>
														</div>
													)}
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</CardContent>
						</CollapsibleContent>
					</Collapsible>
				</Card>
			)}

			{/* Proof */}
			{presentation.proof && (
				<Card>
					<Collapsible open={expandedSections.proof} onOpenChange={() => toggleSection('proof')}>
						<CollapsibleTrigger asChild>
							<CardHeader className='cursor-pointer hover:bg-muted/50 transition-colors'>
								<CardTitle className='flex items-center justify-between'>
									<span className='flex items-center gap-2'>
										<Hash className='h-5 w-5' />
										Cryptographic Proof
									</span>
									{expandedSections.proof ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
								</CardTitle>
							</CardHeader>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<CardContent className='pt-0'>
								<ScrollArea className='h-40'>
									<pre className='text-xs bg-muted p-3 rounded overflow-x-auto'>{JSON.stringify(presentation.proof, null, 2)}</pre>
								</ScrollArea>
							</CardContent>
						</CollapsibleContent>
					</Collapsible>
				</Card>
			)}

			{/* Context */}
			<Card>
				<Collapsible open={expandedSections.context} onOpenChange={() => toggleSection('context')}>
					<CollapsibleTrigger asChild>
						<CardHeader className='cursor-pointer hover:bg-muted/50 transition-colors'>
							<CardTitle className='flex items-center justify-between'>
								<span className='flex items-center gap-2'>
									<Link className='h-5 w-5' />
									JSON-LD Context
								</span>
								{expandedSections.context ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
							</CardTitle>
						</CardHeader>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<CardContent className='pt-0'>
							<div className='space-y-2'>
								{presentation['@context'].map((context, index) => (
									<div key={index} className='flex items-center justify-between'>
										<span className='text-sm font-mono bg-muted px-2 py-1 rounded flex-1 mr-2 truncate'>{context}</span>
										<Button variant='ghost' size='sm' onClick={() => copyToClipboard(context, `Context ${index + 1}`)}>
											<Copy className='h-3 w-3' />
										</Button>
									</div>
								))}
							</div>
						</CardContent>
					</CollapsibleContent>
				</Collapsible>
			</Card>

			{/* Raw JSON Data */}
			<Card>
				<Collapsible open={expandedSections.raw} onOpenChange={() => toggleSection('raw')}>
					<CollapsibleTrigger asChild>
						<CardHeader className='cursor-pointer hover:bg-muted/50 transition-colors'>
							<CardTitle className='flex items-center justify-between'>
								<span className='flex items-center gap-2'>
									<FileText className='h-5 w-5' />
									Raw JSON Data
								</span>
								<div className='flex items-center gap-2'>
									<Button variant='ghost' size='sm' onClick={() => copyToClipboard(JSON.stringify(presentation, null, 2), 'Presentation JSON')}>
										<Copy className='h-3 w-3' />
									</Button>
									{expandedSections.raw ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
								</div>
							</CardTitle>
						</CardHeader>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<CardContent className='pt-0'>
							<ScrollArea className='h-96'>
								<pre className='text-xs bg-muted p-3 rounded overflow-x-auto'>{JSON.stringify(presentation, null, 2)}</pre>
							</ScrollArea>
						</CardContent>
					</CollapsibleContent>
				</Collapsible>
			</Card>
		</div>
	)
}
