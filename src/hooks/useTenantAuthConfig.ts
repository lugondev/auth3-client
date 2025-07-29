import { useState, useEffect } from 'react'
import { TenantAuthConfig, UpdateTenantAuthConfigInput, MFAPolicy } from '@/types/tenant-auth'
import { tenantAuthConfigService } from '@/services/tenantAuthConfigService'
import { toast } from 'sonner'

export function useTenantAuthConfig(tenantId: string) {
  const [config, setConfig] = useState<TenantAuthConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await tenantAuthConfigService.getTenantAuthConfig(tenantId)
      setConfig(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load auth configuration'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (updates: UpdateTenantAuthConfigInput) => {
    try {
      setSaving(true)
      setError(null)

      const updatedConfig = await tenantAuthConfigService.updateTenantAuthConfig(tenantId, updates)
      setConfig(updatedConfig)
      toast.success('Authentication configuration updated successfully')
      return updatedConfig
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update auth configuration'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const toggleSSO = async (enabled: boolean) => {
    try {
      setSaving(true)
      const result = await tenantAuthConfigService.toggleSSO(tenantId, enabled)
      // Update the config state with the new SSO setting
      if (config) {
        setConfig({
          ...config,
          enable_sso: result.enable_sso,
          sso_config: result.sso_config,
          updated_at: result.updated_at
        })
      }
      toast.success(`SSO ${enabled ? 'enabled' : 'disabled'} successfully`)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle SSO'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const updateMFAPolicy = async (policy: MFAPolicy) => {
    try {
      setSaving(true)
      const result = await tenantAuthConfigService.updateMFAPolicy(tenantId, policy)
      // Update the config state with the new MFA policy
      if (config) {
        setConfig({
          ...config,
          mfa_policy: policy,
          updated_at: result.updated_at
        })
      }
      toast.success('MFA policy updated successfully')
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update MFA policy'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const toggleAutoJoin = async (enabled: boolean) => {
    try {
      setSaving(true)
      const result = await tenantAuthConfigService.toggleAutoJoin(tenantId, enabled)
      // Update the config state with the new auto-join setting
      if (config) {
        setConfig({
          ...config,
          allow_auto_join: result.allow_auto_join,
          updated_at: result.updated_at
        })
      }
      toast.success(`Auto-join ${enabled ? 'enabled' : 'disabled'} successfully`)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle auto-join'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const validateConfig = async () => {
    try {
      setError(null)
      const result = await tenantAuthConfigService.validateAuthConfig(tenantId)
      if (!result.valid && result.errors) {
        const errorMessage = result.errors.join(', ')
        setError(errorMessage)
        toast.error(`Configuration validation failed: ${errorMessage}`)
      } else {
        toast.success('Configuration is valid')
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate configuration'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  const testSSOProvider = async (providerId: string) => {
    try {
      const result = await tenantAuthConfigService.testSSOProvider(tenantId, providerId)
      if (result.success) {
        toast.success(result.message || 'SSO provider test successful')
      } else {
        toast.error(result.message || 'SSO provider test failed')
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to test SSO provider'
      toast.error(message)
      throw err
    }
  }

  useEffect(() => {
    if (tenantId) {
      loadConfig()
    }
  }, [tenantId])

  return {
    config,
    loading,
    saving,
    error,
    loadConfig,
    updateConfig,
    toggleSSO,
    updateMFAPolicy,
    toggleAutoJoin,
    validateConfig,
    testSSOProvider,
  }
}
