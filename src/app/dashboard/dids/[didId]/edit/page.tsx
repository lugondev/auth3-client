'use client'

import React, {useState, useEffect} from 'react'
import {useParams, useRouter} from 'next/navigation'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {ArrowLeft, X, FileText, AlertTriangle, ChevronRight} from 'lucide-react'
import {toast} from '@/hooks/use-toast'
import {DIDDocumentEditor} from '@/components'
import {DIDSkeleton} from '@/components/did'
import * as didService from '@/services/didService'
import type {DIDDocument, DIDData} from '@/types/did'

/**
 * DID Edit Page - Dedicated page for editing DID documents
 * Provides a focused environment for DID document editing
 */
export default function DIDEditPage() {
	const params = useParams()
	const router = useRouter()
	const didId = decodeURIComponent(params.didId as string)

	// State management
	const [didData, setDidData] = useState<DIDData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	// Load DID data on mount
	useEffect(() => {
		const fetchDIDData = async () => {
			try {
				setLoading(true)
				setError(null)

				const response = await didService.getDID(didId)
				setDidData(response)
			} catch (err) {
				console.error('Failed to load DID:', err)
				const errorMessage = err instanceof Error ? err.message : 'Failed to load DID document'
				setError(errorMessage)
				toast({
					title: 'Error',
					description: errorMessage,
					variant: 'destructive',
				})
			} finally {
				setLoading(false)
			}
		}

		if (didId) {
			fetchDIDData()
		}
	}, [didId])

	// Handle save operation
	const handleSave = async (savedDocument: DIDDocument) => {
		try {
			setIsSaving(true)

			// Update local state
			if (didData) {
				setDidData({
					...didData,
					document: savedDocument,
				})
			}

			setHasUnsavedChanges(false)

			toast({
				title: 'Success',
				description: 'DID document saved successfully. Returning to details page...',
			})

			// Navigate back to the detail page immediately
			router.push(`/dashboard/dids/${encodeURIComponent(didId)}`)
		} catch (err) {
			console.error('Failed to save DID:', err)
			toast({
				title: 'Error',
				description: 'Failed to save DID document',
				variant: 'destructive',
			})
		} finally {
			setIsSaving(false)
		}
	}

	// Handle cancel operation
	const handleCancel = () => {
		if (hasUnsavedChanges) {
			const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave? All changes will be lost.')
			if (!confirmLeave) {
				return
			}
		}
		router.push(`/dashboard/dids/${encodeURIComponent(didId)}`)
	}

	// Handle back navigation
	const handleBack = () => {
		if (hasUnsavedChanges) {
			const confirmLeave = confirm('You have unsaved changes. Are you sure you want to go back? All changes will be lost.')
			if (!confirmLeave) {
				return
			}
		}
		router.back()
	}

	// Prevent accidental navigation away
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				e.preventDefault()
				e.returnValue = ''
			}
		}

		if (hasUnsavedChanges) {
			window.addEventListener('beforeunload', handleBeforeUnload)
			return () => window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [hasUnsavedChanges])

	// Loading state
	if (loading) {
		return (
			<div className='container mx-auto py-6 space-y-6'>
				{/* Header Skeleton */}
				<div className='flex items-center justify-between'>
					<div>
						<div className='h-8 w-64 bg-gray-800 rounded animate-pulse mb-2' />
						<div className='h-4 w-96 bg-gray-800 rounded animate-pulse' />
					</div>
					<div className='flex gap-2'>
						<div className='h-10 w-20 bg-gray-800 rounded animate-pulse' />
						<div className='h-10 w-16 bg-gray-800 rounded animate-pulse' />
					</div>
				</div>

				{/* Editor Skeleton */}
				<DIDSkeleton variant='details' />
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className='container mx-auto py-6'>
				<Alert variant='destructive' className='mb-6'>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
				<div className='text-center py-12'>
					<p className='text-muted-foreground mb-4'>Failed to load DID document for editing</p>
					<div className='flex gap-2 justify-center'>
						<Button variant='outline' onClick={handleBack}>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Go Back
						</Button>
						<Button onClick={() => window.location.reload()}>Try Again</Button>
					</div>
				</div>
			</div>
		)
	}

	// No data state
	if (!didData) {
		return (
			<div className='container mx-auto py-6'>
				<div className='text-center py-12'>
					<FileText className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
					<h3 className='text-lg font-medium mb-2'>DID Not Found</h3>
					<p className='text-muted-foreground mb-4'>The requested DID document could not be found</p>
					<Button variant='outline' onClick={handleBack}>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Go Back
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className='container mx-auto py-6 space-y-6'>
			{/* Breadcrumb Navigation */}
			<nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
				<button onClick={() => router.push('/dashboard/dids')} className='hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted'>
					DIDs Dashboard
				</button>
				<ChevronRight className='h-4 w-4' />
				<button onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(didId)}`)} className='hover:text-foreground transition-colors truncate max-w-48 px-2 py-1 rounded hover:bg-muted' title={`View details for ${didId}`}>
					{didId.length > 30 ? `${didId.substring(0, 30)}...` : didId}
				</button>
				<ChevronRight className='h-4 w-4' />
				<span className='text-foreground font-medium px-2 py-1'>Edit</span>
			</nav>

			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<div className='flex items-center gap-3 mb-2'>
						<Button variant='ghost' size='sm' onClick={handleBack} className='hover:bg-muted'>
							<ArrowLeft className='h-4 w-4' />
						</Button>
						<h1 className='text-3xl font-bold'>Edit DID Document</h1>
						{hasUnsavedChanges && <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full'>Unsaved Changes</span>}
					</div>
					<p className='text-muted-foreground'>
						Editing document for: <span className='font-mono text-sm'>{didId}</span>
					</p>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' onClick={handleCancel} disabled={isSaving}>
						<X className='h-4 w-4 mr-2' />
						Cancel
					</Button>
					{/* Note: Save functionality is handled by the DIDDocumentEditor component */}
				</div>
			</div>

			{/* Editor Card */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<FileText className='h-5 w-5' />
						DID Document Editor
					</CardTitle>
					<CardDescription>Edit the DID document structure, verification methods, and service endpoints. Changes will be validated before saving.</CardDescription>
				</CardHeader>
				<CardContent>
					<DIDDocumentEditor did={didId} initialDocument={didData.document} onSave={handleSave} onCancel={handleCancel} />
				</CardContent>
			</Card>

			{/* Help Text */}
			<Card>
				<CardContent className='pt-6'>
					<div className='text-sm text-muted-foreground space-y-2'>
						<h4 className='font-medium text-foreground'>Editing Guidelines:</h4>
						<ul className='list-disc list-inside space-y-1 ml-2'>
							<li>Ensure all required fields are properly filled</li>
							<li>Verification methods must have valid public key information</li>
							<li>Service endpoints should use valid URLs</li>
							<li>Changes will be validated before saving</li>
							<li>Use the Cancel button to discard all changes</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
