'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus, List, Eye, FileText } from 'lucide-react';
import { CreatePresentationRequest } from '@/components/presentation-request/CreatePresentationRequest';
import { PresentationRequestList } from '@/components/presentation-request/PresentationRequestList';
import { PresentationRequestView } from '@/components/presentation-request/PresentationRequestView';
import { PresentationRequestDetail } from '@/components/presentation-request/PresentationRequestDetail';
import { toast } from 'sonner';

type ViewMode = 'list' | 'create' | 'view' | 'detail';

interface UnifiedPresentationManagerProps {
  // Optional props for specific modes
  initialMode?: ViewMode;
  requestId?: string;
}

export function UnifiedPresentationManager({ 
  initialMode = 'list',
  requestId 
}: UnifiedPresentationManagerProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewMode>(initialMode);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(requestId || null);

  // Handle URL changes and params
  useEffect(() => {
    if (requestId && requestId !== 'new') {
      setSelectedRequestId(requestId);
      setActiveView('view');
    } else if (requestId === 'new') {
      setActiveView('create');
    }
  }, [requestId]);

  // Handle navigation
  const navigateTo = (view: ViewMode, id?: string) => {
    setActiveView(view);
    setSelectedRequestId(id || null);
    
    // Update URL without page reload
    let newPath = '/presentation-requests';
    
    if (view === 'create') {
      newPath = '/presentation-requests/new';
    } else if (view === 'view' && id) {
      newPath = `/presentation-requests/${id}/view`;
    } else if (view === 'detail' && id) {
      newPath = `/presentation-requests/${id}`;
    }
    
    router.push(newPath);
  };

  const handleRequestCreated = (request: any) => {
    toast.success('Presentation request created successfully!');
    if (request?.request?.request_id) {
      navigateTo('view', request.request.request_id);
    } else {
      navigateTo('list');
    }
  };

  const handleRequestSelected = (request: any) => {
    if (request?.request_id) {
      navigateTo('detail', request.request_id);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'list':
        return (
          <PresentationRequestList
            onViewRequest={handleRequestSelected}
            onCreateNew={() => navigateTo('create')}
          />
        );

      case 'create':
        return (
          <CreatePresentationRequest
            onSuccess={handleRequestCreated}
            onCancel={() => navigateTo('list')}
          />
        );

      case 'view':
        if (!selectedRequestId) {
          return (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Request Selected</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Please select a presentation request to view.
                </p>
                <Button onClick={() => navigateTo('list')}>
                  View All Requests
                </Button>
              </CardContent>
            </Card>
          );
        }
        return <PresentationRequestView requestId={selectedRequestId} />;

      case 'detail':
        if (!selectedRequestId) {
          return (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Request Selected</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Please select a presentation request to view details.
                </p>
                <Button onClick={() => navigateTo('list')}>
                  View All Requests
                </Button>
              </CardContent>
            </Card>
          );
        }
        return <PresentationRequestDetail requestId={selectedRequestId} />;

      default:
        return (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unknown View</h3>
              <p className="text-muted-foreground text-center mb-4">
                The requested view mode is not recognized.
              </p>
              <Button onClick={() => navigateTo('list')}>
                Back to List
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
