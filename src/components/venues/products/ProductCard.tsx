// next/src/components/venues/products/ProductCard.tsx
import React from 'react'
import Image from 'next/image'
import {Product} from '@/types/product'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
// import {MoreVertical} from 'lucide-react'; // Keep if planning dropdown later

// Placeholder function for price formatting
const formatPrice = (price: number) => {
	return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(price)
}

interface ProductCardProps {
	product: Product
	onEdit: (product: Product) => void // Placeholder for edit action
	onDelete: (productId: string) => void // Placeholder for delete action
}

const ProductCard: React.FC<ProductCardProps> = ({product, onEdit, onDelete}) => {
	const firstPhotoUrl = product.photos?.[0]?.url || '/placeholder-venue.svg' // Use a default placeholder

	return (
		<Card className='flex flex-col'>
			<CardHeader className='p-0 relative aspect-video'>
				{/* Product Image */}
				<Image src={firstPhotoUrl} alt={product.name} layout='fill' objectFit='cover' className='rounded-t-lg' />
				{/* Optional: Overlay with availability status? */}
				{!product.isAvailable && (
					<Badge variant='destructive' className='absolute top-2 right-2'>
						Unavailable
					</Badge>
				)}
			</CardHeader>
			<CardContent className='pt-4 flex-grow'>
				<CardTitle className='text-lg mb-1'>{product.name}</CardTitle>
				<CardDescription className='text-sm mb-2 line-clamp-2'>{product.description || 'No description available.'}</CardDescription>
				<div className='flex justify-between items-center'>
					<Badge variant='secondary'>{product.category.charAt(0).toUpperCase() + product.category.slice(1)}</Badge>
					<span className='font-semibold text-lg'>{formatPrice(product.price)}</span>
				</div>
			</CardContent>
			<CardFooter className='flex justify-end gap-2 p-4 pt-0'>
				{/* Add action buttons here later */}
				<Button variant='outline' size='sm' onClick={() => onEdit(product)} disabled>
					Edit
				</Button>
				<Button variant='destructive' size='sm' onClick={() => onDelete(product.id)} disabled>
					Delete
				</Button>
				{/* Or use a Dropdown menu for more actions */}
				{/* <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                </Button> */}
			</CardFooter>
		</Card>
	)
}

export default ProductCard
