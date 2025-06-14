'use client'

import {useState} from 'react'
import {Copy, Eye, EyeOff, Calendar, User, Shield, FileText} from 'lucide-react'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Label} from '@/components/ui/label'
import {ScrollArea} from '@/components/ui/scroll-area'

import type {VerifiableCredential} from '@/types/credentials'

interface CredentialViewerProps {
	credential: VerifiableCredential
	className?: string
	showActions?: boolean
}

/**
 * CredentialViewer Component - Displays verifiable credential details
 *
 * Features:
 * - Formatted credential display
 * - Raw JSON view toggle
 * - Copy to clipboard
 * - Credential metadata display
 * - Subject information
 * - Issuer details
 * - Proof information
 */
export function CredentialViewer({credential, className = '', showActions = true}: CredentialViewerProps) {
	const [showRawJson, setShowRawJson] = useState(false)
	const [activeTab, setActiveTab] = useState('overview')

	// Copy credential to clipboard
	const copyCredential = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(credential, null, 2))
			toast.success('Credential copied to clipboard')
		} catch (error) {
			console.log('Error copying credential to clipboard', error)
			toast.error('Failed to copy credential')
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

	const issuerInfo = getIssuerInfo()
	const subjectInfo = getSubjectInfo()
	const credentialTypes = getCredentialTypes()

	return (
		<Card className={className}>
			<CardHeader>
				<div className='flex items-start justify-between'>
					<div className='space-y-2'>
						<CardTitle className='flex items-center gap-2'>
							<FileText className='h-5 w-5' />
							Verifiable Credential
						</CardTitle>
						<CardDescription>{credentialTypes.length > 0 ? credentialTypes.join(', ') : 'Standard Credential'}</CardDescription>
					</div>

					{showActions && (
						<div className='flex gap-2'>
							<Button variant='outline' size='sm' onClick={() => setShowRawJson(!showRawJson)}>
								{showRawJson ? (
									<>
										<EyeOff className='h-4 w-4 mr-2' />
										Hide JSON
									</>
								) : (
									<>
										<Eye className='h-4 w-4 mr-2' />
										Show JSON
									</>
								)}
							</Button>
							<Button variant='outline' size='sm' onClick={copyCredential}>
								<Copy className='h-4 w-4 mr-2' />
								Copy
							</Button>
						</div>
					)}
				</div>

				{/* Credential Types */}
				{credentialTypes.length > 0 && (
					<div className='flex flex-wrap gap-2'>
						{credentialTypes.map((type, index) => (
							<Badge key={index} variant='secondary'>
								{type}
							</Badge>
						))}
					</div>
				)}
			</CardHeader>

			<CardContent>
				{showRawJson ? (
					<div className='space-y-4'>
						<Label className='text-sm font-medium'>Raw JSON</Label>
						<ScrollArea className='h-96 w-full rounded-md border'>
							<pre className='p-4 text-sm font-mono'>{JSON.stringify(credential, null, 2)}</pre>
						</ScrollArea>
					</div>
				) : (
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className='grid w-full grid-cols-4'>
							<TabsTrigger value='overview'>Overview</TabsTrigger>
							<TabsTrigger value='subject'>Subject</TabsTrigger>
							<TabsTrigger value='issuer'>Issuer</TabsTrigger>
							<TabsTrigger value='proof'>Proof</TabsTrigger>
						</TabsList>

						<TabsContent value='overview' className='space-y-4 mt-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								{/* Basic Information */}
								<div className='space-y-3'>
									<div>
										<Label className='text-sm font-medium text-muted-foreground'>Credential ID</Label>
										<p className='text-sm font-mono break-all'>{credential.id || 'Not specified'}</p>
									</div>

									{credential.issuanceDate && (
										<div>
											<Label className='text-sm font-medium text-muted-foreground'>Issued</Label>
											<div className='flex items-center gap-2'>
												<Calendar className='h-4 w-4 text-muted-foreground' />
												<p className='text-sm'>{formatDate(credential.issuanceDate)}</p>
											</div>
										</div>
									)}

									{credential.expirationDate && (
										<div>
											<Label className='text-sm font-medium text-muted-foreground'>Expires</Label>
											<div className='flex items-center gap-2'>
												<Calendar className='h-4 w-4 text-muted-foreground' />
												<p className='text-sm'>{formatDate(credential.expirationDate)}</p>
											</div>
										</div>
									)}
								</div>

								{/* Status Information */}
								<div className='space-y-3'>
									{credential.credentialStatus && (
										<div>
											<Label className='text-sm font-medium text-muted-foreground'>Status</Label>
											<div className='flex items-center gap-2'>
												<Shield className='h-4 w-4 text-muted-foreground' />
												<Badge variant='outline'>{credential.credentialStatus}</Badge>
											</div>
											{credential.credentialStatus && <p className='text-xs text-muted-foreground mt-1'>Index: {credential.credentialStatus}</p>}
										</div>
									)}

									{credential.credentialSchema && credential.credentialSchema.length > 0 && (
										<div>
											<Label className='text-sm font-medium text-muted-foreground'>Schema</Label>
											{credential.credentialSchema.map((schema, index) => (
												<div key={index} className='mb-2 last:mb-0'>
													<div className='flex items-center gap-2'>
														<FileText className='h-4 w-4 text-muted-foreground' />
														<p className='text-sm font-mono break-all'>{schema.id}</p>
													</div>
													<p className='text-xs text-muted-foreground mt-1'>Type: {schema.type}</p>
												</div>
											))}
										</div>
									)}
								</div>
							</div>

							{/* Context */}
							{credential['@context'] && (
								<div>
									<Label className='text-sm font-medium text-muted-foreground'>Context</Label>
									<div className='flex flex-wrap gap-1 mt-1'>
										{(Array.isArray(credential['@context']) ? credential['@context'] : [credential['@context']]).map((context, index) => (
											<Badge key={index} variant='outline' className='text-xs'>
												{typeof context === 'string' ? context : JSON.stringify(context)}
											</Badge>
										))}
									</div>
								</div>
							)}
						</TabsContent>

						<TabsContent value='subject' className='space-y-4 mt-6'>
							<div className='space-y-4'>
								<div className='flex items-center gap-2'>
									<User className='h-5 w-5' />
									<h3 className='text-lg font-semibold'>Credential Subject</h3>
								</div>

								{subjectInfo.id && (
									<div>
										<Label className='text-sm font-medium text-muted-foreground'>Subject ID</Label>
										<p className='text-sm font-mono break-all'>{subjectInfo.id}</p>
									</div>
								)}

								<Separator />

								{/* Subject Claims */}
								<div className='space-y-3'>
									<Label className='text-sm font-medium text-muted-foreground'>Claims</Label>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										{Object.entries(subjectInfo)
											.filter(([key]) => key !== 'id')
											.map(([key, value]) => (
												<div key={key} className='space-y-1'>
													<Label className='text-xs font-medium text-muted-foreground capitalize'>{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
													<p className='text-sm break-all'>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</p>
												</div>
											))}
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value='issuer' className='space-y-4 mt-6'>
							<div className='space-y-4'>
								<div className='flex items-center gap-2'>
									<Shield className='h-5 w-5' />
									<h3 className='text-lg font-semibold'>Issuer Information</h3>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<Label className='text-sm font-medium text-muted-foreground'>Issuer ID</Label>
										<p className='text-sm font-mono break-all'>{issuerInfo.id}</p>
									</div>

									<div>
										<Label className='text-sm font-medium text-muted-foreground'>Issuer Name</Label>
										<p className='text-sm'>{issuerInfo.name}</p>
									</div>
								</div>

								{typeof credential.issuer === 'object' && (
									<>
										<Separator />
										<div className='space-y-3'>
											<Label className='text-sm font-medium text-muted-foreground'>Additional Issuer Details</Label>
											<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
												{Object.entries(credential.issuer)
													.filter(([key]) => !['id', 'name'].includes(key))
													.map(([key, value]) => (
														<div key={key} className='space-y-1'>
															<Label className='text-xs font-medium text-muted-foreground capitalize'>{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
															<p className='text-sm break-all'>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</p>
														</div>
													))}
											</div>
										</div>
									</>
								)}
							</div>
						</TabsContent>

						<TabsContent value='proof' className='space-y-4 mt-6'>
							<div className='space-y-4'>
								<div className='flex items-center gap-2'>
									<Shield className='h-5 w-5' />
									<h3 className='text-lg font-semibold'>Cryptographic Proof</h3>
								</div>

								{credential.proof ? (
									<div className='space-y-4'>
										{Array.isArray(credential.proof) ? (
											credential.proof.map((proof, index) => (
												<Card key={index} className='p-4'>
													<div className='space-y-3'>
														<div className='flex items-center justify-between'>
															<Badge variant='outline'>Proof {index + 1}</Badge>
															<Badge>{proof.type}</Badge>
														</div>

														<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
															{Object.entries(proof).map(([key, value]) => (
																<div key={key} className='space-y-1'>
																	<Label className='text-xs font-medium text-muted-foreground capitalize'>{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
																	<p className='text-sm font-mono break-all'>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</p>
																</div>
															))}
														</div>
													</div>
												</Card>
											))
										) : (
											<Card className='p-4'>
												<div className='space-y-3'>
													<Badge>{credential.proof.type}</Badge>

													<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
														{Object.entries(credential.proof).map(([key, value]) => (
															<div key={key} className='space-y-1'>
																<Label className='text-xs font-medium text-muted-foreground capitalize'>{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
																<p className='text-sm font-mono break-all'>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</p>
															</div>
														))}
													</div>
												</div>
											</Card>
										)}
									</div>
								) : (
									<div className='text-center py-8 text-muted-foreground'>
										<Shield className='h-12 w-12 mx-auto mb-4 opacity-50' />
										<p>No cryptographic proof available</p>
									</div>
								)}
							</div>
						</TabsContent>
					</Tabs>
				)}
			</CardContent>
		</Card>
	)
}
