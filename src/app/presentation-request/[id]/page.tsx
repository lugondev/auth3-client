'use client';

import { PresentationRequestView } from '@/components/presentation-request/PresentationRequestView';
import { useParams } from 'next/navigation';

export default function PresentationRequestPage() {
    const params = useParams()
    const requestId = params.id as string

    return <PresentationRequestView requestId={requestId} />;
}
