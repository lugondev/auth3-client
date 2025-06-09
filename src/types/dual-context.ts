// Dual Context Management Types
// This file defines types for managing both global and tenant contexts simultaneously

export type ContextMode = 'global' | 'tenant' | 'auto'

export interface TokenStorage {
  accessToken: string | null
  refreshToken: string | null
  timestamp: number
}

export interface ContextState {
  user: AppUser | null
  permissions: Permission[]
  roles: string[]
  tokens: TokenStorage
  isAuthenticated: boolean
  tenantId: string | null
  lastUpdated: number
}

export interface DualContext {
  globalContext: ContextState
  tenantContext: ContextState
  currentMode: ContextMode
  isTransitioning: boolean
}

export interface ContextSwitchOptions {
  preserveGlobalContext?: boolean
  fallbackToGlobal?: boolean
  preferredContext?: 'global' | 'tenant'
  validatePermissions?: boolean
}

export interface ContextManagerConfig {
  cacheTimeout: number
  autoSwitchEnabled: boolean
  fallbackStrategy: 'global' | 'tenant' | 'none'
  validationEnabled: boolean
}

// Re-export types that will be used across contexts
export interface AppUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar?: string
  roles?: string[]
  tenant_id?: string
}

export interface Permission {
  object: string
  action: string
}

// Context validation result
export interface ContextValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Context switch result
export interface ContextSwitchResult {
  success: boolean
  previousMode: ContextMode
  newMode: ContextMode
  error?: string
  rollbackAvailable: boolean
}