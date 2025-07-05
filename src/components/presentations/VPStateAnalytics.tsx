'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Activity, CheckCircle, XCircle, Clock, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { VPTransitionStatistics } from '@/types/vp-state-machine'
import { getVPStateTransitionStatistics } from '@/services/vpStateMachineService'

interface VPStateAnalyticsProps {
  className?: string
  dateRange?: {
    startDate: string
    endDate: string
  }
  presentationId?: string
  autoRefresh?: boolean
}

/**
 * VPStateAnalytics Component - Displays analytics for VP state transitions
 * 
 * Features:
 * - Success rate metrics
 * - State transition flow analysis
 * - Actor performance statistics
 * - Time-based trending
 * - Interactive charts
 */
export function VPStateAnalytics({
  className = '',
  dateRange,
  presentationId,
  autoRefresh = false
}: VPStateAnalyticsProps) {
  const [statistics, setStatistics] = useState<VPTransitionStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load statistics
  const loadStatistics = async () => {
    try {
      setLoading(true)
      setError(null)
      const stats = await getVPStateTransitionStatistics({
        ...dateRange,
        presentationId
      })
      setStatistics(stats)
    } catch (err) {
      setError('Failed to load state transition statistics')
      console.error('Error loading VP state statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [dateRange, presentationId])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(loadStatistics, 60000) // 1 minute
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Chart colors
  const COLORS = {
    success: '#10b981',
    failed: '#ef4444',
    pending: '#f59e0b',
    submitted: '#3b82f6',
    verified: '#10b981',
    rejected: '#ef4444',
    expired: '#6b7280',
    revoked: '#dc2626'
  }

  // Transform data for charts
  const getStateTransitionData = () => {
    if (!statistics?.transitionsByState) return []
    
    return Object.entries(statistics.transitionsByState).flatMap(([fromState, toStates]) =>
      Object.entries(toStates).map(([toState, count]) => ({
        from: fromState,
        to: toState,
        count,
        transition: `${fromState} → ${toState}`
      }))
    ).sort((a, b) => b.count - a.count)
  }

  const getActorData = () => {
    if (!statistics?.transitionsByActor) return []
    
    return Object.entries(statistics.transitionsByActor)
      .map(([actor, count]) => ({
        actor: actor.length > 20 ? `${actor.substring(0, 20)}...` : actor,
        fullActor: actor,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 actors
  }

  const getSuccessRateData = () => {
    if (!statistics) return []
    
    return [
      {
        name: 'Successful',
        value: statistics.successfulTransitions,
        color: COLORS.success
      },
      {
        name: 'Failed',
        value: statistics.failedTransitions,
        color: COLORS.failed
      }
    ]
  }

  const getDailyTrendData = () => {
    if (!statistics?.dailyStats) return []
    
    return statistics.dailyStats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString(),
      total: stat.total,
      successful: stat.successful,
      failed: stat.failed,
      successRate: stat.total > 0 ? (stat.successful / stat.total) * 100 : 0
    }))
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            VP State Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Activity className="h-5 w-5" />
            Error Loading Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!statistics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            VP State Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No analytics data available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transitions</p>
                <p className="text-2xl font-bold">{statistics.totalTransitions.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.successRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold">
                  {statistics.averageDuration < 1000 
                    ? `${Math.round(statistics.averageDuration)}ms`
                    : `${(statistics.averageDuration / 1000).toFixed(1)}s`
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Actors</p>
                <p className="text-2xl font-bold">
                  {Object.keys(statistics.transitionsByActor).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="transitions" className="w-full">
        <TabsList>
          <TabsTrigger value="transitions">State Transitions</TabsTrigger>
          <TabsTrigger value="actors">Top Actors</TabsTrigger>
          <TabsTrigger value="success">Success Rate</TabsTrigger>
          {statistics.dailyStats && <TabsTrigger value="trends">Daily Trends</TabsTrigger>}
        </TabsList>

        <TabsContent value="transitions">
          <Card>
            <CardHeader>
              <CardTitle>State Transition Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getStateTransitionData().slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="transition" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.submitted} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actors">
          <Card>
            <CardHeader>
              <CardTitle>Top Actors by Transition Count</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getActorData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="actor" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name, props) => [value, 'Transitions']}
                    labelFormatter={(label, payload) => 
                      payload?.[0]?.payload?.fullActor || label
                    }
                  />
                  <Bar dataKey="count" fill={COLORS.verified} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="success">
          <Card>
            <CardHeader>
              <CardTitle>Success vs Failure Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getSuccessRateData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getSuccessRateData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {statistics.dailyStats && (
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Daily Transition Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getDailyTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke={COLORS.submitted} 
                      strokeWidth={2}
                      name="Total"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="successful" 
                      stroke={COLORS.success} 
                      strokeWidth={2}
                      name="Successful"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="failed" 
                      stroke={COLORS.failed} 
                      strokeWidth={2}
                      name="Failed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
