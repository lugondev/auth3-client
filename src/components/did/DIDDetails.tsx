'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Key, Globe, Shield, Clock, Copy, ExternalLink, Edit, Trash2, Download, QrCode, AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, EyeOff} from 'lucide-react'
import {DIDDocument, DIDStatus} from '@/types/did'
import {DIDStatusBadge} from './DIDStatusBadge'
import {DIDQRCode} from './DIDQRCode'
import {DIDDocumentViewer} from './DIDDocumentViewer'
import {DIDVerificationMethods} from './DIDVerificationMethods'
import {DIDServiceEndpoints} from './DIDServiceEndpoints'
import {toast} from 'sonner'
import * as didService from '@/services/didService'

interface DIDDetailsProps {
	didId: string
	onEdit?: () => void
	onDeactivate?: () => void
	onDelete?: () => void
	className?: string
}

interface DIDInfo {
	id: string
	name?: string
	document: DIDDocument
	status: DIDStatus
	method: string
	created: string
	updated: string
	resolved: string
	metadata: {
		network?: string
		blockNumber?: number
		transactionHash?: string
		gasUsed?: number
		registrar?: string
		resolver?: string
	}
	analytics: {
		resolutionCount: number
		lastResolved: string
		verificationCount: number
		lastVerified: string
	}
}

/**
 * DIDDetails component provides comprehensive information about a specific DID
 * including document, metadata, analytics, and management actions
 */
export function DIDDetails({didId, onEdit, onDeactivate, onDelete, className}: DIDDetailsProps) {
	const [didInfo, setDidInfo] = useState<DIDInfo | null>(null)
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [showRawDocument, setShowRawDocument] = useState(false)
	const [showQRCode, setShowQRCode] = useState(false)
	const [activeTab, setActiveTab] = useState('overview')

	/**
	 * Fetch DID information from the API
	 */
	const loadDIDInfo = useCallback(async () => {
		try {
			setLoading(true)

			const response = await didService.getDID(didId)
			// Transform DIDResponse to DIDInfo format
			const didInfo: DIDInfo = {
				id: response.did,
				name: response.name,
				document: response.document,
				status: response.status as DIDStatus,
				method: response.method,
				created: response.created_at,
				updated: response.updated_at,
				resolved: new Date().toISOString(),
				metadata: response.metadata || {},
				// Default analytics if not provided by API
				analytics: {
					resolutionCount: 0,
					lastResolved: new Date().toISOString(),
					verificationCount: 0,
					lastVerified: new Date().toISOString(),
				},
			}

			setDidInfo(didInfo)
		} catch (error) {
			console.error('Error loading DID information:', error)
			toast.error('Failed to load DID information')
		} finally {
			setLoading(false)
		}
	}, [didId])

	/**
	 * Load DID information
	 */
	useEffect(() => {
		loadDIDInfo()
	}, [didId, loadDIDInfo])

	/**
	 * Refresh DID information
	 */
	const refreshDIDInfo = async () => {
		try {
			setRefreshing(true)
			await loadDIDInfo()
			toast.success('DID information refreshed')
		} catch (error) {
			console.error('Error refreshing DID information:', error)
			toast.error('Failed to refresh DID information')
		} finally {
			setRefreshing(false)
		}
	}

	/**
	 * Copy text to clipboard
	 */
	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast.success(`${label} copied to clipboard`)
		} catch {
			toast.error(`Failed to copy ${label}`)
		}
	}

	/**
	 * Download DID document as JSON
	 */
	const downloadDocument = () => {
		if (!didInfo) return

		const blob = new Blob([JSON.stringify(didInfo.document, null, 2)], {
			type: 'application/json',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${didId.replace(/[^a-zA-Z0-9]/g, '_')}_document.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)

		toast.success('DID document downloaded')
	}

	/**
	 * Format date for display
	 */
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString()
	}

	/**
	 * Get method icon
	 */
	const getMethodIcon = (method: string) => {
		switch (method) {
			case 'key':
				return <Key className='h-4 w-4' />
			case 'web':
				return <Globe className='h-4 w-4' />
			case 'ethr':
				return <Shield className='h-4 w-4' />
			default:
				return <Key className='h-4 w-4' />
		}
	}

	/**
	 * Get status icon
	 */
	const getStatusIcon = (status: DIDStatus) => {
		switch (status) {
			case 'active':
				return <CheckCircle className='h-4 w-4 text-green-500' />
			case 'deactivated':
				return <XCircle className='h-4 w-4 text-red-500' />
			case 'revoked':
				return <AlertTriangle className='h-4 w-4 text-orange-500' />
			default:
				return <Clock className='h-4 w-4 text-gray-500' />
		}
	}

	if (loading) {
		return (
			<div className={`space-y-6 ${className}`}>
				<div className='animate-pulse'>
					<div className='h-8 bg-gray-200 rounded w-1/3 mb-4'></div>
					<div className='h-64 bg-gray-200 rounded'></div>
				</div>
			</div>
		)
	}

	if (!didInfo) {
		return (
			<div className={className}>
				<Alert>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>Failed to load DID information. Please try again.</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Breadcrumb */}
			<div className='flex items-center gap-2 text-sm text-muted-foreground mb-4'>
				<span>DIDs</span>
				<span>/</span>
				<span className='text-foreground font-medium'>{didInfo.name || didInfo.id.substring(0, 8) + '...'}</span>
			</div>

			{/* Header */}
			<div className='flex items-start justify-between'>
				<div className='space-y-2'>
					<div className='flex items-center gap-3'>
						{getMethodIcon(didInfo.method)}
						<h1 className='text-2xl font-bold'>{didInfo.name || 'DID Details'}</h1>
						<DIDStatusBadge status={didInfo.status} />
					</div>
					{didInfo.name && <div className='text-sm text-muted-foreground'>DID: {didInfo.id}</div>}
					<div className='flex items-center gap-2 text-sm text-muted-foreground'>
						<span>Method: {didInfo.method.toUpperCase()}</span>
						<Separator orientation='vertical' className='h-4' />
						<span>Created: {formatDate(didInfo.created)}</span>
						<Separator orientation='vertical' className='h-4' />
						<span>Updated: {formatDate(didInfo.updated)}</span>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={refreshDIDInfo} disabled={refreshing}>
						<RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
						Refresh
					</Button>

					<Dialog open={showQRCode} onOpenChange={setShowQRCode}>
						<DialogTrigger asChild>
							<Button variant='outline' size='sm'>
								<QrCode className='h-4 w-4 mr-2' />
								QR Code
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>DID QR Code</DialogTitle>
								<DialogDescription>Scan this QR code to share your DID</DialogDescription>
							</DialogHeader>
							<DIDQRCode did={didInfo.id} size={256} />
						</DialogContent>
					</Dialog>

					<Button variant='outline' size='sm' onClick={downloadDocument}>
						<Download className='h-4 w-4 mr-2' />
						Download
					</Button>

					{onEdit && (
						<Button variant='outline' size='sm' onClick={onEdit}>
							<Edit className='h-4 w-4 mr-2' />
							Edit
						</Button>
					)}

					{onDeactivate && didInfo.status === 'active' && (
						<Button variant='outline' size='sm' onClick={onDeactivate}>
							<XCircle className='h-4 w-4 mr-2' />
							Deactivate
						</Button>
					)}

					{onDelete && (
						<Button variant='destructive' size='sm' onClick={onDelete}>
							<Trash2 className='h-4 w-4 mr-2' />
							Delete
						</Button>
					)}
				</div>
			</div>

			{/* DID Identifier */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>DID Identifier</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex items-center gap-2'>
						<code className='flex-1 p-3 bg-gray-50 rounded border text-sm font-mono break-all'>{didInfo.id}</code>
						<Button variant='outline' size='sm' onClick={() => copyToClipboard(didInfo.id, 'DID')}>
							<Copy className='h-4 w-4' />
						</Button>
						<Button variant='outline' size='sm' onClick={() => window.open(`https://dev.uniresolver.io/#${didInfo.id}`, '_blank')}>
							<ExternalLink className='h-4 w-4' />
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Main Content Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid w-full grid-cols-5'>
					<TabsTrigger value='overview'>Overview</TabsTrigger>
					<TabsTrigger value='document'>Document</TabsTrigger>
					<TabsTrigger value='keys'>Keys</TabsTrigger>
					<TabsTrigger value='services'>Services</TabsTrigger>
					<TabsTrigger value='analytics'>Analytics</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value='overview' className='space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{/* Status Information */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									{getStatusIcon(didInfo.status)}
									Status Information
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-3'>
								{didInfo.name && (
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Name:</span>
										<span className='text-sm font-medium'>{didInfo.name}</span>
									</div>
								)}
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>Status:</span>
									<DIDStatusBadge status={didInfo.status} />
								</div>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>Method:</span>
									<Badge variant='outline'>{didInfo.method.toUpperCase()}</Badge>
								</div>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>Created:</span>
									<span className='text-sm'>{formatDate(didInfo.created)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>Last Updated:</span>
									<span className='text-sm'>{formatDate(didInfo.updated)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>Last Resolved:</span>
									<span className='text-sm'>{formatDate(didInfo.resolved)}</span>
								</div>
							</CardContent>
						</Card>

						{/* Metadata */}
						<Card>
							<CardHeader>
								<CardTitle>Metadata</CardTitle>
							</CardHeader>
							<CardContent className='space-y-3'>
								{didInfo.metadata.network && (
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Network:</span>
										<span className='text-sm'>{didInfo.metadata.network}</span>
									</div>
								)}
								{didInfo.metadata.blockNumber && (
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Block Number:</span>
										<span className='text-sm'>{didInfo.metadata.blockNumber.toLocaleString()}</span>
									</div>
								)}
								{didInfo.metadata.transactionHash && (
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Transaction:</span>
										<code className='text-xs bg-gray-100 px-2 py-1 rounded'>{didInfo.metadata.transactionHash.slice(0, 10)}...</code>
									</div>
								)}
								{didInfo.metadata.registrar && (
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Registrar:</span>
										<span className='text-sm'>{didInfo.metadata.registrar}</span>
									</div>
								)}
								{didInfo.metadata.resolver && (
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Resolver:</span>
										<span className='text-sm'>{didInfo.metadata.resolver}</span>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Quick Stats */}
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						<Card>
							<CardContent className='p-4'>
								<div className='text-2xl font-bold'>{didInfo.document.verificationMethod?.length || 0}</div>
								<div className='text-sm text-muted-foreground'>Verification Methods</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<div className='text-2xl font-bold'>{didInfo.document.service?.length || 0}</div>
								<div className='text-sm text-muted-foreground'>Service Endpoints</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<div className='text-2xl font-bold'>{didInfo.analytics.resolutionCount}</div>
								<div className='text-sm text-muted-foreground'>Total Resolutions</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<div className='text-2xl font-bold'>{didInfo.analytics.verificationCount}</div>
								<div className='text-sm text-muted-foreground'>Verifications</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Document Tab */}
				<TabsContent value='document'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle>DID Document</CardTitle>
									<CardDescription>The complete DID document in JSON format</CardDescription>
								</div>
								<Button variant='outline' size='sm' onClick={() => setShowRawDocument(!showRawDocument)}>
									{showRawDocument ? <EyeOff className='h-4 w-4 mr-2' /> : <Eye className='h-4 w-4 mr-2' />}
									{showRawDocument ? 'Hide Raw' : 'Show Raw'}
								</Button>
							</div>
						</CardHeader>
						<CardContent>{showRawDocument ? <pre className='bg-gray-50 p-4 rounded border text-sm overflow-auto max-h-96'>{JSON.stringify(didInfo.document, null, 2)}</pre> : <DIDDocumentViewer document={didInfo.document} />}</CardContent>
					</Card>
				</TabsContent>

				{/* Keys Tab */}
				<TabsContent value='keys'>
					<DIDVerificationMethods verificationMethods={didInfo.document.verificationMethod || []} />
				</TabsContent>

				{/* Services Tab */}
				<TabsContent value='services'>
					<DIDServiceEndpoints serviceEndpoints={didInfo.document.service || []} />
				</TabsContent>

				{/* Analytics Tab */}
				<TabsContent value='analytics'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<Card>
							<CardHeader>
								<CardTitle>Resolution Analytics</CardTitle>
								<CardDescription>Statistics about DID resolution requests</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Total Resolutions:</span>
									<span className='text-2xl font-bold'>{didInfo.analytics.resolutionCount}</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Last Resolved:</span>
									<span className='text-sm'>{formatDate(didInfo.analytics.lastResolved)}</span>
								</div>
								<Separator />
								<div className='text-xs text-muted-foreground'>Resolution requests are tracked when external services or applications query your DID document.</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Verification Analytics</CardTitle>
								<CardDescription>Statistics about signature verifications</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Total Verifications:</span>
									<span className='text-2xl font-bold'>{didInfo.analytics.verificationCount}</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Last Verified:</span>
									<span className='text-sm'>{formatDate(didInfo.analytics.lastVerified)}</span>
								</div>
								<Separator />
								<div className='text-xs text-muted-foreground'>Verification events are recorded when your DID is used to verify signatures or authenticate transactions.</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}
