'use client'

import {useState} from 'react'
import {Shield, Clock, User, FileText, CheckCircle, AlertCircle, Info, Calendar, Globe} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Alert, AlertDescription} from '@/components/ui/alert'
import type {PresentationRequest} from '@/types/presentation-request'

interface PresentationRequestViewerProps {
	request: PresentationRequest
	onSubmit: () => void
	onBack: () => void
	isSubmitting?: boolean
}

export function PresentationRequestViewer({request, onSubmit, onBack, isSubmitting}: PresentationRequestViewerProps) {
	const [showDetails, setShowDetails] = useState(false)

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'active':
				return 'bg-green-100 text-green-800'
			case 'expired':
				return 'bg-red-100 text-red-800'
			case 'completed':
				return 'bg-blue-100 text-blue-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const isExpired = request.expires_at && new Date(request.expires_at) < new Date()
	const canSubmit = request.status === 'active' && !isExpired

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString()
	}

	return (
		<div className='w-full max-w-2xl mx-auto space-y-6'>
			{/* Header Card */}
			<Card>
				<CardHeader>
					<div className='flex items-start justify-between'>
						<div className='space-y-2'>
							<CardTitle className='flex items-center gap-2'>
								<Shield className='w-6 h-6 text-blue-600' />
								Presentation Request
							</CardTitle>
							<Badge className={getStatusColor(request.status)}>{request.status.toUpperCase()}</Badge>
						</div>
						<Button variant='outline' size='sm' onClick={onBack}>
							Back
						</Button>
					</div>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid gap-4'>
						<div>
							<h3 className='text-lg font-semibold'>{request.title}</h3>
							{request.description && <p className='text-muted-foreground mt-1'>{request.description}</p>}
						</div>

						<div className='flex items-center gap-4 text-sm text-muted-foreground'>
							<div className='flex items-center gap-1'>
								<User className='w-4 h-4' />
								<span>{request.verifier_name || 'Unknown Verifier'}</span>
							</div>
							<div className='flex items-center gap-1'>
								<Calendar className='w-4 h-4' />
								<span>Created: {formatDate(request.created_at)}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Status Alerts */}
			{isExpired && (
				<Alert variant='destructive'>
					<AlertCircle className='w-4 h-4' />
					<AlertDescription>This presentation request has expired on {formatDate(request.expires_at!)}</AlertDescription>
				</Alert>
			)}

			{request.status !== 'active' && (
				<Alert>
					<Info className='w-4 h-4' />
					<AlertDescription>This request is currently {request.status} and may not accept new submissions.</AlertDescription>
				</Alert>
			)}

			{/* Required Credentials */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<FileText className='w-5 h-5' />
						Required Credentials
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						{request.required_credentials.map((cred, index) => (
							<div key={index} className='p-4 border rounded-lg'>
								<div className='flex items-start justify-between'>
									<div className='space-y-2'>
										<div className='font-medium'>{cred.type || 'Credential'}</div>
										{cred.schema && <div className='text-sm text-muted-foreground'>Schema: {cred.schema}</div>}
										{cred.issuer && <div className='text-sm text-muted-foreground'>Issuer: {cred.issuer}</div>}
										{cred.purpose && <div className='text-sm text-muted-foreground'>Purpose: {cred.purpose}</div>}
									</div>
									<Badge variant={cred.essential ? 'default' : 'secondary'}>{cred.essential ? 'Required' : 'Optional'}</Badge>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Details Card */}
			<Card>
				<CardHeader>
					<Button variant='ghost' className='w-full justify-between p-0 h-auto' onClick={() => setShowDetails(!showDetails)}>
						<CardTitle className='text-left'>Request Details</CardTitle>
						<span className='text-sm text-muted-foreground'>{showDetails ? 'Hide' : 'Show'}</span>
					</Button>
				</CardHeader>
				{showDetails && (
					<CardContent className='space-y-4'>
						<div className='grid gap-4 text-sm'>
							<div className='grid grid-cols-3 gap-4'>
								<div className='font-medium'>Request ID:</div>
								<div className='col-span-2 font-mono text-xs break-all'>{request.request_id}</div>
							</div>

							<div className='grid grid-cols-3 gap-4'>
								<div className='font-medium'>Verifier DID:</div>
								<div className='col-span-2 font-mono text-xs break-all'>{request.verifier_did}</div>
							</div>

							{request.purpose && (
								<div className='grid grid-cols-3 gap-4'>
									<div className='font-medium'>Purpose:</div>
									<div className='col-span-2'>{request.purpose}</div>
								</div>
							)}

							<Separator />

							{/* Time Constraints */}
							<div className='space-y-2'>
								<div className='font-medium'>Time Constraints:</div>
								<div className='pl-4 space-y-1 text-xs'>
									{request.valid_from && <div>Valid From: {formatDate(request.valid_from)}</div>}
									{request.valid_until && <div>Valid Until: {formatDate(request.valid_until)}</div>}
									{request.expires_at && <div>Expires: {formatDate(request.expires_at)}</div>}
								</div>
							</div>

							<Separator />

							{/* Verification Options */}
							<div className='space-y-2'>
								<div className='font-medium'>Verification Settings:</div>
								<div className='pl-4 space-y-1 text-xs'>
									<div className='flex items-center justify-between'>
										<span>Signature Verification:</span>
										<Badge variant={request.verification_options.verify_signature ? 'default' : 'secondary'}>{request.verification_options.verify_signature ? 'Enabled' : 'Disabled'}</Badge>
									</div>
									<div className='flex items-center justify-between'>
										<span>Expiration Check:</span>
										<Badge variant={request.verification_options.verify_expiration ? 'default' : 'secondary'}>{request.verification_options.verify_expiration ? 'Enabled' : 'Disabled'}</Badge>
									</div>
									<div className='flex items-center justify-between'>
										<span>Revocation Check:</span>
										<Badge variant={request.verification_options.verify_revocation ? 'default' : 'secondary'}>{request.verification_options.verify_revocation ? 'Enabled' : 'Disabled'}</Badge>
									</div>
								</div>
							</div>

							{/* Additional Info */}
							{((request.max_responses && request.max_responses > 0) || (request.metadata && Object.keys(request.metadata).length > 0)) && (
								<>
									<Separator />
									<div className='space-y-2'>
										{request.max_responses && request.max_responses > 0 && (
											<div className='grid grid-cols-3 gap-4'>
												<div className='font-medium'>Max Responses:</div>
												<div className='col-span-2'>
													{request.response_count} / {request.max_responses}
												</div>
											</div>
										)}

										{request.metadata && Object.keys(request.metadata).length > 0 && (
											<div className='space-y-1'>
												<div className='font-medium'>Metadata:</div>
												<pre className='pre-code-sm'>{JSON.stringify(request.metadata, null, 2)}</pre>
											</div>
										)}
									</div>
								</>
							)}
						</div>
					</CardContent>
				)}
			</Card>

			{/* Action Button */}
			<Card>
				<CardContent className='pt-6'>
					<Button onClick={onSubmit} disabled={!canSubmit || isSubmitting} className='w-full' size='lg'>
						{isSubmitting ? (
							<>
								<div className='w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin' />
								Submitting Presentation...
							</>
						) : canSubmit ? (
							<>
								<CheckCircle className='w-4 h-4 mr-2' />
								Submit Presentation
							</>
						) : (
							'Cannot Submit'
						)}
					</Button>

					{!canSubmit && <p className='text-sm text-muted-foreground text-center mt-2'>{isExpired ? 'This request has expired' : 'This request is not accepting submissions'}</p>}
				</CardContent>
			</Card>
		</div>
	)
}
