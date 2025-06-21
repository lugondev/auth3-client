'use client'

import React from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {CheckCircle, XCircle, Download, Copy, ExternalLink, AlertCircle, RefreshCw, ArrowLeft, Share2} from 'lucide-react'
import {toast} from 'sonner'

import {IssuedCredential} from '@/types/credentials'

interface IssueResultStepProps {
	isSuccess: boolean
	credential?: IssuedCredential
	error?: string
	onStartOver: () => void
	onDownload?: () => void
	onViewCredential?: () => void
}

export function IssueResultStep({isSuccess, credential, error, onStartOver, onDownload, onViewCredential}: IssueResultStepProps) {
	const copyCredentialId = () => {
		if (credential?.id) {
			navigator.clipboard.writeText(credential.id)
			toast.success('Credential ID copied to clipboard')
		}
	}

	const copyCredentialUrl = () => {
		if (credential?.id) {
			const url = `${window.location.origin}/credentials/${credential.id}`
			navigator.clipboard.writeText(url)
			toast.success('Credential URL copied to clipboard')
		}
	}

	const shareCredential = async () => {
		if (credential?.id && navigator.share) {
			try {
				await navigator.share({
					title: 'Verifiable Credential',
					text: `Credential: ${credential.id}`,
					url: `${window.location.origin}/credentials/${credential.id}`,
				})
			} catch {
				// User cancelled sharing
			}
		} else {
			copyCredentialUrl()
		}
	}

	if (isSuccess && credential) {
		return (
			<div className='space-y-6'>
				<div className='text-center'>
					<div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4'>
						<CheckCircle className='h-8 w-8 text-green-600' />
					</div>
					<h3 className='text-xl font-semibold text-green-700 mb-2'>Credential Issued Successfully!</h3>
					<p className='text-muted-foreground'>The verifiable credential has been created and is ready for use.</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<CheckCircle className='h-5 w-5 text-green-600' />
							Credential Details
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<span className='text-sm font-medium'>Credential ID:</span>
								<div className='flex items-center gap-2 mt-1'>
									<code className='text-sm bg-muted px-2 py-1 rounded flex-1 truncate'>{credential.id}</code>
									<Button variant='outline' size='sm' onClick={copyCredentialId} className='shrink-0'>
										<Copy className='h-4 w-4' />
									</Button>
								</div>
							</div>

							<div>
								<span className='text-sm font-medium'>Status:</span>
								<div className='mt-1'>
									<Badge variant='secondary' className='bg-green-100 text-green-800'>
										{credential.status}
									</Badge>
								</div>
							</div>

							<div>
								<span className='text-sm font-medium'>Issued Date:</span>
								<p className='text-sm text-muted-foreground'>{new Date(credential.issuedAt).toLocaleString()}</p>
							</div>

							{credential.expiresAt && (
								<div>
									<span className='text-sm font-medium'>Expires:</span>
									<p className='text-sm text-muted-foreground'>{new Date(credential.expiresAt).toLocaleString()}</p>
								</div>
							)}
						</div>

						<div>
							<span className='text-sm font-medium'>Recipient:</span>
							<p className='text-sm text-muted-foreground break-all'>{credential.recipientDid || credential.recipientEmail}</p>
						</div>

						<div>
							<span className='text-sm font-medium'>Template:</span>
							<p className='text-sm text-muted-foreground'>
								{credential.templateName} (v{credential.templateVersion})
							</p>
						</div>

						<div>
							<span className='text-sm font-medium'>Types:</span>
							<div className='flex flex-wrap gap-1 mt-1'>
								{credential.credentialTypes.map((type: string, index: number) => (
									<Badge key={index} variant='outline' className='text-xs'>
										{type}
									</Badge>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
							{onDownload && (
								<Button variant='outline' onClick={onDownload} className='flex items-center gap-2'>
									<Download className='h-4 w-4' />
									Download
								</Button>
							)}

							{onViewCredential && (
								<Button variant='outline' onClick={onViewCredential} className='flex items-center gap-2'>
									<ExternalLink className='h-4 w-4' />
									View Details
								</Button>
							)}

							<Button variant='outline' onClick={shareCredential} className='flex items-center gap-2'>
								<Share2 className='h-4 w-4' />
								Share
							</Button>

							<Button variant='outline' onClick={copyCredentialUrl} className='flex items-center gap-2'>
								<Copy className='h-4 w-4' />
								Copy URL
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Next Steps */}
				<Card>
					<CardHeader>
						<CardTitle>What's Next?</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-3 text-sm'>
							<div className='flex items-start gap-2'>
								<CheckCircle className='h-4 w-4 text-green-600 mt-0.5 shrink-0' />
								<div>
									<p className='font-medium'>Credential Delivered</p>
									<p className='text-muted-foreground'>The recipient has been notified and can access their credential.</p>
								</div>
							</div>

							<div className='flex items-start gap-2'>
								<AlertCircle className='h-4 w-4 text-blue-600 mt-0.5 shrink-0' />
								<div>
									<p className='font-medium'>Verification Ready</p>
									<p className='text-muted-foreground'>The credential can now be verified by third parties using standard protocols.</p>
								</div>
							</div>

							<div className='flex items-start gap-2'>
								<RefreshCw className='h-4 w-4 text-orange-600 mt-0.5 shrink-0' />
								<div>
									<p className='font-medium'>Monitor Status</p>
									<p className='text-muted-foreground'>Track credential usage and manage revocation if needed.</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Navigation */}
				<div className='flex justify-between'>
					<Button variant='outline' onClick={onStartOver} className='flex items-center gap-2'>
						<ArrowLeft className='h-4 w-4' />
						Issue Another Credential
					</Button>

					<Button onClick={() => (window.location.href = '/dashboard/credentials')}>View All Credentials</Button>
				</div>
			</div>
		)
	}

	// Error state
	return (
		<div className='space-y-6'>
			<div className='text-center'>
				<div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
					<XCircle className='h-8 w-8 text-red-600' />
				</div>
				<h3 className='text-xl font-semibold text-red-700 mb-2'>Credential Issuance Failed</h3>
				<p className='text-muted-foreground'>There was an error while issuing the credential. Please try again.</p>
			</div>

			<Card className='border-red-200 bg-red-50'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2 text-red-700'>
						<XCircle className='h-5 w-5' />
						Error Details
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='bg-white border border-red-200 rounded p-3'>
						<code className='text-sm text-red-600 whitespace-pre-wrap'>{error || 'An unknown error occurred while issuing the credential.'}</code>
					</div>
				</CardContent>
			</Card>

			{/* Troubleshooting */}
			<Card>
				<CardHeader>
					<CardTitle>Troubleshooting Tips</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-3 text-sm'>
						<div className='flex items-start gap-2'>
							<AlertCircle className='h-4 w-4 text-blue-600 mt-0.5 shrink-0' />
							<div>
								<p className='font-medium'>Check Your Data</p>
								<p className='text-muted-foreground'>Ensure all required fields are filled correctly and follow the expected format.</p>
							</div>
						</div>

						<div className='flex items-start gap-2'>
							<AlertCircle className='h-4 w-4 text-blue-600 mt-0.5 shrink-0' />
							<div>
								<p className='font-medium'>Verify Recipient Information</p>
								<p className='text-muted-foreground'>Make sure the recipient DID or email address is valid and accessible.</p>
							</div>
						</div>

						<div className='flex items-start gap-2'>
							<AlertCircle className='h-4 w-4 text-blue-600 mt-0.5 shrink-0' />
							<div>
								<p className='font-medium'>Network Connection</p>
								<p className='text-muted-foreground'>Check your internet connection and try again.</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Navigation */}
			<div className='flex justify-between'>
				<Button variant='outline' onClick={onStartOver} className='flex items-center gap-2'>
					<ArrowLeft className='h-4 w-4' />
					Start Over
				</Button>

				<Button variant='outline' onClick={() => window.location.reload()}>
					<RefreshCw className='h-4 w-4 mr-2' />
					Retry
				</Button>
			</div>
		</div>
	)
}
