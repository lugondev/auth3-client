'use client'

import { useParams } from 'next/navigation'
import TenantDIDsTable from '@/components/tenants/TenantDIDsTable'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TenantAllDIDsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  if (!tenantId) {
    return (
     <div className="flex h-screen items-center justify-center">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">Invalid tenant ID</p>
          </div>
        </div>
    )
  }

  return (
     <div className="p-6">
        {/* Main Content */}
        <div className="bg-card shadow rounded-lg border">
          <div className="p-6">
            <TenantDIDsTable tenantId={tenantId} />
          </div>
        </div>
      </div>
  )
}
