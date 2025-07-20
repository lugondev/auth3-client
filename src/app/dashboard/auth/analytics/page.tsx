'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard'
import { authAnalyticsService, UserAuthStats, LoginHistoryEntry, SecurityActivity } from '@/services/auth-analytics-service'
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  Smartphone, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Key,
  Calendar,
  RefreshCw 
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

export default function UserAuthAnalyticsPage() {
  const [stats, setStats] = useState<UserAuthStats | null>(null)
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([])
  const [securityActivity, setSecurityActivity] = useState<SecurityActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (range: TimeRange = timeRange) => {
    try {
      setLoading(true)
      
      const days = TIME_RANGES.find(r => r.value === range)?.days || 30
      const startDate = subDays(new Date(), days)
      const query = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        interval: days <= 7 ? 'day' as const : days <= 90 ? 'week' as const : 'month' as const
      }

      const [statsData, historyData, securityData] = await Promise.all([
        authAnalyticsService.getUserAuthStats(query),
        authAnalyticsService.getUserLoginHistory({ ...query, limit: 50 }),
        authAnalyticsService.getUserSecurityActivity({ ...query, limit: 20 })
      ])

      setStats(statsData)
      setLoginHistory(historyData)
      setSecurityActivity(securityData)
    } catch (error) {
      console.error('Failed to fetch auth analytics:', error)
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

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getLoginStatusIcon = (success: boolean) => {
    return success 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <AlertTriangle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Authentication Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your login activity, security events, and account usage
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
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Logins"
          value={stats?.total_logins || 0}
          description={`${timeRange.replace('d', ' days').replace('y', ' year')}`}
          icon={Activity}
          loading={loading}
        />
        <AnalyticsCard
          title="Success Rate"
          value={`${stats?.success_rate?.toFixed(1) || 0}%`}
          description="Login success rate"
          icon={TrendingUp}
          loading={loading}
        />
        <AnalyticsCard
          title="Login Streak"
          value={`${stats?.login_streak_days || 0} days`}
          description="Current streak"
          icon={Calendar}
          loading={loading}
        />
        <AnalyticsCard
          title="2FA Uses"
          value={stats?.total_2fa_uses || 0}
          description="Security authentications"
          icon={Key}
          loading={loading}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnalyticsCard
          title="Devices Used"
          value={stats?.devices_used || 0}
          description="Unique devices"
          icon={Smartphone}
          loading={loading}
        />
        <AnalyticsCard
          title="Locations"
          value={stats?.locations_used || 0}
          description="Unique locations"
          icon={MapPin}
          loading={loading}
        />
        <AnalyticsCard
          title="Avg Session"
          value={`${stats?.average_session_duration_minutes || 0}m`}
          description="Session duration"
          icon={Clock}
          loading={loading}
        />
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Login History</TabsTrigger>
          <TabsTrigger value="security">Security Activity</TabsTrigger>
          <TabsTrigger value="patterns">Usage Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Login Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : loginHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No login history found</p>
              ) : (
                <div className="space-y-2">
                  {loginHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getLoginStatusIcon(entry.success)}
                        <div>
                          <div className="font-medium">
                            {format(new Date(entry.login_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.ip_address} • {entry.device_type}
                            {entry.location && ` • ${entry.location}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={entry.success ? "default" : "destructive"}>
                          {entry.success ? 'Success' : 'Failed'}
                        </Badge>
                        {entry.requires_2fa && (
                          <Badge variant="outline">2FA</Badge>
                        )}
                        <Badge variant="secondary">{entry.login_method}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : securityActivity.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No security events found</p>
              ) : (
                <div className="space-y-2">
                  {securityActivity.map((event, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full mt-2 ${getSeverityColor(event.severity)}`} />
                      <div className="flex-1">
                        <div className="font-medium">{event.event_type}</div>
                        <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          {format(new Date(event.occurred_at), 'MMM dd, yyyy HH:mm')}
                          {event.ip_address && ` • ${event.ip_address}`}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {event.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Most Active Hour</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats?.most_active_hour || 0}:00
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Your peak login time
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Last Login</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="text-center">
                    <div className="text-lg font-medium">
                      {stats?.last_login_at 
                        ? format(new Date(stats.last_login_at), 'MMM dd, yyyy HH:mm')
                        : 'Never'
                      }
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Most recent access
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
