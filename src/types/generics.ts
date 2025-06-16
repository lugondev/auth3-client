// Generic types for improved reusability and reduced duplication

// Generic API Response wrapper
export interface BaseApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Generic Error interface
export interface BaseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Generic Pagination interface
export interface BasePagination {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
}

// Generic Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  pagination: BasePagination;
}

// Alternative pagination format for backward compatibility
export interface LegacyPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
}

// Generic Entity with timestamps
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Generic Entity with metadata
export interface EntityWithMetadata extends BaseEntity {
  metadata?: Record<string, unknown>;
}

// Generic Status enum constraint
export type BaseStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted';

// Generic Analytics interface
export interface BaseAnalytics {
  total_count: number;
  active_count: number;
  created_today: number;
  created_this_week: number;
  created_this_month: number;
}

// Generic Activity Point for charts
export interface ActivityPoint {
  date: string;
  count: number;
}

// Generic Statistics interface
export interface BaseStatistic {
  type: string;
  count: number;
  percentage: number;
}

// Generic Filter interface
export interface BaseFilter {
  search?: string;
  status?: string[];
  created_from?: string;
  created_to?: string;
  page?: number;
  limit?: number;
}

// Generic Bulk Operation Response
export interface BulkOperationResponse<T = unknown> {
  success_count: number;
  failed_count: number;
  failed_items?: Array<{
    item: T;
    error: string;
  }>;
}

// Generic Configuration interface
export interface BaseConfig {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Generic Webhook interface
export interface BaseWebhook extends BaseConfig {
  url: string;
  events: string[];
  secret?: string;
  last_triggered?: string;
}

// Generic User interface
export interface BaseUser extends BaseEntity {
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  status: BaseStatus;
}

// Generic Role interface
export interface BaseRole extends BaseEntity {
  name: string;
  description?: string;
  permissions: string[];
}

// Generic Permission interface
export interface BasePermission {
  object: string;
  action: string;
}

// Generic Input/Output type helpers
export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateInput<T> = Partial<CreateInput<T>>;
export type ListInput = BaseFilter;

// Generic Response type helpers
export type ApiResponseOf<T> = BaseApiResponse<T>;
export type PaginatedResponseOf<T> = PaginatedResponse<T>;
export type ErrorResponseOf = BaseApiResponse<BaseError>;

// Utility types for form handling
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  loading: boolean;
  touched: Partial<Record<keyof T, boolean>>;
}

// Generic Modal state
export interface ModalState<T = unknown> {
  isOpen: boolean;
  data?: T;
  loading: boolean;
  error?: string;
}

// Generic Table state
export interface TableState<T> {
  items: T[];
  loading: boolean;
  error?: string;
  pagination: BasePagination;
  filters: BaseFilter;
  selectedItems: T[];
}

// Generic Context state
export interface ContextState<T> {
  data: T | null;
  loading: boolean;
  error?: string;
  initialized: boolean;
}

// Generic Search state
export interface SearchState<T> {
  query: string;
  results: T[];
  loading: boolean;
  error?: string;
  filters: Record<string, unknown>;
}