'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard'
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart'
import { 
  authAnalyticsService, 
  SystemAuthStats, 
  UserAnalyticsEntry, 
  FailureAnalyticsEntry,
  AuthAnalyticsChartData 
} from '@/services/auth-analytics-service'
import { 
  Users, 
  Activity, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Key,
  Smartphone,
  Search,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'

type TimeRange = '7d' | '30d' | '90d' | '1y'

const TIME_RANGES = [
  { label: 'Last 7 days', value: '7d' as TimeRange, days: 7 },
  { label: 'Last 30 days', value: '30d' as TimeRange, days: 30 },
  { label: 'Last 90 days', value: '90d' as TimeRange, days: 90 },
  { label: 'Last year', value: '1y' as TimeRange, days: 365 },
]

export default function AdminAuthAnalyticsPage() {
  const [systemStats, setSystemStats] = useState<SystemAuthStats | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsEntry[]>([])
  const [failureAnalytics, setFailureAnalytics] = useState<FailureAnalyticsEntry[]>([])
  const [chartData, setChartData] = useState<AuthAnalyticsChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [searchTerm, setSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState('all') // all, active, inactive, verified
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (range: TimeRange = timeRange) => {
    try {
      setLoading(true)
      
      const days = TIME_RANGES.find(r => r.value === range)?.days || 30
      const startDate = subDays(new Date(), days)
      const query = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        interval: days <= 7 ? 'day' as const : days <= 90 ? 'week' as const : 'month' as const,
        limit: 100
      }

      const [systemData, userData, failureData, trendsData] = await Promise.all([
        authAnalyticsService.getSystemAuthStats(query),
        authAnalyticsService.getUserAnalytics(query),
        authAnalyticsService.getFailureAnalytics(query),
        authAnalyticsService.getAuthTrendsChart(query)
      ])

      setSystemStats(systemData)
      setUserAnalytics(userData)
      setFailureAnalytics(failureData)
      setChartData(trendsData)
    } catch (error) {
      console.error('Failed to fetch admin analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast.success('Analytics data refreshed')
  }

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange)
    fetchData(newRange)
  }

  const filteredUsers = userAnalytics.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = userFilter === 'all' ||
      (userFilter === 'active' && user.is_active) ||
      (userFilter === 'inactive' && !user.is_active) ||
      (userFilter === 'verified' && user.is_email_verified)
    
    return matchesSearch && matchesFilter
  })

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (user: UserAnalyticsEntry) => {
    if (!user.is_active) return <Badge variant="secondary">Inactive</Badge>
    if (!user.is_email_verified) return <Badge variant="destructive">Unverified</Badge>
    if (user.is_2fa_enabled) return <Badge variant="default">Verified + 2FA</Badge>
    return <Badge variant="outline">Verified</Badge>
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Authentication Analytics (Admin)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor system-wide authentication activity and security metrics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Users"
          value={systemStats?.total_users || 0}
          description="Registered users"
          icon={Users}
          loading={loading}
        />
        <AnalyticsCard
          title="Active Today"
          value={systemStats?.active_users_today || 0}
          description="Users logged in today"
          icon={Activity}
          loading={loading}
        />
        <AnalyticsCard
          title="Success Rate"
          value={`${systemStats?.success_rate_today?.toFixed(1) || 0}%`}
          description="Today's login success"
          icon={TrendingUp}
          loading={loading}
        />
        <AnalyticsCard
          title="2FA Enabled"
          value={systemStats?.users_with_2fa_enabled || 0}
          description="Users with 2FA"
          icon={Key}
          loading={loading}
        />
      </div>

      {/* Login Activity Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnalyticsCard
          title="Logins Today"
          value={systemStats?.total_logins_today || 0}
          description="Successful logins"
          icon={CheckCircle}
          loading={loading}
        />
        <AnalyticsCard
          title="Failed Logins"
          value={systemStats?.failed_logins_today || 0}
          description="Failed attempts today"
          icon={AlertTriangle}
          loading={loading}
        />
        <AnalyticsCard
          title="Avg Session"
          value={`${systemStats?.average_session_duration_minutes || 0}m`}
          description="Session duration"
          icon={Clock}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <AnalyticsChart
              title=""
              data={chartData.map(item => ({
                name: format(new Date(item.date), 'MMM dd'),
                'Total Logins': item.total_logins,
                'Successful': item.successful_logins,
                'Failed': item.failed_logins,
                'New Users': item.new_registrations
              }))}
              type="line"
              dataKey=""
              xAxisKey="name"
              height={300}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="failures">Failure Analysis</TabsTrigger>
          <TabsTrigger value="security">Security Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>User Analytics ({filteredUsers.length})</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-[250px]"
                    />
                  </div>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No users found</p>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.slice(0, 50).map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">
                            Created: {format(new Date(user.account_created_at), 'MMM dd, yyyy')}
                            {user.last_login_at && ` • Last: ${format(new Date(user.last_login_at), 'MMM dd')}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(user)}
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>{user.total_logins} logins</span>
                          <span>{user.success_rate.toFixed(1)}% success</span>
                          {user.security_events_count > 0 && (
                            <span className="text-orange-600">{user.security_events_count} events</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failure Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : failureAnalytics.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No failure data found</p>
              ) : (
                <div className="space-y-2">
                  {failureAnalytics.map((failure, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(failure.trend)}
                        <div>
                          <div className="font-medium">{failure.error_type}</div>
                          <div className="text-sm text-gray-500">
                            {failure.count} occurrences ({failure.percentage.toFixed(1)}%)
                          </div>
                          <div className="text-xs text-gray-400">
                            Affects {failure.affected_users} users
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={failure.trend === 'increasing' ? 'destructive' : 'default'}>
                          {failure.trend}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          Last: {format(new Date(failure.last_occurrence), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Email Verified</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{systemStats?.users_verified_email || 0}</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Phone Verified</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{systemStats?.users_verified_phone || 0}</span>
                      <Smartphone className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2FA Enabled</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{systemStats?.users_with_2fa_enabled || 0}</span>
                      <Shield className="h-4 w-4 text-purple-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {systemStats?.peak_login_hour || 0}:00
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Peak login hour
                  </p>
                  <div className="mt-4 text-sm text-gray-600">
                    <div>Unique devices today: {systemStats?.unique_devices_today || 0}</div>
                    <div>Unique locations today: {systemStats?.unique_locations_today || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
