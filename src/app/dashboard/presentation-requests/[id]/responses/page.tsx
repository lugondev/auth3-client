'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Search,
  User,
  FileText,
  Calendar,
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import type { 
  PresentationResponse, 
  PresentationRequest 
} from '@/types/presentation-request';

export default function PresentationRequestResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  
  const [requestInfo, setRequestInfo] = useState<PresentationRequest | null>(null);
  const [responses, setResponses] = useState<PresentationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 10;

  useEffect(() => {
    loadResponses();
  }, [requestId, searchTerm, statusFilter, currentPage]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load request information and responses from API
      const [requestResponse, responsesResponse] = await Promise.all([
        presentationRequestService.getRequestById(requestId),
        presentationRequestService.getResponses(requestId, {
          page: currentPage,
          pageSize: itemsPerPage,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          holderDid: searchTerm || undefined
        })
      ]);
      
      setRequestInfo(requestResponse);
      setResponses(responsesResponse.responses || []);
      setTotalItems(responsesResponse.pagination.total || 0);
      
    } catch (err) {
      console.error('Failed to load responses:', err);
      setError('Failed to load presentation responses');
      toast.error('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPresentation = (response: PresentationResponse) => {
    router.push(`/dashboard/presentations/${response.presentation_id}`);
  };

  const handleRefresh = () => {
    loadResponses();
  };

  const handleExport = () => {
    if (responses.length === 0) return;
    
    const csvData = [
      ['Request ID', 'Holder DID', 'Presentation ID', 'Status', 'Submitted At', 'Verified At', 'Verified'],
      ...responses.map(response => [
        response.request_id,
        response.holder_did,
        response.presentation_id,
        response.status,
        response.submitted_at,
        response.verified_at || '',
        response.verification_result?.verified ? 'Yes' : 'No'
      ])
    ];
    
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-responses-${requestId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Responses data exported successfully');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateResponseTime = (submitted: string, verified?: string) => {
    if (!verified) return null;
    const diff = new Date(verified).getTime() - new Date(submitted).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading responses...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-sm text-gray-400 mt-1">Could not load presentation responses</p>
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
            <h1 className="text-2xl font-bold text-gray-900">
              {requestInfo?.title || 'Presentation Request'} - Responses
            </h1>
            <p className="text-gray-600">
              All responses received for this presentation request
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Request Info */}
      {requestInfo && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">{requestInfo.title}</p>
                  <p className="text-sm text-gray-500">by {requestInfo.verifier_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Responses</p>
                  <p className="font-medium">{responses.length}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/presentation-requests/${requestId}`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Request
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by holder name or DID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses List */}
      <div className="space-y-4">
        {responses.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 font-medium">No responses found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No responses have been received for this request yet'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          responses.map((response) => (
            <Card key={response.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Holder Icon */}
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Holder: {response.holder_did.substring(0, 30)}...
                        </h3>
                        <Badge className={`${getStatusColor(response.status)} text-xs`}>
                          {getStatusIcon(response.status)}
                          <span className="ml-1 capitalize">{response.status}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 font-mono">
                        {response.holder_did.substring(0, 50)}...
                      </p>
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Submitted</p>
                          <p className="font-medium">{formatDateTime(response.submitted_at)}</p>
                        </div>
                        
                        {response.verified_at && (
                          <div>
                            <p className="text-gray-500">Verified</p>
                            <p className="font-medium">{formatDateTime(response.verified_at)}</p>
                          </div>
                        )}
                        
                        {response.verification_result && (
                          <div>
                            <p className="text-gray-500">Verification Status</p>
                            <p className="font-medium">{response.verification_result.verified ? 'Verified' : 'Failed'}</p>
                          </div>
                        )}
                        
                        {response.verified_at && (
                          <div>
                            <p className="text-gray-500">Response Time</p>
                            <p className="font-medium">
                              {calculateResponseTime(response.submitted_at, response.verified_at) || 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Verification Details */}
                      {response.verification_result && response.verification_result.credentialResults && (
                        <div className="mt-3">
                          <p className="text-gray-500 text-sm mb-2">
                            Credential Verification ({response.verification_result.credentialResults.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {response.verification_result.credentialResults.map((credential, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className={`text-xs ${credential.verified ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}`}
                              >
                                Credential {index + 1}: {credential.verified ? 'Valid' : 'Invalid'}
                                {credential.verified ? ' ✓' : ' ✗'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(response.submitted_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewPresentation(response)}
                        title="View presentation details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
