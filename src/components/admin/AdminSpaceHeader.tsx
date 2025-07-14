'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  LogOut, 
  Shield, 
  ArrowLeft, 
  Settings,
  ShieldCheck,
  Users,
  Home
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminSpaceHeaderProps {
  // Removed unnecessary props
}

export const AdminSpaceHeader: React.FC<AdminSpaceHeaderProps> = () => {
  const router = useRouter()
  const { switchToGlobal, user, currentMode } = useAuth()

  const handleExitAdminSpace = async () => {
    try {
      // Switch back to global context
      await switchToGlobal()
      
      toast.success('Exited admin space successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to exit admin space:', error)
      toast.error('Failed to exit admin space')
    }
  }

  const handleBackToAdminDashboard = () => {
    router.push('/dashboard/admin')
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-foreground">
                System Administration
              </h1>
              <Badge variant="destructive" className="text-xs">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Admin Space
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExitAdminSpace}
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Exit Admin Space
          </Button>
        </div>
      </div>
    </div>
  )
}
