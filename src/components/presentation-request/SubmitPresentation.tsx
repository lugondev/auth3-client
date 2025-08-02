'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send,
  Calendar,
  FileText,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import type { PresentationRequest } from '@/types/presentation-request';

// Mock VP Service - replace with actual implementation
const vpService = {
  async getUserPresentations(holderDid: string) {
    // Mock data - replace with actual API call
    return [
      {
        id: '1',
        name: 'Identity Presentation',
        type: 'IdentityCredential',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2', 
        name: 'Education Presentation',
        type: 'EducationCredential',
        createdAt: new Date().toISOString(),
      }
    ];
  }
};

interface SubmitPresentationProps {
  requestId?: string;
}

export function SubmitPresentation({ requestId: propRequestId }: SubmitPresentationProps) {
  const searchParams = useSearchParams();
  const requestIdFromUrl = searchParams.get('requestId');
  const requestId = propRequestId || requestIdFromUrl;
  
  const [request, setRequest] = useState<PresentationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [holderDid, setHolderDid] = useState('');
  const [selectedPresentationId, setSelectedPresentationId] = useState('');
  const [availablePresentations, setAvailablePresentations] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  useEffect(() => {
    if (holderDid) {
      loadAvailablePresentations();
    }
  }, [holderDid]);

  const loadRequest = async () => {
    if (!requestId) return;
    
    try {
      setLoading(true);
      const data = await presentationRequestService.getRequestByRequestId(requestId);
      setRequest(data);
    } catch (error: any) {
      console.error('Failed to load request:', error);
      toast.error('Failed to load presentation request');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePresentations = async () => {
    try {
      const presentations = await vpService.getUserPresentations(holderDid);
      setAvailablePresentations(presentations);
    } catch (error: any) {
      console.error('Failed to load presentations:', error);
      toast.error('Failed to load your presentations');
    }
  };

  const handleSubmit = async () => {
    if (!request || !holderDid || !selectedPresentationId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      await presentationRequestService.submitResponse(request.id, {
        holder_did: holderDid,
        presentation_id: selectedPresentationId,
      });

      setSubmitted(true);
      toast.success('Presentation submitted successfully!');
    } catch (error: any) {
      console.error('Failed to submit presentation:', error);
      toast.error(error.response?.data?.message || 'Failed to submit presentation');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      expired: 'secondary',
      revoked: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = request?.expires_at && new Date(request.expires_at) < new Date();
  const isClosedOrCompleted = request?.status === 'closed' || request?.status === 'completed';
  const canSubmit = request && !isExpired && !isClosedOrCompleted && !submitted;

  if (!requestId) {
    return (
      <Card>
        <CardContent className="text-center p-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No presentation request specified</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!request) {
    return (
      <Card>
        <CardContent className="text-center p-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Presentation request not found</p>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="text-center p-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Presentation Submitted Successfully!</h3>
          <p className="text-gray-500 mb-4">
            Your verifiable presentation has been submitted and is being reviewed.
          </p>
          <p className="text-sm text-gray-400">
            Request ID: {request.request_id}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {request.title}
              </CardTitle>
              <CardDescription className="mt-2">
                Request ID: {request.request_id}
              </CardDescription>
            </div>
            {getStatusBadge(request.status)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {request.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-gray-600">{request.description}</p>
            </div>
          )}

          {request.purpose && (
            <div>
              <h4 className="font-medium mb-2">Purpose</h4>
              <p className="text-gray-600">{request.purpose}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Verifier:</span>
              <span className="font-medium">{request.verifier_name || 'Unknown'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Created:</span>
              <span>{formatDate(request.created_at)}</span>
            </div>
            
            {request.expires_at && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Expires:</span>
                <span className={isExpired ? 'text-red-600' : ''}>
                  {formatDate(request.expires_at)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This presentation request has expired and can no longer accept submissions.
          </AlertDescription>
        </Alert>
      )}

      {isClosedOrCompleted && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This presentation request has been {request?.status === 'closed' ? 'closed' : 'completed'} by the verifier.
          </AlertDescription>
        </Alert>
      )}

      {/* Required Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Required Credentials
          </CardTitle>
          <CardDescription>
            You need to provide the following credentials
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {request.required_credentials.map((credential, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{credential.type}</h4>
                  {credential.format && (
                    <Badge variant="outline">{credential.format}</Badge>
                  )}
                </div>
                
                {credential.constraints && (
                  <div className="text-sm text-gray-600">
                    <p>Additional constraints apply</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submission Form */}
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Presentation</CardTitle>
            <CardDescription>
              Provide your DID and select a presentation to submit
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="holderDid" className="text-sm font-medium">
                Your DID *
              </label>
              <input
                id="holderDid"
                type="text"
                value={holderDid}
                onChange={(e) => setHolderDid(e.target.value)}
                placeholder="did:example:123..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {holderDid && (
              <div className="space-y-2">
                <label htmlFor="presentation" className="text-sm font-medium">
                  Select Presentation *
                </label>
                <Select value={selectedPresentationId} onValueChange={setSelectedPresentationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a presentation to submit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePresentations.map((presentation) => (
                      <SelectItem key={presentation.id} value={presentation.id}>
                        {presentation.name} ({presentation.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={!holderDid || !selectedPresentationId || submitting}
                className="w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Presentation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
