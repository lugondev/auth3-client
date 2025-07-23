// Debug utility to help diagnose token flow issues
import { contextManager } from '@/lib/context-manager'
import { tokenManager } from '@/lib/token-storage'

export const debugTokenFlow = () => {
  console.log('🔍 === TOKEN FLOW DEBUG ===')
  
  const currentMode = contextManager.getCurrentMode()
  const globalTokens = tokenManager.getTokens('global')
  const tenantTokens = tokenManager.getTokens('tenant')
  const expectedTokens = tokenManager.getTokens(currentMode)
  
  console.log(`Current Mode: ${currentMode}`)
  console.log(`Global Token: ${globalTokens.accessToken ? 'Available' : 'Missing'}`)
  console.log(`Tenant Token: ${tenantTokens.accessToken ? 'Available' : 'Missing'}`)
  console.log(`Expected Token (for current mode): ${expectedTokens.accessToken ? 'Available' : 'Missing'}`)
  
  const globalState = contextManager.getContextState('global')
  const tenantState = contextManager.getContextState('tenant')
  
  console.log(`Global Context Tenant ID: ${globalState?.tenantId || 'none'}`)
  console.log(`Tenant Context Tenant ID: ${tenantState?.tenantId || 'none'}`)
  
  console.log('🔍 === END DEBUG ===')
  
  return {
    currentMode,
    globalTokenAvailable: !!globalTokens.accessToken,
    tenantTokenAvailable: !!tenantTokens.accessToken,
    expectedTokenAvailable: !!expectedTokens.accessToken,
    globalContextTenantId: globalState?.tenantId,
    tenantContextTenantId: tenantState?.tenantId
  }
}

export const debugApiRequest = (url: string) => {
  console.log(`🔍 API Request to ${url}`)
  return debugTokenFlow()
}
