import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Eye, Settings, Power, Trash2, MoreHorizontal, Key, Globe, Coins, Network, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DIDResponse } from '@/types/did'
import { DIDStatus } from '@/types/did'

interface DIDTableProps {
  dids: DIDResponse[]
  loading: boolean
  actionLoading: Record<string, boolean>
  onDeactivate: (did: DIDResponse) => void
  onRevoke: (did: DIDResponse) => void
}

function getStatusBadge(status: string) {
  switch (status) {
    case DIDStatus.ACTIVE:
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Active
        </Badge>
      )
    case DIDStatus.DEACTIVATED:
      return <Badge variant="secondary">Deactivated</Badge>
    case DIDStatus.REVOKED:
      return <Badge variant="destructive">Revoked</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

function getMethodIcon(method: string) {
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

export function DIDTable({ dids, loading, actionLoading, onDeactivate, onRevoke }: DIDTableProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (dids.length === 0) {
    return (
      <div className="text-center py-12">
        <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No DIDs found</h3>
        <p className="text-gray-500 mb-4">Get started by creating a new DID</p>
        <Button onClick={() => router.push('/dashboard/dids/create')}>
          Create DID
        </Button>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>DID</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dids.map((did) => (
          <TableRow key={did.id}>
            <TableCell className="font-mono text-sm">
              <div className="max-w-xs truncate" title={String(did.did)}>
                {String(did.did)}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getMethodIcon(did.method)}
                <span className="capitalize">{did.method}</span>
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(did.status)}</TableCell>
            <TableCell>{new Date(did.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(String(did.did))}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(String(did.did))}/edit`)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Document
                  </DropdownMenuItem>
                  {did.status === DIDStatus.ACTIVE && (
                    <DropdownMenuItem
                      onClick={() => onDeactivate(did)}
                      className="text-orange-600"
                      disabled={actionLoading[`deactivate-${did.id}`]}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {actionLoading[`deactivate-${did.id}`] ? 'Deactivating...' : 'Deactivate'}
                    </DropdownMenuItem>
                  )}
                  {did.status !== DIDStatus.REVOKED && (
                    <DropdownMenuItem
                      onClick={() => onRevoke(did)}
                      className="text-red-600"
                      disabled={actionLoading[`revoke-${did.id}`]}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {actionLoading[`revoke-${did.id}`] ? 'Revoking...' : 'Revoke'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
