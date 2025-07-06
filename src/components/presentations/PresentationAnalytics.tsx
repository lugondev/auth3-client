'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  FileCheck,
  Eye,
  Share2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Filter,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import presentationAnalyticsService from '@/services/presentationAnalyticsService'
import type { 
  PresentationAnalytics,
  AnalyticsOverview,
  AnalyticsTrend,
  VerificationStats,
  SharingStats,
  CredentialTypeStats,
  UserActivityStats,
  IssuerStats,
  GeographicStats,
  PresentationStats
} from '@/services/presentationAnalyticsService'

interface PresentationAnalyticsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y'
  className?: string
}

/**
 * PresentationAnalytics Component - Analytics dashboard for presentations
 * 
 * Features:
 * - Usage statistics and trends via real API endpoints
 * - Verification success metrics
 * - Sharing and engagement analytics
 * - Credential type performance
 * - Geographic distribution
 * - Export capabilities
 */
export function PresentationAnalytics({ 
  timeRange = '30d',
  className = '' 
}: PresentationAnalyticsProps) {
  const [analytics, setAnalytics] = useState<PresentationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [activeTab, setActiveTab] = useState('overview')
  const [filterType, setFilterType] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Load analytics data
  useEffect(() => {
    loadAnalytics()
  }, [selectedTimeRange, filterType])

  /**
   * Load analytics data from API endpoints
   */
  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Use the analytics service to get comprehensive data
      const analyticsData = await presentationAnalyticsService.getAnalytics(
        selectedTimeRange, 
        filterType !== 'all' ? filterType : undefined
      )
      
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Refresh analytics data
   */
  const refreshAnalytics = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
    toast.success('Analytics data refreshed')
  }

  /**
   * Export analytics data
   */
  const exportAnalytics = async () => {
    if (!analytics) return

    try {
      // Try to use the service's export functionality first
      const blob = await presentationAnalyticsService.exportAnalytics(selectedTimeRange, 'json')
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentation-analytics-${selectedTimeRange}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Analytics data exported successfully')
    } catch (error) {
      console.warn('Service export failed, falling back to client-side export')
      
      // Fallback to client-side export
      const exportData = {
        ...analytics,
        exportedAt: new Date().toISOString(),
        timeRange: selectedTimeRange,
        filter: filterType
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentation-analytics-${selectedTimeRange}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Analytics data exported successfully')
    }
  }

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!analytics) return null

    const { overview, trends } = analytics
    
    // Calculate growth rates
    const presentationGrowth = trends.length >= 2 
      ? ((trends[trends.length - 1].presentations - trends[trends.length - 2].presentations) / trends[trends.length - 2].presentations) * 100
      : 0

    const verificationGrowth = trends.length >= 2
      ? ((trends[trends.length - 1].verifications - trends[trends.length - 2].verifications) / trends[trends.length - 2].verifications) * 100
      : 0

    const userGrowth = trends.length >= 2
      ? ((trends[trends.length - 1].uniqueUsers - trends[trends.length - 2].uniqueUsers) / trends[trends.length - 2].uniqueUsers) * 100
      : 0

    return {
      presentationGrowth,
      verificationGrowth,
      userGrowth,
      failureRate: 100 - overview.successRate
    }
  }, [analytics])

  // Chart colors
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#eab308'
  }

  /**
   * Render overview tab
   */
  const renderOverviewTab = () => {
    if (!analytics || !derivedMetrics) return null

    const { overview } = analytics

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Presentations</p>
                  <p className="text-2xl font-bold">{overview.totalPresentations.toLocaleString()}</p>
                </div>
                <div className="flex items-center text-sm">
                  {derivedMetrics.presentationGrowth > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={derivedMetrics.presentationGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(derivedMetrics.presentationGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verifications</p>
                  <p className="text-2xl font-bold">{overview.totalVerifications.toLocaleString()}</p>
                </div>
                <div className="flex items-center text-sm">
                  {derivedMetrics.verificationGrowth > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={derivedMetrics.verificationGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(derivedMetrics.verificationGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{overview.successRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Users</p>
                  <p className="text-2xl font-bold">{overview.uniqueUsers.toLocaleString()}</p>
                </div>
                <div className="flex items-center text-sm">
                  {derivedMetrics.userGrowth > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={derivedMetrics.userGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(derivedMetrics.userGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Presentation Trends</CardTitle>
            <CardDescription>Presentations and verifications over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="presentations" 
                  stroke={chartColors.primary} 
                  strokeWidth={2}
                  name="Presentations"
                />
                <Line 
                  type="monotone" 
                  dataKey="verifications" 
                  stroke={chartColors.secondary} 
                  strokeWidth={2}
                  name="Verifications"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trending Credential Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trending Credential Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {overview.trendingCredentialTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-sm">
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Render verification tab
   */
  const renderVerificationTab = () => {
    if (!analytics) return null

    const { verificationStats } = analytics

    // Prepare data for charts
    const statusData = [
      { name: 'Successful', value: verificationStats.successful, color: chartColors.success },
      { name: 'Failed', value: verificationStats.failed, color: chartColors.danger },
      { name: 'Warnings', value: verificationStats.warnings, color: chartColors.warning }
    ]

    const credentialTypeData = Object.entries(verificationStats.byCredentialType).map(([type, count]) => ({
      type,
      count
    }))

    return (
      <div className="space-y-6">
        {/* Verification Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center text-green-600 mb-2">
                <CheckCircle className="h-6 w-6 mr-2" />
                <span className="text-2xl font-bold">{verificationStats.successful}</span>
              </div>
              <p className="text-sm text-muted-foreground">Successful</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center text-red-600 mb-2">
                <AlertTriangle className="h-6 w-6 mr-2" />
                <span className="text-2xl font-bold">{verificationStats.failed}</span>
              </div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center text-yellow-600 mb-2">
                <AlertTriangle className="h-6 w-6 mr-2" />
                <span className="text-2xl font-bold">{verificationStats.warnings}</span>
              </div>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center text-blue-600 mb-2">
                <Clock className="h-6 w-6 mr-2" />
                <span className="text-2xl font-bold">{verificationStats.averageTime}</span>
              </div>
              <p className="text-sm text-muted-foreground">Avg Time (ms)</p>
            </CardContent>
          </Card>
        </div>

        {/* Verification Status Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verifications by Credential Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={credentialTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={chartColors.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Error Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Common Error Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(verificationStats.errorReasons)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([reason, count]) => (
                  <div key={reason} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">{reason}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Render sharing tab
   */
  const renderSharingTab = () => {
    if (!analytics) return null

    const { sharingStats } = analytics

    const sharingMethodData = [
      { name: 'QR Codes', value: sharingStats.qrCodeShares, color: chartColors.primary },
      { name: 'Links', value: sharingStats.linkShares, color: chartColors.secondary },
      { name: 'Email', value: sharingStats.emailShares, color: chartColors.accent }
    ]

    return (
      <div className="space-y-6">
        {/* Sharing Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Share2 className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{sharingStats.totalShares}</p>
              <p className="text-sm text-muted-foreground">Total Shares</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">{sharingStats.averageViews.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avg Views</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-6 w-6 mx-auto bg-blue-600 rounded mb-2 flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full"></div>
              </div>
              <p className="text-2xl font-bold">{sharingStats.qrCodeShares}</p>
              <p className="text-sm text-muted-foreground">QR Shares</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-6 w-6 mx-auto bg-green-600 rounded mb-2 flex items-center justify-center text-white text-xs">
                @
              </div>
              <p className="text-2xl font-bold">{sharingStats.emailShares}</p>
              <p className="text-sm text-muted-foreground">Email Shares</p>
            </CardContent>
          </Card>
        </div>

        {/* Sharing Methods Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sharing Methods Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sharingMethodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                >
                  {sharingMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Shared Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Shared Credential Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sharingStats.topSharedTypes.map((type, index) => (
                <div key={type} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="text-sm">{type}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No analytics data available</p>
        <Button onClick={loadAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Presentation Analytics</h2>
          <p className="text-muted-foreground">
            Last updated: {new Date(analytics.overview.lastUpdated).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedTimeRange} onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-200px)] mt-4">
          <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
          <TabsContent value="verification">{renderVerificationTab()}</TabsContent>
          <TabsContent value="sharing">{renderSharingTab()}</TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default PresentationAnalytics
