'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  FileText,
  QrCode,
  ArrowLeft,
  Send,
  Lock,
  Pause,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import { useAuth } from '@/contexts/AuthContext';
import { PresentationResponseForm } from './PresentationResponseForm';
import { ResponseLimitInfo } from './ResponseLimitInfo';
import { PresentationRequestAnalytics } from './PresentationRequestAnalytics';
import type { PresentationRequest } from '@/types/presentation-request';

interface PresentationRequestViewProps {
  requestId?: string;
  onRespondSuccess?: () => void;
  showAnalytics?: boolean;
}

export function PresentationRequestView({ requestId, onRespondSuccess, showAnalytics = false }: PresentationRequestViewProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [request, setRequest] = useState<PresentationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  // Get request ID from props or URL params
  const finalRequestId = requestId || searchParams.get('requestId');

  useEffect(() => {
    console.log('Final Request ID:', finalRequestId);
    if (finalRequestId) {
      loadRequest();
    }
  }, [finalRequestId]);

  const loadRequest = async () => {
    if (!finalRequestId) return;

    try {
      setLoading(true);
      const result = await presentationRequestService.getRequestByRequestId(finalRequestId);
      setRequest(result);
    } catch (error: any) {
      console.error('Failed to load presentation request:', error);
      toast.error('Failed to load presentation request');
      if (error.response?.status === 404) {
        toast.error('Presentation request not found or has expired');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = () => {
    if (!request) return;
    // Navigate to credential selection page - use the same page but trigger response mode
    setResponding(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, icon: React.ReactElement }> = {
      active: { variant: 'default' as const, icon: <CheckCircle className="h-4 w-4" /> },
      expired: { variant: 'destructive' as const, icon: <Clock className="h-4 w-4" /> },
      completed: { variant: 'default' as const, icon: <CheckCircle className="h-4 w-4" /> },
      cancelled: { variant: 'destructive' as const, icon: <XCircle className="h-4 w-4" /> },
      closed: { variant: 'secondary' as const, icon: <Lock className="h-4 w-4" /> },
      paused: { variant: 'outline' as const, icon: <Pause className="h-4 w-4" /> },
      revoked: { variant: 'destructive' as const, icon: <XCircle className="h-4 w-4" /> },
    };

    const config = variants[status] || { variant: 'outline' as const, icon: <AlertTriangle className="h-4 w-4" /> };

    return (
      <Badge variant={config.variant} className="flex items-center gap-2">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading presentation request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Request Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The presentation request could not be found or has expired.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if request is expired or inactive
  const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
  const isInactive = request.status !== 'active';
  const canRespond = request.status === 'active' && !isExpired;

  // If responding, show the response form
  if (responding && request) {
    return (
      <PresentationResponseForm 
        request={request}
        onCancel={() => setResponding(false)}
        onSuccess={() => {
          setResponding(false);
          if (onRespondSuccess) {
            onRespondSuccess();
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Presentation Request
              </h1>
              <p className="text-muted-foreground">
                You have been requested to share verifiable credentials
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/presentation-requests/${request.request_id}/analytics`)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              {getStatusBadge(request.status)}
            </div>
          </div>
        </div>

        {/* Warning if expired or revoked */}
        {(isExpired || isInactive) && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  {isInactive ? 'This request is not active' : 'This request has expired'}
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {isInactive 
                  ? 'The verifier has cancelled this presentation request.'
                  : 'This presentation request is no longer accepting responses.'
                }
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {request.title}
                </CardTitle>
                <CardDescription>
                  Requested by {request.verifier_name || 'Anonymous Verifier'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                  </div>
                )}

                {request.purpose && (
                  <div>
                    <h4 className="font-medium mb-2">Purpose</h4>
                    <p className="text-sm text-muted-foreground">{request.purpose}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Request ID:</span>
                    <br />
                    <code className="text-xs bg-muted p-1 rounded">{request.request_id}</code>
                  </div>
                  
                  <div>
                    <span className="font-medium">Created:</span>
                    <br />
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(request.created_at)}
                    </span>
                  </div>

                  {request.expires_at && (
                    <div>
                      <span className="font-medium">Expires:</span>
                      <br />
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(request.expires_at)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Required Credentials */}
            <Card>
              <CardHeader>
                <CardTitle>Required Credentials</CardTitle>
                <CardDescription>
                  The following credentials are requested for verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.required_credentials?.map((credential: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{credential.type}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={credential.essential ? 'default' : 'secondary'}>
                            {credential.essential ? 'Required' : 'Optional'}
                          </Badge>
                          {credential.format && (
                            <Badge variant="outline">{credential.format}</Badge>
                          )}
                        </div>
                      </div>
                      
                      {credential.purpose && (
                        <p className="text-sm text-muted-foreground mb-2">{credential.purpose}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {credential.schema && (
                          <div>
                            <span className="font-medium">Schema:</span>
                            <br />
                            <code className="text-xs bg-muted p-1 rounded break-all">{credential.schema}</code>
                          </div>
                        )}
                        {credential.issuer && (
                          <div>
                            <span className="font-medium">Trusted Issuer:</span>
                            <br />
                            <code className="text-xs bg-muted p-1 rounded break-all">{credential.issuer}</code>
                          </div>
                        )}
                      </div>
                      
                      {credential.constraints && Object.keys(credential.constraints).length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Additional Requirements:</span>
                          <div className="text-xs bg-muted p-2 rounded mt-1">
                            {JSON.stringify(credential.constraints, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verifier Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Verifier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">Name:</span>
                  <p className="text-sm">{request.verifier_name || 'Not specified'}</p>
                </div>
                
                <div>
                  <span className="font-medium">DID:</span>
                  <code className="text-xs bg-muted p-1 rounded block mt-1 break-all">
                    {request.verifier_did}
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Action Card */}
            <Card>
              <CardHeader>
                <CardTitle>Respond to Request</CardTitle>
                <CardDescription>
                  {canRespond 
                    ? 'Share your credentials to complete this verification'
                    : 'This request cannot be responded to'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You need to log in to respond to this presentation request.
                    </p>
                    <Button 
                      onClick={() => router.push('/login')}
                      className="w-full"
                    >
                      Log In to Respond
                    </Button>
                  </div>
                ) : canRespond ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Click below to select and share your credentials.
                    </p>
                    <Button 
                      onClick={handleRespond}
                      className="w-full flex items-center gap-2"
                      disabled={responding}
                    >
                      <Send className="h-4 w-4" />
                      {responding ? 'Processing...' : 'Select Credentials'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {isInactive 
                        ? 'This request has been cancelled by the verifier.'
                        : 'This request has expired and can no longer accept responses.'
                      }
                    </p>
                    <Button disabled className="w-full">
                      Cannot Respond
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardContent className="py-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Security Notice</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Only share credentials with trusted verifiers. 
                      Your credentials will be verified but not stored by the verifier.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Limit Info */}
            <ResponseLimitInfo request={request} />
          </div>
        </div>

        {/* Analytics Section - only show if enabled */}
        {showAnalytics && (
          <div className="mt-8">
            <PresentationRequestAnalytics requestId={request.request_id} />
          </div>
        )}
      </div>
    </div>
  );
}
