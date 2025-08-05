'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getTenantById } from '@/services/tenantService'
import { 
  Users, 
  Shield, 
  Settings, 
  Building2,
  Calendar,
  Crown,
  ExternalLink
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { formatDistanceToNow } from 'date-fns'

export default function TenantDetailPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => getTenantById(tenantId),
    enabled: !!tenantId,
  })

  if (isLoading) {
    return (
      <AppShell sidebarType='user'>
        <div className='flex h-screen items-center justify-center'>
          <div className='space-y-4'>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !tenant) {
    return (
      <AppShell sidebarType='user'>
        <div className='flex h-screen items-center justify-center'>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Failed to load tenant details.</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell sidebarType='user'>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-card border border-border shadow rounded-lg mb-6">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Building2 className="h-10 w-10 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
                    <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Created {formatDistanceToNow(new Date(tenant.created_at), { addSuffix: true })}
                      </span>
                      {tenant.owner && (
                        <span className="flex items-center">
                          <Crown className="mr-1 h-4 w-4" />
                          Owned by {tenant.owner.first_name} {tenant.owner.last_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenant.is_active 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {tenant.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <Link
                    href={`/dashboard/admin/tenants/${tenantId}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-border shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Users */}
            <Link
              href={`/dashboard/admin/tenants/${tenantId}/users`}
              className="bg-card border border-border overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Manage Users
                      </dt>
                      <dd className="text-lg font-medium text-foreground">
                        View and manage tenant users
                      </dd>
                    </dl>
                  </div>
                  <div className="flex-shrink-0">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </Link>

            {/* User DIDs */}
            <Link
              href={`/dashboard/admin/tenants/${tenantId}/user-dids`}
              className="bg-card border border-border overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        User DIDs
                      </dt>
                      <dd className="text-lg font-medium text-foreground">
                        DIDs organized by user
                      </dd>
                    </dl>
                  </div>
                  <div className="flex-shrink-0">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </Link>

            {/* All DIDs */}
            <Link
              href={`/dashboard/admin/tenants/${tenantId}/dids`}
              className="bg-card border border-border overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        All DIDs
                      </dt>
                      <dd className="text-lg font-medium text-foreground">
                        Complete DID overview
                      </dd>
                    </dl>
                  </div>
                  <div className="flex-shrink-0">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Settings */}
            <Link
              href={`/dashboard/admin/tenants/${tenantId}/edit`}
              className="bg-card border border-border overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Settings className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Tenant Settings
                      </dt>
                      <dd className="text-lg font-medium text-foreground">
                        Configure tenant
                      </dd>
                    </dl>
                  </div>
                  <div className="flex-shrink-0">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
