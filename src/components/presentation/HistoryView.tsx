'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  User,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { historyService, type HistoryItem, type HistoryFilters } from '@/services/history-service';

export const HistoryView: React.FC = () => {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const itemsPerPage = 10;

  const loadHistory = async (page = 1, resetSearch = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (resetSearch) {
        setCurrentPage(1);
        page = 1;
      }

      const filters: HistoryFilters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as any : undefined,
        page,
        limit: itemsPerPage,
      };

      const response = await historyService.getHistory(filters);
      
      setHistoryItems(response.data);
      setTotalItems(response.total);
      setCurrentPage(page);
      setHasNextPage(page * itemsPerPage < response.total);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load verification history');
      toast.error('Failed to load verification history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1, true);
  }, [searchTerm, statusFilter, typeFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
  };

  const handleRefresh = () => {
    loadHistory(currentPage);
  };

  const handleViewDetails = (item: HistoryItem) => {
    // Navigate to presentation request details page using the request ID
    // Since this is a request history, we should navigate to request details, not presentation details
    router.push(`/dashboard/presentation-requests/${item.id}`);
  };

  const handleViewPresentation = (item: HistoryItem) => {
    // Navigate to presentation details if we have a presentation ID
    if (item.details.presentationId) {
      router.push(`/dashboard/presentations/${item.details.presentationId}`);
    } else {
      toast.error('No presentation available for this request');
    }
  };

  const handleViewResponses = (item: HistoryItem) => {
    // Navigate to responses page for this request
    router.push(`/presentation-requests/${item.details.requestId}/responses`);
  };

  const handleExport = () => {
    if (historyItems.length === 0) return;
    
    // Simple CSV export
    const csvData = [
      ['ID', 'Type', 'Title', 'Status', 'Timestamp', 'Verifier', 'Holder', 'Credential Types'],
      ...historyItems.map(item => [
        item.id,
        item.type,
        item.title,
        item.status,
        item.timestamp,
        item.verifier,
        item.holder || '',
        item.details.credentialTypes?.join('; ') || '',
      ])
    ];
    
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('History data exported successfully');
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadHistory(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      loadHistory(currentPage + 1);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'response':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'verification':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verification History</h2>
          <p className="text-gray-600">Complete timeline of all presentation activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

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
                  placeholder="Search by title, description, or verifier..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="request">Request</SelectItem>
                  <SelectItem value="response">Response</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>        {/* History Timeline */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-gray-600">Loading history...</span>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
                  <p className="text-red-600 font-medium">{error}</p>
                  <Button onClick={handleRefresh} className="mt-4" variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : historyItems.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 font-medium">No history items found</p>
                  <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {historyItems.map((item: HistoryItem) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Type Icon */}
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getTypeIcon(item.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <Badge className={`${getStatusColor(item.status)} text-xs`}>
                              {getStatusIcon(item.status)}
                              <span className="ml-1 capitalize">{item.status}</span>
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{item.description}</p>
                          
                          {/* Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Verifier</p>
                              <p className="font-medium">{item.verifier}</p>
                            </div>
                            
                            {item.holder && (
                              <div>
                                <p className="text-gray-500">Latest Holder</p>
                                <p className="font-medium text-xs">{item.holder.substring(0, 20)}...</p>
                              </div>
                            )}
                            
                            {item.details.responseCount !== undefined && (
                              <div>
                                <p className="text-gray-500">Responses</p>
                                <p className="font-medium">{item.details.responseCount} / {item.details.responseTotal || 'N/A'}</p>
                              </div>
                            )}
                            
                            {item.details.responseTime && (
                              <div>
                                <p className="text-gray-500">Response Time</p>
                                <p className="font-medium">{item.details.responseTime}</p>
                              </div>
                            )}
                            
                            {item.details.verificationScore !== undefined && (
                              <div>
                                <p className="text-gray-500">Verification Score</p>
                                <p className="font-medium">{item.details.verificationScore}%</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Response History Summary */}
                          {item.details.allResponses && item.details.allResponses.length > 0 && (
                            <div className="mt-3">
                              <p className="text-gray-500 text-sm mb-2">Response History ({item.details.allResponses.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {item.details.allResponses.slice(0, 3).map((response, index) => (
                                  <Badge 
                                    key={response.id} 
                                    variant="outline" 
                                    className={`text-xs ${response.status === 'verified' ? 'border-green-300 text-green-700' : 'border-yellow-300 text-yellow-700'}`}
                                  >
                                    #{index + 1}: {response.status}
                                  </Badge>
                                ))}
                                {item.details.allResponses.length > 3 && (
                                  <Badge variant="outline" className="text-xs text-gray-500">
                                    +{item.details.allResponses.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Credential Types */}
                          {item.details.credentialTypes && item.details.credentialTypes.length > 0 && (
                            <div className="mt-3">
                              <p className="text-gray-500 text-sm mb-2">Credential Types</p>
                              <div className="flex flex-wrap gap-2">
                                {item.details.credentialTypes.map((type: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Timestamp and Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatTimestamp(item.timestamp)}
                        </div>
                        <div className="flex gap-1 flex-col">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(item)}
                            title="View request details"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Request
                          </Button>
                          {item.details.responseCount && item.details.responseCount > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewResponses(item)}
                              title={`View all ${item.details.responseCount} responses`}
                            >
                              <User className="h-4 w-4 mr-1" />
                              Responses ({item.details.responseCount})
                            </Button>
                          )}
                          {item.details.presentationId && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewPresentation(item)}
                              title="View latest presentation details"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Presentation
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Pagination */}
              {totalItems > itemsPerPage && (
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
    </div>
  );
};

export default HistoryView;
