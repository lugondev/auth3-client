import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, RefreshCw } from 'lucide-react'

interface PermissionsViewProps {
  tenantId?: string
  title?: string
}

export const PermissionsView: React.FC<PermissionsViewProps> = ({
  tenantId,
  title = 'Permissions'
}) => {
  const {
    permissions,
    loading,
    error,
    loadPermissions,
    clearCache,
    hasPermission,
    isLoaded
  } = usePermissions({ 
    tenantId, 
    autoLoad: true 
  })

  const handleRefresh = () => {
    loadPermissions(true) // Force refresh
  }

  const handleClearCache = () => {
    clearCache()
    loadPermissions(true) // Reload after clearing cache
  }

  if (loading && !isLoaded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading permissions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Permissions</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => loadPermissions(true)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!permissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Permissions</CardTitle>
          <CardDescription>No permissions data available</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => loadPermissions(true)} variant="outline">
            Load Permissions
          </Button>
        </CardContent>
      </Card>
    )
  }

  const groupedPermissions = permissions.permissions.reduce((acc, [object, action]) => {
    if (!acc[object]) {
      acc[object] = []
    }
    acc[object].push(action)
    return acc
  }, {} as Record<string, string[]>)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {tenantId ? `Tenant permissions for ${tenantId}` : 'Global permissions'}
              <br />
              Total: {permissions.permissions.length} permissions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleClearCache}
              variant="outline"
              size="sm"
            >
              Clear Cache
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([object, actions]) => (
            <div key={object} className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                {object}
              </h3>
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Badge key={`${object}.${action}`} variant="secondary">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick permission checks for demonstration */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-2">Quick Checks</h4>
          <div className="space-y-1 text-sm">
            <div>
              Can create tenants: {' '}
              <Badge variant={hasPermission('tenant', 'create') ? 'default' : 'destructive'}>
                {hasPermission('tenant', 'create') ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              Can manage users: {' '}
              <Badge variant={hasPermission('user', 'manage') ? 'default' : 'destructive'}>
                {hasPermission('user', 'manage') ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              Can read analytics: {' '}
              <Badge variant={hasPermission('analytics', 'read') ? 'default' : 'destructive'}>
                {hasPermission('analytics', 'read') ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PermissionsView
