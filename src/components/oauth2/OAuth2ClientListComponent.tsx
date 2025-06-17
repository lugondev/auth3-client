'use client'

import React, {useState, useEffect} from 'react'
import Link from 'next/link'
import {listClients} from '@/services/oauth2Service'
import {ClientInfo} from '@/types/oauth2'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Badge} from '@/components/ui/badge'
import {Edit, Trash2, Key, Globe, Lock, Unlock, Calendar, Plus} from 'lucide-react'
import {PermissionButton} from '@/components/guards'
import {PermissionTooltip} from '@/components/permissions'

/**
 * Component for displaying a list of OAuth2 clients
 */
const OAuth2ClientListComponent: React.FC = () => {
	const [clients, setClients] = useState<ClientInfo[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	useEffect(() => {
		const fetchClients = async () => {
			try {
				const response = await listClients()
				setClients(response.clients)
				setLoading(false)
			} catch (err: unknown) {
				interface ErrorWithMessage {
					message: string
				}
				const getErrorMessage = (error: unknown): string => {
					if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as ErrorWithMessage).message === 'string') {
						return (error as ErrorWithMessage).message
					}
					return 'Failed to fetch OAuth2 clients'
				}
				const message = err instanceof Error ? err.message : getErrorMessage(err)
				setError(message || 'Failed to fetch OAuth2 clients')
				setLoading(false)
			}
		}

		fetchClients()
	}, [])

	// This function can be called from parent components to refresh the client list
	const refreshClientList = async () => {
		setLoading(true)
		try {
			const response = await listClients()
			setClients(response.clients)
			setLoading(false)
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to fetch OAuth2 clients'
			setError(message)
			setLoading(false)
		}
	}

	// Function to set success message that can be called from parent
	const setSuccess = (message: string) => {
		setSuccessMessage(message)
		// Auto-clear message after 5 seconds
		setTimeout(() => setSuccessMessage(null), 5000)
	}

	if (loading) {
		return (
			<CardContent>
				<div>Loading OAuth2 Clients...</div>
			</CardContent>
		)
	}

	if (error) {
		return (
			<CardContent>
				<Alert variant='destructive'>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</CardContent>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>OAuth2 Clients</h2>
					<p className='text-muted-foreground'>Manage your OAuth2 applications and their configurations</p>
				</div>
				<Button asChild>
					<Link href='/dashboard/oauth2/create'>
						<Plus className='mr-2 h-4 w-4' />
						New Client
					</Link>
				</Button>
			</div>

			{successMessage && (
				<Alert>
					<AlertDescription>{successMessage}</AlertDescription>
				</Alert>
			)}

			{clients.length === 0 ? (
				<Card className='text-center py-12'>
					<CardContent>
						<Globe className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
						<h3 className='text-lg font-medium text-muted-foreground mb-2'>No OAuth2 clients found</h3>
						<p className='text-sm text-muted-foreground mb-6'>Create your first OAuth2 client to get started with application integration.</p>
						<Button asChild>
							<Link href='/dashboard/oauth2/create'>Create OAuth2 Client</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{clients.map((client) => (
						<Card key={client.client_id} className='hover:shadow-md transition-shadow'>
							<CardHeader className='pb-3'>
								<div className='flex items-start justify-between'>
									<div className='space-y-2'>
										<CardTitle className='text-lg font-semibold line-clamp-1' title={client.name}>
											{client.name}
										</CardTitle>
										<div className='space-y-1'>
											<div className='flex items-center gap-2 text-sm text-muted-foreground'>
												<Key className='h-3 w-3' />
												<code className='bg-muted px-1.5 py-0.5 rounded text-xs font-mono' title={client.client_id}>
													{client.client_id.slice(0, 8)}...
												</code>
											</div>
											<div className='flex items-center gap-2 text-sm text-muted-foreground'>
												<Calendar className='h-3 w-3' />
												<span>{new Date(client.created_at).toLocaleDateString()}</span>
											</div>
										</div>
									</div>
									<div className='flex flex-col gap-1'>
										<Badge variant={client.is_public ? 'secondary' : 'outline'} className='text-xs'>
											{client.is_public ? [<Unlock key='icon' className='mr-1 h-3 w-3' />, 'Public'] : [<Lock key='icon' className='mr-1 h-3 w-3' />, 'Private']}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent className='pt-0'>
								<div className='flex gap-2'>
									<PermissionTooltip permission='admin:oauth2:update'>
										<PermissionButton asChild size='sm' variant='outline' className='flex-1' permission='admin:oauth2:update'>
											<Link href={`/dashboard/oauth2/${client.client_id}/edit`}>
												<Edit className='mr-1.5 h-3 w-3' />
												Edit
											</Link>
										</PermissionButton>
									</PermissionTooltip>
									<PermissionTooltip permission='admin:oauth2:delete'>
										<PermissionButton asChild size='sm' variant='outline' className='flex-1' permission='admin:oauth2:delete'>
											<Link href={`/dashboard/oauth2/${client.client_id}/delete`}>
												<Trash2 className='mr-1.5 h-3 w-3' />
												Delete
											</Link>
										</PermissionButton>
									</PermissionTooltip>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}

export default OAuth2ClientListComponent
