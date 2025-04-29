// next/src/components/venues/products/ProductList.tsx
'use client'

import React, {useState, useEffect, useMemo} from 'react'
import {Product, ProductCategory} from '@/types/product'
import venueService from '@/services/venueService'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Button} from '@/components/ui/button'
import {PlusCircle} from 'lucide-react'
import AddProductDialog from './AddProductDialog'
import EditProductDialog from './EditProductDialog' // Import EditProductDialog
// Placeholder for ProductCard/ProductRow - will be created later
import ProductCard from './ProductCard'

interface ProductListProps {
	venueId: string
}

const ProductList: React.FC<ProductListProps> = ({venueId}) => {
	const [products, setProducts] = useState<Product[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false)
	const [editingProduct, setEditingProduct] = useState<Product | null>(null) // State for product being edited
	const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false) // State for Edit dialog

	const fetchProducts = async () => {
		setIsLoading(true)
		setError(null)
		try {
			const fetchedProducts = await venueService.getVenueProducts(venueId)
			setProducts(fetchedProducts)
		} catch (err) {
			console.error('Error fetching products:', err)
			setError('Failed to load products. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (venueId) {
			fetchProducts()
		}
	}, [venueId])

	const filteredProducts = useMemo(() => {
		return products.filter((product) => {
			const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
			const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
			return matchesCategory && matchesSearch
		})
	}, [products, searchTerm, selectedCategory])

	const handleCategoryChange = (value: string) => {
		setSelectedCategory(value)
	}

	// --- Action Handlers ---
	const handleOpenEditDialog = (product: Product) => {
		setEditingProduct(product)
		setIsEditDialogOpen(true)
	}

	const handleCloseEditDialog = () => {
		setEditingProduct(null)
		setIsEditDialogOpen(false)
	}

	const handleDeleteProduct = async (productId: string) => {
		if (window.confirm('Are you sure you want to delete this product?')) {
			console.log('Delete product:', productId)
			// TODO: Implement API call and update state
			// try {
			//     await venueService.deleteProduct(productId);
			//     fetchProducts(); // Refresh the list
			// } catch (err) {
			//     console.error("Failed to delete product:", err);
			//     alert("Failed to delete product.");
			// }
		}
	}
	// --- End Placeholder Action Handlers ---

	return (
		<div className='space-y-4'>
			<div className='flex flex-col sm:flex-row gap-4 justify-between items-center'>
				<h2 className='text-2xl font-semibold'>Products</h2>
				<Button onClick={() => setIsAddDialogOpen(true)}>
					{' '}
					{/* Enable button */}
					<PlusCircle className='mr-2 h-4 w-4' /> Add Product
				</Button>
			</div>

			<div className='flex flex-col sm:flex-row gap-4'>
				<Input placeholder='Search products...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='max-w-sm' />
				<Select value={selectedCategory} onValueChange={handleCategoryChange}>
					<SelectTrigger className='w-[180px]'>
						<SelectValue placeholder='Filter by category' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>All Categories</SelectItem>
						{Object.values(ProductCategory).map((category) => (
							<SelectItem key={category} value={category}>
								{/* Capitalize first letter */}
								{category.charAt(0).toUpperCase() + category.slice(1)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{isLoading && <p>Loading products...</p>}
			{error && <p className='text-red-500'>{error}</p>}

			{!isLoading && !error && <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>{filteredProducts.length > 0 ? filteredProducts.map((product) => <ProductCard key={product.id} product={product} onEdit={handleOpenEditDialog} onDelete={handleDeleteProduct} />) : <p>No products found matching your criteria.</p>}</div>}

			{/* Add Product Dialog */}
			<AddProductDialog venueId={venueId} isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onProductAdded={fetchProducts} />

			{/* Edit Product Dialog */}
			<EditProductDialog
				product={editingProduct}
				isOpen={isEditDialogOpen}
				onClose={handleCloseEditDialog}
				onProductUpdated={() => {
					fetchProducts() // Refresh list after update
					handleCloseEditDialog() // Close dialog
				}}
			/>
		</div>
	)
}

export default ProductList
