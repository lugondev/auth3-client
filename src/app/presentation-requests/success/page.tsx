import { Suspense } from 'react'
import { PresentationSuccess } from '@/components/presentation-request/PresentationSuccess';

export default function PresentationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PresentationSuccess />
    </Suspense>
  );
}
