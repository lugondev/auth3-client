'use client';

import { UnifiedPresentationManager } from '@/components/presentation-request/UnifiedPresentationManager';
import { useParams } from 'next/navigation';

export default function PresentationRequestViewPage() {
    const params = useParams()
    const requestId = params.id as string

    return <UnifiedPresentationManager initialMode="view" requestId={requestId} />;
}
