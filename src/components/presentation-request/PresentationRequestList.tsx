'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  QrCode, 
  Eye, 
  Edit, 
  Trash2, 
  Ban,
  Calendar,
  Clock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import { PresentationRequestDetailModal } from './PresentationRequestDetailModal';
import type { PresentationRequest } from '@/types/presentation-request';

interface PresentationRequestListProps {
  onCreateNew?: () => void;
  onViewRequest?: (request: PresentationRequest) => void;
  onEditRequest?: (request: PresentationRequest) => void;
}

export function PresentationRequestList({ 
  onCreateNew, 
  onViewRequest, 
  onEditRequest 
}: PresentationRequestListProps) {
  const [requests, setRequests] = useState<PresentationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<PresentationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [currentPage, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        pageSize,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await presentationRequestService.getRequests(params);
      setRequests(response.requests);
      setTotalPages(Math.ceil(response.total / pageSize));
    } catch (error: any) {
      console.error('Failed to load presentation requests:', error);
      toast.error('Failed to load presentation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // In a real app, you might debounce this and trigger a new API call
  };

  const handleViewRequest = (request: PresentationRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
    onViewRequest?.(request);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  const handleEditFromModal = (request: PresentationRequest) => {
    onEditRequest?.(request);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleRevoke = async (request: PresentationRequest) => {
    try {
      await presentationRequestService.revokeRequest(request.id);
      toast.success('Presentation request revoked');
      loadRequests();
    } catch (error: any) {
      console.error('Failed to revoke request:', error);
      toast.error('Failed to revoke request');
    }
  };

  const handleDelete = async (request: PresentationRequest) => {
    if (!confirm('Are you sure you want to delete this presentation request?')) {
      return;
    }

    try {
      await presentationRequestService.deleteRequest(request.id);
      toast.success('Presentation request deleted');
      loadRequests();
    } catch (error: any) {
      console.error('Failed to delete request:', error);
      toast.error('Failed to delete request');
    }
  };

  const handleGenerateQR = async (request: PresentationRequest) => {
    try {
      const { qrCodeData } = await presentationRequestService.generateQRCode(request.id);
      // You could show the QR code in a modal or download it
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = `presentation-request-${request.request_id}.png`;
      link.click();
      toast.success('QR code generated');
    } catch (error: any) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
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

  const filteredRequests = (requests || []).filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.verifier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.request_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Presentation Requests</CardTitle>
            <CardDescription>
              Manage and monitor your verifiable presentation requests
            </CardDescription>
          </div>
          
          {onCreateNew && (
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Request
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No presentation requests found</p>
            {onCreateNew && (
              <Button onClick={onCreateNew} variant="outline">
                Create your first request
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Verifier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.title}</div>
                        <div className="text-sm text-gray-500">
                          ID: {request.request_id}
                        </div>
                        {request.description && (
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {request.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        {request.verifier_name && (
                          <div className="font-medium">{request.verifier_name}</div>
                        )}
                        <div className="text-sm text-gray-500 font-mono truncate max-w-[150px]">
                          {request.verifier_did}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{request.response_count}</span>
                        {request.max_responses && (
                          <span className="text-gray-500">/ {request.max_responses}</span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(request.created_at)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {request.expires_at ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatDate(request.expires_at)}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
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
                          <DropdownMenuItem onClick={() => handleViewRequest(request)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleGenerateQR(request)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Generate QR
                          </DropdownMenuItem>
                          
                          {onEditRequest && request.status === 'active' && (
                            <DropdownMenuItem onClick={() => onEditRequest(request)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          
                          {request.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleRevoke(request)}>
                              <Ban className="h-4 w-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={() => handleDelete(request)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Detail Modal */}
      <PresentationRequestDetailModal
        request={selectedRequest}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onEdit={handleEditFromModal}
      />
    </Card>
  );
}
