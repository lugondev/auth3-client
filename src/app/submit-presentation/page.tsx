'use client';

import { Suspense } from 'react';
import { PresentationNavigation } from '@/components/presentation-request/PresentationNavigation';
import { SubmitPresentation } from '@/components/presentation-request/SubmitPresentation';

export default function SubmitPresentationPage() {
  return (
    <>
      <PresentationNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit Presentation</h1>
          <p className="text-gray-600">
            Submit your verifiable presentation in response to a request
          </p>
        </div>
        
        <Suspense fallback={<div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <SubmitPresentation />
        </Suspense>
      </div>
    </>
  );
}
