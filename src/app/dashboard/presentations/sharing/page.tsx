'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Share2,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Users,
  Globe,
  Lock,
  Eye,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'
import SharingOptions from '@/components/presentations/SharingOptions'
import ShareHistory from '@/components/presentations/ShareHistory'
import PresentationQRCode from '@/components/presentations/PresentationQRCode'

interface SharingDashboardStats {
  totalShares: number
  activeShares: number
  totalViews: number
  topPresentations: Array<{
    id: string
    title: string
    shareCount: number
    viewCount: number
  }>
  recentActivity: Array<{
    id: string
    action: string
    timestamp: string
    presentationTitle: string
  }>
}

export default function SharingDashboardPage() {
  const [stats, setStats] = useState<SharingDashboardStats>({
    totalShares: 0,
    activeShares: 0,
    totalViews: 0,
    topPresentations: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateShare, setShowCreateShare] = useState(false)
  const [selectedPresentationId, setSelectedPresentationId] = useState<string>('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      // Load sharing dashboard statistics
      const response = await apiClient.get<SharingDashboardStats>('/api/v1/presentations/sharing/stats')
      setStats(response.data)
      
    } catch (error) {
      console.error('Error loading sharing stats:', error)
      
      // Mock data for demo
      setStats({
        totalShares: 42,
        activeShares: 35,
        totalViews: 1247,
        topPresentations: [
          {
            id: 'pres-1',
            title: 'Academic Credentials Package',
            shareCount: 8,
            viewCount: 156
          },
          {
            id: 'pres-2', 
            title: 'Professional Certifications',
            shareCount: 6,
            viewCount: 234
          },
          {
            id: 'pres-3',
            title: 'Identity Verification Bundle',
            shareCount: 5,
            viewCount: 89
          }
        ],
        recentActivity: [
          {
            id: 'act-1',
            action: 'Share created',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            presentationTitle: 'Academic Credentials Package'
          },
          {
            id: 'act-2',
            action: 'Share accessed',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            presentationTitle: 'Professional Certifications'
          },
          {
            id: 'act-3',
            action: 'Share revoked',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            presentationTitle: 'Identity Verification Bundle'
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sharing Dashboard</h1>
          <p className="text-muted-foreground">Manage and monitor presentation shares</p>
        </div>
        <Button onClick={() => setShowCreateShare(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Share
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShares}</div>
            <p className="text-xs text-muted-foreground">All time shares created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shares</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeShares}</div>
            <p className="text-xs text-muted-foreground">Currently accessible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">Presentation views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Views/Share</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalShares > 0 ? Math.round(stats.totalViews / stats.totalShares) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Engagement rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Shared Presentations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Shared Presentations
            </CardTitle>
            <CardDescription>Most frequently shared presentations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topPresentations.map((presentation, index) => (
                <div key={presentation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{presentation.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {presentation.shareCount} shares • {presentation.viewCount} views
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedPresentationId(presentation.id)
                      setShowCreateShare(true)
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest sharing actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.presentationTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">Share History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
          <ShareHistory />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sharing Analytics</CardTitle>
              <CardDescription>Detailed insights into sharing performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Advanced analytics coming soon</p>
                <p className="text-sm text-muted-foreground">
                  Track sharing patterns, geographic distribution, and engagement metrics
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Sharing Settings</CardTitle>
              <CardDescription>Configure default sharing preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Global settings coming soon</p>
                <p className="text-sm text-muted-foreground">
                  Set default expiration times, access controls, and security policies
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Share Modal */}
      {showCreateShare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Share</h2>
              <Button variant="outline" onClick={() => setShowCreateShare(false)}>
                Close
              </Button>
            </div>
            
            {selectedPresentationId ? (
              <SharingOptions
                presentationId={selectedPresentationId}
                onShareCreated={(shareLink) => {
                  toast.success('Share created successfully!')
                  setShowCreateShare(false)
                  loadStats() // Refresh stats
                }}
                onClose={() => setShowCreateShare(false)}
              />
            ) : (
              <div className="text-center py-8">
                <Input
                  placeholder="Enter presentation ID..."
                  value={selectedPresentationId}
                  onChange={(e) => setSelectedPresentationId(e.target.value)}
                  className="mb-4"
                />
                <p className="text-sm text-muted-foreground">
                  Enter a presentation ID to create a share link
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
