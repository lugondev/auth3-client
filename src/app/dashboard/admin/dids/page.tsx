'use client'

import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Custom hooks
import { useAdminDIDList } from '@/hooks/useAdminDIDList'
import { useAdminDIDActions } from '@/hooks/useAdminDIDActions'

// Components
import { AdminDIDStatsCards } from '@/components/admin/AdminDIDStatsCards'
import { AdminDIDTable } from '@/components/admin/AdminDIDTable'
import { DIDPagination } from '@/components/did/DIDPagination'

export default function AdminDIDDashboard() {
  // Custom hooks for data management
  const {
    dids,
    stats,
    loading,
    error,
    pagination,
    filters,
    refetch,
    setSearchTerm,
    setMethodFilter,
    setStatusFilter,
    changePage,
  } = useAdminDIDList()

  const { actionLoading, deactivateDID, revokeDID } = useAdminDIDActions(() => {
    // Refresh data after successful action
    refetch()
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="DID Administration"
        description="Manage and monitor all DIDs across the system"
        actions={
          <Link href="/dashboard/admin/dids/config">
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Method Configuration
            </Button>
          </Link>
        }
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <AdminDIDStatsCards stats={stats} loading={loading} />

      {/* Main Content - DID Management */}
      <Card>
        <CardHeader>
          <CardTitle>DID Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminDIDTable
            dids={dids}
            loading={loading}
            actionLoading={actionLoading}
            searchTerm={filters.searchTerm}
            methodFilter={filters.methodFilter}
            statusFilter={filters.statusFilter}
            onSearchChange={setSearchTerm}
            onMethodFilterChange={setMethodFilter}
            onStatusFilterChange={setStatusFilter}
            onDeactivate={deactivateDID}
            onRevoke={revokeDID}
          />

          {/* Pagination */}
          <DIDPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={changePage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
