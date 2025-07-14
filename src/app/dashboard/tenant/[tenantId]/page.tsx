'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTenantInfo } from '@/hooks/useTenantInfo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  Calendar,
  Database,
  Activity,
  TrendingUp
} from 'lucide-react'

export default function TenantDashboardPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { user } = useAuth()
  const { tenantInfo, tenantName, loading: tenantLoading } = useTenantInfo(tenantId)

  const statsCards = [
    {
      title: 'Total Users',
      value: '24',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Sessions',
      value: '18',
      change: '+5%',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Documents',
      value: '156',
      change: '+23%',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Performance',
      value: '98.5%',
      change: '+2.1%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage tenant users and permissions',
      href: `/dashboard/tenant/${tenantId}/users`,
      icon: Users,
      color: 'border-blue-200 hover:border-blue-300',
    },
    {
      title: 'Settings',
      description: 'Configure tenant settings',
      href: `/dashboard/tenant/${tenantId}/settings`,
      icon: Settings,
      color: 'border-gray-200 hover:border-gray-300',
    },
    {
      title: 'Analytics',
      description: 'View tenant analytics and reports',
      href: `/dashboard/tenant/${tenantId}/analytics`,
      icon: BarChart3,
      color: 'border-green-200 hover:border-green-300',
    },
    {
      title: 'Data Management',
      description: 'Manage tenant data and storage',
      href: `/dashboard/tenant/${tenantId}/data`,
      icon: Database,
      color: 'border-purple-200 hover:border-purple-300',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {tenantLoading ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            `${tenantName || 'Tenant'} Dashboard`
          )}
        </h1>
        <p className="text-muted-foreground">
          Welcome to your tenant workspace. Manage your organization data and settings.
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="font-semibold">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary">
                  {user?.roles?.join(', ') || 'User'}
                </Badge>
                <Badge variant="outline">
                  {tenantLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    `Tenant: ${tenantName || tenantId}`
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-xs ${stat.color}`}>{stat.change} from last month</p>
                </div>
                <div className={`p-3 ${stat.bgColor} rounded-full`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Card key={action.title} className={`cursor-pointer transition-colors ${action.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <action.icon className="h-5 w-5" />
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">New user joined</p>
                <p className="text-sm text-muted-foreground">John Doe joined the tenant</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                2 hours ago
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Settings updated</p>
                <p className="text-sm text-muted-foreground">Tenant configuration changed</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                5 hours ago
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Document uploaded</p>
                <p className="text-sm text-muted-foreground">New document added to storage</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                1 day ago
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
