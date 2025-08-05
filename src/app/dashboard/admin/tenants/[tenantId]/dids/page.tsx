'use client'

import { useParams } from 'next/navigation'
import TenantDIDsTable from '@/components/tenants/TenantDIDsTable'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TenantDIDsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  if (!tenantId) {
    return (
        <div className="flex h-screen items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Invalid tenant ID</p>
          </div>
        </div>
    )
  }

  return (
      <div className="p-6">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href={`/dashboard/admin/tenants/${tenantId}`}
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenant Details
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-card shadow rounded-lg border">
          <div className="p-6">
            <TenantDIDsTable tenantId={tenantId} />
          </div>
        </div>
      </div>
  )
}
