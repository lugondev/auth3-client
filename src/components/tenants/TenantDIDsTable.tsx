'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTenantMemberDIDs } from '@/services/tenantService'
import { TenantMemberDIDInfo, TenantMemberDIDFilters } from '@/types/tenantMemberDID'
import { formatDistanceToNow } from 'date-fns'
import { 
  Users, 
  Shield, 
  Calendar, 
  Hash, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  User
} from 'lucide-react'

interface TenantDIDsTableProps {
  tenantId: string
  defaultFilters?: Partial<TenantMemberDIDFilters>
}

const getMethodIcon = (method: string) => {
  switch (method.toLowerCase()) {
    case 'did:key':
      return '🔑'
    case 'did:web':
      return '🌐'
    case 'did:ethr':
      return '⚡'
    default:
      return '🆔'
  }
}

const getStatusBadge = (status: string) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-900/50',
    revoked: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50',
    suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status as keyof typeof statusColors] || statusColors.inactive}`}>
      {status}
    </span>
  )
}

const getUserRolesBadge = (roles: string[]) => {
  if (!roles || roles.length === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        No roles
      </span>
    )
  }
  
  const roleColors = {
    owner: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
    admin: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
    manager: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
    member: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  }

  // Show the highest priority role first (owner > admin > manager > member)
  const priorityOrder = ['owner', 'admin', 'manager', 'member']
  const sortedRoles = roles.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.toLowerCase())
    const bIndex = priorityOrder.indexOf(b.toLowerCase())
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
  })

  const primaryRole = sortedRoles[0]
  const color = roleColors[primaryRole.toLowerCase() as keyof typeof roleColors] || roleColors.member

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {sortedRoles.length > 1 ? `${primaryRole} +${sortedRoles.length - 1}` : primaryRole}
    </span>
  )
}


export default function TenantDIDsTable({ tenantId, defaultFilters = {} }: TenantDIDsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter state (similar to users page)
  const [searchQuery, setSearchQuery] = useState(defaultFilters?.search || '')
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(defaultFilters?.search || '')
  
  // Query params using applied search value
  const queryParams = useMemo(() => ({
    search: appliedSearchQuery || undefined,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  }), [pageSize, currentPage, appliedSearchQuery])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tenant-member-dids', tenantId, queryParams],
    queryFn: () => getTenantMemberDIDs(tenantId, queryParams),
    enabled: !!tenantId,
  })

  // Handle filter application (similar to users page)
  const handleApplyFilters = useCallback(() => {
    setAppliedSearchQuery(searchQuery)
    setCurrentPage(1) // Reset to first page on new search
  }, [searchQuery])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setAppliedSearchQuery('')
    setCurrentPage(1)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-destructive">Failed to load tenant DIDs. Please try again.</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 text-destructive hover:text-destructive/80 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const totalPages = data?.total_pages || 0
  const hasFilters = !!appliedSearchQuery

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tenant DIDs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            All DIDs in this tenant ({data?.total || 0} total)
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center px-3 py-2 border border-border shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring ${showFilters ? 'bg-accent' : ''}`}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasFilters && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              1
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-muted border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Search</label>
              <input
                type="text"
                placeholder="Search DIDs, users, emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-ring focus:border-ring bg-background text-foreground"
              />
            </div>
          </div>
          
          <div className="flex justify-between">
            <div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
            <button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-background shadow overflow-hidden sm:rounded-md border border-border">
        {!data?.dids?.length ? (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No DIDs found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters ? 'Try adjusting your filters.' : 'This tenant has no DIDs yet.'}
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
                        {data.dids.map((did: TenantMemberDIDInfo) => (
              <li key={did.did_id} className="px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getMethodIcon(did.method)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {did.name || did.did}
                          </p>
                          {getStatusBadge(did.status)}
                          {getUserRolesBadge(did.user_roles)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Hash className="mr-1 h-3 w-3" />
                            {did.method}
                          </span>
                          <span className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            {did.user_first_name} {did.user_last_name} ({did.user_email})
                          </span>
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {formatDistanceToNow(new Date(did.created_at), { addSuffix: true })}
                          </span>
                          <span className="flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            Joined {formatDistanceToNow(new Date(did.joined_tenant_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        // Navigate to DID details or open modal
                        console.log('View DID details:', did.did_id)
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-border shadow-sm text-xs leading-4 font-medium rounded text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-background px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, data?.total || 0)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{data?.total || 0}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-border bg-background text-sm font-medium text-foreground">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
