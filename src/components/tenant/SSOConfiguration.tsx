import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SSOConfig, SSOProvider } from '@/types/tenant-auth'
import { Plus, Trash2, ExternalLink, Key } from 'lucide-react'
import { toast } from 'sonner'

interface SSOConfigurationProps {
  tenantId: string
  config?: SSOConfig
  onTestConnection?: (providerId: string) => Promise<{ success: boolean; message: string }>
  onUpdateConfig?: (config: SSOConfig) => Promise<void>
}

export function SSOConfiguration({ 
  tenantId, 
  config, 
  onTestConnection,
  onUpdateConfig 
}: SSOConfigurationProps) {
  const [activeProvider, setActiveProvider] = useState<SSOProvider | null>(
    config?.providers?.[0] || null
  )

  const handleAddProvider = () => {
    // In a real implementation, this would open a modal/form to add a new provider
    toast.info('Add SSO Provider functionality will be implemented')
  }

  const handleRemoveProvider = async (providerId: string) => {
    if (!config || !config.providers) return
    
    try {
      const updatedProviders = config.providers.filter(p => p.id !== providerId)
      const updatedConfig = { ...config, providers: updatedProviders }
      
      if (onUpdateConfig) {
        await onUpdateConfig(updatedConfig)
        toast.success('SSO provider removed successfully')
      }
    } catch (error) {
      toast.error('Failed to remove SSO provider')
    }
  }

  const handleTestConnection = async (provider: SSOProvider) => {
    if (!onTestConnection) {
      toast.info('Test connection functionality not available')
      return
    }

    try {
      const result = await onTestConnection(provider.id)
      if (result.success) {
        toast.success(result.message || 'Connection test successful')
      } else {
        toast.error(result.message || 'Connection test failed')
      }
    } catch (error) {
      toast.error('Failed to test connection')
    }
  }

  const handleToggleProvider = async (provider: SSOProvider, enabled: boolean) => {
    if (!config || !config.providers) return

    try {
      const updatedProviders = config.providers.map(p => 
        p.id === provider.id ? { ...p, enabled } : p
      )
      const updatedConfig = { ...config, providers: updatedProviders }
      
      if (onUpdateConfig) {
        await onUpdateConfig(updatedConfig)
        toast.success(`Provider ${enabled ? 'enabled' : 'disabled'} successfully`)
      }
    } catch (error) {
      toast.error(`Failed to ${enabled ? 'enable' : 'disable'} provider`)
    }
  }

  if (!config) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="text-center">
            <ExternalLink className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No SSO Configuration</h3>
            <p className="text-gray-500 mb-4">
              Configure SSO providers to allow users to authenticate with external identity providers.
            </p>
            <Button onClick={handleAddProvider}>
              <Plus className="h-4 w-4 mr-2" />
              Add SSO Provider
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">SSO Providers</CardTitle>
              <CardDescription>
                Manage external identity providers for single sign-on
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddProvider}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config.providers && config.providers.length > 0 ? (
            <Tabs value={activeProvider?.id} onValueChange={(value) => {
              const provider = config.providers?.find(p => p.id === value)
              setActiveProvider(provider || null)
            }}>
              <TabsList className="grid w-full grid-cols-auto">
                {config.providers.map((provider) => (
                  <TabsTrigger key={provider.id} value={provider.id}>
                    {provider.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {config.providers.map((provider) => (
                <TabsContent key={provider.id} value={provider.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium">{provider.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{provider.type}</Badge>
                        <Badge variant={provider.enabled ? "default" : "secondary"}>
                          {provider.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(provider)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveProvider(provider.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-client-id`}>Client ID</Label>
                      <Input
                        id={`${provider.id}-client-id`}
                        value={provider.client_id}
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-client-secret`}>Client Secret</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id={`${provider.id}-client-secret`}
                          type="password"
                          value="••••••••••••••••"
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button size="sm" variant="outline">
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-auth-url`}>Authorization URL</Label>
                      <Input
                        id={`${provider.id}-auth-url`}
                        value={provider.auth_url}
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-token-url`}>Token URL</Label>
                      <Input
                        id={`${provider.id}-token-url`}
                        value={provider.token_url}
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-user-info-url`}>User Info URL</Label>
                      <Input
                        id={`${provider.id}-user-info-url`}
                        value={provider.user_info_url}
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-scopes`}>Scopes</Label>
                      <div className="flex flex-wrap gap-1">
                        {provider.scopes?.map((scope, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor={`${provider.id}-enabled`}>Enable Provider</Label>
                        <p className="text-sm text-gray-500">
                          Allow users to authenticate using this provider
                        </p>
                      </div>
                      <Switch
                        id={`${provider.id}-enabled`}
                        checked={provider.enabled}
                        onCheckedChange={(checked) => handleToggleProvider(provider, checked)}
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <ExternalLink className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No SSO Providers</h3>
              <p className="text-gray-500 mb-4">
                Add SSO providers to enable single sign-on for your users.
              </p>
              <Button onClick={handleAddProvider}>
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
