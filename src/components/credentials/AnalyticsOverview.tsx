/**
 * Comprehensive Analytics Overview Component
 * Displays detailed credential analytics with charts and insights
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  PieChart, 
  Activity, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'

import { 
  useCredentialAnalytics, 
  getAnalyticsQueryPresets 
} from '@/hooks/useCredentialAnalytics'
import { CredentialAnalyticsQuery } from '@/types/analytics'

interface AnalyticsOverviewProps {
  className?: string
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ className }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<keyof ReturnType<typeof getAnalyticsQueryPresets>>('lastMonth')
  const [activeTab, setActiveTab] = useState<'overview' | 'issuance' | 'received'>('overview')
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'custom'>('month')

  const analyticsPresets = getAnalyticsQueryPresets()
  const currentQuery = analyticsPresets[selectedPeriod]

  const {
    data: analytics,
    isLoading,
    error,
    refetch
  } = useCredentialAnalytics(currentQuery)

  const handleExportData = () => {
    if (!analytics) return
    
    const dataStr = JSON.stringify(analytics, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `credential-analytics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analytics Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load analytics data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Credential Analytics
            </CardTitle>
            <CardDescription>
              Comprehensive analytics for your credential activities
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select 
              value={timeFilter} 
              onValueChange={(value) => setTimeFilter(value as typeof timeFilter)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={selectedPeriod} 
              onValueChange={(value) => setSelectedPeriod(value as keyof ReturnType<typeof getAnalyticsQueryPresets>)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="lastQuarter">Last Quarter</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportData} disabled={!analytics}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issuance">Issuance</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : analytics ? (
              <>
                {/* Main 4 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">VC Issued</p>
                          <div className="text-3xl font-bold text-blue-600">
                            {analytics.issuance_metrics.total_issued}
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        +{analytics.issuance_metrics.issued_this_month} this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">VC Received</p>
                          <div className="text-3xl font-bold text-green-600">
                            {analytics.received_metrics.total_received}
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full">
                          <Download className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        +{analytics.received_metrics.received_this_month} this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Revoked</p>
                          <div className="text-3xl font-bold text-red-600">
                            {analytics.overview_metrics.revoked_credentials}
                          </div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-full">
                          <TrendingDown className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {analytics.status_metrics.revoked_credentials.revoked_this_month} this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active</p>
                          <div className="text-3xl font-bold text-emerald-600">
                            {analytics.overview_metrics.active_credentials}
                          </div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-full">
                          <Activity className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {analytics.status_metrics.active_credentials.expiring_within_30_days} expiring soon
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Active</span>
                          <span className="font-medium text-green-600">
                            {analytics.status_metrics.active_credentials.count}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revoked</span>
                          <span className="font-medium text-red-600">
                            {analytics.status_metrics.revoked_credentials.count}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deactivated</span>
                          <span className="font-medium text-orange-600">
                            {analytics.status_metrics.deactivated_credentials.count}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Activity Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Issued</span>
                          <span className="font-medium">
                            {analytics.issuance_metrics.total_issued}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Received</span>
                          <span className="font-medium">
                            {analytics.received_metrics.total_received}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate</span>
                          <span className="font-medium text-green-600">
                            {analytics.received_metrics.verification_success_rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="issuance" className="space-y-4 mt-4">
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Issuance Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Issued</span>
                        <span className="font-medium">{analytics.issuance_metrics.total_issued}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>This Month</span>
                        <span className="font-medium">{analytics.issuance_metrics.issued_this_month}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>This Week</span>
                        <span className="font-medium">{analytics.issuance_metrics.issued_this_week}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Today</span>
                        <span className="font-medium">{analytics.issuance_metrics.issued_today}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">By Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.issuance_metrics.issued_by_type.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="truncate">{item.type}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="received" className="space-y-4 mt-4">
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Received Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Received</span>
                        <span className="font-medium">{analytics.received_metrics.total_received}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>This Month</span>
                        <span className="font-medium">{analytics.received_metrics.received_this_month}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verification Rate</span>
                        <span className="font-medium text-green-600">
                          {analytics.received_metrics.verification_success_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">By Issuer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.received_metrics.received_by_issuer.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="truncate text-sm">{item.issuer_name || item.issuer_did}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default AnalyticsOverview
