// Common types used across the application

export interface PaginationMeta {
	current_page: number;
	page_size: number;
	total_items: number;
	total_pages: number;
	has_previous: boolean;
	has_next: boolean;
}