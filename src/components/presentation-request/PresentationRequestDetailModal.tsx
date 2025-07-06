'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  QrCode, 
  Calendar, 
  Clock, 
  Shield, 
  Users, 
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import type { PresentationRequest, PresentationResponse } from '@/types/presentation-request';

interface PresentationRequestDetailModalProps {
  request: PresentationRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (request: PresentationRequest) => void;
}

export function PresentationRequestDetailModal({
  request,
  isOpen,
  onClose,
  onEdit
}: PresentationRequestDetailModalProps) {
  const [responses, setResponses] = useState<PresentationResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'responses' | 'analytics'>('details');

  useEffect(() => {
    if (isOpen && request) {
      loadResponses();
    }
  }, [isOpen, request]);

  const loadResponses = async () => {
    if (!request) return;
    
    try {
      setLoadingResponses(true);
      const result = await presentationRequestService.getResponses(request.id);
      // Backend returns { responses: [...], pagination: {...} }
      setResponses(result.responses || []);
    } catch (error) {
      console.error('Failed to load responses:', error);
      toast.error('Failed to load responses');
    } finally {
      setLoadingResponses(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      active: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      expired: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      revoked: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      completed: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
    };

    const config = variants[status] || { variant: 'outline' as const, icon: <AlertCircle className="h-3 w-3" /> };

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleGenerateQR = async () => {
    if (!request) return;
    
    try {
      const { qrCodeData } = await presentationRequestService.generateQRCode(request.id);
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = `presentation-request-${request.request_id}.png`;
      link.click();
      toast.success('QR code downloaded');
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {request.title}
          </DialogTitle>
          <DialogDescription>
            Presentation Request Details - ID: {request.request_id}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'details' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'responses' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('responses')}
          >
            Responses ({responses.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'analytics' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>

        <div className="space-y-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Response Count</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{request.response_count}</span>
                        {request.max_responses && (
                          <span className="text-muted-foreground">/ {request.max_responses}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1 text-sm">{request.description || 'No description provided'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                    <p className="mt-1 text-sm">{request.purpose || 'No purpose specified'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(request.created_at)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expires</label>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {request.expires_at ? formatDate(request.expires_at) : 'Never'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verifier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verifier Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Verifier Name</label>
                    <p className="mt-1 text-sm">{request.verifier_name || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Verifier DID</label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="text-xs bg-muted p-2 rounded font-mono flex-1 break-all">
                        {request.verifier_did}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(request.verifier_did, 'Verifier DID')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Required Credentials */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Credentials</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {request.required_credentials?.map((credential, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{credential.type}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={credential.essential ? 'default' : 'secondary'}>
                              {credential.essential ? 'Essential' : 'Optional'}
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
                              <code className="text-xs bg-muted p-1 rounded">{credential.schema}</code>
                            </div>
                          )}
                          {credential.issuer && (
                            <div>
                              <span className="font-medium">Required Issuer:</span>
                              <br />
                              <code className="text-xs bg-muted p-1 rounded">{credential.issuer}</code>
                            </div>
                          )}
                        </div>
                        
                        {credential.constraints && Object.keys(credential.constraints).length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium">Constraints:</span>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(credential.constraints, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Verification Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Verification Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(request.verification_options || {}).map(([option, enabled]) => (
                      <div key={option} className="flex items-center gap-2">
                        {enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">
                          {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Share Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Request ID</label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="text-xs bg-muted p-2 rounded font-mono flex-1">
                        {request.request_id}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(request.request_id, 'Request ID')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {request.share_url && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Share URL</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="text-xs bg-muted p-2 rounded font-mono flex-1 break-all">
                          {request.share_url}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(request.share_url!, 'Share URL')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(request.share_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {request.qr_code_data && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">QR Code Data</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="text-xs bg-muted p-2 rounded font-mono flex-1 break-all">
                          QR Code available
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(request.qr_code_data!, 'QR Code Data')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateQR}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Responses Tab */}
          {activeTab === 'responses' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Presentation Responses</CardTitle>
                <CardDescription>
                  {loadingResponses ? 'Loading responses...' : `${responses.length} response(s) received`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingResponses ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : responses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No responses received yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {responses.map((response) => (
                      <div key={response.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Response {response.id}</h4>
                            <p className="text-sm text-muted-foreground">
                              From: {response.holder_did}
                            </p>
                          </div>
                          {getStatusBadge(response.status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Submitted: {formatDate(response.submitted_at)}
                        </div>
                        
                        {response.verified_at && (
                          <div className="text-sm text-muted-foreground">
                            Verified: {formatDate(response.verified_at)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{request.response_count}</div>
                    <div className="text-sm text-muted-foreground">Total Responses</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {responses.filter(r => r.status === 'verified').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Verified</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {responses.filter(r => r.status === 'submitted').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Response Timeline</h4>
                  <div className="space-y-2">
                    {responses.map((response) => (
                      <div key={response.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>{formatDate(response.submitted_at)}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>Response from {response.holder_did.slice(0, 20)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between gap-4 pt-6 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateQR}>
              <QrCode className="h-4 w-4 mr-2" />
              Download QR
            </Button>
            
            {request.share_url && (
              <Button
                variant="outline"
                onClick={() => window.open(request.share_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Share URL
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {onEdit && request.status === 'active' && (
              <Button
                variant="outline"
                onClick={() => {
                  onEdit(request);
                  onClose();
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Edit Request
              </Button>
            )}
            
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
