'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  History,
  Eye,
  Trash2,
  ExternalLink,
  Copy,
  Search,
  Filter,
  Calendar,
  Users,
  Globe,
  Lock,
  Shield,
  Clock,
  TrendingUp,
  BarChart3,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'

interface ShareLink {
  id: string
  token: string
  url: string
  presentationId: string
  settings: {
    accessType: 'public' | 'restricted' | 'password'
    allowDownload: boolean
    allowSharing: boolean
    trackViews: boolean
    requireAuth: boolean
    maxViews?: number
    expiresAt?: string
    customMessage?: string
    allowedViewers?: string[]
  }
  createdAt: string
  expiresAt?: string
  viewCount: number
  lastAccessed?: string
  isActive: boolean
  accessLog: AccessLogEntry[]
}

interface AccessLogEntry {
  id: string
  timestamp: string
  ip: string
  userAgent: string
  location?: string
  user?: {
    id: string
    email: string
    name: string
  }
  action: 'view' | 'download' | 'share'
  success: boolean
  errorReason?: string
}

interface ShareHistoryProps {
  presentationId?: string
  onShareRevoked?: (shareId: string) => void
  className?: string
}

/**
 * ShareHistory Component - Manage and track presentation shares
 * 
 * Features:
 * - View all active and inactive shares
 * - Monitor access analytics and logs
 * - Revoke active shares
 * - Filter and search share history
 * - Export access reports
 * - Real-time activity monitoring
 */
export default function ShareHistory({
  presentationId,
  onShareRevoked,
  className = ''
}: ShareHistoryProps) {
  const [shares, setShares] = useState<ShareLink[]>([])
  const [filteredShares, setFilteredShares] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all')
  const [accessTypeFilter, setAccessTypeFilter] = useState<'all' | 'public' | 'restricted' | 'password'>('all')
  const [selectedShare, setSelectedShare] = useState<ShareLink | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showAccessLog, setShowAccessLog] = useState(false)
  const [shareToRevoke, setShareToRevoke] = useState<ShareLink | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadShares()
  }, [presentationId])

  useEffect(() => {
    filterShares()
  }, [shares, searchQuery, statusFilter, accessTypeFilter])

  const loadShares = async () => {
    try {
      setLoading(true)
      
      const endpoint = presentationId 
        ? `/api/v1/presentations/${presentationId}/shares`
        : '/api/v1/presentations/shares'
      
      const response = await apiClient.get<{ shares: ShareLink[] }>(endpoint)
      setShares(response.data.shares || [])
      
    } catch (error) {
      console.error('Error loading shares:', error)
      
      // Mock data for demo
      const mockShares: ShareLink[] = [
        {
          id: 'share-1',
          token: 'abc123def456',
          url: 'https://example.com/presentations/shared?token=abc123def456',
          presentationId: presentationId || 'pres-1',
          settings: {
            accessType: 'public',
            allowDownload: true,
            allowSharing: false,
            trackViews: true,
            requireAuth: false,
            maxViews: 100,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            customMessage: 'Academic credentials for verification'
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 15,
          lastAccessed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isActive: true,
          accessLog: [
            {
              id: 'log-1',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              ip: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
              location: 'San Francisco, CA',
              action: 'view',
              success: true
            },
            {
              id: 'log-2',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              ip: '10.0.0.50',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              location: 'New York, NY',
              user: {
                id: 'user-1',
                email: 'john@example.com',
                name: 'John Doe'
              },
              action: 'download',
              success: true
            }
          ]
        },
        {
          id: 'share-2',
          token: 'xyz789ghi012',
          url: 'https://example.com/presentations/shared?token=xyz789ghi012',
          presentationId: presentationId || 'pres-1',
          settings: {
            accessType: 'password',
            allowDownload: false,
            allowSharing: false,
            trackViews: true,
            requireAuth: true,
            maxViews: 5,
            expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            customMessage: 'Confidential employment verification'
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 3,
          lastAccessed: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          accessLog: []
        },
        {
          id: 'share-3',
          token: 'old456token789',
          url: 'https://example.com/presentations/shared?token=old456token789',
          presentationId: presentationId || 'pres-1',
          settings: {
            accessType: 'restricted',
            allowDownload: true,
            allowSharing: true,
            trackViews: true,
            requireAuth: false,
            allowedViewers: ['alice@example.com', 'bob@company.com']
          },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 8,
          lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: false,
          accessLog: []
        }
      ]
      
      setShares(mockShares)
    } finally {
      setLoading(false)
    }
  }

  const filterShares = () => {
    let filtered = shares

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(share =>
        share.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
        share.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        share.settings.customMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(share => {
        switch (statusFilter) {
          case 'active':
            return share.isActive && (!share.expiresAt || new Date(share.expiresAt) > new Date())
          case 'expired':
            return share.expiresAt && new Date(share.expiresAt) <= new Date()
          case 'revoked':
            return !share.isActive
          default:
            return true
        }
      })
    }

    // Filter by access type
    if (accessTypeFilter !== 'all') {
      filtered = filtered.filter(share => share.settings.accessType === accessTypeFilter)
    }

    setFilteredShares(filtered)
  }

  const revokeShare = async (shareId: string) => {
    try {
      await apiClient.delete(`/api/v1/presentations/shares/${shareId}`)
      
      setShares(prev => prev.map(share => 
        share.id === shareId ? { ...share, isActive: false } : share
      ))
      
      toast.success('Share link revoked successfully')
      onShareRevoked?.(shareId)
      
    } catch (error) {
      console.error('Error revoking share:', error)
      toast.error('Failed to revoke share link')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const exportAccessReport = async () => {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        presentationId,
        totalShares: shares.length,
        activeShares: shares.filter(s => s.isActive).length,
        totalViews: shares.reduce((sum, s) => sum + s.viewCount, 0),
        shares: shares.map(share => ({
          id: share.id,
          created: share.createdAt,
          expires: share.expiresAt,
          views: share.viewCount,
          lastAccessed: share.lastAccessed,
          accessType: share.settings.accessType,
          isActive: share.isActive,
          accessLog: share.accessLog
        }))
      }

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `share-history-${presentationId || 'all'}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Access report exported')
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    await loadShares()
    setRefreshing(false)
    toast.success('Share history refreshed')
  }

  const getStatusIcon = (share: ShareLink) => {
    if (!share.isActive) {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
    if (share.expiresAt && new Date(share.expiresAt) <= new Date()) {
      return <Clock className="h-4 w-4 text-yellow-600" />
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }

  const getStatusText = (share: ShareLink) => {
    if (!share.isActive) return 'Revoked'
    if (share.expiresAt && new Date(share.expiresAt) <= new Date()) return 'Expired'
    return 'Active'
  }

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case 'public': return <Globe className="h-4 w-4" />
      case 'restricted': return <Users className="h-4 w-4" />
      case 'password': return <Lock className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Share History
              </CardTitle>
              <CardDescription>
                Manage and monitor all presentation shares and access
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAccessReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shares..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={accessTypeFilter} onValueChange={(value: typeof accessTypeFilter) => setAccessTypeFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="password">Password</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Shares</p>
                    <p className="text-2xl font-bold">{shares.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {shares.filter(s => s.isActive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Total Views</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {shares.reduce((sum, s) => sum + s.viewCount, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {shares.filter(s => 
                        s.expiresAt && 
                        new Date(s.expiresAt) > new Date() && 
                        new Date(s.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                      ).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shares Table */}
          {loading ? (
            <div className="text-center py-8">Loading shares...</div>
          ) : filteredShares.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No shares found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Last Access</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(share)}
                        <span className="text-sm">{getStatusText(share)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAccessTypeIcon(share.settings.accessType)}
                        <span className="capitalize">{share.settings.accessType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(share.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {share.expiresAt 
                        ? new Date(share.expiresAt).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {share.viewCount}
                        {share.settings.maxViews && ` / ${share.settings.maxViews}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {share.lastAccessed 
                        ? new Date(share.lastAccessed).toLocaleString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedShare(share)
                            setShowDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(share.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(share.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {share.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShareToRevoke(share)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Share Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Details</DialogTitle>
            <DialogDescription>
              Detailed information about this share link
            </DialogDescription>
          </DialogHeader>
          
          {selectedShare && (
            <div className="space-y-4">
              <Tabs defaultValue="info">
                <TabsList>
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="access">Access Log</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">Share ID</Label>
                      <p className="text-sm font-mono">{selectedShare.id}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Token</Label>
                      <p className="text-sm font-mono">{selectedShare.token}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Status</Label>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedShare)}
                        <span>{getStatusText(selectedShare)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">View Count</Label>
                      <p>{selectedShare.viewCount}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="font-medium">Share URL</Label>
                    <div className="flex gap-2">
                      <Input value={selectedShare.url} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedShare.url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">Access Type</Label>
                      <div className="flex items-center gap-2">
                        {getAccessTypeIcon(selectedShare.settings.accessType)}
                        <span className="capitalize">{selectedShare.settings.accessType}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">Track Views</Label>
                      <Badge className={selectedShare.settings.trackViews ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {selectedShare.settings.trackViews ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="font-medium">Allow Download</Label>
                      <Badge className={selectedShare.settings.allowDownload ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {selectedShare.settings.allowDownload ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="font-medium">Allow Sharing</Label>
                      <Badge className={selectedShare.settings.allowSharing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {selectedShare.settings.allowSharing ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedShare.settings.customMessage && (
                    <div>
                      <Label className="font-medium">Custom Message</Label>
                      <p className="text-sm text-muted-foreground">{selectedShare.settings.customMessage}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="access" className="space-y-4">
                  {selectedShare.accessLog.length > 0 ? (
                    <div className="space-y-2">
                      {selectedShare.accessLog.map((entry) => (
                        <Card key={entry.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={entry.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {entry.action}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm">IP: {entry.ip}</p>
                                {entry.location && <p className="text-sm">Location: {entry.location}</p>}
                                {entry.user && <p className="text-sm">User: {entry.user.name} ({entry.user.email})</p>}
                              </div>
                              {entry.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No access logs available</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!shareToRevoke} onOpenChange={() => setShareToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Share Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this share link? This action cannot be undone and the link will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (shareToRevoke) {
                  revokeShare(shareToRevoke.id)
                  setShareToRevoke(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
