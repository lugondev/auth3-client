'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard'
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart'
import * as securityEventsService from '@/services/securityEventsService'
import type { SecurityEvent, SecurityOverview, SecurityEventsFilter } from '@/types/securityEvents'

/**
 * Security Dashboard Component
 * 
 * Provides comprehensive security monitoring interface with:
 * - Security overview metrics
 * - Recent security events
 * - Security alerts and recommendations
 * - Interactive charts and analytics
 */

interface SecurityDashboardProps {
  className?: string
}

interface SecurityAlert {
  id: string
  type: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  timestamp: Date
  resolved: boolean
}

interface SecurityRecommendation {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'authentication' | 'authorization' | 'data' | 'network'
  implemented: boolean
}

const MOCK_ALERTS: SecurityAlert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Multiple Failed Login Attempts',
    description: 'Detected 15 failed login attempts from IP 192.168.1.100 in the last 5 minutes',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    resolved: false
  },
  {
    id: '2',
    type: 'high',
    title: 'Suspicious DID Activity',
    description: 'Unusual DID creation pattern detected from user account',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    resolved: false
  },
  {
    id: '3',
    type: 'medium',
    title: 'Weak Password Detected',
    description: 'User account using password that does not meet security requirements',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    resolved: true
  }
]

const MOCK_RECOMMENDATIONS: SecurityRecommendation[] = [
  {
    id: '1',
    title: 'Enable Multi-Factor Authentication',
    description: 'Implement MFA for all user accounts to enhance security',
    priority: 'high',
    category: 'authentication',
    implemented: false
  },
  {
    id: '2',
    title: 'Regular Security Audits',
    description: 'Schedule monthly security audits to identify vulnerabilities',
    priority: 'medium',
    category: 'data',
    implemented: true
  },
  {
    id: '3',
    title: 'Update Password Policy',
    description: 'Strengthen password requirements and enforce regular updates',
    priority: 'high',
    category: 'authentication',
    implemented: false
  }
]

function getAlertBadgeVariant(type: SecurityAlert['type']) {
  switch (type) {
    case 'critical':
      return 'destructive'
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'default'
  }
}

function getAlertIcon(type: SecurityAlert['type']) {
  switch (type) {
    case 'critical':
    case 'high':
      return XCircle
    case 'medium':
      return AlertTriangle
    case 'low':
      return Clock
    default:
      return AlertTriangle
  }
}

function getPriorityBadgeVariant(priority: SecurityRecommendation['priority']) {
  switch (priority) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'default'
  }
}

export function SecurityDashboard({ className = '' }: SecurityDashboardProps) {
  const [overview, setOverview] = useState<SecurityOverview | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [alerts] = useState<SecurityAlert[]>(MOCK_ALERTS)
  const [recommendations] = useState<SecurityRecommendation[]>(MOCK_RECOMMENDATIONS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<SecurityEventsFilter>({})

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      
      const [overviewData, eventsData] = await Promise.all([
        securityEventsService.getSecurityOverview(),
        securityEventsService.getSecurityEvents(filter)
      ])
      
      setOverview(overviewData)
      setEvents(eventsData.events || [])
    } catch (error) {
      console.error('Failed to fetch security data:', error)
      toast.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSecurityData()
    setRefreshing(false)
    toast.success('Security data refreshed')
  }

  useEffect(() => {
    fetchSecurityData()
  }, [filter])

  // Prepare chart data for security events trend
  const chartData = events.slice(0, 10).map((event, index) => ({
    name: `Event ${index + 1}`,
    value: event.severity === 'critical' ? 4 : event.severity === 'high' ? 3 : event.severity === 'medium' ? 2 : 1,
    severity: event.severity
  }))

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor security events, alerts, and recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Events"
          value={overview?.total_events || 0}
          icon={Shield}
          loading={loading}
        />
        <AnalyticsCard
          title="Critical Events"
          value={overview?.critical_events || 0}
          icon={XCircle}
          loading={loading}
          trend={{
            value: 12,
            isPositive: false
          }}
        />
        <AnalyticsCard
          title="High Priority"
          value={overview?.high_events || 0}
          icon={AlertTriangle}
          loading={loading}
        />
        <AnalyticsCard
          title="Resolved Today"
          value={42}
          icon={CheckCircle}
          loading={loading}
          trend={{
            value: 8,
            isPositive: true
          }}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Latest security events and incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : events.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.slice(0, 10).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {event.event_type}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.severity === 'critical' ? 'destructive' : 'default'}>
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{event.user_id || 'System'}</TableCell>
                        <TableCell>{event.ip_address || 'N/A'}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No security events found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type)
              return (
                <Alert key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                  <Icon className="h-4 w-4" />
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <Badge variant={getAlertBadgeVariant(alert.type)}>
                          {alert.type}
                        </Badge>
                        {alert.resolved && (
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <AlertDescription>
                        {alert.description}
                      </AlertDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!alert.resolved && (
                        <Button size="sm">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </Alert>
              )
            })}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className={rec.implemented ? 'opacity-60' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge variant={getPriorityBadgeVariant(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          {rec.category}
                        </Badge>
                        {rec.implemented && (
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Implemented
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rec.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Learn More
                      </Button>
                      {!rec.implemented && (
                        <Button size="sm">
                          Implement
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AnalyticsChart
              title="Security Events Trend"
              data={chartData}
              type="line"
              dataKey="value"
              xAxisKey="name"
              loading={loading}
            />
            <AnalyticsChart
              title="Event Severity Distribution"
              data={[
                { name: 'Critical', value: overview?.critical_events || 0 },
                { name: 'High', value: overview?.high_events || 0 },
                { name: 'Medium', value: overview?.medium_events || 0 },
                { name: 'Low', value: overview?.low_events || 0 }
              ]}
              type="pie"
              loading={loading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SecurityDashboard