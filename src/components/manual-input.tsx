'use client';

import { useState } from 'react';
import { Link, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ManualInputProps {
  onSubmit: (data: { requestId?: string; url?: string; qrData?: string }) => void;
  isLoading?: boolean;
}

export function ManualInput({ onSubmit, isLoading }: ManualInputProps) {
  const [inputType, setInputType] = useState<'requestId' | 'url' | 'qrData'>('requestId');
  const [requestId, setRequestId] = useState('');
  const [url, setUrl] = useState('');
  const [qrData, setQrData] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (inputType === 'requestId') {
        if (!requestId.trim()) {
          setError('Please enter a request ID');
          return;
        }
        onSubmit({ requestId: requestId.trim() });
      } else if (inputType === 'url') {
        if (!url.trim()) {
          setError('Please enter a URL');
          return;
        }
        // Validate URL format
        try {
          new URL(url);
        } catch {
          setError('Please enter a valid URL');
          return;
        }
        onSubmit({ url: url.trim() });
      } else if (inputType === 'qrData') {
        if (!qrData.trim()) {
          setError('Please enter QR code data');
          return;
        }
        onSubmit({ qrData: qrData.trim() });
      }
    } catch (err) {
      setError('Invalid input format');
    }
  };

  const handleDemoRequest = () => {
    // Provide demo data for testing
    const demoData = {
      requestId: '16e9470e-75ad-4654-82cb-e28a20c28fba' // From our test
    };
    onSubmit(demoData);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Manual Input
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Input Type Selection */}
          <div className="space-y-2">
            <Label>Input Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={inputType === 'requestId' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputType('requestId')}
              >
                Request ID
              </Button>
              <Button
                type="button"
                variant={inputType === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputType('url')}
              >
                URL
              </Button>
              <Button
                type="button"
                variant={inputType === 'qrData' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputType('qrData')}
              >
                QR Data
              </Button>
            </div>
          </div>

          {/* Input Fields */}
          {inputType === 'requestId' && (
            <div className="space-y-2">
              <Label htmlFor="requestId">Request ID</Label>
              <Input
                id="requestId"
                type="text"
                placeholder="e.g., 16e9470e-75ad-4654-82cb-e28a20c28fba"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter the presentation request ID
              </p>
            </div>
          )}

          {inputType === 'url' && (
            <div className="space-y-2">
              <Label htmlFor="url">Presentation Request URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/request/123"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full URL to the presentation request
              </p>
            </div>
          )}

          {inputType === 'qrData' && (
            <div className="space-y-2">
              <Label htmlFor="qrData">QR Code Data</Label>
              <Textarea
                id="qrData"
                placeholder="Paste the raw QR code data here..."
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paste the base64 encoded QR code data
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Load Request
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDemoRequest}
              disabled={isLoading}
            >
              Use Demo Request
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Request ID:</strong> Direct UUID of the request</p>
            <p><strong>URL:</strong> Full link to presentation request</p>
            <p><strong>QR Data:</strong> Raw data from QR code scan</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
