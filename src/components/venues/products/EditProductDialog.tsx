// next/src/components/venues/products/EditProductDialog.tsx
'use client'

import React, {useState, useEffect} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {ProductForm, ProductFormData, stringToArray} from './ProductForm'
import {Product, UpdateProductDTO} from '@/types/product'
import venueService from '@/services/venueService'

interface EditProductDialogProps {
	product: Product | null // Product to edit, or null if dialog is closed
	isOpen: boolean
	onClose: () => void
	onProductUpdated: () => void // Callback to refresh the list
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({product, isOpen, onClose, onProductUpdated}) => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Reset error when dialog opens or product changes
	useEffect(() => {
		if (isOpen) {
			setError(null)
		}
	}, [isOpen, product])

	const handleEditProduct = async (data: ProductFormData) => {
		if (!product) return // Should not happen if dialog is open

		setIsSubmitting(true)
		setError(null)
		try {
			const ingredientsArray = stringToArray(data.ingredients)
			const allergensArray = stringToArray(data.allergens)

			// Prepare the DTO for the PATCH request (partial update)
			const dto: UpdateProductDTO = {
				name: data.name,
				description: data.description,
				price: data.price,
				category: data.category,
				isAvailable: data.isAvailable ?? true, // Ensure boolean
				ingredients: ingredientsArray,
				allergens: allergensArray,
				// TODO: Handle nutritionalInfo update if/when re-enabled in ProductForm
				// nutritionalInfo: data.nutritionalInfo && Object.values(data.nutritionalInfo).some(v => v != null && v !== '') ? data.nutritionalInfo : undefined,
			}

			await venueService.updateProduct(product.id, dto)
			onProductUpdated() // Refresh the product list
			onClose() // Close the dialog on success
		} catch (err) {
			console.error('Failed to update product:', err)
			setError('Failed to update product. Please try again.')
			// Keep dialog open on error
		} finally {
			setIsSubmitting(false)
		}
	}

	// Render only when a product is provided
	if (!product) {
		return null
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[600px]'>
				<DialogHeader>
					<DialogTitle>Edit Product: {product.name}</DialogTitle>
					<DialogDescription>Update the product details below. Click save when you&#39;re done.</DialogDescription>
				</DialogHeader>
				{error && <p className='text-sm text-red-500 px-6'>{error}</p>}
				<div className='p-6 pt-0 max-h-[70vh] overflow-y-auto'>
					<ProductForm
						initialData={product} // Pass the product data to the form
						onSubmit={handleEditProduct}
						isSubmitting={isSubmitting}
						onCancel={onClose}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default EditProductDialog
