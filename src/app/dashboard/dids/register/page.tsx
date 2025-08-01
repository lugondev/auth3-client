'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Copy, 
  Download,
  FileText,
  Lock,
  Unlock,
  Zap,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

import ChallengeDisplay from '@/components/did/ChallengeDisplay'
import SigningHelper from '@/components/did/SigningHelper'

import * as didService from '@/services/didService'
import type { 
  GenerateControlChallengeInput,
  GenerateControlChallengeOutput,
  VerifyDIDControlInput,
  RegisterUserManagedDIDInput,
  DIDControlProof
} from '@/types/did'

// Registration workflow steps
type RegistrationStep = 'input' | 'challenge' | 'sign' | 'verify' | 'register' | 'complete'

interface ChallengeData extends GenerateControlChallengeOutput {
  verification_method?: string
}

interface SigningData {
  message: string
  signature: string
  verification_method: string
  timestamp: string
}

const UserManagedDIDRegistration: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()

  // Form state
  const [did, setDid] = useState('')
  const [verificationMethod, setVerificationMethod] = useState('')
  const [metadata, setMetadata] = useState('')

  // Workflow state
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('input')
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null)
  const [signingData, setSigningData] = useState<SigningData | null>(null)
  const [proof, setProof] = useState<DIDControlProof | null>(null)
  const [registrationResult, setRegistrationResult] = useState<any>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation
  const isValidDID = (didString: string): boolean => {
    return /^did:[a-z0-9]+:[A-Za-z0-9\-._:]+$/i.test(didString)
  }

  const isValidVerificationMethod = (vm: string): boolean => {
    return vm.includes('#') && isValidDID(vm.split('#')[0])
  }

  // Reset form
  const resetForm = useCallback(() => {
    setDid('')
    setVerificationMethod('')
    setMetadata('')
    setChallengeData(null)
    setSigningData(null)
    setProof(null)
    setRegistrationResult(null)
    setCurrentStep('input')
    setError(null)
  }, [])

  // Step 1: Generate challenge
  const handleGenerateChallenge = async () => {
    if (!isValidDID(did)) {
      setError('Please enter a valid DID format (e.g., did:key:z...)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const input: GenerateControlChallengeInput = {
        did,
        verification_method: verificationMethod || undefined,
        purpose: 'registration'
      }

      const result = await didService.generateControlChallenge(input)
      
      setChallengeData({
        ...result,
        verification_method: verificationMethod || `${did}#key-1`
      })
      
      setCurrentStep('challenge')
      
      toast({
        title: 'Challenge Generated',
        description: 'A cryptographic challenge has been generated for your DID.',
      })
    } catch (err) {
      console.error('Error generating challenge:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate challenge')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Handle signature creation
  const handleSignatureCreated = (signature: string) => {
    if (!challengeData) return

    const signingDataResult: SigningData = {
      message: challengeData.message,
      signature: signature,
      verification_method: challengeData.verification_method || `${did}#key-1`,
      timestamp: new Date().toISOString()
    }

    setSigningData(signingDataResult)
    setCurrentStep('verify')

    toast({
      title: 'Signature Added',
      description: 'Your signature has been added. You can now verify or proceed to registration.',
    })
  }

  // Step 3: Create proof and verify (optional step)
  const handleVerifyControl = async () => {
    if (!challengeData || !signingData) return

    setLoading(true)
    setError(null)

    try {
      const proofData: DIDControlProof = {
        type: 'signature',
        challenge: challengeData.challenge,
        signature: signingData.signature,
        verification_method: signingData.verification_method,
        signed_message: challengeData.message,
        timestamp: signingData.timestamp,
        nonce: challengeData.nonce
      }

      const verifyInput: VerifyDIDControlInput = {
        challenge_id: challengeData.challenge_id,
        did,
        proof_of_control: proofData
      }

      const result = await didService.verifyDIDControl(verifyInput)
      
      if (result.valid) {
        setProof(proofData)
        setCurrentStep('register')
        toast({
          title: 'Control Verified',
          description: 'Your DID control has been successfully verified.',
        })
      } else {
        setError(`Verification failed: ${result.reason || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error verifying control:', err)
      setError(err instanceof Error ? err.message : 'Failed to verify DID control')
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Register DID
  const handleRegisterDID = async () => {
    if (!challengeData || !signingData) return

    setLoading(true)
    setError(null)

    try {
      const proofData: DIDControlProof = proof || {
        type: 'signature',
        challenge: challengeData.challenge,
        signature: signingData.signature,
        verification_method: signingData.verification_method,
        signed_message: challengeData.message,
        timestamp: signingData.timestamp,
        nonce: challengeData.nonce
      }

      const registerInput: RegisterUserManagedDIDInput = {
        did,
        challenge_id: challengeData.challenge_id,
        proof_of_control: proofData,
        metadata: metadata ? JSON.parse(metadata) : undefined
      }

      const result = await didService.registerUserManagedDID(registerInput)
      
      setRegistrationResult(result)
      setCurrentStep('complete')
      
      toast({
        title: 'DID Registered Successfully',
        description: `Your DID has been registered with ID: ${result.did_id}`,
      })
    } catch (err) {
      console.error('Error registering DID:', err)
      setError(err instanceof Error ? err.message : 'Failed to register DID')
    } finally {
      setLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to register a user-managed DID</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Register User-Managed DID</h1>
          <p className="text-muted-foreground">
            Register an existing DID that you control using cryptographic proof
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/dids">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to DIDs
            </Button>
          </Link>
          <Link href="/dashboard/dids/create">
            <Button variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Create New DID
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Registration Progress
          </CardTitle>
          <CardDescription>
            Secure DID registration using cryptographic challenge-response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            {[
              { key: 'input', label: 'DID Input', icon: FileText },
              { key: 'challenge', label: 'Challenge', icon: Zap },
              { key: 'sign', label: 'Sign', icon: Key },
              { key: 'verify', label: 'Verify', icon: CheckCircle },
              { key: 'register', label: 'Register', icon: Unlock },
              { key: 'complete', label: 'Complete', icon: CheckCircle }
            ].map((step, index) => {
              const isActive = currentStep === step.key
              const isCompleted = ['input', 'challenge', 'sign', 'verify', 'register', 'complete'].indexOf(currentStep) > index
              const Icon = step.icon

              return (
                <React.Fragment key={step.key}>
                  <div className={`flex flex-col items-center space-y-2 ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <div className={`rounded-full p-2 ${isActive ? 'bg-primary text-primary-foreground' : isCompleted ? 'bg-green-100 text-green-600' : 'bg-muted'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
                  </div>
                  {index < 5 && (
                    <ArrowRight className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="input" disabled={currentStep !== 'input'}>Input</TabsTrigger>
              <TabsTrigger value="challenge" disabled={!challengeData}>Challenge</TabsTrigger>
              <TabsTrigger value="sign" disabled={!challengeData}>Sign</TabsTrigger>
              <TabsTrigger value="verify" disabled={!signingData}>Verify</TabsTrigger>
              <TabsTrigger value="register" disabled={!signingData}>Register</TabsTrigger>
              <TabsTrigger value="complete" disabled={!registrationResult}>Complete</TabsTrigger>
            </TabsList>

            {/* Step 1: DID Input */}
            <TabsContent value="input">
              <Card>
                <CardHeader>
                  <CardTitle>DID Information</CardTitle>
                  <CardDescription>
                    Enter the DID you want to register and prove control over
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="did">DID *</Label>
                    <Input
                      id="did"
                      placeholder="did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
                      value={did}
                      onChange={(e) => setDid(e.target.value)}
                      className={!isValidDID(did) && did ? 'border-red-500' : ''}
                    />
                    {did && !isValidDID(did) && (
                      <p className="text-sm text-red-500">Please enter a valid DID format</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verification-method">Verification Method (Optional)</Label>
                    <Input
                      id="verification-method"
                      placeholder="did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1"
                      value={verificationMethod}
                      onChange={(e) => setVerificationMethod(e.target.value)}
                      className={verificationMethod && !isValidVerificationMethod(verificationMethod) ? 'border-red-500' : ''}
                    />
                    <p className="text-sm text-muted-foreground">
                      If not provided, will default to {did ? `${did}#key-1` : 'DID#key-1'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metadata">Metadata (Optional JSON)</Label>
                    <Textarea
                      id="metadata"
                      placeholder='{"description": "My personal DID", "keyType": "Ed25519"}'
                      value={metadata}
                      onChange={(e) => setMetadata(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleGenerateChallenge}
                    disabled={!isValidDID(did) || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating Challenge...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Challenge
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 2: Challenge Generated */}
            <TabsContent value="challenge">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Challenge Generated
                  </CardTitle>
                  <CardDescription>
                    A cryptographic challenge has been generated. Review the details and proceed to signing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {challengeData && (
                    <>
                      <ChallengeDisplay 
                        challenge={challengeData} 
                        did={did}
                        onExpired={() => {
                          setError('Challenge has expired. Please generate a new one.')
                          setCurrentStep('input')
                        }}
                      />
                      
                      <Alert>
                        <Key className="h-4 w-4" />
                        <AlertDescription>
                          Use your private key to sign the message above. In a real application, this would be done automatically by your wallet or signing software.
                        </AlertDescription>
                      </Alert>

                      <Button 
                        onClick={() => setCurrentStep('sign')}
                        className="w-full"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Proceed to Signing
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 3: Sign Challenge */}
            <TabsContent value="sign">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Sign Challenge
                  </CardTitle>
                  <CardDescription>
                    Sign the challenge message with your private key to prove DID control
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {challengeData ? (
                    <SigningHelper
                      message={challengeData.message}
                      did={did}
                      verificationMethod={challengeData.verification_method || `${did}#key-1`}
                      onSignatureCreated={handleSignatureCreated}
                    />
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Challenge data is missing. Please go back and generate a new challenge.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {signingData && (
                    <div className="mt-6 space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Signature Created:</strong> Your signature has been created successfully.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setCurrentStep('verify')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify Control (Optional)
                        </Button>
                        <Button 
                          onClick={() => setCurrentStep('register')}
                          variant="outline"
                          className="flex-1"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Skip to Register
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 4: Verify Control (Optional) */}
            <TabsContent value="verify">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Verify DID Control
                  </CardTitle>
                  <CardDescription>
                    Optional step to verify your DID control before registration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {challengeData && signingData && (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>DID</Label>
                          <div className="font-mono bg-muted p-2 rounded text-xs break-all">
                            {did}
                          </div>
                        </div>
                        <div>
                          <Label>Challenge ID</Label>
                          <div className="font-mono bg-muted p-2 rounded text-xs">
                            {challengeData.challenge_id}
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          This verification step is optional. You can proceed directly to registration if you prefer.
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleVerifyControl}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify Control
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={() => setCurrentStep('register')}
                          variant="outline"
                          className="flex-1"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Skip to Register
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 5: Register DID */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Unlock className="h-5 w-5" />
                    Register DID
                  </CardTitle>
                  <CardDescription>
                    Complete the registration process by submitting your proof of control
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {challengeData && signingData && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Challenge Generated</span>
                          </div>
                          <Badge variant="secondary">✓</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Signature Created</span>
                          </div>
                          <Badge variant="secondary">✓</Badge>
                        </div>

                        {proof && (
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Control Verified</span>
                            </div>
                            <Badge variant="secondary">✓</Badge>
                          </div>
                        )}
                      </div>

                      <Alert>
                        <Unlock className="h-4 w-4" />
                        <AlertDescription>
                          Ready to register your DID. This will create a permanent record linking your DID to your account.
                        </AlertDescription>
                      </Alert>

                      <Button 
                        onClick={handleRegisterDID}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Registering DID...
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Register DID
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 6: Complete */}
            <TabsContent value="complete">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Registration Complete
                  </CardTitle>
                  <CardDescription>
                    Your DID has been successfully registered!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {registrationResult && (
                    <>
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Success!</strong> Your DID has been registered and is now linked to your account.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <Label>DID ID</Label>
                          <div className="font-mono bg-muted p-2 rounded text-xs">
                            {registrationResult.did_id}
                          </div>
                        </div>
                        <div>
                          <Label>DID</Label>
                          <div className="font-mono bg-muted p-2 rounded text-xs break-all">
                            {registrationResult.did}
                          </div>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Badge variant="default">{registrationResult.status}</Badge>
                        </div>
                        <div>
                          <Label>Registered At</Label>
                          <div className="font-mono bg-muted p-2 rounded text-xs">
                            {new Date(registrationResult.registered_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => router.push('/dashboard/dids')}
                          className="flex-1"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          View All DIDs
                        </Button>
                        <Button 
                          onClick={resetForm}
                          variant="outline"
                          className="flex-1"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Register Another
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium">Enter DID</p>
                  <p className="text-muted-foreground">Provide the DID you want to register</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium">Generate Challenge</p>
                  <p className="text-muted-foreground">System creates a cryptographic challenge</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium">Sign Message</p>
                  <p className="text-muted-foreground">Use your private key to sign the challenge</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <p className="font-medium">Submit Proof</p>
                  <p className="text-muted-foreground">Complete registration with your signature</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Challenge Status */}
          {challengeData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Challenge Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ID:</span>
                  <span className="font-mono text-xs">{challengeData.challenge_id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires:</span>
                  <span>{new Date(challengeData.expires_at).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Purpose:</span>
                  <Badge variant="outline">{challengeData.purpose}</Badge>
                </div>
                {signingData && (
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="default">Signed</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Cryptographic challenge verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>10-minute challenge expiration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Single-use challenges</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Replay attack protection</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UserManagedDIDRegistration
