// next/src/components/venues/products/AddProductDialog.tsx
'use client'

import React, {useState} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {ProductForm, ProductFormData, stringToArray} from './ProductForm' // Import stringToArray
import {CreateProductDTO} from '@/types/product'
import venueService from '@/services/venueService'
// import {Button} from '@/components/ui/button' // Remove unused Button

interface AddProductDialogProps {
	venueId: string
	isOpen: boolean
	onClose: () => void
	onProductAdded: () => void // Callback to refresh the list
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({venueId, isOpen, onClose, onProductAdded}) => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleAddProduct = async (data: ProductFormData) => {
		setIsSubmitting(true)
		setError(null)
		try {
			// The ProductForm already handles basic DTO conversion (like string to array)
			// Convert strings to arrays *before* creating the DTO
			const ingredientsArray = stringToArray(data.ingredients)
			const allergensArray = stringToArray(data.allergens)

			const dto: CreateProductDTO = {
				...data,
				ingredients: ingredientsArray, // Use converted array
				allergens: allergensArray, // Use converted array
				// Ensure isAvailable is boolean (ProductFormData might have it as optional initially)
				isAvailable: data.isAvailable ?? true,
				// TODO: Handle nutritionalInfo if/when it's re-enabled in ProductForm
				// nutritionalInfo: data.nutritionalInfo && Object.values(data.nutritionalInfo).some(v => v != null && v !== '') ? data.nutritionalInfo : undefined,
			}
			await venueService.createProduct(venueId, dto)
			onProductAdded() // Refresh the product list
			onClose() // Close the dialog on success
		} catch (err) {
			console.error('Failed to add product:', err)
			setError('Failed to add product. Please try again.')
			// Keep dialog open on error
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[600px]'>
				{' '}
				{/* Adjust width as needed */}
				<DialogHeader>
					<DialogTitle>Add New Product</DialogTitle>
					<DialogDescription>Fill in the details for the new product. Click save when you&#39;re done.</DialogDescription>
				</DialogHeader>
				{error && <p className='text-sm text-red-500 px-6'>{error}</p>} {/* Display error */}
				<div className='p-6 pt-0 max-h-[70vh] overflow-y-auto'>
					{' '}
					{/* Add scroll for long forms */}
					<ProductForm onSubmit={handleAddProduct} isSubmitting={isSubmitting} onCancel={onClose} />
				</div>
				{/* Footer is implicitly handled by ProductForm's submit button */}
				{/* We might add explicit footer buttons if ProductForm didn't have them */}
			</DialogContent>
		</Dialog>
	)
}

export default AddProductDialog
