'use client'

import React, {useState, useRef} from 'react'
import Image from 'next/image'
import {useFetchProductDetails, useUploadProductPhoto, useDeleteProductPhoto} from '@/features/venues/products/hooks'
import {ProductPhoto} from '@/types/product'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge' // Import Badge
import {Trash2, UploadCloud} from 'lucide-react' // Removed unused CheckCircle, XCircle
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog'
import {toast} from 'sonner'

interface ProductPhotoManagerProps {
	productId: string
	venueId: string // Needed for query invalidation
}

const ProductPhotoManager: React.FC<ProductPhotoManagerProps> = ({productId, venueId}) => {
	const {data: product, isLoading, error, refetch} = useFetchProductDetails(productId)
	const uploadMutation = useUploadProductPhoto()
	const deleteMutation = useDeleteProductPhoto()

	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [caption, setCaption] = useState('')
	const [isPrimary, setIsPrimary] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<ProductPhoto | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			setSelectedFile(file)
			const reader = new FileReader()
			reader.onloadend = () => {
				setPreviewUrl(reader.result as string)
			}
			reader.readAsDataURL(file)
		} else {
			setSelectedFile(null)
			setPreviewUrl(null)
		}
	}

	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error('Please select a file to upload.')
			return
		}

		uploadMutation.mutate(
			{productId, file: selectedFile, caption, isPrimary, venueId},
			{
				onSuccess: () => {
					toast.success('Photo uploaded successfully!')
					setSelectedFile(null)
					setPreviewUrl(null)
					setCaption('')
					setIsPrimary(false)
					if (fileInputRef.current) {
						fileInputRef.current.value = '' // Reset file input
					}
					refetch() // Refetch product details to show the new photo
				},
				// onError is handled by the hook's default toast
			},
		)
	}

	const handleDeleteClick = (photo: ProductPhoto) => {
		setShowDeleteConfirm(photo)
	}

	const confirmDelete = () => {
		if (showDeleteConfirm) {
			deleteMutation.mutate(
				{productId: productId, photoId: showDeleteConfirm.id, venueId: venueId},
				{
					onSuccess: () => {
						toast.success('Photo deleted successfully!')
						setShowDeleteConfirm(null)
						// refetch(); // Refetching might be handled by invalidation in hook, but explicit refetch is safer here
					},
					// onError is handled by hook's default toast
					onError: () => {
						setShowDeleteConfirm(null) // Close dialog even on error
					},
				},
			)
		}
	}

	if (isLoading) return <div>Loading photos...</div>
	if (error)
		return (
			<Alert variant='destructive'>
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>Failed to load product photos: {error.message}</AlertDescription>
			</Alert>
		)

	const photos = product?.photos || []

	return (
		<div className='space-y-6'>
			<h3 className='text-lg font-medium'>Manage Product Photos</h3>

			{/* Upload Form */}
			<Card>
				<CardHeader>
					<CardTitle>Upload New Photo</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid w-full max-w-sm items-center gap-1.5'>
						<Label htmlFor='picture'>Picture</Label>
						<Input id='picture' type='file' accept='image/*' onChange={handleFileChange} ref={fileInputRef} />
					</div>
					{previewUrl && (
						<div className='mt-4'>
							<Image src={previewUrl} alt='Preview' width={100} height={100} className='rounded object-cover' />
						</div>
					)}
					<div className='grid w-full max-w-sm items-center gap-1.5'>
						<Label htmlFor='caption'>Caption (Optional)</Label>
						<Input id='caption' value={caption} onChange={(e) => setCaption(e.target.value)} placeholder='Brief description' />
					</div>
					<div className='flex items-center space-x-2'>
						{/* Simple checkbox for isPrimary - consider RadioGroup if multiple photos exist */}
						<input type='checkbox' id='isPrimary' checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600' />
						<Label htmlFor='isPrimary'>Set as primary photo</Label>
					</div>
				</CardContent>
				<CardFooter>
					<Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
						<UploadCloud className='mr-2 h-4 w-4' /> {uploadMutation.isPending ? 'Uploading...' : 'Upload Photo'}
					</Button>
				</CardFooter>
			</Card>

			{/* Existing Photos */}
			<div>
				<h4 className='text-md font-medium mb-2'>Existing Photos ({photos.length})</h4>
				{photos.length === 0 ? (
					<p className='text-sm text-muted-foreground'>No photos uploaded yet.</p>
				) : (
					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
						{photos.map((photo) => (
							<Card key={photo.id} className='relative group'>
								<Image src={photo.url} alt={photo.caption || `Product photo ${photo.id}`} width={150} height={150} className='rounded-t object-cover w-full aspect-square' />
								<CardContent className='p-2 text-sm'>
									<p className='truncate text-muted-foreground'>{photo.caption || 'No caption'}</p>
									{photo.isPrimary && (
										<Badge variant='secondary' className='mt-1'>
											Primary
										</Badge>
									)}
								</CardContent>
								<div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity'>
									<Button variant='destructive' size='icon' className='h-7 w-7' onClick={() => handleDeleteClick(photo)} disabled={deleteMutation.isPending && showDeleteConfirm?.id === photo.id}>
										<Trash2 className='h-4 w-4' />
									</Button>
								</div>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete this photo.
							{showDeleteConfirm?.caption && ` Caption: "${showDeleteConfirm.caption}"`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending} className='bg-destructive hover:bg-destructive/90'>
							{deleteMutation.isPending ? 'Deleting...' : 'Delete Photo'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

export default ProductPhotoManager
