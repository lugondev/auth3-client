'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PresentationRequestAnalytics } from '@/components/presentation-request/PresentationRequestAnalytics';

export default function PresentationRequestAnalyticsPage() {
  const params = useParams();
  const requestId = params.id as string;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with back navigation */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/presentation-requests/${requestId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Request
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Analytics</h1>
          <p className="text-muted-foreground">
            Detailed analytics and insights for presentation request
          </p>
        </div>
      </div>

      {/* Analytics Component */}
      <PresentationRequestAnalytics requestId={requestId} />
    </div>
  );
}
