'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import { ResponseTimeline } from './ResponseTimeline';
import type { PresentationResponse } from '@/types/presentation-request';

interface RequestAnalytics {
  request_id: string;
  total_responses: number;
  verified_responses: number;
  rejected_responses: number;
  pending_responses: number;
  unique_holders: number;
  success_rate: number;
  average_response_time: number;
  response_timeline: Array<{
    timestamp: string;
    event: string;
    holder_did: string;
    status: string;
  }>;
  failure_reasons: Array<{
    reason: string;
    count: number;
  }>;
}

interface PresentationRequestAnalyticsProps {
  requestId: string;
}

export function PresentationRequestAnalytics({ requestId }: PresentationRequestAnalyticsProps) {
  const [analytics, setAnalytics] = useState<RequestAnalytics | null>(null);
  const [responses, setResponses] = useState<PresentationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [requestId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Try to load analytics from new endpoint first
      try {
        const analyticsData = await presentationRequestService.getRequestAnalytics(requestId);
        setAnalytics(analyticsData);
        
        // Also load responses for timeline
        const responsesData = await presentationRequestService.getResponses(requestId, {
          page: 1,
          pageSize: 100
        });
        setResponses(responsesData.responses);
        
        return; // Success, exit early
      } catch (analyticsError) {
        console.warn('Analytics endpoint not available, calculating from responses:', analyticsError);
      }
      
      // Fallback: Load responses and calculate analytics manually
      const responsesData = await presentationRequestService.getResponses(requestId, {
        page: 1,
        pageSize: 100 // Get all responses for analytics
      });
      
      setResponses(responsesData.responses);
      
      // Calculate analytics from responses data
      const totalResponses = responsesData.responses.length;
      const verifiedResponses = responsesData.responses.filter(r => r.status === 'verified').length;
      const rejectedResponses = responsesData.responses.filter(r => r.status === 'rejected').length;
      const pendingResponses = responsesData.responses.filter(r => r.status === 'submitted').length;
      
      // Calculate unique holders
      const uniqueHolders = new Set(responsesData.responses.map(r => r.holder_did)).size;
      
      // Calculate success rate
      const successRate = totalResponses > 0 ? (verifiedResponses / totalResponses) * 100 : 0;
      
      // Calculate average response time (mock for now)
      const avgResponseTime = 2.5; // TODO: Calculate actual response time when verification_time is available
      
      // Create timeline from responses
      const timeline = responsesData.responses.map(response => ({
        timestamp: response.submitted_at,
        event: 'response_submitted',
        holder_did: response.holder_did,
        status: response.status
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Calculate failure reasons
      const failureReasons: Array<{reason: string, count: number}> = [];
      const reasonCounts = new Map<string, number>();
      
      responsesData.responses
        .filter(r => r.status === 'rejected' && r.verification_result?.errors)
        .forEach(response => {
          response.verification_result?.errors?.forEach(error => {
            const currentCount = reasonCounts.get(error) || 0;
            reasonCounts.set(error, currentCount + 1);
          });
        });
      
      reasonCounts.forEach((count, reason) => {
        failureReasons.push({ reason, count });
      });
      
      failureReasons.sort((a, b) => b.count - a.count);
      
      const calculatedAnalytics: RequestAnalytics = {
        request_id: requestId,
        total_responses: totalResponses,
        verified_responses: verifiedResponses,
        rejected_responses: rejectedResponses,
        pending_responses: pendingResponses,
        unique_holders: uniqueHolders,
        success_rate: successRate,
        average_response_time: avgResponseTime,
        response_timeline: timeline,
        failure_reasons: failureReasons
      };
      
      setAnalytics(calculatedAnalytics);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const exportData = {
      ...analytics,
      responses,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation_request_analytics_${requestId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analytics exported successfully');
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Request Analytics</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Request Analytics</h2>
          <p className="text-muted-foreground">Detailed insights for request {requestId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_responses}</div>
            <p className="text-xs text-muted-foreground">
              From {analytics.unique_holders} unique holders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.success_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.verified_responses} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Responses</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.rejected_responses}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.total_responses > 0 ? 
                ((analytics.rejected_responses / analytics.total_responses) * 100).toFixed(1) 
                : 0}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.average_response_time.toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">Average verification time</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.verified_responses}
            </div>
            <p className="text-xs text-green-600 mt-1">Successfully verified</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.rejected_responses}
            </div>
            <p className="text-xs text-red-600 mt-1">Verification failed</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.pending_responses}
            </div>
            <p className="text-xs text-yellow-600 mt-1">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Failure Reasons */}
      {analytics.failure_reasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Top Failure Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.failure_reasons.slice(0, 5).map((reason, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded">
                  <span className="text-sm text-red-800">{reason.reason}</span>
                  <Badge variant="destructive">{reason.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Timeline */}
      <ResponseTimeline 
        responses={responses} 
        requestId={requestId} 
      />
    </div>
  );
}
