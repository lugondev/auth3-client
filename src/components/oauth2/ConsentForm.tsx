'use client'

import React from 'react'
import Image from 'next/image'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {AlertTriangle, Shield, CheckCircle} from 'lucide-react'
import {ConsentDetails, SCOPE_DESCRIPTIONS} from '@/types/oauth2-consent'

interface ConsentFormProps {
	consentDetails: ConsentDetails
	onConsent: (action: 'allow' | 'deny') => void
	loading: boolean
}

export const ConsentForm: React.FC<ConsentFormProps> = ({consentDetails, onConsent, loading}) => {
	const getScopeInfo = (scope: string) => {
		return (
			SCOPE_DESCRIPTIONS[scope] || {
				scope,
				description: `Access ${scope} permissions`,
				icon: '🔑',
				sensitive: true,
			}
		)
	}

	const hasSensitiveScopes = consentDetails.requestedScopes.some((scope) => getScopeInfo(scope).sensitive)

	return (
		<Card className='w-full max-w-md mx-auto'>
			<CardHeader className='text-center'>
				<div className='flex justify-center mb-4'>
					{consentDetails.clientLogoUri ? (
						<Image src={consentDetails.clientLogoUri} alt={`${consentDetails.clientName} logo`} width={64} height={64} className='rounded-lg object-cover' />
					) : (
						<div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
							<span className='text-white text-2xl font-bold'>{consentDetails.clientName.charAt(0).toUpperCase()}</span>
						</div>
					)}
				</div>

				<CardTitle className='text-xl font-semibold'>Grant Access to {consentDetails.clientName}</CardTitle>

				<p className='text-sm text-muted-foreground mt-2'>This application is requesting access to your account. Review the permissions below.</p>
			</CardHeader>

			<CardContent className='space-y-6'>
				{/* Security Notice */}
				{hasSensitiveScopes && (
					<div className='bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3'>
						<div className='flex items-center space-x-2'>
							<AlertTriangle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
							<span className='text-sm font-medium text-amber-800 dark:text-amber-200'>This app is requesting sensitive information</span>
						</div>
						<p className='text-xs text-amber-700 dark:text-amber-300 mt-1'>Please review all permissions carefully before granting access.</p>
					</div>
				)}

				{/* Permissions List */}
				<div className='space-y-3'>
					<h3 className='text-sm font-medium flex items-center space-x-2 text-foreground'>
						<Shield className='h-4 w-4' />
						<span>Permissions Requested</span>
					</h3>

					<div className='space-y-2'>
						{consentDetails.requestedScopes.map((scope) => {
							const scopeInfo = getScopeInfo(scope)
							return (
								<div key={scope} className='flex items-center space-x-3 p-3 bg-muted rounded-lg'>
									<div className='text-lg'>{scopeInfo.icon}</div>
									<div className='flex-1'>
										<div className='flex items-center space-x-2'>
											<span className='font-medium text-sm text-foreground'>{scopeInfo.scope}</span>
											{scopeInfo.sensitive && (
												<Badge variant='outline' className='text-xs'>
													Sensitive
												</Badge>
											)}
										</div>
										<p className='text-xs text-muted-foreground'>{scopeInfo.description}</p>
									</div>
									<CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
								</div>
							)
						})}
					</div>
				</div>

				<Separator />

				{/* Security Information */}
				<div className='text-xs text-muted-foreground space-y-1'>
					<p>• You can revoke this access at any time in your account settings</p>
					<p>• This application will only access the permissions you approve</p>
					<p>• Your data will be handled according to our privacy policy</p>
				</div>

				{/* Action Buttons */}
				<div className='flex space-x-3'>
					<Button variant='outline' className='flex-1' onClick={() => onConsent('deny')} disabled={loading}>
						Deny
					</Button>
					<Button className='flex-1' onClick={() => onConsent('allow')} disabled={loading}>
						{loading ? 'Processing...' : 'Allow Access'}
					</Button>
				</div>

				{/* Debug Information (Development) */}
				{process.env.NODE_ENV === 'development' && (
					<details className='text-xs text-muted-foreground'>
						<summary className='cursor-pointer'>Debug Info</summary>
						<pre className='mt-2 p-2 bg-muted rounded text-xs overflow-x-auto'>{JSON.stringify(consentDetails, null, 2)}</pre>
					</details>
				)}
			</CardContent>
		</Card>
	)
}
