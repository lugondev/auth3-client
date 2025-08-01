'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Key, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

// Custom hooks
import { useDIDList } from '@/hooks/useDIDList'
import { useDIDStats } from '@/hooks/useDIDStats'
import { useDIDActions } from '@/hooks/useDIDActions'

// Components
import { DIDStatsCards } from '@/components/did/DIDStatsCards'
import { DIDTable } from '@/components/did/DIDTable'
import { DIDPagination } from '@/components/did/DIDPagination'

export default function SimpleDIDPage() {
  const { user } = useAuth()

  // Custom hooks for data management
  const { dids, loading: didsLoading, error, pagination, refetch, changePage } = useDIDList()
  const { stats, loading: statsLoading, refetch: refetchStats } = useDIDStats()
  const { actionLoading, deactivateDID, revokeDID } = useDIDActions(() => {
    // Refresh data after successful action
    refetch()
    refetchStats()
  })

  // Guard clause for authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access the DID management dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DID Management</h1>
          <p className="text-muted-foreground">Manage your Decentralized Identifiers</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/dids/register">
            <Button variant="secondary">
              <Key className="h-4 w-4 mr-2" />
              Register DID
            </Button>
          </Link>
          <Link href="/dashboard/dids/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create DID
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <DIDStatsCards stats={stats} loading={statsLoading} />

      {/* Main Content - DID Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your DIDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DIDTable
            dids={dids}
            loading={didsLoading}
            actionLoading={actionLoading}
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
