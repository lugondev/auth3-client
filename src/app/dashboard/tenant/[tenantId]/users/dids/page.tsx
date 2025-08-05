'use client'

import { useParams } from 'next/navigation'
import TenantUserDIDs from '@/components/tenants/TenantUserDIDs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'

export default function TenantUserDIDsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  if (!tenantId) {
    return (
      <AppShell sidebarType="user">
        <div className="flex h-screen items-center justify-center">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">Invalid tenant ID</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell sidebarType="user">
      <div className="p-6">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href={`/dashboard/tenant/${tenantId}`}
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenant Dashboard
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-card shadow rounded-lg border">
          <div className="p-6">
            <TenantUserDIDs tenantId={tenantId} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
