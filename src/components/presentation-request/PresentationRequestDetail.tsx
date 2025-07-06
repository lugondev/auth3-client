'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  QrCode, 
  Share2, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  Shield,
  Calendar,
  Users,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import type { PresentationRequest, PresentationResponse } from '@/types/presentation-request';

interface PresentationRequestDetailProps {
  requestId: string;
  onBack?: () => void;
}

export function PresentationRequestDetail({ requestId, onBack }: PresentationRequestDetailProps) {
  const [request, setRequest] = useState<PresentationRequest | null>(null);
  const [responses, setResponses] = useState<PresentationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadRequest();
    loadResponses();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const data = await presentationRequestService.getRequestById(requestId);
      setRequest(data);
    } catch (error: any) {
      console.error('Failed to load request:', error);
      toast.error('Failed to load presentation request');
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async () => {
    try {
      setResponsesLoading(true);
      const data = await presentationRequestService.getResponses(requestId);
      setResponses(data.responses || []);
    } catch (error: any) {
      console.error('Failed to load responses:', error);
      toast.error('Failed to load responses');
    } finally {
      setResponsesLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!request) return;
    
    try {
      const { qrCodeData } = await presentationRequestService.generateQRCode(request.id);
      setQrCodeData(qrCodeData);
      setShowQRDialog(true);
    } catch (error: any) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handleCopyShareUrl = async () => {
    if (!request?.share_url) return;
    
    try {
      await navigator.clipboard.writeText(request.share_url);
      toast.success('Share URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleVerifyResponse = async (response: PresentationResponse) => {
    try {
      await presentationRequestService.verifyResponse(requestId, response.id);
      toast.success('Response verified successfully');
      loadResponses();
    } catch (error: any) {
      console.error('Failed to verify response:', error);
      toast.error('Failed to verify response');
    }
  };

  const handleRejectResponse = async (response: PresentationResponse) => {
    try {
      await presentationRequestService.rejectResponse(requestId, response.id, 'Rejected by verifier');
      toast.success('Response rejected');
      loadResponses();
    } catch (error: any) {
      console.error('Failed to reject response:', error);
      toast.error('Failed to reject response');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      expired: 'secondary',
      revoked: 'destructive',
      submitted: 'outline',
      verified: 'default',
      rejected: 'destructive',
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
          <p className="text-gray-500">Presentation request not found</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="mt-4">
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{request.title}</h1>
            <p className="text-gray-500">Request ID: {request.request_id}</p>
          </div>
          {getStatusBadge(request.status)}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerateQR} variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
          
          {request.share_url && (
            <Button onClick={handleCopyShareUrl} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center gap-2">
            Responses
            <Badge variant="secondary">{responses.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="credentials">Required Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="mt-1">{request.title}</p>
                </div>
                
                {request.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1">{request.description}</p>
                  </div>
                )}
                
                {request.purpose && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Purpose</label>
                    <p className="mt-1">{request.purpose}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Verifier DID</label>
                  <p className="mt-1 font-mono text-sm break-all">{request.verifier_did}</p>
                </div>

                {request.verifier_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Verifier Name</label>
                    <p className="mt-1">{request.verifier_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{request.response_count}</div>
                    <div className="text-sm text-blue-600">Total Responses</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {responses.filter(r => r.status === 'verified').length}
                    </div>
                    <div className="text-sm text-green-600">Verified</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Max Responses</label>
                  <p className="mt-1">{request.max_responses || 'Unlimited'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(request.created_at)}
                  </p>
                </div>

                {request.expires_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expires</label>
                    <p className="mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {formatDate(request.expires_at)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Verification Options */}
          {Object.keys(request.verification_options).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.challenge && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Challenge</label>
                      <p className="mt-1 font-mono text-sm">{request.challenge}</p>
                    </div>
                  )}
                  
                  {request.domain && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Domain</label>
                      <p className="mt-1">{request.domain}</p>
                    </div>
                  )}
                  
                  {request.nonce && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nonce</label>
                      <p className="mt-1 font-mono text-sm">{request.nonce}</p>
                    </div>
                  )}
                  
                  {request.purpose && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Purpose</label>
                      <p className="mt-1">{request.purpose}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Presentation Responses</CardTitle>
              <CardDescription>
                Responses submitted by credential holders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {responsesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : responses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No responses received yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holder DID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>
                          <div className="font-mono text-sm break-all max-w-[200px]">
                            {response.holder_did}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(response.status)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(response.submitted_at)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {response.verified_at ? (
                            <div className="text-sm">
                              {formatDate(response.verified_at)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              
                              {response.status === 'submitted' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleVerifyResponse(response)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Verify
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onClick={() => handleRejectResponse(response)}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Required Credentials</CardTitle>
              <CardDescription>
                Credentials that holders must provide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.required_credentials.map((credential: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <p className="mt-1 font-semibold">{credential.type}</p>
                      </div>
                      
                      {credential.format && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Format</label>
                          <p className="mt-1">{credential.format}</p>
                        </div>
                      )}
                    </div>
                    
                    {credential.constraints && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Constraints</label>
                        <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(credential.constraints, null, 2)}
                        </pre>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code for Presentation Request</DialogTitle>
            <DialogDescription>
              Scan this QR code to access the presentation request
            </DialogDescription>
          </DialogHeader>
          
          {qrCodeData && (
            <div className="flex flex-col items-center space-y-4">
              <img src={qrCodeData} alt="QR Code" className="w-64 h-64" />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeData;
                    link.download = `presentation-request-${request.request_id}.png`;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(qrCodeData);
                    toast.success('QR code copied to clipboard');
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
