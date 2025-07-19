'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  QrCode, 
  TrendingUp, 
  Clock, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  BarChart3,
  RefreshCw,
  Calendar,
  Users
} from 'lucide-react'

interface QRCodeAnalytics {
  total_sessions: number
  successful_scans: number
  failed_scans: number
  expired_sessions: number
  average_scan_time: number
  success_rate: number
  active_sessions: number
  popular_scan_times: Array<{
    hour: number
    count: number
  }>
  device_types: Array<{
    type: string
    count: number
  }>
  recent_activity: Array<{
    id: string
    status: string
    created_at: string
    scanned_at?: string
    user_agent?: string
  }>
}

interface TimeRange {
  label: string
  value: string
  days: number
}

const timeRanges: TimeRange[] = [
  { label: 'Last 24 hours', value: '24h', days: 1 },
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 }
]

export function QRCodeAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<QRCodeAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)

  // Load analytics data
  const loadAnalytics = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    setError(null)

    try {
      const response = await fetch(`/api/v1/oauth2/qr/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Add proper auth
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load analytics data')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    return `${(seconds / 60).toFixed(1)}m`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'expired': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      case 'pending': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'expired': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <QrCode className="h-4 w-4 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => loadAnalytics()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              No analytics data available for the selected time range.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">QR Code Analytics</h2>
          <p className="text-gray-600">Monitor QR code login performance and usage</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => loadAnalytics(true)} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold">{analytics.total_sessions.toLocaleString()}</p>
              </div>
              <QrCode className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{analytics.success_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Scan Time</p>
                <p className="text-2xl font-bold">{formatTime(analytics.average_scan_time)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">{analytics.active_sessions}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Session Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Successful</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{analytics.successful_scans}</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {((analytics.successful_scans / analytics.total_sessions) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{analytics.failed_scans}</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {((analytics.failed_scans / analytics.total_sessions) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>Expired</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{analytics.expired_sessions}</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {((analytics.expired_sessions / analytics.total_sessions) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {analytics.device_types.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-gray-600" />
                    <span className="capitalize">{device.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{device.count}</span>
                    <Badge variant="outline">
                      {((device.count / analytics.total_sessions) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Usage Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Peak Usage Times
          </CardTitle>
          <CardDescription>
            Hourly distribution of QR code scans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {analytics.popular_scan_times.map((hour, index) => {
              const maxCount = Math.max(...analytics.popular_scan_times.map(h => h.count))
              const height = (hour.count / maxCount) * 100
              return (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-8 bg-blue-200 rounded-t flex items-end justify-center"
                    style={{ height: `${Math.max(height, 10)}px` }}
                  >
                    <div 
                      className="w-6 bg-blue-600 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs mt-1">{hour.hour}h</span>
                  <span className="text-xs text-gray-500">{hour.count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest QR code session attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recent_activity.length > 0 ? (
              analytics.recent_activity.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(session.status)}
                    <div>
                      <p className="font-medium text-sm">Session {session.id.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-500">
                        Created: {formatDate(session.created_at)}
                        {session.scanned_at && (
                          <span> • Scanned: {formatDate(session.scanned_at)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(session.status)}
                    >
                      {session.status}
                    </Badge>
                    {session.user_agent && (
                      <p className="text-xs text-gray-500 mt-1 max-w-32 truncate">
                        {session.user_agent}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No recent activity found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
