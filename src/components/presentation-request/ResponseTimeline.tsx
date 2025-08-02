'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import type { PresentationResponse } from '@/types/presentation-request';

interface ResponseTimelineProps {
  responses: PresentationResponse[];
  requestId: string;
  className?: string;
}

export function ResponseTimeline({ responses, requestId, className }: ResponseTimelineProps) {
  const [selectedResponse, setSelectedResponse] = useState<PresentationResponse | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'HH:mm:ss')
    };
  };

  const sortedResponses = [...responses].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );

  if (responses.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Response Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No responses received yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Response Timeline ({responses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedResponses.map((response, index) => {
            const formatted = formatDate(response.submitted_at);
            const hasErrors = response.verification_result?.errors && response.verification_result.errors.length > 0;
            
            return (
              <div 
                key={response.id} 
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(response.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {response.holder_did}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(response.status)}`}
                    >
                      {response.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatted.date}</span>
                    <span>{formatted.time}</span>
                    {response.verified_at && (
                      <>
                        <span>•</span>
                        <span>Verified: {formatDate(response.verified_at).time}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasErrors && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Verification Errors</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          {response.verification_result?.errors?.map((error, i) => (
                            <div key={i} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                              {error}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedResponse(response)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Response Details</DialogTitle>
                      </DialogHeader>
                      {selectedResponse && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Holder DID</label>
                              <p className="text-sm text-muted-foreground break-all">
                                {selectedResponse.holder_did}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Presentation ID</label>
                              <p className="text-sm text-muted-foreground break-all">
                                {selectedResponse.presentation_id}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <Badge className={getStatusColor(selectedResponse.status)}>
                                {selectedResponse.status}
                              </Badge>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Submitted At</label>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(selectedResponse.submitted_at).date} {formatDate(selectedResponse.submitted_at).time}
                              </p>
                            </div>
                          </div>
                          
                          {selectedResponse.verification_result && (
                            <div>
                              <label className="text-sm font-medium">Verification Result</label>
                              <div className="mt-2 p-3 bg-gray-50 rounded border">
                                <div className="flex items-center gap-2 mb-2">
                                  {selectedResponse.verification_result.verified ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {selectedResponse.verification_result.verified ? 'Verified' : 'Failed'}
                                  </span>
                                </div>
                                
                                {selectedResponse.verification_result.errors && selectedResponse.verification_result.errors.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-red-700">Errors:</p>
                                    {selectedResponse.verification_result.errors.map((error, i) => (
                                      <p key={i} className="text-xs text-red-600 bg-red-50 p-1 rounded">
                                        {error}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                
                                {selectedResponse.verification_result.warnings && selectedResponse.verification_result.warnings.length > 0 && (
                                  <div className="space-y-1 mt-2">
                                    <p className="text-xs font-medium text-yellow-700">Warnings:</p>
                                    {selectedResponse.verification_result.warnings.map((warning, i) => (
                                      <p key={i} className="text-xs text-yellow-600 bg-yellow-50 p-1 rounded">
                                        {warning}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
