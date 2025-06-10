'use client'

import React from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Settings, ShieldCheck, KeyRound, FileText} from 'lucide-react'
import Link from 'next/link'

export default function OAuth2AdvancedPage() {
	return (
		<div className='container mx-auto p-6'>
			<div className='mb-6'>
				<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>OAuth2 Advanced Settings</h1>
				<p className='text-gray-600 dark:text-gray-400 mt-2'>
					Manage advanced OAuth2 configurations, scopes, tokens, and audit logs.
				</p>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{/* Manage Scopes Card */}
				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader>
						<div className='flex items-center space-x-2'>
							<ShieldCheck className='h-6 w-6 text-blue-600' />
							<CardTitle>Manage Scopes</CardTitle>
						</div>
						<CardDescription>
							Define and manage OAuth2 scopes for your applications.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href='/dashboard/oauth2/scopes'>
							<Button className='w-full'>
								Manage Scopes
							</Button>
						</Link>
					</CardContent>
				</Card>

				{/* Token Management Card */}
				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader>
						<div className='flex items-center space-x-2'>
							<KeyRound className='h-6 w-6 text-green-600' />
							<CardTitle>Token Management</CardTitle>
						</div>
						<CardDescription>
							View and manage active OAuth2 tokens and sessions.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href='/dashboard/oauth2/tokens'>
							<Button className='w-full'>
								Manage Tokens
							</Button>
						</Link>
					</CardContent>
				</Card>

				{/* Audit Logs Card */}
				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader>
						<div className='flex items-center space-x-2'>
							<FileText className='h-6 w-6 text-purple-600' />
							<CardTitle>Audit Logs</CardTitle>
						</div>
						<CardDescription>
							View OAuth2 authentication and authorization audit logs.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href='/dashboard/oauth2/audit'>
							<Button className='w-full'>
								View Audit Logs
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

			{/* Additional Settings Section */}
			<div className='mt-8'>
				<Card>
					<CardHeader>
						<div className='flex items-center space-x-2'>
							<Settings className='h-6 w-6 text-gray-600' />
							<CardTitle>Advanced Configuration</CardTitle>
						</div>
						<CardDescription>
							Advanced OAuth2 server configuration and settings.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='p-4 border rounded-lg'>
									<h3 className='font-semibold mb-2'>Token Expiration</h3>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Configure default token expiration times.
									</p>
								</div>
								<div className='p-4 border rounded-lg'>
									<h3 className='font-semibold mb-2'>Security Policies</h3>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Manage OAuth2 security policies and restrictions.
									</p>
								</div>
							</div>
							<p className='text-sm text-gray-500 dark:text-gray-400'>
								These advanced settings require system administrator privileges.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}