'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {useParams} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Fingerprint, Plus, Key, Copy, Eye, EyeOff, Download, RefreshCw, Shield, AlertCircle, Trash2, ChevronDown, ChevronUp, Ban, RotateCcw} from 'lucide-react'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useToast} from '@/hooks/use-toast'
import * as tenantDIDService from '@/services/tenantDIDService'
import type {TenantDIDDocument} from '@/services/tenantDIDService'
import {formatDate} from '@/lib/utils'

export default function TenantDIDPage() {
	const params = useParams()
	const {toast} = useToast()
	const tenantId = params.tenantId as string

	const [dids, setDids] = useState<TenantDIDDocument[]>([])
	const [stats, setStats] = useState<{
		total: number
		active: number
		deactivated: number
		revoked: number
		byMethod: Record<string, number>
	} | null>(null)
	const [loading, setLoading] = useState(true)
	const [showPrivateKey, setShowPrivateKey] = useState<string | null>(null)
	const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
	const [isCreating, setIsCreating] = useState(false)
	const [newDIDMethod, setNewDIDMethod] = useState('key')
	const [newKeyType, setNewKeyType] = useState('Ed25519')
	const [createDialogOpen, setCreateDialogOpen] = useState(false)

	// Confirmation modals state
	const [confirmAction, setConfirmAction] = useState<{
		type: 'deactivate' | 'revoke' | 'reactivate' | null
		didId: string | null
		isOpen: boolean
		reason: string
		isProcessing: boolean
	}>({
		type: null,
		didId: null,
		isOpen: false,
		reason: '',
		isProcessing: false,
	})

	const [permissions, setPermissions] = useState<{
		canCreate: boolean
		canRead: boolean
		canUpdate: boolean
		canDelete: boolean
	} | null>(null)

	// Fetch DIDs and statistics
	const fetchDIDs = useCallback(async () => {
		console.log('🔍 Fetching DIDs for tenant:', tenantId)
		try {
			setLoading(true)

			// Fetch DIDs
			console.log('📡 Calling getTenantDIDs API...')
			const didsResponse = await tenantDIDService.getTenantDIDs({
				tenantId,
				page: 1,
				pageSize: 50,
			})
			console.log('📥 DIDs Response:', didsResponse)
			console.log('📥 DIDs Array:', didsResponse?.dids)

			if (didsResponse?.dids) {
				console.log('✅ Setting DIDs:', didsResponse.dids)
				setDids(didsResponse.dids)
			} else {
				console.log('❌ No DIDs data found or success=false')
				setDids([])
			}

			// Fetch stats
			console.log('📡 Calling getTenantDIDStats API...')
			const statsResponse = await tenantDIDService.getTenantDIDStats(tenantId)
			console.log('📥 Stats Response:', statsResponse)
			if (statsResponse) {
				setStats(statsResponse)
			}

			// Fetch permissions
			console.log('📡 Calling checkTenantDIDPermissions API...')
			const permissionsResponse = await tenantDIDService.checkTenantDIDPermissions(tenantId)
			console.log('📥 Permissions Response:', permissionsResponse)
			if (permissionsResponse) {
				// setPermissions({
				// 	canCreate: permissionsResponse.canCreate,
				// 	canRead: permissionsResponse.canRead,
				// 	canUpdate: permissionsResponse.canUpdate,
				// 	canDelete: permissionsResponse.canDelete,
				// })
				setPermissions({
					canCreate: true,
					canRead: true,
					canUpdate: true,
					canDelete: true,
				})
			}
		} catch (error) {
			console.error('❌ Error fetching tenant DIDs:', error)
			toast({
				title: 'Error',
				description: 'Failed to load tenant DIDs. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setLoading(false)
		}
	}, [tenantId, toast])

	useEffect(() => {
		if (tenantId) {
			fetchDIDs()
		}
	}, [fetchDIDs, tenantId])

	const toggleCardExpansion = (didId: string) => {
		setExpandedCards((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(didId)) {
				newSet.delete(didId)
			} else {
				newSet.add(didId)
			}
			return newSet
		})
	}

	// Helper functions for confirmation modals
	const openDeactivateModal = (didId: string) => {
		setConfirmAction({
			type: 'deactivate',
			didId,
			isOpen: true,
			reason: '',
			isProcessing: false,
		})
	}

	const openRevokeModal = (didId: string) => {
		setConfirmAction({
			type: 'revoke',
			didId,
			isOpen: true,
			reason: '',
			isProcessing: false,
		})
	}

	const openReactivateModal = (didId: string) => {
		setConfirmAction({
			type: 'reactivate',
			didId,
			isOpen: true,
			reason: '',
			isProcessing: false,
		})
	}

	const closeConfirmModal = () => {
		console.log('🔒 Closing confirmation modal')
		setConfirmAction({
			type: null,
			didId: null,
			isOpen: false,
			reason: '',
			isProcessing: false,
		})
	}

	const updateConfirmReason = (reason: string) => {
		setConfirmAction((prev) => ({
			...prev,
			reason,
		}))
	}

	const handleCreateDID = async () => {
		console.log('🔍 Creating DID with method:', newDIDMethod, 'for tenant:', tenantId)

		if (!permissions?.canCreate) {
			toast({
				title: 'Permission Denied',
				description: 'You do not have permission to create DIDs for this tenant.',
				variant: 'destructive',
			})
			return
		}

		// Validate inputs
		if (!newDIDMethod.trim()) {
			toast({
				title: 'Validation Error',
				description: 'Please select a DID method.',
				variant: 'destructive',
			})
			return
		}

		if (!newKeyType.trim()) {
			toast({
				title: 'Validation Error',
				description: 'Please select a key type.',
				variant: 'destructive',
			})
			return
		}

		setIsCreating(true)

		try {
			console.log('📡 Calling createTenantDID API...')
			const response = await tenantDIDService.createTenantDID({
				tenant_id: tenantId,
				method: newDIDMethod,
				key_type: newKeyType,
				capabilities: ['authentication', 'assertion'],
			})

			console.log('📥 API Response:', response)

			// Check for successful response
			if (response && (response.success === true || response.success !== false)) {
				console.log('✅ DID created successfully')

				toast({
					title: 'Success',
					description: `DID created successfully with method: ${newDIDMethod}`,
				})

				// Close dialog first to avoid any state conflicts
				setCreateDialogOpen(false)

				// Reset form to default values
				setNewDIDMethod('key')
				setNewKeyType('Ed25519')

				// Small delay before refresh to ensure modal closes smoothly
				setTimeout(async () => {
					try {
						console.log('🔄 Refreshing DID list after creation...')
						await fetchDIDs()
						console.log('✅ DID list refreshed successfully')
					} catch (refreshError) {
						console.error('❌ Error refreshing DID list:', refreshError)
						toast({
							title: 'Warning',
							description: 'DID created but failed to refresh the list. Please refresh the page.',
							variant: 'destructive',
						})
					}
				}, 200)
			} else {
				// Handle API error response
				const errorMessage = response?.message || 'Failed to create DID'
				console.error('❌ API returned error:', errorMessage)
				throw new Error(errorMessage)
			}
		} catch (error) {
			console.error('❌ Error creating DID:', error)

			// Determine error message based on error type
			let errorMessage = 'Failed to create DID. Please try again.'

			if (error instanceof Error) {
				errorMessage = error.message
			} else if (typeof error === 'string') {
				errorMessage = error
			} else if (error && typeof error === 'object') {
				const errorObj = error as Record<string, unknown>
				errorMessage = (errorObj.message as string) || (errorObj.error as string) || errorMessage
			}

			// Show user-friendly error messages for common issues
			if (errorMessage.toLowerCase().includes('network')) {
				errorMessage = 'Network error. Please check your connection and try again.'
			} else if (errorMessage.toLowerCase().includes('unauthorized')) {
				errorMessage = 'You are not authorized to perform this action.'
			} else if (errorMessage.toLowerCase().includes('tenant')) {
				errorMessage = 'Invalid tenant. Please check the tenant ID.'
			} else if (errorMessage.toLowerCase().includes('method')) {
				errorMessage = 'Invalid DID method selected. Please try a different method.'
			}

			toast({
				title: 'Error Creating DID',
				description: errorMessage,
				variant: 'destructive',
			})
		} finally {
			setIsCreating(false)
		}
	}

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast({
				title: 'Copied',
				description: 'Copied to clipboard successfully!',
			})
		} catch (error) {
			console.error('Failed to copy:', error)
		}
	}

	const downloadDIDDocument = (did: TenantDIDDocument) => {
		const blob = new Blob([JSON.stringify(did.document, null, 2)], {
			type: 'application/json',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `did-document-${did.id.split(':').pop()}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	const handleDeactivateDID = async () => {
		if (!confirmAction.didId || !permissions?.canUpdate) {
			toast({
				title: 'Permission Denied',
				description: 'You do not have permission to deactivate DIDs.',
				variant: 'destructive',
			})
			return
		}

		if (!confirmAction.reason.trim()) {
			toast({
				title: 'Reason Required',
				description: 'Please provide a reason for deactivating this DID.',
				variant: 'destructive',
			})
			return
		}

		setConfirmAction((prev) => ({...prev, isProcessing: true}))

		try {
			console.log('🔄 Deactivating DID:', confirmAction.didId, 'with reason:', confirmAction.reason)
			const response = await tenantDIDService.deactivateTenantDID(tenantId, confirmAction.didId, confirmAction.reason)
			console.log('📥 Deactivate Response:', response)

			// Check if response indicates success (could be response.success or just no error)
			if (response?.success !== false) {
				toast({
					title: 'Success',
					description: 'DID deactivated successfully!',
				})

				// Close modal first to avoid any state conflicts
				const shouldClose = true
				if (shouldClose) {
					closeConfirmModal()
					// Small delay before refresh to ensure modal closes
					setTimeout(async () => {
						await fetchDIDs()
					}, 100)
				}
			} else {
				throw new Error(response?.message || 'Failed to deactivate DID')
			}
		} catch (error) {
			console.error('❌ Error deactivating DID:', error)
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to deactivate DID. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setConfirmAction((prev) => ({...prev, isProcessing: false}))
		}
	}

	const handleRevokeDID = async () => {
		if (!confirmAction.didId || !permissions?.canDelete) {
			toast({
				title: 'Permission Denied',
				description: 'You do not have permission to revoke DIDs.',
				variant: 'destructive',
			})
			return
		}

		if (!confirmAction.reason.trim()) {
			toast({
				title: 'Reason Required',
				description: 'Please provide a reason for revoking this DID.',
				variant: 'destructive',
			})
			return
		}

		setConfirmAction((prev) => ({...prev, isProcessing: true}))

		try {
			console.log('🗑️ Revoking DID:', confirmAction.didId, 'with reason:', confirmAction.reason)
			const response = await tenantDIDService.revokeTenantDID(tenantId, confirmAction.didId, confirmAction.reason)
			console.log('📥 Revoke Response:', response)

			// Check if response indicates success (could be response.success or just no error)
			if (response?.success !== false) {
				toast({
					title: 'Success',
					description: 'DID revoked successfully!',
				})

				// Close modal first to avoid any state conflicts
				const shouldClose = true
				if (shouldClose) {
					closeConfirmModal()
					// Small delay before refresh to ensure modal closes
					setTimeout(async () => {
						await fetchDIDs()
					}, 100)
				}
			} else {
				throw new Error(response?.message || 'Failed to revoke DID')
			}
		} catch (error) {
			console.error('❌ Error revoking DID:', error)
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to revoke DID. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setConfirmAction((prev) => ({...prev, isProcessing: false}))
		}
	}

	const handleReactivateDID = async () => {
		if (!confirmAction.didId || !permissions?.canUpdate) {
			toast({
				title: 'Permission Denied',
				description: 'You do not have permission to reactivate DIDs.',
				variant: 'destructive',
			})
			return
		}

		if (!confirmAction.reason.trim()) {
			toast({
				title: 'Reason Required',
				description: 'Please provide a reason for reactivating this DID.',
				variant: 'destructive',
			})
			return
		}

		setConfirmAction((prev) => ({...prev, isProcessing: true}))

		try {
			console.log('🔄 Reactivating DID:', confirmAction.didId, 'with reason:', confirmAction.reason)

			// Call the actual reactivate API
			const response = await tenantDIDService.reactivateTenantDID(tenantId, confirmAction.didId, confirmAction.reason)
			console.log('📥 Reactivate Response:', response)

			// Check if response indicates success
			if (response?.success !== false) {
				toast({
					title: 'Success',
					description: 'DID reactivated successfully!',
				})

				// Close modal first to avoid any state conflicts
				closeConfirmModal()

				// Small delay before refresh to ensure modal closes
				setTimeout(async () => {
					try {
						await fetchDIDs()
					} catch (refreshError) {
						console.error('❌ Error refreshing DID list:', refreshError)
						toast({
							title: 'Warning',
							description: 'DID reactivated but failed to refresh the list. Please refresh the page.',
							variant: 'destructive',
						})
					}
				}, 200)
			} else {
				throw new Error(response?.message || 'Failed to reactivate DID')
			}
		} catch (error) {
			console.error('❌ Error reactivating DID:', error)
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to reactivate DID. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setConfirmAction((prev) => ({...prev, isProcessing: false}))
		}
	}

	if (loading) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='flex items-center justify-center h-64'>
					<RefreshCw className='h-8 w-8 animate-spin' />
				</div>
			</div>
		)
	}

	// Debug logging
	console.log('🎯 About to render. DIDs count:', dids.length)
	console.log('🎯 DIDs state:', dids)

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='space-y-6'>
				{/* Header */}
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold tracking-tight'>DID Management</h1>
						<p className='text-muted-foreground'>Manage Decentralized Identities for tenant: {tenantId}</p>
					</div>

					<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
						<DialogTrigger asChild>
							<Button onClick={() => setCreateDialogOpen(true)}>
								<Plus className='mr-2 h-4 w-4' />
								Create DID
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New DID</DialogTitle>
								<DialogDescription>Create a new Decentralized Identity for this tenant.</DialogDescription>
							</DialogHeader>

							<div className='space-y-4'>
								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='method'>DID Method</Label>
										<Select value={newDIDMethod} onValueChange={setNewDIDMethod}>
											<SelectTrigger>
												<SelectValue placeholder='Select a DID method' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='key'>did:key</SelectItem>
												<SelectItem value='web'>did:web</SelectItem>
												<SelectItem value='ethr'>did:ethr</SelectItem>
												<SelectItem value='vbsn'>did:vbsn</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='keyType'>Key Type</Label>
										<Select value={newKeyType} onValueChange={setNewKeyType}>
											<SelectTrigger>
												<SelectValue placeholder='Select key type' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='Ed25519'>Ed25519</SelectItem>
												<SelectItem value='secp256k1'>secp256k1</SelectItem>
												<SelectItem value='P-256'>P-256</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<Alert>
									<AlertCircle className='h-4 w-4' />
									<AlertDescription>The private key will be generated automatically and stored securely.</AlertDescription>
								</Alert>
							</div>

							<DialogFooter>
								<Button onClick={handleCreateDID} disabled={isCreating}>
									{isCreating ? (
										<>
											<RefreshCw className='mr-2 h-4 w-4 animate-spin' />
											Creating...
										</>
									) : (
										<>
											<Fingerprint className='mr-2 h-4 w-4' />
											Create DID
										</>
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				{/* Stats Cards */}
				<div className='grid gap-4 md:grid-cols-4'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Total DIDs</CardTitle>
							<Fingerprint className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{stats?.total || dids.length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Active DIDs</CardTitle>
							<Shield className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{stats?.active || dids.filter((d) => d.status === 'active').length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>DID Methods</CardTitle>
							<Key className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{stats?.byMethod ? Object.keys(stats.byMethod).length : new Set(dids.map((d) => d.method)).size}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Tenant ID</CardTitle>
							<Fingerprint className='h-4 w-4 text-blue-600' />
						</CardHeader>
						<CardContent>
							<div className='text-sm font-medium truncate'>{tenantId}</div>
						</CardContent>
					</Card>
				</div>

				{/* DID List */}
				<div className='space-y-4'>
					{dids.map((did) => {
						const isExpanded = expandedCards.has(did.id)
						return (
							<Card key={did.id}>
								<CardHeader>
									<div className='flex items-center justify-between'>
										<div className='space-y-1 flex-1'>
											<div className='flex items-center gap-2'>
												<CardTitle className='text-lg'>DID Document</CardTitle>
												<Badge variant={did.status === 'active' ? 'default' : 'secondary'}>{did.status}</Badge>
												<Badge variant='outline'>{did.method}</Badge>
											</div>
											<p className='text-sm text-muted-foreground font-mono truncate'>{did.id}</p>
											<div className='text-xs text-muted-foreground'>Created: {formatDate(did.created_at)}</div>
										</div>

										<div className='flex gap-2 items-center'>
											<Button variant='ghost' size='sm' onClick={() => toggleCardExpansion(did.id)} className='text-muted-foreground hover:text-foreground' title={isExpanded ? 'Collapse details' : 'Expand details'}>
												{isExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
											</Button>

											<div className='w-px h-6 bg-border'></div>

											<Button variant='outline' size='sm' onClick={() => copyToClipboard(did.id)} title='Copy DID to clipboard'>
												<Copy className='h-4 w-4' />
											</Button>

											<Button variant='outline' size='sm' onClick={() => downloadDIDDocument(did)} title='Download DID document'>
												<Download className='h-4 w-4' />
											</Button>

											{/* Status-based action buttons */}
											{did.status === 'active' && permissions?.canUpdate && (
												<Button variant='outline' size='sm' onClick={() => openDeactivateModal(did.id)} className='text-orange-600 hover:text-orange-700 hover:bg-orange-50' title='Deactivate DID'>
													<Ban className='h-4 w-4' />
												</Button>
											)}

											{did.status === 'deactivated' && permissions?.canUpdate && (
												<Button variant='outline' size='sm' onClick={() => openReactivateModal(did.id)} className='text-green-600 hover:text-green-700 hover:bg-green-50' title='Reactivate DID'>
													<RotateCcw className='h-4 w-4' />
												</Button>
											)}

											{permissions?.canDelete && did.status !== 'revoked' && (
												<Button variant='outline' size='sm' onClick={() => openRevokeModal(did.id)} className='text-red-600 hover:text-red-700 hover:bg-red-50' title='Revoke DID (permanent)'>
													<Trash2 className='h-4 w-4' />
												</Button>
											)}
										</div>
									</div>
								</CardHeader>

								{isExpanded && (
									<CardContent className='space-y-4'>
										{/* DID Document */}
										<div>
											<Label className='text-sm font-medium'>DID Document</Label>
											<div className='mt-1'>
												<pre className='pre-code-json'>{JSON.stringify(did.document, null, 2)}</pre>
											</div>
										</div>

										{/* Private Key */}
										{did.privateKey && (
											<div>
												<div className='flex items-center justify-between'>
													<Label className='text-sm font-medium'>Private Key</Label>
													<Button variant='ghost' size='sm' onClick={() => setShowPrivateKey(showPrivateKey === did.id ? null : did.id)}>
														{showPrivateKey === did.id ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
													</Button>
												</div>
												<div className='mt-1'>
													{showPrivateKey === did.id ? (
														<pre className='pre-code-danger'>{did.privateKey}</pre>
													) : (
														<div className='bg-red-50 p-3 rounded-md border border-red-200'>
															<p className='text-xs text-red-600'>••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••</p>
														</div>
													)}
												</div>
											</div>
										)}

										{/* Metadata */}
										<div className='grid grid-cols-2 gap-4 text-sm'>
											<div>
												<Label className='text-xs text-muted-foreground'>Created</Label>
												<p>{formatDate(did.created_at)}</p>
											</div>
											<div>
												<Label className='text-xs text-muted-foreground'>Updated</Label>
												<p>{formatDate(did.updated_at)}</p>
											</div>
										</div>
									</CardContent>
								)}
							</Card>
						)
					})}

					{dids.length === 0 && (
						<Card>
							<CardContent className='py-12 text-center'>
								<Fingerprint className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
								<h3 className='text-lg font-medium mb-2'>No DIDs found</h3>
								<p className='text-muted-foreground mb-4'>Create your first Decentralized Identity to get started.</p>
								<p className='text-xs text-muted-foreground mb-4'>Debug: DIDs array length = {dids.length}</p>
								<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
									<DialogTrigger asChild>
										<Button onClick={() => setCreateDialogOpen(true)}>
											<Plus className='mr-2 h-4 w-4' />
											Create First DID
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Create New DID</DialogTitle>
											<DialogDescription>Create a new Decentralized Identity for this tenant.</DialogDescription>
										</DialogHeader>

										<div className='space-y-4'>
											<div className='grid grid-cols-2 gap-4'>
												<div className='space-y-2'>
													<Label htmlFor='method'>DID Method</Label>
													<Select value={newDIDMethod} onValueChange={setNewDIDMethod}>
														<SelectTrigger>
															<SelectValue placeholder='Select a DID method' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='key'>did:key</SelectItem>
															<SelectItem value='web'>did:web</SelectItem>
															<SelectItem value='ethr'>did:ethr</SelectItem>
															<SelectItem value='vbsn'>did:vbsn</SelectItem>
														</SelectContent>
													</Select>
												</div>

												<div className='space-y-2'>
													<Label htmlFor='keyType'>Key Type</Label>
													<Select value={newKeyType} onValueChange={setNewKeyType}>
														<SelectTrigger>
															<SelectValue placeholder='Select key type' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='Ed25519'>Ed25519</SelectItem>
															<SelectItem value='secp256k1'>secp256k1</SelectItem>
															<SelectItem value='P-256'>P-256</SelectItem>
															<SelectItem value='RSA'>RSA</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>

											<Alert>
												<AlertCircle className='h-4 w-4' />
												<AlertDescription>The private key will be generated automatically and stored securely.</AlertDescription>
											</Alert>
										</div>

										<DialogFooter>
											<Button onClick={handleCreateDID} disabled={isCreating}>
												{isCreating ? (
													<>
														<RefreshCw className='mr-2 h-4 w-4 animate-spin' />
														Creating...
													</>
												) : (
													<>
														<Fingerprint className='mr-2 h-4 w-4' />
														Create DID
													</>
												)}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Confirmation Modal */}
				<Dialog
					open={confirmAction.isOpen}
					onOpenChange={(open) => {
						if (!open && !confirmAction.isProcessing) {
							closeConfirmModal()
						}
					}}>
					<DialogContent className='sm:max-w-md'>
						<DialogHeader>
							<DialogTitle className='flex items-center gap-2'>
								{confirmAction.type === 'deactivate' ? (
									<>
										<Ban className='h-5 w-5 text-orange-600' />
										Deactivate DID
									</>
								) : confirmAction.type === 'revoke' ? (
									<>
										<Trash2 className='h-5 w-5 text-red-600' />
										Revoke DID
									</>
								) : (
									<>
										<RotateCcw className='h-5 w-5 text-green-600' />
										Reactivate DID
									</>
								)}
							</DialogTitle>
							<DialogDescription>{confirmAction.type === 'deactivate' ? 'This will deactivate the DID. It can be reactivated later if needed.' : confirmAction.type === 'revoke' ? 'This will permanently revoke the DID. This action CANNOT be undone!' : 'This will reactivate the DID, making it usable again.'}</DialogDescription>
						</DialogHeader>

						<div className='space-y-4'>
							{/* DID ID Display */}
							<div className='p-3 bg-muted rounded-md'>
								<p className='text-xs text-muted-foreground mb-1'>DID to {confirmAction.type}:</p>
								<p className='font-mono text-sm break-all'>{confirmAction.didId}</p>
							</div>

							{/* Reason Input */}
							<div className='space-y-2'>
								<Label htmlFor='reason'>Reason *</Label>
								<Textarea id='reason' placeholder={`Enter reason for ${confirmAction.type === 'deactivate' ? 'deactivating' : confirmAction.type === 'revoke' ? 'revoking' : 'reactivating'} this DID...`} value={confirmAction.reason} onChange={(e) => updateConfirmReason(e.target.value)} className='min-h-[100px]' disabled={confirmAction.isProcessing} />
								<p className='text-xs text-muted-foreground'>Please provide a clear reason for this action for audit purposes.</p>
							</div>

							{/* Warning for Revoke */}
							{confirmAction.type === 'revoke' && (
								<Alert className='border-red-200 bg-red-50'>
									<AlertCircle className='h-4 w-4 text-red-600' />
									<AlertDescription className='text-red-600 font-medium'>Warning: Revoking a DID is permanent and cannot be undone. The DID will no longer be usable.</AlertDescription>
								</Alert>
							)}

							{/* Info for Reactivate */}
							{confirmAction.type === 'reactivate' && (
								<Alert className='border-green-200 bg-green-50'>
									<AlertCircle className='h-4 w-4 text-green-600' />
									<AlertDescription className='text-green-600 font-medium'>This DID will become active and usable again after reactivation.</AlertDescription>
								</Alert>
							)}
						</div>

						<DialogFooter className='gap-2'>
							<Button variant='outline' onClick={closeConfirmModal} disabled={confirmAction.isProcessing}>
								Cancel
							</Button>
							<Button variant={confirmAction.type === 'revoke' ? 'destructive' : confirmAction.type === 'reactivate' ? 'default' : 'default'} onClick={confirmAction.type === 'deactivate' ? handleDeactivateDID : confirmAction.type === 'revoke' ? handleRevokeDID : handleReactivateDID} disabled={confirmAction.isProcessing || !confirmAction.reason.trim()}>
								{confirmAction.isProcessing ? (
									<>
										<RefreshCw className='mr-2 h-4 w-4 animate-spin' />
										{confirmAction.type === 'deactivate' ? 'Deactivating...' : confirmAction.type === 'revoke' ? 'Revoking...' : 'Reactivating...'}
									</>
								) : (
									<>
										{confirmAction.type === 'deactivate' ? (
											<>
												<Ban className='mr-2 h-4 w-4' />
												Deactivate DID
											</>
										) : confirmAction.type === 'revoke' ? (
											<>
												<Trash2 className='mr-2 h-4 w-4' />
												Revoke DID
											</>
										) : (
											<>
												<RotateCcw className='mr-2 h-4 w-4' />
												Reactivate DID
											</>
										)}
									</>
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
