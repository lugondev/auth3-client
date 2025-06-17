export * from './generics';

// Export existing types (many now use generics internally)
export * from './admin';
export * from './api';
export * from './audit';
export * from './auth';
export * from './common';
export * from './credentials';
export * from './did';
export * from './didcomm';
export * from './dual-context';
export * from './event';
export * from './notification';
export * from './oauth2';
export * from './rbac';
export * from './tenant';
export * from './tenantManagement';
export * from './tenantRbac';
export * from './user';
export * from './jwt';

// Re-export commonly used generic types for convenience
export type {
  BaseApiResponse,
  PaginatedResponse,
  BaseEntity,
  EntityWithMetadata,
  BaseError,
  BaseFilter,
  CreateInput,
  UpdateInput,
  FormState,
  ModalState,
  TableState,
  ContextState,
  SearchState
} from './generics';