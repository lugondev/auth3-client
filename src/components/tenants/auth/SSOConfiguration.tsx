'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Key, Info, AlertTriangle } from 'lucide-react'

interface SSOConfigurationProps {
  tenantId: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function SSOConfiguration({ tenantId, enabled, onToggle }: SSOConfigurationProps) {
  const [ssoType, setSSOType] = useState<'saml' | 'oidc'>('saml')
  const [samlConfig, setSamlConfig] = useState({
    idpMetadataUrl: '',
    spEntityId: '',
    assertionUrl: '',
    signingCert: '',
    encryptionCert: '',
  })
  const [oidcConfig, setOidcConfig] = useState({
    issuer: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scope: 'openid email profile',
  })

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>SSO Configuration</span>
            <Badge variant="secondary">Disabled</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              SSO is currently disabled. Enable it in the Authentication Configuration section to start configuring identity providers.
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
          <Key className="h-5 w-5" />
          <span>SSO Configuration</span>
          <Badge variant="default">Enabled</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={ssoType} onValueChange={(value) => setSSOType(value as 'saml' | 'oidc')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
            <TabsTrigger value="oidc">OpenID Connect</TabsTrigger>
          </TabsList>

          <TabsContent value="saml" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                SAML configuration is coming soon. This feature is under development.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 opacity-50">
              <div className="space-y-2">
                <Label htmlFor="idp-metadata-url">Identity Provider Metadata URL</Label>
                <Input
                  id="idp-metadata-url"
                  placeholder="https://your-idp.com/metadata"
                  value={samlConfig.idpMetadataUrl}
                  onChange={(e) => setSamlConfig({ ...samlConfig, idpMetadataUrl: e.target.value })}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sp-entity-id">Service Provider Entity ID</Label>
                <Input
                  id="sp-entity-id"
                  placeholder="https://your-app.com/saml/metadata"
                  value={samlConfig.spEntityId}
                  onChange={(e) => setSamlConfig({ ...samlConfig, spEntityId: e.target.value })}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assertion-url">Assertion Consumer Service URL</Label>
                <Input
                  id="assertion-url"
                  placeholder="https://your-app.com/saml/acs"
                  value={samlConfig.assertionUrl}
                  onChange={(e) => setSamlConfig({ ...samlConfig, assertionUrl: e.target.value })}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signing-cert">Signing Certificate (Optional)</Label>
                <Textarea
                  id="signing-cert"
                  placeholder="-----BEGIN CERTIFICATE-----"
                  value={samlConfig.signingCert}
                  onChange={(e) => setSamlConfig({ ...samlConfig, signingCert: e.target.value })}
                  disabled
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="oidc" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                OpenID Connect configuration is coming soon. This feature is under development.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 opacity-50">
              <div className="space-y-2">
                <Label htmlFor="oidc-issuer">Issuer URL</Label>
                <Input
                  id="oidc-issuer"
                  placeholder="https://your-oidc-provider.com"
                  value={oidcConfig.issuer}
                  onChange={(e) => setOidcConfig({ ...oidcConfig, issuer: e.target.value })}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oidc-client-id">Client ID</Label>
                <Input
                  id="oidc-client-id"
                  placeholder="your-client-id"
                  value={oidcConfig.clientId}
                  onChange={(e) => setOidcConfig({ ...oidcConfig, clientId: e.target.value })}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oidc-client-secret">Client Secret</Label>
                <Input
                  id="oidc-client-secret"
                  type="password"
                  placeholder="your-client-secret"
                  value={oidcConfig.clientSecret}
                  onChange={(e) => setOidcConfig({ ...oidcConfig, clientSecret: e.target.value })}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oidc-redirect-uri">Redirect URI</Label>
                <Input
                  id="oidc-redirect-uri"
                  placeholder="https://your-app.com/auth/callback"
                  value={oidcConfig.redirectUri}
                  onChange={(e) => setOidcConfig({ ...oidcConfig, redirectUri: e.target.value })}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oidc-scope">Scope</Label>
                <Input
                  id="oidc-scope"
                  placeholder="openid email profile"
                  value={oidcConfig.scope}
                  onChange={(e) => setOidcConfig({ ...oidcConfig, scope: e.target.value })}
                  disabled
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <Button disabled className="w-full">
            Save SSO Configuration (Coming Soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
