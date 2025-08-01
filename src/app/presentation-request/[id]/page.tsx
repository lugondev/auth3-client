'use client';

import { UnifiedPresentationManager } from '@/components/presentation-request/UnifiedPresentationManager';
import { useParams } from 'next/navigation';

export default function PresentationRequestPage() {
    const params = useParams()
    const requestId = params.id as string

    if (requestId === 'new') {
        return <UnifiedPresentationManager initialMode="create" />;
    }

    return <UnifiedPresentationManager initialMode="view" requestId={requestId} />;
}
