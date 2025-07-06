'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Clock, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { analyticsService, type PresentationRequestAnalytics } from '@/services/analytics-service';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<PresentationRequestAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get analytics for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const analyticsData = await analyticsService.getPresentationRequestAnalytics({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        interval: 'day',
      });
      
      setData(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRefresh = () => {
    loadAnalytics();
  };

  const handleExport = () => {
    if (!data) return;
    
    // Simple CSV export
    const csvData = [
      ['Metric', 'Value'],
      ['Total Requests', data.overview.total_requests.toString()],
      ['Active Requests', data.overview.active_requests.toString()],
      ['Completed Requests', data.overview.completed_requests.toString()],
      ['Success Rate', `${data.overview.success_rate.toFixed(1)}%`],
      ['Average Response Time', data.overview.average_response_time],
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Analytics data exported successfully');
  };

  // Use real data from API - no mock data
  const displayData = data;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
            <p className="text-gray-600">Presentation request performance and insights</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading analytics data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !displayData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
            <p className="text-gray-600">Presentation request performance and insights</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <p className="text-red-600 font-medium">{error || 'Failed to load analytics'}</p>
              <p className="text-sm text-gray-400 mt-1">Please try again or contact support</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state if no data
  if (displayData.overview.total_requests === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
            <p className="text-gray-600">Presentation request performance and insights</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">No presentation requests yet</p>
              <p className="text-sm text-gray-400 mt-1">Analytics will appear once you have presentation request activity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successRate = Math.round(displayData.overview.success_rate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600">Presentation request performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData.overview.total_requests}</div>
            <p className="text-xs text-muted-foreground">
              {displayData.overview.active_requests} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {displayData.overview.completed_requests} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData.overview.average_response_time}</div>
            <p className="text-xs text-muted-foreground">
              Response time improved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData.overview.pending_requests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting responses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Verification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Top Verification Types</CardTitle>
            <CardDescription>
              Most requested verification categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayData.top_verification_types.length > 0 ? (
              displayData.top_verification_types.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" style={{
                      backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b'
                    }} />
                    <span className="font-medium">{type.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{type.count}</Badge>
                    <span className="text-sm text-muted-foreground">{type.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No verification types available</p>
                <p className="text-sm text-gray-400">Data will appear after requests are made</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Daily request volume and success rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayData.recent_activity.length > 0 ? (
                displayData.recent_activity.map((activity, index) => {
                  const successRate = activity.requests > 0 ? Math.round((activity.success / activity.requests) * 100) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div>
                        <p className="font-medium">{activity.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.requests} requests • {activity.success} successful
                        </p>
                      </div>
                      <Badge 
                        variant={successRate >= 90 ? "default" : successRate >= 80 ? "secondary" : "destructive"}
                      >
                        {successRate}%
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400">Request activity will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            System performance and peak usage times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{displayData.performance_metrics.avg_response_time.toFixed(1)}s</div>
              <p className="text-sm text-muted-foreground">Average Response Time</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{displayData.performance_metrics.success_rate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Overall Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {displayData.performance_metrics.peak_hours.length > 0 
                  ? `${displayData.performance_metrics.peak_hours[0].hour}:00` 
                  : 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">Peak Hour</p>
            </div>
          </div>
          
          {displayData.performance_metrics.peak_hours.length > 0 ? (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Peak Usage Hours</h4>
              <div className="flex gap-2 flex-wrap">
                {displayData.performance_metrics.peak_hours.map((peak, index) => (
                  <Badge key={index} variant="outline">
                    {peak.hour}:00 ({peak.count} requests)
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">No peak usage data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsView;
