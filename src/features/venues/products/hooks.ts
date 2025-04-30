import { useQuery, useMutation, useQueryClient, UseQueryOptions, MutationOptions, useInfiniteQuery, InfiniteData, UseInfiniteQueryOptions } from '@tanstack/react-query'; // Added useInfiniteQuery, InfiniteData, UseInfiniteQueryOptions
import venueService from '@/services/venueService';
import { Product, CreateProductDTO, UpdateProductDTO, ProductPhoto, PaginatedProductResponse } from '@/types/product'; // Added PaginatedProductResponse
import { toast } from 'sonner';

// --- Query Key Factory ---
// Updated key factory to include filters
type ProductFilters = { category?: string; featured?: boolean; limit?: number };
const venueProductsQueryKey = (venueId: string, filters: ProductFilters = {}) => ['venueProducts', venueId, filters];
const productDetailsQueryKey = (productId: string) => ['productDetails', productId];


// --- Fetch Products Hook (Using Infinite Query) ---
/**
 * Hook to fetch products for a specific venue with pagination and filtering.
 */
export const useFetchVenueProducts = (
	venueId: string,
	filters: ProductFilters = {}, // Accept filters
	options?: Omit<UseInfiniteQueryOptions<PaginatedProductResponse, Error, InfiniteData<PaginatedProductResponse, unknown>, PaginatedProductResponse, ReturnType<typeof venueProductsQueryKey>, number>, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>
) => {
	const queryKey = venueProductsQueryKey(venueId, filters); // Use updated key factory
	const { limit = 10, ...restFilters } = filters; // Default limit

	return useInfiniteQuery<PaginatedProductResponse, Error, InfiniteData<PaginatedProductResponse>, ReturnType<typeof venueProductsQueryKey>, number>({
		queryKey: queryKey,
		queryFn: ({ pageParam }) => {
			if (!venueId) {
				return Promise.reject(new Error("Venue ID is required"));
			}
			return venueService.getVenueProducts(venueId, pageParam, limit, restFilters);
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			const totalPages = Math.ceil(lastPage.total / lastPage.limit);
			const nextPage = lastPage.page + 1;
			return nextPage <= totalPages ? nextPage : undefined;
		},
		enabled: !!venueId,
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		...options,
	});
};

// --- Fetch Product Details Hook (Optional, if needed) ---
/**
 * Hook to fetch details for a specific product.
 */
export const useFetchProductDetails = (
	productId: string,
	options?: Omit<UseQueryOptions<Product, Error>, 'queryKey' | 'queryFn'>
) => {
	return useQuery<Product, Error>({
		queryKey: productDetailsQueryKey(productId),
		queryFn: () => {
			if (!productId) throw new Error("Product ID is required to fetch details.");
			return venueService.getProductDetails(productId);
		},
		enabled: !!productId && options?.enabled !== false,
		...options,
	});
};


// --- Create Product Hook ---
interface CreateProductVariables {
	venueId: string;
	data: CreateProductDTO;
}

export const useCreateProduct = (options?: MutationOptions<Product, Error, CreateProductVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Product, Error, CreateProductVariables>({
		mutationFn: ({ venueId, data }) => venueService.createProduct(venueId, data),
		onSuccess: (newProduct, variables) => {
			queryClient.invalidateQueries({ queryKey: venueProductsQueryKey(variables.venueId) });
			toast.success(`Product "${newProduct.name}" created successfully.`);
			options?.onSuccess?.(newProduct, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error creating product for venue ${variables.venueId}:`, error);
			toast.error(`Failed to create product: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Update Product Hook ---
// Note: Update/Delete use /products/{productId} endpoint
interface UpdateProductVariables {
	productId: string;
	data: UpdateProductDTO;
	venueId?: string; // For invalidating the venue's product list
}

export const useUpdateProduct = (options?: MutationOptions<Product, Error, UpdateProductVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<Product, Error, UpdateProductVariables>({
		mutationFn: ({ productId, data }) => venueService.updateProduct(productId, data),
		onSuccess: (updatedProduct, variables) => {
			// Invalidate specific product details query
			queryClient.invalidateQueries({ queryKey: productDetailsQueryKey(variables.productId) });
			// Invalidate the venue's product list query if venueId is provided
			// Invalidate the venue's product list query (all pages/filters) if venueId is provided
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: ['venueProducts', variables.venueId] });
				// TODO: Consider selectively updating infinite query cache
			}
			toast.success(`Product "${updatedProduct.name}" updated successfully.`);
			options?.onSuccess?.(updatedProduct, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error updating product ${variables.productId}:`, error);
			toast.error(`Failed to update product: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Delete Product Hook ---
interface DeleteProductVariables {
	productId: string;
	productName?: string; // For toast message
	venueId?: string; // For invalidating the venue's product list
}

export const useDeleteProduct = (options?: MutationOptions<void, Error, DeleteProductVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, DeleteProductVariables>({
		mutationFn: ({ productId }) => venueService.deleteProduct(productId),
		onSuccess: (data, variables) => {
			// Invalidate specific product details query
			// Invalidate specific product details query
			queryClient.invalidateQueries({ queryKey: productDetailsQueryKey(variables.productId) });
			// Invalidate the venue's product list query (all pages/filters) if venueId is provided
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: ['venueProducts', variables.venueId] });
				// TODO: Consider selectively updating infinite query cache
			}
			toast.success(`Product "${variables.productName || variables.productId}" deleted successfully.`);
			options?.onSuccess?.(data, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error deleting product ${variables.productId}:`, error);
			toast.error(`Failed to delete product: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Upload Product Photo Hook ---
interface UploadProductPhotoVariables {
	productId: string;
	file: File;
	caption?: string; // Added caption
	isPrimary?: boolean; // Added isPrimary
	venueId?: string; // For list invalidation
}

export const useUploadProductPhoto = (options?: MutationOptions<ProductPhoto, Error, UploadProductPhotoVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<ProductPhoto, Error, UploadProductPhotoVariables>({
		// Pass caption and isPrimary to the service function
		mutationFn: ({ productId, file, caption, isPrimary }) => venueService.uploadProductPhoto(productId, file, caption, isPrimary),
		onSuccess: (newPhoto, variables) => {
			// Invalidate product details to show new photo
			queryClient.invalidateQueries({ queryKey: productDetailsQueryKey(variables.productId) });
			// Invalidate product lists if venueId provided
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: ['venueProducts', variables.venueId] });
				// TODO: Consider selectively updating infinite query cache
			}
			toast.success(`Photo uploaded successfully for product ${variables.productId}.`);
			options?.onSuccess?.(newPhoto, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error uploading photo for product ${variables.productId}:`, error);
			toast.error(`Failed to upload photo: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};

// --- Delete Product Photo Hook ---
interface DeleteProductPhotoVariables {
	productId: string;
	photoId: string;
	venueId?: string; // For list invalidation
}

export const useDeleteProductPhoto = (options?: MutationOptions<void, Error, DeleteProductPhotoVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, DeleteProductPhotoVariables>({
		mutationFn: ({ productId, photoId }) => venueService.deleteProductPhoto(productId, photoId),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: productDetailsQueryKey(variables.productId) });
			// Invalidate product details after deletion
			queryClient.invalidateQueries({ queryKey: productDetailsQueryKey(variables.productId) });
			// Invalidate product lists if venueId provided
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: ['venueProducts', variables.venueId] });
				// TODO: Consider selectively updating infinite query cache
			}
			toast.success(`Photo deleted successfully for product ${variables.productId}.`);
			options?.onSuccess?.(data, variables, undefined);
		},
		onError: (error, variables) => {
			console.error(`Error deleting photo ${variables.photoId} for product ${variables.productId}:`, error);
			toast.error(`Failed to delete photo: ${error.message || 'Unknown error'}`);
			options?.onError?.(error, variables, undefined);
		},
		...options,
	});
};


// --- Placeholder for more complex product/inventory logic ---
// export const useUpdateStock = (...) => { ... };
// export const useToggleProductAvailability = (...) => { ... };
// export const useManageDiscounts = (...) => { ... };
