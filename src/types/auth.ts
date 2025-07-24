// Authentication and Permission Types
// Updated to support dual context management

import { AppUser, Permission, ContextMode, ContextSwitchOptions, ContextSwitchResult } from './dual-context'
import { LoginInput, RegisterInput, AuthResult, Verify2FARequest } from './user'

// Enhanced AuthContextType with dual context support
export interface AuthContextType {
  // Current user and authentication state
  user: AppUser | null
  isAuthenticated: boolean
  isSystemAdmin: boolean | null
  loading: boolean
  currentTenantId: string | null

  // Dual context management
  currentMode: ContextMode
  globalContext: {
    user: AppUser | null
    isAuthenticated: boolean
    tenantId: string | null
  }
  tenantContext: {
    user: AppUser | null
    isAuthenticated: boolean
    tenantId: string | null
  }
  isTransitioning: boolean

  // Authentication methods
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signInWithApple: () => Promise<void>
  signInWithTwitter: () => Promise<void>
  signInWithEmail: (data: LoginInput) => Promise<{ success: boolean; twoFactorRequired: boolean; sessionToken?: string; error?: unknown }>
  signInWithDID?: (data: { did: string; access_token: string; refresh_token: string }) => Promise<void>
  verifyTwoFactorCode: (data: Verify2FARequest) => Promise<{ success: boolean; error?: unknown }>
  register: (data: RegisterInput) => Promise<void>
  logout: (contextOnly?: boolean) => Promise<void>
  exitTenantContext: () => Promise<void>

  // Context switching methods
  switchToTenant: (tenantId: string, options?: ContextSwitchOptions) => Promise<ContextSwitchResult>
  switchToTenantById: (tenantId: string) => Promise<void>
  switchToGlobal: (options?: ContextSwitchOptions) => Promise<ContextSwitchResult>
  switchContext: (mode: ContextMode, tenantId?: string, options?: ContextSwitchOptions) => Promise<ContextSwitchResult>

  // Two-factor authentication
  isTwoFactorPending: boolean
  twoFactorSessionToken: string | null

  // Enhanced auth handling
  handleAuthSuccess: (authResult: AuthResult, preserveContext?: boolean) => Promise<void>
  signInWithOAuth2Code: (code: string, state?: string | null) => Promise<void>

  // Context utilities
  getActiveContext: () => 'global' | 'tenant'
  canSwitchToTenant: (tenantId: string) => boolean
  rollbackContext: () => Promise<ContextSwitchResult>
  checkAuthStatus: () => Promise<void>

  // Debug utilities (temporarily disabled)
  // debugTokenFlow: () => void
}

// Enhanced PermissionContextType with dual context support
export interface PermissionContextType {
  // Current permissions and roles
  permissions: Permission[]
  roles: string[]
  loading: boolean
  error: string | null

  // Dual context permissions
  globalPermissions: Permission[]
  tenantPermissions: Permission[]
  globalRoles: string[]
  tenantRoles: string[]
  currentMode: ContextMode

  // Permission checking methods
  hasPermission: (permission: string, context?: ContextMode) => boolean
  hasRole: (role: string, context?: ContextMode) => boolean
  hasAnyPermission: (permissions: string[], context?: ContextMode) => boolean
  hasAllPermissions: (permissions: string[], context?: ContextMode) => boolean
  hasAnyRole: (roles: string[], context?: ContextMode) => boolean
  hasAllRoles: (roles: string[], context?: ContextMode) => boolean

  // Async permission checking
  checkPermission: (object: string, action: string, context?: ContextMode) => Promise<boolean>
  checkPermissions: (permissions: string[], context?: ContextMode) => Promise<Record<string, boolean>>

  // Permission management
  refreshPermissions: (context?: ContextMode) => Promise<void>
  clearCache: (context?: ContextMode) => void

  // Role checking utilities
  isSystemAdmin: (context?: ContextMode) => boolean
  isTenantAdmin: (context?: ContextMode) => boolean

  // Context-aware getters
  getUserPermissions: (context?: ContextMode) => Permission[]
  getUserRoles: (context?: ContextMode) => string[]

  // Smart permission resolution
  resolvePermission: (permission: string, options?: ContextSwitchOptions) => boolean
  resolveRole: (role: string, options?: ContextSwitchOptions) => boolean

  // Context synchronization
  syncPermissions: () => Promise<void>
  invalidateContext: (context: ContextMode) => void

  // Context switching
  switchPermissionContext: (newMode: ContextMode) => void
}

// Token management types
export interface TokenManager {
  getTokens: (context: ContextMode) => { accessToken: string | null; refreshToken: string | null }
  setTokens: (context: ContextMode, accessToken: string | null, refreshToken: string | null) => void
  clearTokens: (context: ContextMode) => void
  backupTokens: (fromContext: ContextMode, toContext: ContextMode) => void
  restoreTokens: (fromContext: ContextMode, toContext: ContextMode) => void
  validateTokens: (context: ContextMode) => boolean
}