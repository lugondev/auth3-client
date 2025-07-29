import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MFAPolicy, SSOConfig } from '@/types/tenant-auth'
import { SSOConfiguration } from './SSOConfiguration'
import { useTenantAuthConfig } from '@/hooks/useTenantAuthConfig'
import { Settings, Shield, UserCheck, Loader2 } from 'lucide-react'

interface TenantAuthConfigSectionProps {
  tenantId: string
}

export function TenantAuthConfigSection({ tenantId }: TenantAuthConfigSectionProps) {
  const { 
    config, 
    loading, 
    saving, 
    error,
    toggleSSO, 
    updateMFAPolicy, 
    toggleAutoJoin,
    testSSOProvider,
    updateConfig
  } = useTenantAuthConfig(tenantId)

  const handleUpdateSSOConfig = async (ssoConfig: SSOConfig) => {
    await updateConfig({ sso_config: ssoConfig })
  }

  const getMFAPolicyBadge = (policy: MFAPolicy) => {
    switch (policy) {
      case MFAPolicy.MandatoryForAll:
        return <Badge variant="destructive">Required for All</Badge>
      case MFAPolicy.MandatoryForAdmins:
        return <Badge variant="destructive">Required for Admins</Badge>
      case MFAPolicy.OptionalForAll:
        return <Badge variant="secondary">Optional</Badge>
      default:
        return <Badge variant="outline">Disabled</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading authentication configuration...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center text-red-700">
            <Settings className="h-5 w-5 mr-2" />
            <span>Error loading authentication configuration: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No authentication configuration found for this tenant.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Authentication Configuration
          </CardTitle>
          <CardDescription>
            Configure authentication policies and settings for this tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SSO Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-sso" className="text-sm font-medium flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Single Sign-On (SSO)
                </Label>
                <p className="text-sm text-gray-500">
                  Allow users to authenticate using external identity providers
                </p>
              </div>
              <Switch
                id="enable-sso"
                checked={config.enable_sso}
                onCheckedChange={toggleSSO}
                disabled={saving}
              />
            </div>

            {config.enable_sso && (
              <SSOConfiguration 
                tenantId={tenantId}
                config={config.sso_config}
                onTestConnection={testSSOProvider}
                onUpdateConfig={handleUpdateSSOConfig}
              />
            )}
          </div>

          {/* MFA Policy */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Multi-Factor Authentication Policy
                </Label>
                <p className="text-sm text-gray-500">
                  Configure MFA requirements for user authentication
                </p>
              </div>
              {getMFAPolicyBadge(config.mfa_policy)}
            </div>

            <Select
              value={config.mfa_policy}
              onValueChange={updateMFAPolicy}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select MFA policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MFAPolicy.Disabled}>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">Disabled</Badge>
                    MFA is disabled for all users
                  </div>
                </SelectItem>
                <SelectItem value={MFAPolicy.OptionalForAll}>
                  <div className="flex items-center">
                    <Badge variant="secondary" className="mr-2">Optional</Badge>
                    Users can choose to enable MFA
                  </div>
                </SelectItem>
                <SelectItem value={MFAPolicy.MandatoryForAdmins}>
                  <div className="flex items-center">
                    <Badge variant="destructive" className="mr-2">Required for Admins</Badge>
                    MFA is mandatory for admin users
                  </div>
                </SelectItem>
                <SelectItem value={MFAPolicy.MandatoryForAll}>
                  <div className="flex items-center">
                    <Badge variant="destructive" className="mr-2">Required for All</Badge>
                    MFA is mandatory for all users
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto Join */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="allow-auto-join" className="text-sm font-medium">
                  Allow Auto Join
                </Label>
                <p className="text-sm text-gray-500">
                  Allow users to automatically join this tenant without invitation
                </p>
              </div>
              <Switch
                id="allow-auto-join"
                checked={config.allow_auto_join}
                onCheckedChange={toggleAutoJoin}
                disabled={saving}
              />
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Current Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">SSO Status:</span>
                <Badge variant={config.enable_sso ? "default" : "outline"}>
                  {config.enable_sso ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">MFA Policy:</span>
                {getMFAPolicyBadge(config.mfa_policy)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Auto Join:</span>
                <Badge variant={config.allow_auto_join ? "default" : "outline"}>
                  {config.allow_auto_join ? "Allowed" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
