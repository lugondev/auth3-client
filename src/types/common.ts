// Common types used across the application
// Re-export generic types for backward compatibility

export type { 
  BasePagination as PaginationMeta,
  BaseEntity,
  EntityWithMetadata,
  BaseStatus,
  BaseError,
  BaseAnalytics,
  ActivityPoint,
  BaseStatistic,
  BaseFilter,
  BulkOperationResponse,
  BaseConfig,
  BaseWebhook,
  BaseUser,
  BaseRole,
  BasePermission,
  CreateInput,
  UpdateInput,
  ListInput,
  ApiResponseOf,
  PaginatedResponseOf,
  ErrorResponseOf,
  FormState,
  ModalState,
  TableState,
  ContextState,
  SearchState
} from './generics';