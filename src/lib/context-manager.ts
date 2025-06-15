// Context Management Utilities
// Handles context switching, preservation, and validation logic

import { 
  ContextMode, 
  ContextState, 
  ContextSwitchOptions, 
  ContextSwitchResult, 
  ContextValidationResult,
  ContextManagerConfig,
  AppUser,
  Permission
} from '@/types/dual-context'
import { tokenManager } from './token-storage'
import { jwtDecode } from 'jwt-decode'

// Default configuration
const DEFAULT_CONFIG: ContextManagerConfig = {
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  autoSwitchEnabled: true,
  fallbackStrategy: 'global',
  validationEnabled: true
}

// Context storage keys
const CONTEXT_STORAGE_KEYS = {
  globalContext: 'dual_context_global',
  tenantContext: 'dual_context_tenant',
  currentMode: 'dual_context_current_mode',
  lastSwitch: 'dual_context_last_switch'
} as const

// Context Manager Class
export class ContextManager {
  private static instance: ContextManager
  private config: ContextManagerConfig
  private switchHistory: Array<{ from: ContextMode; to: ContextMode; timestamp: number }> = []
  
  private constructor(config: Partial<ContextManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }
  
  static getInstance(config?: Partial<ContextManagerConfig>): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager(config)
    }
    return ContextManager.instance
  }
  
  // Get current context mode
  getCurrentMode(): ContextMode {
    if (typeof window === 'undefined') {
      return 'global'
    }
    
    try {
      const stored = localStorage.getItem(CONTEXT_STORAGE_KEYS.currentMode)
      return (stored as ContextMode) || 'global'
    } catch {
      return 'global'
    }
  }
  
  // Set current context mode
  setCurrentMode(mode: ContextMode): void {
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      localStorage.setItem(CONTEXT_STORAGE_KEYS.currentMode, mode)
    } catch (error) {
      console.error('Failed to set current mode:', error)
    }
  }
  
  // Get context state
  getContextState(context: ContextMode): ContextState | null {
    if (typeof window === 'undefined') {
      return null
    }
    
    try {
      const key = context === 'global' 
        ? CONTEXT_STORAGE_KEYS.globalContext 
        : CONTEXT_STORAGE_KEYS.tenantContext
      
      const stored = localStorage.getItem(key)
      if (!stored) return null
      
      const state: ContextState = JSON.parse(stored)
      
      // Validate cache timeout
      if (this.config.validationEnabled && this.isCacheExpired(state.lastUpdated)) {
        this.clearContextState(context)
        return null
      }
      
      return state
    } catch (error) {
      console.error(`Failed to get ${context} context state:`, error)
      return null
    }
  }
  
  // Set context state
  setContextState(context: ContextMode, state: Omit<ContextState, 'lastUpdated'>): void {
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const key = context === 'global' 
        ? CONTEXT_STORAGE_KEYS.globalContext 
        : CONTEXT_STORAGE_KEYS.tenantContext
      
      const stateWithTimestamp: ContextState = {
        ...state,
        lastUpdated: Date.now()
      }
      
      localStorage.setItem(key, JSON.stringify(stateWithTimestamp))
    } catch (error) {
      console.error(`Failed to set ${context} context state:`, error)
    }
  }
  
  // Clear context state
  clearContextState(context: ContextMode): void {
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const key = context === 'global' 
        ? CONTEXT_STORAGE_KEYS.globalContext 
        : CONTEXT_STORAGE_KEYS.tenantContext
      
      localStorage.removeItem(key)
      tokenManager.clearTokens(context)
    } catch (error) {
      console.error(`Failed to clear ${context} context state:`, error)
    }
  }
  
  // Validate context
  validateContext(context: ContextMode, state?: ContextState): ContextValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!this.config.validationEnabled) {
      return { isValid: true, errors, warnings }
    }
    
    const contextState = state || this.getContextState(context)
    
    if (!contextState) {
      errors.push(`No state found for ${context} context`)
      return { isValid: false, errors, warnings }
    }
    
    // Validate tokens
    if (!tokenManager.validateTokens(context)) {
      errors.push(`Invalid or expired tokens for ${context} context`)
    }
    
    // Validate user data
    if (contextState.isAuthenticated && !contextState.user) {
      errors.push(`Authenticated state without user data in ${context} context`)
    }
    
    // Validate tenant context specifics
    if (context === 'tenant') {
      if (!contextState.tenantId) {
        errors.push('Tenant context missing tenant ID')
      }
      
      if (contextState.user && !contextState.user.tenant_id) {
        warnings.push('User in tenant context has no tenant_id')
      }
    }
    
    // Check cache expiry
    if (this.isCacheExpired(contextState.lastUpdated)) {
      warnings.push(`${context} context cache has expired`)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  // Switch context
  async switchContext(
    targetMode: ContextMode, 
    tenantId?: string, 
    options: ContextSwitchOptions = {}
  ): Promise<ContextSwitchResult> {
    const currentMode = this.getCurrentMode()
    
    // Record switch attempt
    this.recordSwitchAttempt(currentMode, targetMode)
    
    try {
      // Validate current context if preserving
      if (options.preserveGlobalContext && currentMode === 'global') {
        const validation = this.validateContext('global')
        if (!validation.isValid) {
          console.warn('Current global context is invalid:', validation.errors)
        }
      }
      
      // Backup current context if needed
      if (options.preserveGlobalContext || currentMode === 'global') {
        tokenManager.backupTokens(currentMode)
      }
      
      // Validate target context
      if (targetMode === 'tenant' && !tenantId) {
        return {
          success: false,
          previousMode: currentMode,
          newMode: currentMode,
          error: 'Tenant ID required for tenant context switch',
          rollbackAvailable: false
        }
      }
      
      // Check if target context is available
      const targetState = this.getContextState(targetMode)
      if (targetMode !== 'global' && !targetState && !options.fallbackToGlobal) {
        return {
          success: false,
          previousMode: currentMode,
          newMode: currentMode,
          error: `No valid ${targetMode} context available`,
          rollbackAvailable: true
        }
      }
      
      // Perform the switch
      this.setCurrentMode(targetMode)
      
      // Update tenant context if switching to tenant
      if (targetMode === 'tenant' && tenantId) {
        const currentTenantState = this.getContextState('tenant')
        if (currentTenantState) {
          this.setContextState('tenant', {
            ...currentTenantState,
            tenantId
          })
        }
      }
      
      return {
        success: true,
        previousMode: currentMode,
        newMode: targetMode,
        rollbackAvailable: true
      }
      
    } catch (error) {
      console.error('Context switch failed:', error)
      
      // Attempt rollback
      this.setCurrentMode(currentMode)
      
      return {
        success: false,
        previousMode: currentMode,
        newMode: currentMode,
        error: error instanceof Error ? error.message : 'Unknown error during context switch',
        rollbackAvailable: false
      }
    }
  }
  
  // Rollback to previous context
  async rollbackContext(): Promise<ContextSwitchResult> {
    const currentMode = this.getCurrentMode()
    
    // Find last successful switch
    const lastSwitch = this.switchHistory[this.switchHistory.length - 1]
    if (!lastSwitch) {
      return {
        success: false,
        previousMode: currentMode,
        newMode: currentMode,
        error: 'No previous context to rollback to',
        rollbackAvailable: false
      }
    }
    
    // Attempt to restore tokens
    const tokensRestored = tokenManager.restoreTokens(lastSwitch.from)
    
    if (tokensRestored) {
      this.setCurrentMode(lastSwitch.from)
      return {
        success: true,
        previousMode: currentMode,
        newMode: lastSwitch.from,
        rollbackAvailable: false
      }
    }
    
    return {
      success: false,
      previousMode: currentMode,
      newMode: currentMode,
      error: 'Failed to restore previous context tokens',
      rollbackAvailable: false
    }
  }
  
  // Preserve current context
  preserveCurrentContext(): void {
    const currentMode = this.getCurrentMode()
    const tokens = tokenManager.getTokens(currentMode)
    
    if (tokens.accessToken) {
      tokenManager.backupTokens(currentMode)
    }
  }
  
  // Auto-detect optimal context
  detectOptimalContext(user?: AppUser): ContextMode {
    if (!this.config.autoSwitchEnabled) {
      return this.getCurrentMode()
    }
    
    // If user has tenant_id, prefer tenant context
    if (user?.tenant_id) {
      const tenantState = this.getContextState('tenant')
      if (tenantState && this.validateContext('tenant').isValid) {
        return 'tenant'
      }
    }
    
    // Fallback to global context
    const globalState = this.getContextState('global')
    if (globalState && this.validateContext('global').isValid) {
      return 'global'
    }
    
    // Default fallback based on strategy
    return this.config.fallbackStrategy === 'tenant' ? 'tenant' : 'global'
  }
  
  // Check if user can switch to tenant
  canSwitchToTenant(tenantId: string, user?: AppUser): boolean {
    // Check if user belongs to tenant
    if (user?.tenant_id === tenantId) {
      return true
    }
    
    // Check if user has system admin role
    if (user?.roles?.includes('system_admin')) {
      return true
    }
    
    // Check if tenant context exists and is valid
    const tenantState = this.getContextState('tenant')
    if (tenantState?.tenantId === tenantId) {
      return this.validateContext('tenant').isValid
    }
    
    return false
  }
  
  // Utility methods
  private isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.config.cacheTimeout
  }
  
  private recordSwitchAttempt(from: ContextMode, to: ContextMode): void {
    this.switchHistory.push({
      from,
      to,
      timestamp: Date.now()
    })
    
    // Keep only last 10 switches
    if (this.switchHistory.length > 10) {
      this.switchHistory = this.switchHistory.slice(-10)
    }
    
    // Store last switch timestamp
    try {
      localStorage.setItem(CONTEXT_STORAGE_KEYS.lastSwitch, Date.now().toString())
    } catch (error) {
      console.error('Failed to record switch attempt:', error)
    }
  }
  
  // Clear all context data
  clearAllContexts(): void {
    this.clearContextState('global')
    this.clearContextState('tenant')
    
    try {
      localStorage.removeItem(CONTEXT_STORAGE_KEYS.currentMode)
      localStorage.removeItem(CONTEXT_STORAGE_KEYS.lastSwitch)
    } catch (error) {
      console.error('Failed to clear context storage:', error)
    }
    
    this.switchHistory = []
  }
  
  // Get context statistics
  getContextStats() {
    return {
      currentMode: this.getCurrentMode(),
      globalContextValid: this.validateContext('global').isValid,
      tenantContextValid: this.validateContext('tenant').isValid,
      switchHistory: this.switchHistory.slice(-5), // Last 5 switches
      config: this.config
    }
  }
}

// Export singleton instance
export const contextManager = ContextManager.getInstance()

// Utility functions
export const getCurrentContextMode = (): ContextMode => {
  return contextManager.getCurrentMode()
}

export const switchToContext = (
  mode: ContextMode, 
  tenantId?: string, 
  options?: ContextSwitchOptions
): Promise<ContextSwitchResult> => {
  return contextManager.switchContext(mode, tenantId, options)
}

export const validateCurrentContext = (): ContextValidationResult => {
  const currentMode = contextManager.getCurrentMode()
  return contextManager.validateContext(currentMode)
}

export const canUserSwitchToTenant = (tenantId: string, user?: AppUser): boolean => {
  return contextManager.canSwitchToTenant(tenantId, user)
}