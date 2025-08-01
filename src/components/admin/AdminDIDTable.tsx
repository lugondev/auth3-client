import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Eye, Power, Trash2, MoreHorizontal, Search, Key, Globe, Coins, Network, Users } from 'lucide-react'
import { DIDStatus } from '@/types/did'
import type { AdminDIDRecord } from '@/hooks/useAdminDIDList'

interface AdminDIDTableProps {
  dids: AdminDIDRecord[]
  loading: boolean
  actionLoading: Record<string, boolean>
  searchTerm: string
  methodFilter: string
  statusFilter: string
  onSearchChange: (term: string) => void
  onMethodFilterChange: (method: string) => void
  onStatusFilterChange: (status: string) => void
  onDeactivate: (didString: string) => void
  onRevoke: (didString: string) => void
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'active':
      return 'default'
    case 'deactivated':
      return 'secondary'
    case 'revoked':
      return 'destructive'
    default:
      return 'outline'
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

export function AdminDIDTable({
  dids,
  loading,
  actionLoading,
  searchTerm,
  methodFilter,
  statusFilter,
  onSearchChange,
  onMethodFilterChange,
  onStatusFilterChange,
  onDeactivate,
  onRevoke,
}: AdminDIDTableProps) {
  // Filter DIDs based on search and filters
  const filteredDIDs = dids.filter((did) => {
    const matchesSearch =
      searchTerm === '' ||
      did.did.toLowerCase().includes(searchTerm.toLowerCase()) ||
      did.owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (did.owner.username && did.owner.username.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesMethod = methodFilter === 'all' || did.method === methodFilter
    const matchesStatus = statusFilter === 'all' || did.status === statusFilter

    return matchesSearch && matchesMethod && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse flex-1" />
          <div className="h-10 w-[150px] bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-[150px] bg-gray-200 rounded animate-pulse" />
        </div>
        
        {/* Table skeleton */}
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
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by DID, email, or username..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={methodFilter} onValueChange={onMethodFilterChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="key">Key</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="ethr">Ethereum</SelectItem>
            <SelectItem value="ion">ION</SelectItem>
            <SelectItem value="peer">Peer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* DID Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DID</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDIDs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {loading ? 'Loading...' : 'No DIDs found'}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDIDs.map((did) => (
                <TableRow key={did.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="max-w-xs truncate" title={did.did}>
                      {did.did.length > 40 ? `${did.did.substring(0, 40)}...` : did.did}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getMethodIcon(did.method)}
                      <span className="capitalize">{did.method}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{did.owner.username || did.owner.email}</div>
                      {did.owner.username && (
                        <div className="text-sm text-muted-foreground">{did.owner.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(did.status)}>{did.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(did.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {did.status === DIDStatus.ACTIVE && (
                          <DropdownMenuItem
                            onClick={() => onDeactivate(did.did)}
                            disabled={actionLoading[`deactivate-${did.did}`]}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {actionLoading[`deactivate-${did.did}`] ? 'Deactivating...' : 'Deactivate'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onRevoke(did.did)}
                          disabled={actionLoading[`revoke-${did.did}`]}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {actionLoading[`revoke-${did.did}`] ? 'Revoking...' : 'Revoke'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredDIDs.length} of {dids.length} DIDs
      </div>
    </div>
  )
}
