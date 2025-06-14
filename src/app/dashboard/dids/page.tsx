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

// Types for DID data
interface DIDDocument {
  id: string
  method: 'key' | 'web' | 'ethr' | 'ion' | 'peer'
  status: 'active' | 'deactivated' | 'revoked'
  created_at: string
  updated_at: string
  document: Record<string, unknown>
}

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
  const [dids, setDids] = useState<DIDDocument[]>([])
  const [stats, setStats] = useState<DIDStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch DIDs and statistics
  useEffect(() => {
    const fetchDIDs = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call
        // const response = await didService.getUserDIDs()
        // setDids(response.dids)
        // setStats(response.stats)
        
        // Mock data for now
        const mockDIDs: DIDDocument[] = [
          {
            id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
            method: 'key',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            document: {}
          },
          {
            id: 'did:web:example.com:users:alice',
            method: 'web',
            status: 'active',
            created_at: '2024-01-10T14:20:00Z',
            updated_at: '2024-01-10T14:20:00Z',
            document: {}
          },
          {
            id: 'did:ethr:0x1234567890123456789012345678901234567890',
            method: 'ethr',
            status: 'deactivated',
            created_at: '2024-01-05T09:15:00Z',
            updated_at: '2024-01-20T16:45:00Z',
            document: {}
          }
        ]
        
        const mockStats: DIDStats = {
          total: 3,
          active: 2,
          deactivated: 1,
          revoked: 0,
          byMethod: {
            key: 1,
            web: 1,
            ethr: 1,
            ion: 0,
            peer: 0
          }
        }
        
        setDids(mockDIDs)
        setStats(mockStats)
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
  const handleDeactivate = async (didId: string) => {
    try {
      // TODO: Implement actual API call
      // await didService.deactivateDID(didId)
      console.log('Deactivating DID:', didId)
      // Refresh the list
      // fetchDIDs()
    } catch (err) {
      console.error('Error deactivating DID:', err)
    }
  }

  /**
   * Handle DID revocation
   */
  const handleRevoke = async (didId: string) => {
    try {
      // TODO: Implement actual API call
      // await didService.revokeDID(didId)
      console.log('Revoking DID:', didId)
      // Refresh the list
      // fetchDIDs()
    } catch (err) {
      console.error('Error revoking DID:', err)
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
                      <div className="max-w-xs truncate" title={did.id}>
                        {did.id}
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
                            onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(did.id)}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {did.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(did.id)}
                              className="text-orange-600"
                            >
                              <Power className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          {did.status !== 'revoked' && (
                            <DropdownMenuItem
                              onClick={() => handleRevoke(did.id)}
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