'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Eye, Trash2, Power, MoreHorizontal, Key, Globe, Coins, Network, Users } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as didService from '@/services/didService'
import type { DIDResponse } from '@/types/did'

// Types for DID data - using types from API
interface DIDStats {
  total: number
  active: number
  deactivated: number
  revoked: number
  byMethod: Record<string, number>
}

/**
 * DID Dashboard Page - Main page for managing DIDs
 * Displays user's DIDs with status indicators and quick actions
 */
export default function DIDDashboardPage() {
  const router = useRouter()
  const [dids, setDids] = useState<DIDResponse[]>([])
  const [stats, setStats] = useState<DIDStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch DIDs and statistics
  useEffect(() => {
    const fetchDIDs = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch user's DIDs
        const didsResponse = await didService.listDIDs()
        setDids(didsResponse.dids || [])
        
        // Fetch DID statistics
        const statsResponse = await didService.getDIDStatistics()
        
        // Convert statistics to local format
        const convertedStats: DIDStats = {
          total: statsResponse.total,
          active: statsResponse.active,
          deactivated: statsResponse.deactivated,
          revoked: statsResponse.revoked,
          byMethod: statsResponse.by_method
        }
        
        setStats(convertedStats)
      } catch (err) {
        setError('Failed to fetch DIDs')
        console.error('Error fetching DIDs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDIDs()
  }, [])

  /**
   * Get status badge variant based on DID status
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'deactivated':
        return <Badge variant="secondary">Deactivated</Badge>
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  /**
   * Get method icon based on DID method
   */
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'key':
        return <Key className="h-4 w-4" />
      case 'web':
        return <Globe className="h-4 w-4" />
      case 'ethr':
        return <Coins className="h-4 w-4" />
      case 'ion':
        return <Network className="h-4 w-4" />
      case 'peer':
        return <Users className="h-4 w-4" />
      default:
        return <Key className="h-4 w-4" />
    }
  }

  /**
   * Handle DID deactivation
   */
  const handleDeactivate = async (did: DIDResponse) => {
    try {
      await didService.deactivateDID({ 
        id: did.id,
        did: did.did,
        user_id: did.user_id,
        reason: 'User requested deactivation'
      })
      // Refresh the list
      window.location.reload()
    } catch (err) {
      console.error('Error deactivating DID:', err)
      setError('Failed to deactivate DID')
    }
  }

  /**
   * Handle DID revocation
   */
  const handleRevoke = async (did: DIDResponse) => {
    try {
      await didService.revokeDID({ 
        id: did.id,
        did: did.did,
        user_id: did.user_id,
        reason: 'User requested revocation'
      })
      // Refresh the list
      window.location.reload()
    } catch (err) {
      console.error('Error revoking DID:', err)
      setError('Failed to revoke DID')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="DID Management"
        description="Manage your Decentralized Identifiers (DIDs)"
        actions={
          <Link href="/dashboard/dids/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create DID
            </Button>
          </Link>
        }
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total DIDs</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deactivated</CardTitle>
              <div className="h-2 w-2 bg-gray-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.deactivated}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revoked</CardTitle>
              <div className="h-2 w-2 bg-red-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DIDs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your DIDs</CardTitle>
          <CardDescription>
            A list of all your Decentralized Identifiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dids.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No DIDs found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first DID</p>
              <Link href="/dashboard/dids/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create DID
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DID</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dids.map((did) => (
                  <TableRow key={did.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="max-w-xs truncate" title={did.did}>
                        {did.did}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(did.method)}
                        <span className="capitalize">{did.method}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(did.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(did.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(did.did)}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {did.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(did)}
                              className="text-orange-600"
                            >
                              <Power className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          {did.status !== 'revoked' && (
                            <DropdownMenuItem
                              onClick={() => handleRevoke(did)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}