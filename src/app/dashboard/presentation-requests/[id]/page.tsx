'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Clock, 
  User, 
  FileText, 
  Calendar,
  Shield,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import type { PresentationRequest } from '@/types/presentation-request';

export default function PresentationRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  
  const [requestDetails, setRequestDetails] = useState<PresentationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequestDetails();
  }, [requestId]);

  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load request details from API
      const response = await presentationRequestService.getRequestById(requestId);
      setRequestDetails(response);
      
    } catch (err) {
      console.error('Failed to load request details:', err);
      setError('Failed to load presentation request details');
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponses = () => {
    router.push(`/dashboard/presentation-requests/${requestId}/responses`);
  };

  const handleCopyLink = () => {
    if (requestDetails?.share_url) {
      navigator.clipboard.writeText(requestDetails.share_url);
      toast.success('Share link copied to clipboard');
    }
  };

  const handleRefresh = () => {
    loadRequestDetails();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading request details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !requestDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <p className="text-red-600 font-medium">{error || 'Request not found'}</p>
              <p className="text-sm text-gray-400 mt-1">The presentation request could not be loaded</p>
              <Button onClick={handleRefresh} className="mt-4" variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{requestDetails.title}</h1>
            <p className="text-gray-600">Presentation Request Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {requestDetails.response_count > 0 && (
            <Button onClick={handleViewResponses}>
              <User className="h-4 w-4 mr-2" />
              View Responses ({requestDetails.response_count})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Request Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{requestDetails.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Purpose</label>
                <p className="text-gray-900">{requestDetails.purpose}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Request ID</label>
                  <p className="font-mono text-sm text-gray-900">{requestDetails.request_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={`${getStatusColor(requestDetails.status)} mt-1`}>
                    {getStatusIcon(requestDetails.status)}
                    <span className="ml-1 capitalize">{requestDetails.status}</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Required Credentials
              </CardTitle>
              <CardDescription>
                Credentials that need to be provided for this verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requestDetails.required_credentials.map((credential, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{credential.type}</h4>
                    <Badge variant={credential.essential ? "default" : "secondary"}>
                      {credential.essential ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{credential.purpose}</p>
                  
                  {credential.issuer && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Issuer:</span> {credential.issuer}
                    </div>
                  )}
                  
                  {credential.schema && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Schema:</span> {credential.schema}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Verifier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Verifier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{requestDetails.verifier_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">DID</label>
                <p className="font-mono text-xs text-gray-900 break-all">{requestDetails.verifier_did}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-900">{formatDateTime(requestDetails.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">{formatDateTime(requestDetails.updated_at)}</p>
              </div>
              {requestDetails.expires_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Expires</label>
                  <p className="text-sm text-gray-900">{formatDateTime(requestDetails.expires_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Response Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Responses</span>
                <span className="font-medium">{requestDetails.response_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Max Responses</span>
                <span className="font-medium">{requestDetails.max_responses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Progress</span>
                <span className="font-medium">
                  {Math.round((requestDetails.response_count / (requestDetails.max_responses || 1)) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Share */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Share Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Share URL</label>
                <div className="flex gap-2 mt-1">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded break-all">
                    {requestDetails.share_url}
                  </code>
                  <Button size="sm" variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                <QrCode className="h-4 w-4 mr-2" />
                Show QR Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
