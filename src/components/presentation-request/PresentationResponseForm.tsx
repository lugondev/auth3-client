'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Send,
  Eye,
  Calendar,
  User,
  Building,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import { credentialService } from '@/services/credentialService';
import { didService } from '@/services/didService';
import { createPresentation, getMyPresentations } from '@/services/presentationService';
import type { CreatePresentationRequest, VerifiablePresentation } from '@/types/presentations';
import { usePresentationRefreshTrigger } from '@/hooks/usePresentationRefresh';
import { useAuth } from '@/contexts/AuthContext';
import type { PresentationRequest, CredentialRequirement } from '@/types/presentation-request';
import type { VerifiableCredential } from '@/services/credentialService';
import type { DIDData } from '@/types/did';

interface CredentialMatch {
  credential: VerifiableCredential;
  requirement: CredentialRequirement;
  requirementIndex: number;
  isMatch: boolean;
  issues?: string[];
}

interface PresentationResponseFormProps {
  request?: PresentationRequest;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function PresentationResponseForm({ request: propRequest, onCancel, onSuccess }: PresentationResponseFormProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;
  const triggerPresentationRefresh = usePresentationRefreshTrigger();

  const [request, setRequest] = useState<PresentationRequest | null>(null);
  const [userCredentials, setUserCredentials] = useState<VerifiableCredential[]>([]);
  const [userDIDs, setUserDIDs] = useState<DIDData[]>([]);
  const [userPresentations, setUserPresentations] = useState<VerifiablePresentation[]>([]);
  const [credentialMatches, setCredentialMatches] = useState<CredentialMatch[]>([]);
  const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set());
  const [selectedPresentationId, setSelectedPresentationId] = useState<string>('');
  const [submissionMode, setSubmissionMode] = useState<'create' | 'select'>('create');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (propRequest) {
      // Use the request passed as prop
      setRequest(propRequest);
      setLoading(false);
      // Load credentials after setting request
      if (isAuthenticated) {
        loadUserCredentials();
      }
    } else if (requestId && isAuthenticated) {
      loadData();
    }
  }, [requestId, isAuthenticated, propRequest]);

  useEffect(() => {
    // This effect handles credential loading when request becomes available
    if (request && isAuthenticated && userCredentials.length === 0) {
      console.log('🔄 Loading credentials because request is available and no credentials loaded yet');
      loadUserCredentials();
    }
  }, [request, isAuthenticated]);

  useEffect(() => {
    // This effect handles matching when both request and credentials are available
    if (request && userCredentials.length > 0) {
      console.log('🔄 Running matching because both request and credentials are available');
      matchCredentialsToRequirements(request, userCredentials);
    }
  }, [request, userCredentials]);

  const loadUserCredentials = async () => {
    try {
      console.log('🔄 Starting to load user credentials, DIDs, and presentations...');
      
      // Load user's credentials, DIDs, and presentations in parallel
      const [credentialsResult, didsResult, presentationsResult] = await Promise.all([
        credentialService.listCredentials(),
        didService.listDIDs({ limit: 100 }),
        getMyPresentations({ limit: 100 })
      ]);
      
      console.log('📥 Credentials API Response:', credentialsResult);
      console.log('🆔 DIDs API Response:', didsResult);
      console.log('📋 Presentations API Response:', presentationsResult);
      
      const credentials = credentialsResult.credentials || [];
      const dids = didsResult.dids || [];
      const presentations = presentationsResult.presentations || [];
      
      console.log('💳 Processed credentials:', credentials);
      console.log('🆔 Processed DIDs:', dids);
      console.log('📋 Processed presentations:', presentations);
      
      setUserCredentials(credentials);
      setUserDIDs(dids);
      setUserPresentations(presentations);

      // Match credentials to requirements if request is available
      if (request) {
        console.log('🔗 Request available, running matching immediately...');
        matchCredentialsToRequirements(request, credentials);
      } else {
        console.log('⏳ Request not available yet, matching will run later...');
      }
    } catch (error: any) {
      console.error('❌ Failed to load user data:', error);
      toast.error('Failed to load your credentials, DIDs, and presentations');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load presentation request, user's credentials, DIDs, and presentations in parallel
      const [requestResult, credentialsResult, didsResult, presentationsResult] = await Promise.all([
        presentationRequestService.getRequestByRequestId(requestId),
        credentialService.listCredentials(),
        didService.listDIDs({ limit: 100 }),
        getMyPresentations({ limit: 100 })
      ]);
      
      setRequest(requestResult);
      setUserCredentials(credentialsResult.credentials || []);
      setUserDIDs(didsResult.dids || []);
      setUserPresentations(presentationsResult.presentations || []);

      // Match credentials to requirements
      matchCredentialsToRequirements(requestResult, credentialsResult.credentials || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load presentation request or user data');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const matchCredentialsToRequirements = (
    presentationRequest: PresentationRequest, 
    credentials: VerifiableCredential[]
  ) => {
    console.log('🔍 Matching Process Started');
    console.log('📋 Request Requirements:', presentationRequest.required_credentials);
    console.log('💳 User Credentials:', credentials);
    
    const matches: CredentialMatch[] = [];

    presentationRequest.required_credentials?.forEach((requirement, reqIndex) => {
      console.log(`\n📝 Checking Requirement ${reqIndex}:`, requirement);
      
      credentials.forEach((credential, credIndex) => {
        console.log(`\n  🔍 Testing Credential ${credIndex}:`, {
          id: credential.id,
          type: credential.type,
          issuer: credential.issuer,
          status: credential.credentialStatus?.status,
          expirationDate: credential.expirationDate
        });
        
        const isMatch = checkCredentialMatch(credential, requirement);
        const issues = getMatchingIssues(credential, requirement);
        
        console.log(`  ✅ Match Result:`, {
          isMatch,
          issues,
          requirement: requirement.type,
          credentialTypes: credential.type
        });
        
        matches.push({
          credential,
          requirement,
          requirementIndex: reqIndex,
          isMatch,
          issues
        });
      });
    });

    console.log('🏁 Final Matches:', matches);

    // Group by requirement and sort by match quality
    const sortedMatches = matches.sort((a, b) => {
      if (a.requirementIndex !== b.requirementIndex) {
        return a.requirementIndex - b.requirementIndex;
      }
      if (a.isMatch !== b.isMatch) {
        return b.isMatch ? 1 : -1;
      }
      return (a.issues?.length || 0) - (b.issues?.length || 0);
    });

    setCredentialMatches(sortedMatches);

    // Auto-select best matches for essential requirements
    const autoSelected = new Set<string>();
    presentationRequest.required_credentials?.forEach((requirement, reqIndex) => {
      if (requirement.essential) {
        const bestMatch = sortedMatches.find(
          match => match.requirementIndex === reqIndex && match.isMatch
        );
        if (bestMatch) {
          autoSelected.add(bestMatch.credential.id);
        }
      }
    });
    setSelectedCredentials(autoSelected);
  };

  const checkCredentialMatch = (credential: VerifiableCredential, requirement: CredentialRequirement): boolean => {
    console.log(`\n🔍 Detailed Match Check:`, {
      requirement: requirement.type,
      credentialTypes: credential.type,
      requirementIssuer: requirement.issuer,
      credentialIssuer: credential.issuer
    });

    // ✅ Improved type checking - credential.type is always string[]
    let typeMatches = false;
    
    if (credential.type && Array.isArray(credential.type)) {
      // Check if any of the credential types match the requirement
      typeMatches = credential.type.some(credType => {
        const exactMatch = credType === requirement.type;
        const caseInsensitiveMatch = credType.toLowerCase() === requirement.type.toLowerCase();
        const verifiableCredentialMatch = requirement.type === 'VerifiableCredential';
        
        const match = exactMatch || caseInsensitiveMatch || verifiableCredentialMatch;
        console.log(`    Type check details:`, {
          credType,
          requirementType: requirement.type,
          exactMatch,
          caseInsensitiveMatch,
          verifiableCredentialMatch,
          finalMatch: match
        });
        
        return match;
      });
    }

    if (!typeMatches) {
      console.log(`    ❌ Type mismatch: required ${requirement.type}, found ${credential.type}`);
      return false;
    }
    console.log(`    ✅ Type matches`);

    // Check issuer if specified
    if (requirement.issuer) {
      const credentialIssuerStr = typeof credential.issuer === 'string' 
        ? credential.issuer 
        : (credential.issuer as any)?.id || (credential.issuer as any)?.name || '';
        
      if (credentialIssuerStr !== requirement.issuer) {
        console.log(`    ❌ Issuer mismatch: required ${requirement.issuer}, found ${credentialIssuerStr}`);
        return false;
      }
    }
    console.log(`    ✅ Issuer check passed`);

    // Check if credential is valid (check status if available)
    // ⚠️ Make status check more lenient
    if (credential.credentialStatus) {
      const status = credential.credentialStatus.status;
      console.log(`    📊 Credential status check: ${status}`);
      
      if (status && status !== 'active') {
        console.log(`    ❌ Invalid status: ${status}`);
        return false;
      }
    } else {
      console.log(`    ⚠️ No credential status found - assuming valid`);
    }
    console.log(`    ✅ Status check passed`);

    // Check expiration
    if (credential.expirationDate) {
      const expirationDate = new Date(credential.expirationDate);
      const now = new Date();
      console.log(`    📅 Expiration check: ${credential.expirationDate} vs ${now.toISOString()}`);
      
      if (expirationDate < now) {
        console.log(`    ❌ Expired: ${credential.expirationDate}`);
        return false;
      }
    } else {
      console.log(`    ⚠️ No expiration date - assuming not expired`);
    }
    console.log(`    ✅ Expiration check passed`);

    console.log(`    🎉 OVERALL MATCH: TRUE`);
    return true;
  };

  const getMatchingIssues = (credential: VerifiableCredential, requirement: CredentialRequirement): string[] => {
    const issues: string[] = [];

    // Check type matching
    let typeMatches = false;
    if (credential.type && Array.isArray(credential.type)) {
      typeMatches = credential.type.some(credType => 
        credType === requirement.type || 
        credType.toLowerCase() === requirement.type.toLowerCase() ||
        requirement.type === 'VerifiableCredential'
      );
    }

    if (!typeMatches) {
      issues.push(`Type mismatch: expected ${requirement.type}, got ${credential.type?.join(', ')}`);
    }

    if (requirement.issuer) {
      const credentialIssuerStr = typeof credential.issuer === 'string' 
        ? credential.issuer 
        : (credential.issuer as any)?.id || (credential.issuer as any)?.name || '';
        
      if (credentialIssuerStr !== requirement.issuer) {
        issues.push(`Issuer mismatch: expected ${requirement.issuer}, got ${credentialIssuerStr}`);
      }
    }

    if (credential.credentialStatus && credential.credentialStatus.status !== 'active') {
      issues.push(`Credential status: ${credential.credentialStatus.status}`);
    }

    if (credential.expirationDate && new Date(credential.expirationDate) < new Date()) {
      issues.push('Credential has expired');
    }

    return issues;
  };

  const handleCredentialToggle = (credentialId: string, checked: boolean) => {
    const newSelected = new Set(selectedCredentials);
    if (checked) {
      newSelected.add(credentialId);
    } else {
      newSelected.delete(credentialId);
    }
    setSelectedCredentials(newSelected);
  };

  const handleSubmit = async () => {
    if (!request) {
      toast.error('Request not found');
      return;
    }

    // Get the holder DID based on submission mode
    let holderDID: string;
    
    if (submissionMode === 'create') {
      // For create mode, use user's DIDs
      if (userDIDs.length === 0) {
        toast.error('No DIDs available. Please create a DID first.');
        return;
      }
      holderDID = userDIDs[0].did;
    } else {
      // For select mode, use the holder DID from the selected presentation
      if (!selectedPresentationId) {
        toast.error('Please select a presentation');
        return;
      }
      
      const selectedPresentation = userPresentations.find(p => p.id === selectedPresentationId);
      if (!selectedPresentation) {
        toast.error('Selected presentation not found');
        return;
      }
      
      holderDID = selectedPresentation.holder;
      console.log('🆔 Using holder DID from selected presentation:', holderDID);
    }

    if (submissionMode === 'create') {
      // Create new presentation mode
      if (selectedCredentials.size === 0) {
        toast.error('Please select at least one credential');
        return;
      }

      // Check if all essential requirements are met
      const essentialRequirements = request.required_credentials?.filter(req => req.essential) || [];
      const unmetEssential = essentialRequirements.filter(req => {
        const hasMatchingCredential = credentialMatches.some(
          match => match.requirement === req && 
                   match.isMatch && 
                   selectedCredentials.has(match.credential.id)
        );
        return !hasMatchingCredential;
      });

      if (unmetEssential.length > 0) {
        toast.error('Please select credentials for all essential requirements');
        return;
      }

      try {
        setSubmitting(true);

        // Create presentation with selected credentials
        const selectedCredentialsList = Array.from(selectedCredentials)
          .map(id => userCredentials.find(c => c.id === id))
          .filter(Boolean) as VerifiableCredential[];

        console.log('🚀 Creating presentation with selected credentials:', {
          requestId: request.request_id,
          holderDID,
          selectedCredentialsCount: selectedCredentialsList.length,
          credentialIds: selectedCredentialsList.map(c => c.id)
        });

        // Step 1: Create a Verifiable Presentation using the presentation service
        const createPresentationRequest: CreatePresentationRequest = {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          credentials: selectedCredentialsList.map(c => c.id), // Use credential IDs (UUID strings)
          holderDID,
          challenge: request.challenge || '',
          domain: request.domain || '',
          type: ['VerifiablePresentation'],
          metadata: {
            purpose: request.purpose || 'Presentation Request Response',
            requestId: request.request_id,
            timestamp: new Date().toISOString()
          }
        };

        console.log('📋 Creating presentation with request:', createPresentationRequest);

        const createdPresentation = await createPresentation(createPresentationRequest);
        const presentationId = createdPresentation.presentationID;

        console.log('✅ Presentation created successfully:', {
          presentationId,
          presentation: createdPresentation.presentation
        });

        // Step 2: Submit the response with the actual presentation ID
        console.log('📤 Submitting presentation response:', {
          requestId: request.request_id,
          holderDID,
          presentationId
        });

        await presentationRequestService.submitResponse(request.request_id, {
          holder_did: holderDID,
          presentation_id: presentationId,
        });

        toast.success('Presentation created and submitted successfully!');
        
        // Trigger refresh of presentation lists across the app
        await triggerPresentationRefresh();
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/presentation-request/success?requestId=${request.id}`);
        }
      } catch (error: any) {
        console.error('Failed to create and submit presentation:', error);
        
        // Enhanced error handling
        if (error.name === 'ValidationError') {
          toast.error(error.message);
        } else if (error.message?.includes('presentation not found')) {
          toast.error('Failed to create presentation. Please check your credentials and try again.');
        } else if (error.message?.includes('holder_did')) {
          toast.error('Invalid holder DID. Please ensure you have a valid DID.');
        } else {
          toast.error('Failed to create and submit presentation');
        }
      } finally {
        setSubmitting(false);
      }
    } else {
      // Select existing presentation mode
      if (!selectedPresentationId) {
        toast.error('Please select a presentation');
        return;
      }

      try {
        setSubmitting(true);

        console.log('📤 Submitting existing presentation response:', {
          requestId: request.request_id,
          holderDID,
          presentationId: selectedPresentationId
        });

        await presentationRequestService.submitResponse(request.request_id, {
          holder_did: holderDID,
          presentation_id: selectedPresentationId,
        });

        toast.success('Presentation submitted successfully!');
        
        // Trigger refresh of presentation lists across the app
        await triggerPresentationRefresh();
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/presentation-request/success?requestId=${request.id}`);
        }
      } catch (error: any) {
        console.error('Failed to submit presentation:', error);
        toast.error('Failed to submit presentation');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-amber-500 dark:text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              You need to log in to respond to presentation requests.
            </p>
            <Button onClick={() => router.push('/login')}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your credentials...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Request Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The presentation request could not be found or has expired.
            </p>
            <Button 
              onClick={onCancel || (() => router.push('/dashboard'))} 
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {onCancel ? 'Cancel' : 'Back to Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group credentials by requirement
  const credentialsByRequirement = request.required_credentials?.map((requirement, index) => {
    const matches = credentialMatches.filter(match => match.requirementIndex === index);
    return {
      requirement,
      index,
      matches
    };
  }) || [];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Select Credentials to Share
            </h1>
            <p className="text-muted-foreground">
              Choose which credentials to include in your presentation response
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Debug Panel - Always show in development */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="border-border bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    🔍 Debug Information
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('🔄 Manual credential and DID reload triggered');
                          loadUserCredentials();
                        }}
                        className="text-xs h-6"
                      >
                        Reload Data
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (request && userCredentials.length > 0) {
                            console.log('🔄 Manual matching triggered');
                            matchCredentialsToRequirements(request, userCredentials);
                          } else {
                            console.log('❌ Cannot run matching: request or credentials missing');
                          }
                        }}
                        className="text-xs h-6"
                      >
                        Re-run Matching
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 text-muted-foreground">
                  <div><strong className="text-foreground">User Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
                  <div><strong className="text-foreground">Request Loaded:</strong> {request ? '✅ Yes' : '❌ No'}</div>
                  <div><strong className="text-foreground">User Credentials Count:</strong> {userCredentials.length}</div>
                  <div><strong className="text-foreground">User DIDs Count:</strong> {userDIDs.length}</div>
                  <div><strong className="text-foreground">User Presentations Count:</strong> {userPresentations.length}</div>
                  <div><strong className="text-foreground">Submission Mode:</strong> {submissionMode}</div>
                  <div><strong className="text-foreground">Selected Holder DID:</strong> {
                    submissionMode === 'create' 
                      ? (userDIDs.length > 0 ? userDIDs[0].did : 'None available')
                      : (selectedPresentationId 
                          ? userPresentations.find(p => p.id === selectedPresentationId)?.holder || 'Unknown'
                          : 'Select presentation first')
                  }</div>
                  <div><strong className="text-foreground">Requirements Count:</strong> {request?.required_credentials?.length || 0}</div>
                  <div><strong className="text-foreground">Total Matches:</strong> {credentialMatches.length}</div>
                  {submissionMode === 'create' && <div><strong className="text-foreground">Selected Credentials:</strong> {selectedCredentials.size}</div>}
                  {submissionMode === 'select' && <div><strong className="text-foreground">Selected Presentation ID:</strong> {selectedPresentationId || 'None'}</div>}
                  
                  {userDIDs.length > 0 && (
                    <div>
                      <strong className="text-foreground">Available DIDs:</strong>
                      <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                        {userDIDs.map((didData, idx) => (
                          <div key={idx} className="p-2 bg-card border border-border rounded text-xs">
                            <div><strong className="text-foreground">DID:</strong> {didData.did}</div>
                            <div><strong className="text-foreground">Method:</strong> {didData.method}</div>
                            <div><strong className="text-foreground">Status:</strong> {didData.status}</div>
                            <div><strong className="text-foreground">Created:</strong> {didData.created_at}</div>
                            {idx === 0 && <div className="text-primary text-xs mt-1">👆 This DID will be used as holder</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userCredentials.length > 0 && (
                    <div>
                      <strong className="text-foreground">Your Credentials:</strong>
                      <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                        {userCredentials.map((cred, idx) => (
                          <div key={idx} className="p-2 bg-card border border-border rounded text-xs">
                            <div><strong className="text-foreground">ID:</strong> {cred.id}</div>
                            <div><strong className="text-foreground">Types:</strong> [{cred.type?.join(', ')}]</div>
                            <div><strong className="text-foreground">Issuer:</strong> {typeof cred.issuer === 'string' ? cred.issuer : JSON.stringify(cred.issuer)}</div>
                            <div><strong className="text-foreground">Status:</strong> {cred.credentialStatus?.status || 'no status'}</div>
                            <div><strong className="text-foreground">Issued:</strong> {cred.issuanceDate}</div>
                            {cred.expirationDate && <div><strong className="text-foreground">Expires:</strong> {cred.expirationDate}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userPresentations.length > 0 && (
                    <div>
                      <strong className="text-foreground">Your Presentations:</strong>
                      <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                        {userPresentations.map((pres, idx) => (
                          <div key={idx} className="p-2 bg-card border border-border rounded text-xs">
                            <div><strong className="text-foreground">ID:</strong> {pres.id}</div>
                            <div><strong className="text-foreground">Status:</strong> {pres.status}</div>
                            <div><strong className="text-foreground">Holder:</strong> {pres.holder}</div>
                            <div><strong className="text-foreground">Credentials:</strong> {pres.verifiableCredential?.length || 0}</div>
                            <div><strong className="text-foreground">Created:</strong> {pres.createdAt}</div>
                            {pres.expiresAt && <div><strong className="text-foreground">Expires:</strong> {pres.expiresAt}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {request?.required_credentials && request.required_credentials.length > 0 && (
                    <div>
                      <strong className="text-foreground">Required Credentials:</strong>
                      <div className="mt-1 space-y-1">
                        {request.required_credentials.map((req, idx) => (
                          <div key={idx} className="p-2 bg-card border border-border rounded text-xs">
                            <div><strong className="text-foreground">Type:</strong> {req.type}</div>
                            <div><strong className="text-foreground">Essential:</strong> {req.essential ? 'Yes' : 'No'}</div>
                            {req.issuer && <div><strong className="text-foreground">Required Issuer:</strong> {req.issuer}</div>}
                            {req.format && <div><strong className="text-foreground">Format:</strong> {req.format}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Request Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{request.title}</CardTitle>
                <CardDescription>
                  Requested by {request.verifier_name || 'Anonymous Verifier'}
                </CardDescription>
              </CardHeader>
              {request.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                </CardContent>
              )}
            </Card>

            {/* Submission Mode Selector */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Choose Submission Method
                </CardTitle>
                <CardDescription>
                  Select how you want to respond to this presentation request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={submissionMode} 
                  onValueChange={(value: 'create' | 'select') => {
                    setSubmissionMode(value);
                    // Reset selections when changing mode
                    setSelectedCredentials(new Set());
                    setSelectedPresentationId('');
                  }}
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem value="create" id="create" className="mt-1" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="create" className="text-sm font-medium">
                        🆕 Create New Presentation
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Select credentials and create a new verifiable presentation for this request
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem value="select" id="select" className="mt-1" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="select" className="text-sm font-medium">
                        📋 Use Existing Presentation
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Choose from your previously created presentations ({userPresentations.length} available)
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Presentation Selection (when select mode) */}
            {submissionMode === 'select' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Select Existing Presentation
                  </CardTitle>
                  <CardDescription>
                    Choose a presentation from your collection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userPresentations.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        No presentations found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You'll need to create a new presentation instead
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSubmissionMode('create')}
                        className="mt-3"
                      >
                        Switch to Create Mode
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Select value={selectedPresentationId} onValueChange={setSelectedPresentationId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a presentation..." />
                        </SelectTrigger>
                        <SelectContent>
                          {userPresentations.map((presentation) => (
                            <SelectItem key={presentation.id} value={presentation.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {presentation.metadata?.title || `Presentation ${presentation.id.slice(0, 8)}...`}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {presentation.verifiableCredential?.length || 0} credentials • Created {formatDate(presentation.createdAt)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedPresentationId && (
                        <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
                          {(() => {
                            const selectedPresentation = userPresentations.find(p => p.id === selectedPresentationId);
                            return selectedPresentation ? (
                              <div className="space-y-2 text-sm">
                                <div className="font-medium">Presentation Details:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                  <div>ID: {selectedPresentation.id}</div>
                                  <div>Status: {selectedPresentation.status}</div>
                                  <div>Holder: {selectedPresentation.holder}</div>
                                  <div>Credentials: {selectedPresentation.verifiableCredential?.length || 0}</div>
                                  <div>Created: {formatDate(selectedPresentation.createdAt)}</div>
                                  {selectedPresentation.expiresAt && (
                                    <div>Expires: {formatDate(selectedPresentation.expiresAt)}</div>
                                  )}
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Credential Selection (when create mode) */}
            {submissionMode === 'create' && credentialsByRequirement.map(({ requirement, index, matches }) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {requirement.type}
                    </CardTitle>
                    <Badge variant={requirement.essential ? 'default' : 'secondary'}>
                      {requirement.essential ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                  {requirement.purpose && (
                    <CardDescription>{requirement.purpose}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Debug Info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground">
                      <strong className="text-foreground">🔍 Debug Info:</strong>
                      <div>Required Type: <code className="bg-muted px-1 rounded">{requirement.type}</code></div>
                      <div>Required Issuer: <code className="bg-muted px-1 rounded">{requirement.issuer || 'Any'}</code></div>
                      <div>Essential: <code className="bg-muted px-1 rounded">{requirement.essential}</code></div>
                      <div>User Credentials Count: <code className="bg-muted px-1 rounded">{userCredentials.length}</code></div>
                      <div>Matches Found: <code className="bg-muted px-1 rounded">{matches.length}</code></div>
                      <div>Valid Matches: <code className="bg-muted px-1 rounded">{matches.filter(m => m.isMatch).length}</code></div>
                    </div>
                  )}
                  
                  {matches.length === 0 ? (
                    <div className="text-center py-8">
                      <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No matching credentials found
                      </p>
                      {requirement.essential && (
                        <p className="text-sm text-destructive mt-1">
                          This is a required credential type
                        </p>
                      )}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-3 bg-card border border-border rounded text-xs text-left">
                            <strong className="text-primary">💡 Troubleshooting:</strong>
                            <ul className="mt-2 space-y-1 text-muted-foreground">
                                <li>• Check if you have any credentials issued</li>
                                <li>• Check if you have at least one DID created</li>
                                <li>• Check credential types in your wallet</li>
                                <li>• Verify credential status is 'active'</li>
                                <li>• Check browser console for detailed logs</li>
                            </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matches.map((match) => (
                        <div 
                          key={match.credential.id}
                          className={`border rounded-lg p-4 ${
                            match.isMatch 
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedCredentials.has(match.credential.id)}
                              onCheckedChange={(checked) => 
                                handleCredentialToggle(match.credential.id, checked as boolean)
                              }
                              disabled={!match.isMatch}
                              className="mt-1"
                            />                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-sm">
                                    {(match.credential.credentialSubject?.name as string) || 
                                     match.credential.type?.join(', ') || 
                                     'Unnamed Credential'}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    {match.isMatch ? (
                                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {match.credential.credentialStatus?.status || 'unknown'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    <span>Issuer: {typeof match.credential.issuer === 'string' 
                                      ? match.credential.issuer 
                                      : (match.credential.issuer as any)?.name || 'Unknown'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Issued: {formatDate(match.credential.issuanceDate)}
                                    </span>
                                  </div>
                                  {match.credential.expirationDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        Expires: {formatDate(match.credential.expirationDate)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                              {match.issues && match.issues.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-1 text-destructive text-xs mb-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Issues:</span>
                                  </div>
                                  <ul className="text-xs text-destructive ml-4 list-disc">
                                    {match.issues.map((issue, idx) => (
                                      <li key={idx}>{issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Selection Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Submission Mode:</span>
                    <Badge variant={submissionMode === 'create' ? 'default' : 'secondary'}>
                      {submissionMode === 'create' ? '🆕 Create New' : '📋 Use Existing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Holder DID:</span>
                    <span className="font-mono text-xs text-muted-foreground break-all">
                      {submissionMode === 'create' 
                        ? (userDIDs.length > 0 ? userDIDs[0].did : 'No DID available')
                        : (selectedPresentationId 
                            ? userPresentations.find(p => p.id === selectedPresentationId)?.holder || 'Unknown'
                            : 'Select presentation first')
                      }
                    </span>
                  </div>
                  
                  {submissionMode === 'create' ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span>Selected Credentials:</span>
                        <span className="font-medium">{selectedCredentials.size}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Required:</span>
                        <span className="font-medium">
                          {request.required_credentials?.filter(req => req.essential).length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Optional:</span>
                        <span className="font-medium">
                          {request.required_credentials?.filter(req => !req.essential).length || 0}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span>Available Presentations:</span>
                        <span className="font-medium">{userPresentations.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Selected Presentation:</span>
                        <span className="font-medium">
                          {selectedPresentationId ? '✅ Yes' : '❌ None'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={
                    submitting || 
                    (submissionMode === 'create' && (selectedCredentials.size === 0 || userDIDs.length === 0)) || 
                    (submissionMode === 'select' && !selectedPresentationId)
                  }
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {submissionMode === 'create' ? 'Creating & Submitting...' : 'Submitting...'}
                    </>
                  ) : submissionMode === 'create' && userDIDs.length === 0 ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      No DID Available
                    </>
                  ) : submissionMode === 'create' && selectedCredentials.size === 0 ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Select Credentials
                    </>
                  ) : submissionMode === 'select' && !selectedPresentationId ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Select Presentation
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {submissionMode === 'create' ? 'Create & Submit' : 'Submit Presentation'}
                    </>
                  )}
                </Button>
                
                {submissionMode === 'create' && userDIDs.length === 0 && (
                  <p className="text-xs text-destructive text-center">
                    You need to create a DID before creating new presentations.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardContent className="py-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Privacy Notice</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Only the selected credential information will be shared. 
                      The verifier will not store your credentials.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
