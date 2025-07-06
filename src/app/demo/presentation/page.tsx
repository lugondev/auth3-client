'use client';

import { useState } from 'react';
import { ArrowLeft, Smartphone, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRScanner } from '@/components/qr-scanner';
import { ManualInput } from '@/components/manual-input';
import { PresentationRequestViewer } from '@/components/presentation-request-viewer';
import { presentationRequestService } from '@/services/presentation-request-service';
import type { PresentationRequest } from '@/types/presentation-request';

type FlowStep = 'input' | 'viewing' | 'submitting' | 'completed';

export default function PresentationDemoPage() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('input');
  const [request, setRequest] = useState<PresentationRequest | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleQRScan = async (qrData: string) => {
    try {
      setError('');
      setIsLoading(true);
      
      // Parse QR data (assume it's base64 encoded JSON)
      let requestData;
      try {
        const decodedData = atob(qrData);
        requestData = JSON.parse(decodedData);
      } catch {
        // If not base64, try direct JSON parse
        requestData = JSON.parse(qrData);
      }
      
      if (requestData.requestID) {
        await loadRequest({ requestId: requestData.requestID });
      } else if (requestData.url) {
        await loadRequest({ url: requestData.url });
      } else {
        throw new Error('Invalid QR code format');
      }
      
      setIsScanning(false);
    } catch (error) {
      console.error('QR scan error:', error);
      setError('Failed to process QR code data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequest = async (data: { requestId?: string; url?: string; qrData?: string }) => {
    try {
      setError('');
      setIsLoading(true);
      
      let requestId = data.requestId;
      
      // Extract request ID from URL if provided
      if (data.url && !requestId) {
        const urlMatch = data.url.match(/\/request\/([^\/\?]+)/);
        if (urlMatch) {
          requestId = urlMatch[1];
        }
      }
      
      // Parse QR data if provided
      if (data.qrData && !requestId) {
        try {
          const decodedData = atob(data.qrData);
          const requestData = JSON.parse(decodedData);
          requestId = requestData.requestID;
        } catch {
          throw new Error('Invalid QR data format');
        }
      }
      
      if (!requestId) {
        throw new Error('Could not extract request ID');
      }
      
      // Load the presentation request
      const loadedRequest = await presentationRequestService.getRequestByRequestId(requestId);
      setRequest(loadedRequest);
      setCurrentStep('viewing');
      
    } catch (error) {
      console.error('Load request error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load presentation request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPresentation = async () => {
    if (!request) return;
    
    try {
      setError('');
      setIsLoading(true);
      setCurrentStep('submitting');
      
      // Simulate presentation submission
      // In a real app, this would:
      // 1. Collect user's verifiable credentials
      // 2. Create a verifiable presentation
      // 3. Submit to the presentation request endpoint
      
      // For demo purposes, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccessMessage('Presentation submitted successfully!');
      setCurrentStep('completed');
      
    } catch (error) {
      console.error('Submit error:', error);
      setError('Failed to submit presentation');
      setCurrentStep('viewing');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep('input');
    setRequest(null);
    setError('');
    setSuccessMessage('');
    setIsScanning(false);
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verifiable Presentation Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Scan a QR code or manually enter a presentation request to begin the verification process.
          </p>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Scan QR Code
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Manual Input
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scan" className="mt-6">
          <QRScanner
            onScan={handleQRScan}
            onError={setError}
            isScanning={isScanning}
            onToggleScanning={() => setIsScanning(!isScanning)}
          />
        </TabsContent>
        
        <TabsContent value="manual" className="mt-6">
          <ManualInput
            onSubmit={loadRequest}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderViewingStep = () => (
    request && (
      <PresentationRequestViewer
        request={request}
        onSubmit={handleSubmitPresentation}
        onBack={resetFlow}
        isSubmitting={currentStep === 'submitting'}
      />
    )
  );

  const renderCompletedStep = () => (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-green-600">
            ✅ Presentation Submitted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {successMessage}
          </p>
          
          <div className="space-y-2">
            <Button onClick={resetFlow} className="w-full">
              Submit Another Presentation
            </Button>
          </div>
          
          {request && (
            <div className="pt-4 border-t text-sm text-muted-foreground">
              <p><strong>Request:</strong> {request.title}</p>
              <p><strong>Verifier:</strong> {request.verifier_name}</p>
              <p><strong>ID:</strong> {request.request_id}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Verifiable Presentation Demo</h1>
          <p className="text-muted-foreground mt-2">
            Experience the complete flow of responding to presentation requests
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {(['input', 'viewing', 'submitting', 'completed'] as FlowStep[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : index < (['input', 'viewing', 'submitting', 'completed'] as FlowStep[]).indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`
                    w-12 h-0.5 
                    ${index < (['input', 'viewing', 'submitting', 'completed'] as FlowStep[]).indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-16 text-sm text-muted-foreground">
            <span>Input</span>
            <span>Review</span>
            <span>Submit</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {currentStep === 'input' && renderInputStep()}
          {(currentStep === 'viewing' || currentStep === 'submitting') && renderViewingStep()}
          {currentStep === 'completed' && renderCompletedStep()}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>This is a demonstration of the Verifiable Presentation request flow.</p>
          <p>In a production environment, actual credentials would be selected and presented.</p>
        </div>
      </div>
    </div>
  );
}
