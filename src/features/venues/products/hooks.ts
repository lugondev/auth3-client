import { useQuery, useMutation, useQueryClient, UseQueryOptions, MutationOptions } from '@tanstack/react-query';
import venueService from '@/services/venueService';
import { Product, CreateProductDTO, UpdateProductDTO, ProductPhoto } from '@/types/product'; // Import product types
import { toast } from 'sonner';

// --- Query Key Factory ---
const venueProductsQueryKey = (venueId: string) => ['venueProducts', venueId];
const productDetailsQueryKey = (productId: string) => ['productDetails', productId];

// --- Fetch Products Hook ---
/**
 * Hook to fetch the list of products for a specific venue.
 */
export const useFetchVenueProducts = (
	venueId: string,
	options?: Omit<UseQueryOptions<Product[], Error>, 'queryKey' | 'queryFn'>
) => {
	return useQuery<Product[], Error>({
		queryKey: venueProductsQueryKey(venueId),
		queryFn: () => {
			if (!venueId) return Promise.resolve([]);
			return venueService.getVenueProducts(venueId);
		},
		enabled: !!venueId && options?.enabled !== false,
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
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: venueProductsQueryKey(variables.venueId) });
				// Optionally update cache directly
				queryClient.setQueryData(venueProductsQueryKey(variables.venueId), (oldData: Product[] | undefined) =>
					oldData?.map(product => product.id === variables.productId ? updatedProduct : product) || []
				);
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
			queryClient.invalidateQueries({ queryKey: productDetailsQueryKey(variables.productId) });
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: venueProductsQueryKey(variables.venueId) });
				// Optionally remove from cache directly
				queryClient.setQueryData(venueProductsQueryKey(variables.venueId), (oldData: Product[] | undefined) =>
					oldData?.filter(product => product.id !== variables.productId) || []
				);
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
	venueId?: string; // For list invalidation
}

export const useUploadProductPhoto = (options?: MutationOptions<ProductPhoto, Error, UploadProductPhotoVariables>) => {
	const queryClient = useQueryClient();

	return useMutation<ProductPhoto, Error, UploadProductPhotoVariables>({
		mutationFn: ({ productId, file }) => venueService.uploadProductPhoto(productId, file),
		onSuccess: (newPhoto, variables) => {
			queryClient.invalidateQueries({ queryKey: productDetailsQueryKey(variables.productId) });
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: venueProductsQueryKey(variables.venueId) });
				// Note: Updating product list cache with new photo URL might be complex
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
			if (variables.venueId) {
				queryClient.invalidateQueries({ queryKey: venueProductsQueryKey(variables.venueId) });
				// Note: Updating product list cache after photo deletion might be complex
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
