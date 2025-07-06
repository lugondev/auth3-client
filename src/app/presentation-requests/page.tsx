'use client';

import React, { useState } from 'react';
import { PresentationNavigation } from '@/components/presentation-request/PresentationNavigation';
import { CreatePresentationRequest } from '@/components/presentation-request/CreatePresentationRequest';
import { PresentationRequestList } from '@/components/presentation-request/PresentationRequestList';
import { PresentationRequestDetail } from '@/components/presentation-request/PresentationRequestDetail';
import type { PresentationRequest } from '@/types/presentation-request';

type ViewMode = 'list' | 'create' | 'detail' | 'edit';

export default function PresentationRequestsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRequest, setSelectedRequest] = useState<PresentationRequest | null>(null);

  const handleCreateNew = () => {
    setViewMode('create');
    setSelectedRequest(null);
  };

  const handleViewRequest = (request: PresentationRequest) => {
    setSelectedRequest(request);
    setViewMode('detail');
  };

  const handleEditRequest = (request: PresentationRequest) => {
    setSelectedRequest(request);
    setViewMode('edit');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedRequest(null);
  };

  const handleCreateSuccess = (request: PresentationRequest) => {
    setSelectedRequest(request);
    setViewMode('detail');
  };

  return (
    <>
      <PresentationNavigation />
      <div className="container mx-auto py-8 px-4">
        {viewMode === 'list' && (
          <PresentationRequestList
            onCreateNew={handleCreateNew}
            onViewRequest={handleViewRequest}
            onEditRequest={handleEditRequest}
          />
        )}

        {viewMode === 'create' && (
          <CreatePresentationRequest
            onSuccess={handleCreateSuccess}
            onCancel={handleBack}
          />
        )}

        {viewMode === 'detail' && selectedRequest && (
          <PresentationRequestDetail
            requestId={selectedRequest.id}
            onBack={handleBack}
          />
        )}

        {viewMode === 'edit' && selectedRequest && (
          <CreatePresentationRequest
            onSuccess={handleCreateSuccess}
            onCancel={handleBack}
            // You could pass the existing request data here for editing
          />
        )}
      </div>
    </>
  );
}
