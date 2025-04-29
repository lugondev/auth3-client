// next/src/components/venues/products/ProductForm.tsx
'use client'

import React from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Product, ProductCategory} from '@/types/product' // Remove unused DTOs
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Switch} from '@/components/ui/switch'
// import {Label} from '@/components/ui/label' // Keep commented out
import {capitalize} from '@/lib/utils'

// Validation Schema
const productFormSchema = z.object({
	name: z.string().min(2, {message: 'Product name must be at least 2 characters.'}).max(100),
	description: z.string().max(500).optional().or(z.literal('')),
	price: z.coerce.number({required_error: 'Price is required.', invalid_type_error: 'Price must be a number.'}).positive({message: 'Price must be positive.'}).multipleOf(0.01, {message: 'Price must have at most two decimal places.'}),
	category: z.nativeEnum(ProductCategory, {required_error: 'Category is required.'}),
	isAvailable: z.boolean().optional(), // Keep optional
	ingredients: z.string().optional().or(z.literal('')),
	allergens: z.string().optional().or(z.literal('')),
	// nutritionalInfo: z.object({...}).optional(), // Keep commented out
})

export type ProductFormData = z.infer<typeof productFormSchema>

// Helpers remain exported for use in Dialog components
export const arrayToString = (arr: string[] | undefined): string => arr?.join(', ') || ''
export const stringToArray = (str: string | undefined): string[] | undefined =>
	str
		? str
				.split(',')
				.map((item) => item.trim())
				.filter((item) => item !== '')
		: undefined

interface ProductFormProps {
	initialData?: Product
	onSubmit: (data: ProductFormData) => Promise<void> // Corrected: Expect ProductFormData
	isSubmitting: boolean
	onCancel?: () => void
}

export function ProductForm({initialData, onSubmit, isSubmitting, onCancel}: ProductFormProps) {
	const form = useForm<ProductFormData>({
		resolver: zodResolver(productFormSchema),
		defaultValues: {
			name: initialData?.name || '',
			description: initialData?.description || '',
			price: initialData?.price || 0,
			category: initialData?.category || ProductCategory.MAIN,
			isAvailable: initialData?.isAvailable !== undefined ? initialData.isAvailable : true,
			ingredients: arrayToString(initialData?.ingredients),
			allergens: arrayToString(initialData?.allergens),
			// nutritionalInfo: ... // Keep commented out
		},
	})

	// Simplified handleFormSubmit: Pass raw form data up
	const handleFormSubmit = async (values: ProductFormData) => {
		await onSubmit(values) // Pass validated form data directly
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleFormSubmit)} className='space-y-4'>
				{/* Name */}
				<FormField
					control={form.control}
					name='name'
					render={({field}) => (
						<FormItem>
							<FormLabel>Product Name *</FormLabel>
							<FormControl>
								<Input placeholder='e.g., Classic Burger, Iced Latte' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Description */}
				<FormField
					control={form.control}
					name='description'
					render={({field}) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea placeholder='Detailed description of the product...' {...field} value={field.value ?? ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
					{/* Price */}
					<FormField
						control={form.control}
						name='price'
						render={({field}) => (
							<FormItem>
								<FormLabel>Price ($) *</FormLabel>
								<FormControl>
									<Input type='number' step='0.01' min='0' placeholder='e.g., 12.99' {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Category */}
					<FormField
						control={form.control}
						name='category'
						render={({field}) => (
							<FormItem>
								<FormLabel>Category *</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder='Select product category' />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(ProductCategory).map((cat) => (
											<SelectItem key={cat} value={cat}>
												{capitalize(cat)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Ingredients */}
				<FormField
					control={form.control}
					name='ingredients'
					render={({field}) => (
						<FormItem>
							<FormLabel>Ingredients</FormLabel>
							<FormControl>
								<Input placeholder='Comma-separated, e.g., beef patty, lettuce, tomato' {...field} value={field.value ?? ''} />
							</FormControl>
							<FormDescription>Enter ingredients separated by commas.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Allergens */}
				<FormField
					control={form.control}
					name='allergens'
					render={({field}) => (
						<FormItem>
							<FormLabel>Allergens</FormLabel>
							<FormControl>
								<Input placeholder='Comma-separated, e.g., gluten, dairy, nuts' {...field} value={field.value ?? ''} />
							</FormControl>
							<FormDescription>Enter allergens separated by commas.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* isAvailable */}
				<FormField
					control={form.control}
					name='isAvailable'
					render={({field}) => (
						<FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
							<div className='space-y-0.5'>
								<FormLabel>Available for Sale</FormLabel>
								<FormDescription>Controls whether the product appears on the menu.</FormDescription>
							</div>
							<FormControl>
								{/* Ensure field.value is boolean for Switch */}
								<Switch checked={!!field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Submit/Cancel Buttons */}
				<div className='flex justify-end space-x-2 pt-4'>
					{onCancel && (
						<Button type='button' variant='outline' onClick={onCancel} disabled={isSubmitting}>
							Cancel
						</Button>
					)}
					<Button type='submit' disabled={isSubmitting}>
						{isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Product'}
					</Button>
				</div>
			</form>
		</Form>
	)
}
