'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listUsersInTenant, getUserDIDsInTenant } from '@/services/tenantService'
import { TenantUserDIDInfo } from '@/types/tenantUserDID'
import { TenantUserResponse } from '@/types/tenant'
import { formatDistanceToNow } from 'date-fns'
import { 
  Users, 
  Shield, 
  Calendar, 
  Hash, 
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface TenantUserDIDsProps {
  tenantId: string
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

const getOwnershipBadge = (ownershipType: string) => {
  const ownershipColors = {
    personal: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50',
    tenant: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ownershipColors[ownershipType as keyof typeof ownershipColors] || ownershipColors.personal}`}>
      {ownershipType === 'personal' ? (
        <>
          <User className="mr-1 h-3 w-3" />
          Personal
        </>
      ) : (
        <>
          <Users className="mr-1 h-3 w-3" />
          Tenant
        </>
      )}
    </span>
  )
}

interface UserDIDsRowProps {
  user: TenantUserResponse
  tenantId: string
  isExpanded: boolean
  onToggle: () => void
}

function UserDIDsRow({ user, tenantId, isExpanded, onToggle }: UserDIDsRowProps) {
  const { data: userDIDs, isLoading, error } = useQuery({
    queryKey: ['user-dids', tenantId, user.user_id],
    queryFn: () => getUserDIDsInTenant(tenantId, user.user_id, 20, 0),
    enabled: isExpanded,
  })

  return (
    <div className="border border-border rounded-lg">
      {/* User Header */}
      <div 
        className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              {user.roles.map((role) => (
                <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {userDIDs?.total || 0} DIDs
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* DIDs List */}
      {isExpanded && (
        <div className="border-t border-border">
          {isLoading && (
            <div className="p-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border-destructive/20">
              <p className="text-destructive text-sm">Failed to load DIDs</p>
            </div>
          )}

          {userDIDs && !userDIDs.dids?.length && (
            <div className="p-4 text-center">
              <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No DIDs found for this user</p>
            </div>
          )}

          {userDIDs?.dids?.map((did: TenantUserDIDInfo) => (
            <div key={did.did_id} className="p-4 border-t border-border hover:bg-muted/30">
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
                        {getOwnershipBadge(did.ownership_type)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Hash className="mr-1 h-3 w-3" />
                          {did.method}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDistanceToNow(new Date(did.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {did.description && (
                        <p className="text-sm text-muted-foreground mt-1">{did.description}</p>
                      )}
                      {did.usage_count !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Used {did.usage_count} times
                          {did.last_used_at && (
                            <span className="ml-2">
                              Last used {formatDistanceToNow(new Date(did.last_used_at), { addSuffix: true })}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('View DID details:', did.did_id)
                    }}
                    className="inline-flex items-center px-2.5 py-1.5 border border-input shadow-sm text-xs leading-4 font-medium rounded text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TenantUserDIDs({ tenantId }: TenantUserDIDsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())

  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['tenant-users', tenantId, currentPage, pageSize],
    queryFn: () => listUsersInTenant(tenantId, pageSize, (currentPage - 1) * pageSize),
    enabled: !!tenantId,
  })

  const filteredUsers = usersData?.users?.filter(user => 
    searchTerm === '' || 
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const toggleUser = (userId: string) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedUsers(newExpanded)
  }

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
        <p className="text-destructive">Failed to load tenant users. Please try again.</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 text-destructive hover:text-destructive/80 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const totalPages = usersData?.total_pages || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">User DIDs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            DIDs organized by users in this tenant ({usersData?.total || 0} users)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 block w-full border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground placeholder:text-muted-foreground sm:text-sm"
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {!filteredUsers.length ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No users found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search.' : 'This tenant has no users yet.'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <UserDIDsRow
              key={user.user_id}
              user={user}
              tenantId={tenantId}
              isExpanded={expandedUsers.has(user.user_id)}
              onToggle={() => toggleUser(user.user_id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {Math.min(currentPage * pageSize, usersData?.total || 0)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{usersData?.total || 0}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-input bg-background text-sm font-medium text-foreground">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
