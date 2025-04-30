// next/src/types/product.ts

export enum ProductCategory {
	APPETIZER = 'appetizer',
	MAIN = 'main',
	DESSERT = 'dessert',
	DRINK = 'drink',
	ALCOHOL = 'alcohol',
	SIDE = 'side',
	SPECIAL = 'special',
}

export interface ProductOptionChoice {
	id?: string; // Optional: Present if already created
	name: string;
	priceAdjustment: number; // Can be positive or negative
}

export interface ProductOption {
	id?: string; // Optional: Present if already created
	name: string; // e.g., "Size", "Add-ons"
	minSelection: number;
	maxSelection: number;
	choices: ProductOptionChoice[];
}

export interface ProductPhoto {
	id: string;
	url: string;
	caption?: string; // Renamed from altText to match backend handler input
	isPrimary?: boolean; // Added based on backend handler input
}

export interface NutritionalInfo {
	calories?: number;
	protein?: number; // grams
	carbohydrates?: number; // grams
	fat?: number; // grams
	servingSize?: string; // e.g., "100g", "1 slice"
}

export interface Product {
	id: string;
	venueId: string;
	name: string;
	description?: string;
	price: number;
	category: ProductCategory;
	photos?: ProductPhoto[];
	options?: ProductOption[];
	ingredients?: string[];
	allergens?: string[];
	nutritionalInfo?: NutritionalInfo;
	isAvailable: boolean;
	createdAt: string;
	updatedAt: string;
}

// DTOs for API requests (often omit id, createdAt, updatedAt)
export type CreateProductDTO = Omit<Product, 'id' | 'venueId' | 'createdAt' | 'updatedAt' | 'photos'> & {
	// Photos might be handled separately or via multipart form
	options?: Omit<ProductOption, 'id'>[];
};

export type UpdateProductDTO = Partial<Omit<CreateProductDTO, 'venueId'>>; // venueId shouldn't change on update

/**
 * Response structure for fetching multiple products with pagination.
 */
export interface PaginatedProductResponse {
	products: Product[];
	total: number;
	page: number;
	limit: number;
}
