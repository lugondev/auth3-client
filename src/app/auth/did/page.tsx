'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, QrCode, Key, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { initiateDIDAuth, completeDIDAuth, createChallenge, validateSignature } from '@/services/didService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * DID Authentication Page Component
 * 
 * Provides DID-based authentication interface with:
 * - DID input and validation
 * - Challenge-response workflow
 * - QR code for mobile wallet integration
 * - Signature verification UI
 * - Multi-step authentication process
 */
export default function DIDAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithDID } = useAuth();
  
  // Authentication states
  const [step, setStep] = useState<'input' | 'challenge' | 'signature' | 'complete'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // DID authentication data
  const [didInput, setDidInput] = useState('');
  const [challengeData, setChallengeData] = useState<{
    challenge_id: string;
    challenge: string;
    challenge_message: string;
    expires_at: string;
    instructions: string;
  } | null>(null);
  const [signature, setSignature] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  
  // QR code and mobile integration
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');
  
  // OAuth2 parameters from URL
  const oauth2Params = searchParams ? Object.fromEntries(searchParams.entries()) : null;
  
  useEffect(() => {
    // Store OAuth2 parameters if present
    if (oauth2Params && Object.keys(oauth2Params).length > 0) {
      sessionStorage.setItem('oauth2_params', JSON.stringify(oauth2Params));
    }
  }, [oauth2Params]);
  
  /**
   * Validates DID format
   */
  const validateDID = (did: string): boolean => {
    const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/;
    return didRegex.test(did);
  };
  
  /**
   * Initiates DID authentication process
   */
  const handleInitiateAuth = async () => {
    if (!didInput.trim()) {
      setError('Please enter a valid DID');
      return;
    }
    
    if (!validateDID(didInput)) {
      setError('Invalid DID format. Expected format: did:method:identifier');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await initiateDIDAuth({
        did: didInput,
        domain: window.location.origin,
        nonce: crypto.randomUUID()
      });
      
      setChallengeData(result);
      
      // Generate QR code data for mobile wallets
      const qrData = JSON.stringify({
        type: 'did-auth-challenge',
        challenge_id: result.challenge_id,
        challenge: result.challenge,
        did: didInput,
        domain: window.location.origin,
        expires_at: result.expires_at
      });
      setQRCodeData(qrData);
      
      setStep('challenge');
      toast.success('Challenge created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate DID authentication';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handles signature submission and completes authentication
   */
  const handleSubmitSignature = async () => {
    if (!signature.trim()) {
      setError('Please provide a signature');
      return;
    }
    
    if (!challengeData) {
      setError('No challenge data available');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First validate the signature
      const validationResult = await validateSignature({
        did: didInput,
        message: challengeData.challenge,
        signature: signature,
        verification_method: verificationMethod || undefined
      });
      
      if (!validationResult.valid) {
        throw new Error('Invalid signature');
      }
      
      // Complete the DID authentication
      const authResult = await completeDIDAuth({
        challenge_id: challengeData.challenge_id,
        signature: signature,
        verification_method: verificationMethod || undefined
      });
      
      // Use the auth context to handle the successful authentication
      if (signInWithDID) {
        await signInWithDID({
          did: didInput,
          access_token: authResult.access_token,
          refresh_token: authResult.refresh_token
        });
      }
      
      setStep('complete');
      toast.success('DID authentication successful');
      
      // Redirect after successful authentication
      setTimeout(() => {
        const redirectUrl = searchParams?.get('redirect') || '/dashboard';
        router.push(redirectUrl);
      }, 2000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Resets the authentication process
   */
  const handleReset = () => {
    setStep('input');
    setDidInput('');
    setChallengeData(null);
    setSignature('');
    setVerificationMethod('');
    setError(null);
    setShowQRCode(false);
    setQRCodeData('');
  };
  
  /**
   * Renders the DID input step
   */
  const renderDIDInput = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="did">Decentralized Identifier (DID)</Label>
        <Input
          id="did"
          type="text"
          placeholder="did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
          value={didInput}
          onChange={(e) => setDidInput(e.target.value)}
          disabled={loading}
        />
        <p className="text-sm text-muted-foreground">
          Enter your DID to authenticate. Supported methods: did:key, did:web, did:ethr, did:ion, did:peer
        </p>
      </div>
      
      <Button 
        onClick={handleInitiateAuth} 
        disabled={loading || !didInput.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initiating Authentication...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Authenticate with DID
          </>
        )}
      </Button>
    </div>
  );
  
  /**
   * Renders the challenge step
   */
  const renderChallenge = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Authentication Challenge</Label>
        <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
          {challengeData?.challenge}
        </div>
        <p className="text-sm text-muted-foreground">
          {challengeData?.instructions}
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setShowQRCode(!showQRCode)}
          className="flex-1"
        >
          <QrCode className="mr-2 h-4 w-4" />
          {showQRCode ? 'Hide' : 'Show'} QR Code
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setStep('signature')}
          className="flex-1"
        >
          <Key className="mr-2 h-4 w-4" />
          Enter Signature
        </Button>
      </div>
      
      {showQRCode && (
        <div className="p-4 bg-white rounded-md border text-center">
          <div className="text-sm text-muted-foreground mb-2">
            Scan with your DID wallet
          </div>
          <div className="font-mono text-xs break-all p-2 bg-muted rounded">
            {qrCodeData}
          </div>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        Challenge expires at: {challengeData?.expires_at && new Date(challengeData.expires_at).toLocaleString()}
      </div>
    </div>
  );
  
  /**
   * Renders the signature input step
   */
  const renderSignatureInput = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verification-method">Verification Method (Optional)</Label>
        <Input
          id="verification-method"
          type="text"
          placeholder="did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
          value={verificationMethod}
          onChange={(e) => setVerificationMethod(e.target.value)}
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signature">Signature</Label>
        <Input
          id="signature"
          type="text"
          placeholder="Enter the signature generated by your DID wallet"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          disabled={loading}
        />
        <p className="text-sm text-muted-foreground">
          Provide the signature generated by signing the challenge with your DID's private key
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setStep('challenge')}
          disabled={loading}
          className="flex-1"
        >
          Back to Challenge
        </Button>
        <Button 
          onClick={handleSubmitSignature}
          disabled={loading || !signature.trim()}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Authentication
            </>
          )}
        </Button>
      </div>
    </div>
  );
  
  /**
   * Renders the completion step
   */
  const renderComplete = () => (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Authentication Successful!</h3>
        <p className="text-muted-foreground">
          You have been successfully authenticated with your DID.
        </p>
      </div>
      <div className="text-sm text-muted-foreground">
        Redirecting to dashboard...
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto max-w-md py-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6" />
            DID Authentication
          </CardTitle>
          <CardDescription>
            Authenticate using your Decentralized Identifier
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {step === 'input' && renderDIDInput()}
          {step === 'challenge' && renderChallenge()}
          {step === 'signature' && renderSignatureInput()}
          {step === 'complete' && renderComplete()}
          
          {step !== 'complete' && step !== 'input' && (
            <div className="pt-4 border-t">
              <Button 
                variant="ghost" 
                onClick={handleReset}
                disabled={loading}
                className="w-full"
              >
                Start Over
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}