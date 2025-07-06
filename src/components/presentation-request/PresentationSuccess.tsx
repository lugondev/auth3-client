'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Shield, 
  ArrowLeft,
  ExternalLink,
  Home
} from 'lucide-react';

export function PresentationSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <div className="max-w-md mx-auto px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl text-green-800 dark:text-green-200">
              Presentation Submitted Successfully!
            </CardTitle>
            <CardDescription>
              Your verifiable credentials have been shared with the verifier
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">What happens next?</span>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                <li>The verifier will review your credentials</li>
                <li>You'll be notified of the verification result</li>
                <li>Your credentials remain secure and are not stored by the verifier</li>
              </ul>
            </div>

            {requestId && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Request ID:</span>
                <br />
                <code className="text-xs bg-muted p-1 rounded">{requestId}</code>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>
                If you have any questions about this verification, 
                please contact the requesting organization directly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
