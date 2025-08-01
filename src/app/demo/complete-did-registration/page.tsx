/**
 * Complete DID Registration Component
 * Combines client-side generation with challenge-response registration
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Key, Shield, CheckCircle, AlertCircle, Copy, Download } from 'lucide-react'
import { ClientDIDGenerator } from '@/components/did/ClientDIDGenerator'
import { useDIDGeneration, copyToClipboard, downloadAsFile } from '@/hooks/use-did-generation'
import { signMessage } from '@/lib/did-generation'
import { toast } from 'sonner'

// Mock services - in real implementation, these would call your API
const mockChallengeService = {
  async generateChallenge(did: string) {
    const challenge = `auth3-challenge-${Date.now()}-${Math.random().toString(36).substring(2)}`
    const challengeId = `ch_${Math.random().toString(36).substring(2)}`
    const message = `Please sign this message to prove control of DID: ${did}\nChallenge: ${challenge}\nTimestamp: ${new Date().toISOString()}`
    
    return {
      challengeId,
      challenge,
      message,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    }
  },

  async registerDID(did: string, challengeId: string, signature: string, verificationMethod: string) {
    // Mock registration
    return {
      success: true,
      didId: `did_${Math.random().toString(36).substring(2)}`,
      registeredAt: new Date().toISOString()
    }
  }
}

interface RegistrationState {
  step: 'generate' | 'challenge' | 'sign' | 'register' | 'complete'
  generatedDID: any | null
  challenge: any | null
  signature: string | null
  error: string | null
}

export function CompleteDIDRegistration() {
  const [state, setState] = useState<RegistrationState>({
    step: 'generate',
    generatedDID: null,
    challenge: null,
    signature: null,
    error: null
  })
  
  const [didName, setDidName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Handle DID generation completion
  const handleDIDGenerated = (result: any) => {
    setState(prev => ({
      ...prev,
      generatedDID: result,
      step: 'challenge'
    }))
  }

  // Generate challenge for proof of control
  const handleGenerateChallenge = async () => {
    if (!state.generatedDID) return

    setIsLoading(true)
    try {
      const challenge = await mockChallengeService.generateChallenge(state.generatedDID.did)
      setState(prev => ({
        ...prev,
        challenge,
        step: 'sign'
      }))
      toast.success('Challenge generated successfully')
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to generate challenge'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // Sign the challenge message
  const handleSignChallenge = async () => {
    if (!state.generatedDID || !state.challenge) return

    setIsLoading(true)
    try {
      const signature = await signMessage(
        state.challenge.message,
        state.generatedDID.keyPair.privateKey,
        'Ed25519' // Assuming Ed25519 for demo
      )

      setState(prev => ({
        ...prev,
        signature,
        step: 'register'
      }))
      toast.success('Challenge signed successfully')
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to sign challenge'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // Register the DID with proof of control
  const handleRegisterDID = async () => {
    if (!state.generatedDID || !state.challenge || !state.signature) return

    setIsLoading(true)
    try {
      const result = await mockChallengeService.registerDID(
        state.generatedDID.did,
        state.challenge.challengeId,
        state.signature,
        state.generatedDID.verificationMethod
      )

      setState(prev => ({
        ...prev,
        step: 'complete'
      }))
      toast.success('DID registered successfully!')
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to register DID'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // Reset the flow
  const handleReset = () => {
    setState({
      step: 'generate',
      generatedDID: null,
      challenge: null,
      signature: null,
      error: null
    })
    setDidName('')
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card>
        <CardHeader>
          <CardTitle>DID Registration Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {[
              { key: 'generate', label: 'Generate DID', icon: Key },
              { key: 'challenge', label: 'Get Challenge', icon: Shield },
              { key: 'sign', label: 'Sign Challenge', icon: Shield },
              { key: 'register', label: 'Register DID', icon: CheckCircle },
              { key: 'complete', label: 'Complete', icon: CheckCircle }
            ].map((step, index) => {
              const isActive = state.step === step.key
              const isCompleted = ['generate', 'challenge', 'sign', 'register', 'complete'].indexOf(state.step) > index
              const IconComponent = step.icon

              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-blue-500 text-white' : 
                    'bg-gray-200 text-gray-500'
                  }`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className={`ml-2 text-sm ${
                    isCompleted ? 'text-green-600' : 
                    isActive ? 'text-blue-600' : 
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < 4 && (
                    <div className={`w-8 h-px mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Generate DID */}
      {state.step === 'generate' && (
        <ClientDIDGenerator onGenerated={handleDIDGenerated} />
      )}

      {/* Step 2: Generate Challenge */}
      {state.step === 'challenge' && state.generatedDID && (
        <Card>
          <CardHeader>
            <CardTitle>Request Challenge for Proof of Control</CardTitle>
            <CardDescription>
              To register your DID, you need to prove control by signing a challenge message.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Generated DID</Label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {state.generatedDID.did}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="did-name">DID Name (optional)</Label>
              <Input
                id="did-name"
                placeholder="My Generated DID"
                value={didName}
                onChange={(e) => setDidName(e.target.value)}
              />
            </div>

            <Button onClick={handleGenerateChallenge} disabled={isLoading} className="w-full">
              {isLoading ? 'Generating Challenge...' : 'Generate Challenge'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sign Challenge */}
      {state.step === 'sign' && state.challenge && (
        <Card>
          <CardHeader>
            <CardTitle>Sign Challenge Message</CardTitle>
            <CardDescription>
              Sign the challenge message to prove you control this DID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Challenge Message</Label>
              <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {state.challenge.message}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">Challenge ID: {state.challenge.challengeId}</Badge>
              <Badge variant="outline">Expires: {new Date(state.challenge.expiresAt).toLocaleTimeString()}</Badge>
            </div>

            <Button onClick={handleSignChallenge} disabled={isLoading} className="w-full">
              {isLoading ? 'Signing...' : 'Sign Challenge'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Register DID */}
      {state.step === 'register' && state.signature && (
        <Card>
          <CardHeader>
            <CardTitle>Register DID with Proof</CardTitle>
            <CardDescription>
              Submit your DID registration with the signed proof of control.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Signature</Label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {state.signature}
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Challenge signed successfully. Ready to register your DID.
              </AlertDescription>
            </Alert>

            <Button onClick={handleRegisterDID} disabled={isLoading} className="w-full">
              {isLoading ? 'Registering DID...' : 'Register DID'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Complete */}
      {state.step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              DID Registration Complete
            </CardTitle>
            <CardDescription>
              Your DID has been successfully registered with proof of control.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Registered DID</Label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {state.generatedDID?.did}
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Success!</strong> Your DID is now registered and verified. You can use it for authentication and signing.
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button 
                onClick={async () => {
                  const success = await copyToClipboard(state.generatedDID?.did || '')
                  if (success) {
                    toast.success('DID copied to clipboard')
                  } else {
                    toast.error('Failed to copy to clipboard')
                  }
                }}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy DID
              </Button>
              <Button 
                onClick={() => {
                  if (state.generatedDID) {
                    const content = JSON.stringify(state.generatedDID.didDocument, null, 2)
                    downloadAsFile(content, `${state.generatedDID.did.replace(/:/g, '_')}.json`, 'application/json')
                  }
                }}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function CompleteDIDRegistrationPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Complete DID Registration</h1>
        <p className="text-muted-foreground mt-2">
          Generate a DID client-side and register it with challenge-response proof of control.
        </p>
      </div>

      <CompleteDIDRegistration />
    </div>
  )
}
