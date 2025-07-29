'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Settings, Users } from 'lucide-react'
import { MFAPolicy } from '@/types/tenant-auth'
import { useTenantAuthConfig } from '@/hooks/useTenantAuthConfig'

interface TenantAuthConfigSectionProps {
  tenantId: string
  onSSOStateChange?: (enabled: boolean) => void
}

export function TenantAuthConfigSection({ tenantId, onSSOStateChange }: TenantAuthConfigSectionProps) {
  const { 
    config, 
    loading, 
    saving, 
    error,
    toggleSSO, 
    updateMFAPolicy, 
    toggleAutoJoin 
  } = useTenantAuthConfig(tenantId)

  const handleMFAPolicyChange = (policy: string) => {
    updateMFAPolicy(policy as MFAPolicy)
  }

  const handleSSOToggle = (enabled: boolean) => {
    toggleSSO(enabled)
  }

  const handleAutoJoinToggle = (enabled: boolean) => {
    toggleAutoJoin(enabled)
  }

  // Notify parent component about SSO state changes
  React.useEffect(() => {
    if (config && onSSOStateChange) {
      onSSOStateChange(config.enable_sso)
    }
  }, [config?.enable_sso, onSSOStateChange])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Authentication Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading authentication settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Authentication Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {error || 'Failed to load authentication configuration'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Authentication Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SSO Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Single Sign-On (SSO)</span>
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sso-enabled">Enable SSO</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to sign in using external identity providers
              </p>
            </div>
            <Switch
              id="sso-enabled"
              checked={config.enable_sso}
              onCheckedChange={handleSSOToggle}
              disabled={saving}
            />
          </div>

          {config.enable_sso && (
            <Alert>
              <AlertDescription>
                SSO is enabled. Configure your identity providers using the SSO Configuration section below.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* MFA Policy */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Multi-Factor Authentication (MFA)</span>
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="mfa-policy">MFA Policy</Label>
            <Select 
              value={config.mfa_policy} 
              onValueChange={handleMFAPolicyChange}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select MFA policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MFAPolicy.Disabled}>Disabled</SelectItem>
                <SelectItem value={MFAPolicy.OptionalForAll}>Optional for All Users</SelectItem>
                <SelectItem value={MFAPolicy.MandatoryForAdmins}>Mandatory for Admins</SelectItem>
                <SelectItem value={MFAPolicy.MandatoryForAll}>Mandatory for All Users</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {config.mfa_policy === MFAPolicy.Disabled && 'MFA is not required for any users'}
              {config.mfa_policy === MFAPolicy.OptionalForAll && 'Users can optionally enable MFA'}
              {config.mfa_policy === MFAPolicy.MandatoryForAdmins && 'MFA is required for admin users only'}
              {config.mfa_policy === MFAPolicy.MandatoryForAll && 'MFA is required for all users'}
            </p>
          </div>
        </div>

        {/* Auto Join Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span>User Auto-Join</span>
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-join-enabled">Allow Auto-Join</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to automatically join this tenant without approval
              </p>
            </div>
            <Switch
              id="auto-join-enabled"
              checked={config.allow_auto_join}
              onCheckedChange={handleAutoJoinToggle}
              disabled={saving}
            />
          </div>

          {!config.allow_auto_join && (
            <Alert>
              <AlertDescription>
                Auto-join is disabled. New users will need approval to join this tenant.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {saving && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving changes...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
