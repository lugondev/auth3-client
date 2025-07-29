// Tenant Auth Configuration Service (Main focus)
export { tenantAuthConfigService } from './tenantAuthConfigService'
export type { TenantAuthConfigService } from './tenantAuthConfigService'

// Key Authentication Services
export { 
  exchangeFirebaseToken,
  signInWithEmail,
  register,
  logoutUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  generate2FASecret,
  enable2FA,
  disable2FA,
  requestLoginLink,
  verifyLoginLink,
  loginTenantContext,
  loginGlobalContext
} from './authService'

// Key Tenant Services
export {
  createTenant,
  listTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getOwnedTenants,
  addUserToTenant,
  removeUserFromTenant
} from './tenantService'

// Error Handling Utility
export { withErrorHandling } from './errorHandlingService'

// Note: Other services can be imported directly when needed to avoid naming conflicts
// Example: import { specificFunction } from '@/services/specificService'
