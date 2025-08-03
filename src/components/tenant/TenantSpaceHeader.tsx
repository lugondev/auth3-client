'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LogOut, 
  Crown,
} from 'lucide-react'
import { toast } from 'sonner'

interface TenantSpaceHeaderProps {
  tenantId: string
  tenantName?: string
}

export const TenantSpaceHeader: React.FC<TenantSpaceHeaderProps> = ({
  tenantId,
  tenantName
}) => {
  const router = useRouter()
  const { switchToGlobal, user, currentMode } = useAuth()

  const handleExitTenantSpace = async () => {
    try {
      // Check if user is global admin - if yes, preserve global context to maintain admin access
      const isGlobalAdmin = user?.roles?.includes('admin') || user?.roles?.includes('SystemAdmin')
      const preserveGlobal = isGlobalAdmin
      
      // Switch back to global context
      const result = await switchToGlobal({ preserveGlobalContext: preserveGlobal })
      
      if (result.success) {
        toast.success('Switched to global access token')
        // If user is global admin, redirect to admin area, otherwise tenant management
        if (isGlobalAdmin) {
          router.push('/dashboard/admin')
        } else {
          router.push('/dashboard/tenant-management')
        }
      } else {
        toast.error(result.error || 'Failed to switch to global context')
      }
    } catch (error) {
      console.error('Failed to exit tenant space:', error)
      toast.error('Failed to switch to global context')
    }
  }

  const handleBackToDashboard = () => {
    router.push(`/dashboard/tenant/${tenantId}`)
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-foreground">
                {tenantName || `Tenant ${tenantId}`}
              </h1>
              <Badge variant="secondary" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Tenant Space
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExitTenantSpace}
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            {user?.roles?.includes('admin') || user?.roles?.includes('SystemAdmin') 
              ? 'Back to Admin' 
              : 'Switch to Global Token'
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
