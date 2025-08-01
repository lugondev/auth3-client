import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Copy, Key, AlertTriangle, ExternalLink, Shield } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SigningHelperProps {
  message: string
  did: string
  verificationMethod: string
  onSignatureCreated: (signature: string) => void
  privateKey?: Uint8Array // Add support for automatic signing
  keyType?: 'Ed25519' | 'secp256k1' | 'P-256'
}

const SigningHelper: React.FC<SigningHelperProps> = ({
  message,
  did,
  verificationMethod,
  onSignatureCreated,
  privateKey,
  keyType = 'Ed25519'
}) => {
  const [manualSignature, setManualSignature] = useState('')
  const [showDemo, setShowDemo] = useState(false)
  const [isAutoSigning, setIsAutoSigning] = useState(false)

  /**
   * Automatically sign with the provided private key
   */
  const handleAutoSign = async () => {
    if (!privateKey) {
      toast({
        title: 'Error',
        description: 'No private key available for automatic signing',
        variant: 'destructive'
      })
      return
    }

    setIsAutoSigning(true)

    try {
      // Import signing function
      const { signMessage } = await import('@/lib/did-generation')
      
      // Sign the message with the private key
      const signature = await signMessage(message, privateKey, keyType)
      
      onSignatureCreated(signature)
      toast({
        title: 'Success',
        description: 'Message signed successfully with your generated private key!',
      })
    } catch (error) {
      console.error('Auto signing error:', error)
      toast({
        title: 'Signing Failed',
        description: 'Failed to sign with your private key. Please try manual signing.',
        variant: 'destructive'
      })
    } finally {
      setIsAutoSigning(false)
    }
  }

  const createDemoSignature = () => {
    // Create a mock signature for demo purposes
    const timestamp = Date.now()
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    const randomHex = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
    const mockSignature = btoa(`demo_signature_${timestamp}_${randomHex}`)
    
    onSignatureCreated(mockSignature)
    toast({
      title: 'Demo Signature Created',
      description: 'A mock signature has been generated for demonstration purposes.',
    })
  }

  const handleManualSignature = () => {
    if (!manualSignature.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a signature',
        variant: 'destructive'
      })
      return
    }
    
    onSignatureCreated(manualSignature.trim())
    toast({
      title: 'Signature Added',
      description: 'Your signature has been added to the registration process.',
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    })
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          <strong>Signature Required:</strong> You need to sign the challenge message with the private key associated with your DID.
        </AlertDescription>
      </Alert>

      {/* Message to Sign */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Message to Sign</CardTitle>
          <CardDescription>
            This is the exact message you need to sign with your private key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Challenge Message</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(message, 'Challenge message')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="font-mono bg-green-50 border border-green-200 p-3 rounded text-sm whitespace-pre-wrap">
            {message}
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <div><strong>DID:</strong> <span className="font-mono">{did}</span></div>
            <div><strong>Verification Method:</strong> <span className="font-mono">{verificationMethod}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Signing Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Automatic Signing with Generated Key */}
        {privateKey && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Auto Sign
                <Badge variant="default" className="bg-green-600">Recommended</Badge>
              </CardTitle>
              <CardDescription>
                Sign automatically with your generated private key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This will use the private key you just generated to sign the challenge automatically.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleAutoSign}
                disabled={isAutoSigning}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isAutoSigning ? (
                  <>
                    <Key className="h-4 w-4 mr-2 animate-pulse" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Sign with Generated Key
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Signature Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manual Signature</CardTitle>
            <CardDescription>
              Enter a signature created with your external wallet or signing tool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="signature">Signature (Base64)</Label>
              <Textarea
                id="signature"
                placeholder="Enter your signature here..."
                value={manualSignature}
                onChange={(e) => setManualSignature(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
            <Button 
              onClick={handleManualSignature}
              disabled={!manualSignature.trim()}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Use This Signature
            </Button>
          </CardContent>
        </Card>

        {/* Demo Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Demo Mode
              <Badge variant="secondary">Development</Badge>
            </CardTitle>
            <CardDescription>
              Generate a mock signature for demonstration purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This creates a mock signature for testing. In production, use a real wallet or signing tool.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={createDemoSignature}
              variant="outline"
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Generate Demo Signature
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Integration Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wallet Integration</CardTitle>
          <CardDescription>
            How to sign with popular wallets and tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 border rounded">
              <div className="font-medium mb-1">did:key (Ed25519)</div>
              <div className="text-muted-foreground">Use libsodium or similar Ed25519 signing library</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium mb-1">did:ethr</div>
              <div className="text-muted-foreground">Sign with MetaMask or web3 provider</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium mb-1">did:web</div>
              <div className="text-muted-foreground">Use your domain's private key</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium mb-1">Other Methods</div>
              <div className="text-muted-foreground">Refer to method-specific documentation</div>
            </div>
          </div>
          
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              For production use, integrate with wallet libraries like ethers.js, @solana/web3.js, or method-specific SDKs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

export default SigningHelper
