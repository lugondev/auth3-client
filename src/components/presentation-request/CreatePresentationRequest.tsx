'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Plus, Trash2, Calendar, Clock, Shield, QrCode, Copy, Eye, Info, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import didService from '@/services/didService';
import { useAuth } from '@/contexts/AuthContext';
import type { CreatePresentationRequestDTO, CredentialRequirement } from '@/types/presentation-request';
import type { DIDResponse } from '@/types/did';

const credentialRequirementSchema = z.object({
  type: z.string().min(1, 'Credential type is required'),
  format: z.string().optional(),
  schema: z.string().optional(),
  issuer: z.string().optional(),
  purpose: z.string().optional(),
  essential: z.boolean(),
  constraints: z.union([z.record(z.any()), z.string()]).optional(),
});

const presentationRequestSchema = z.object({
  verifierDid: z.string().min(1, 'Verifier DID is required'),
  verifierName: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  purpose: z.string().optional(),
  requiredCredentials: z.array(credentialRequirementSchema).min(1, 'At least one credential requirement is needed'),
  challenge: z.string().optional(),
  domain: z.string().optional(),
  nonce: z.string().optional(),
  expiresAt: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  maxResponses: z.number().min(0).optional(),
  verificationOptions: z.object({
    verify_signature: z.boolean(),
    verify_expiration: z.boolean(),
    verify_revocation: z.boolean(),
    verify_issuer_trust: z.boolean(),
    verify_schema: z.boolean(),
  }),
  metadata: z.record(z.any()).optional(),
});

type FormData = z.infer<typeof presentationRequestSchema>;

interface CreatePresentationRequestProps {
  onSuccess?: (request: any) => void;
  onCancel?: () => void;
}

export function CreatePresentationRequest({ onSuccess, onCancel }: CreatePresentationRequestProps) {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableDIDs, setAvailableDIDs] = useState<DIDResponse[]>([]);
  const [loadingDIDs, setLoadingDIDs] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(presentationRequestSchema),
    defaultValues: {
      requiredCredentials: [{ type: '', format: 'ldp_vc', essential: false }],
      verificationOptions: {
        verify_signature: true,
        verify_expiration: true,
        verify_revocation: true,
        verify_issuer_trust: true,
        verify_schema: true,
      },
      metadata: {},
    },
  });

  // Load user's DIDs for verifier selection
  useEffect(() => {
    const loadDIDs = async () => {
      try {
        setLoadingDIDs(true);
        const result = await didService.listDIDs({ limit: 100 });
        console.log('Raw DID response:', result); // Debug log
        
        // Filter active DIDs - check multiple possible status values
        const userDIDs = result.dids?.filter(didResponse => {
          const status = didResponse?.status;
          console.log('DID status:', status, 'for DID:', didResponse?.did); // Debug log
          return status === 'active' || status === 'created' || status === 'confirmed' || status === 'published';
        }) || [];
        
        console.log('Filtered DIDs:', userDIDs); // Debug log
        setAvailableDIDs(userDIDs);
        
        // Auto-select first DID if only one available
        if (userDIDs.length === 1) {
          setValue('verifierDid', userDIDs[0].did);
        }
      } catch (error) {
        console.error('Failed to load DIDs:', error);
        toast.error('Failed to load your DIDs. Please check your connection and try again.');
      } finally {
        setLoadingDIDs(false);
      }
    };

    loadDIDs();
  }, [setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'requiredCredentials',
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      console.log('Form data received:', data); // Debug log

      // Manual validation - more flexible than react-hook-form strict validation
      const validationErrors: string[] = [];

      // Validate required fields
      if (!data.verifierDid || data.verifierDid.trim() === '') {
        validationErrors.push('Please select or enter a verifier DID');
      }

      if (!data.title || data.title.trim() === '') {
        validationErrors.push('Please enter a title');
      }

      if (!data.requiredCredentials || data.requiredCredentials.length === 0) {
        validationErrors.push('Please add at least one credential requirement');
      } else {
        // Check if any credential type is empty
        const emptyCredentials = data.requiredCredentials.filter(cred => !cred.type || cred.type.trim() === '');
        if (emptyCredentials.length > 0) {
          validationErrors.push('Please select credential types for all requirements');
        }
      }

      // If there are validation errors, show them and stop
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        setIsSubmitting(false);
        return;
      }

      // Generate random values for security
      const challenge = data.challenge || crypto.randomUUID();
      const nonce = data.nonce || crypto.randomUUID();

      // Convert form data to API format
      const requestData: CreatePresentationRequestDTO = {
        verifier_did: data.verifierDid,
        verifier_name: data.verifierName,
        title: data.title,
        description: data.description,
        purpose: data.purpose,
        required_credentials: data.requiredCredentials.map(cred => {
          // Handle constraints - parse JSON string if it's a string, otherwise use as-is
          let constraints: Record<string, any> | undefined = undefined;
          if (cred.constraints) {
            if (typeof cred.constraints === 'string') {
              try {
                // Only parse if it's not empty
                if (cred.constraints.trim()) {
                  constraints = JSON.parse(cred.constraints);
                }
              } catch (error) {
                console.warn('Failed to parse constraints JSON:', cred.constraints, error);
                // If parsing fails, ignore constraints
                constraints = undefined;
              }
            } else {
              constraints = cred.constraints;
            }
          }
          
          return {
            type: cred.type,
            format: cred.format,
            schema: cred.schema,
            issuer: cred.issuer,
            purpose: cred.purpose,
            essential: cred.essential,
            constraints,
          };
        }),
        challenge,
        domain: data.domain,
        nonce,
        max_responses: data.maxResponses || undefined,
        expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        valid_from: data.validFrom ? new Date(data.validFrom).toISOString() : undefined,
        valid_until: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
        verification_options: data.verificationOptions,
        metadata: data.metadata,
      };

      console.log('Request data to send:', requestData); // Debug log

      try {
        const result = await presentationRequestService.createRequest(requestData);
        console.log('Result from API:', result); // Debug log
        setCreatedRequest(result);
        setShowResult(true);
        toast.success('Presentation request created successfully!');
        onSuccess?.(result);
      } catch (apiError: any) {
        console.error('API Error details:', {
          error: apiError,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          headers: apiError.response?.headers,
          config: apiError.config
        });
        
        // Re-throw to be caught by outer catch
        throw apiError;
      }
    } catch (error: any) {
      console.error('Failed to create presentation request:', error);
      
      // Extract specific error message
      let errorMessage = 'Failed to create presentation request';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Permission denied. You do not have access to create presentation requests.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid request data. Please check your inputs.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    // Get current form values without waiting for validation
    const currentValues = getValues();
    console.log('Manual submit with values:', currentValues);
    
    // Call onSubmit directly with current values
    await onSubmit(currentValues);
  };

  const addCredentialRequirement = () => {
    append({ type: '', format: 'ldp_vc', essential: false });
  };

  const removeCredentialRequirement = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const generateRandomChallenge = () => {
    setValue('challenge', crypto.randomUUID());
    trigger('challenge');
  };

  const generateRandomNonce = () => {
    setValue('nonce', crypto.randomUUID());
    trigger('nonce');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const commonCredentialTypes = [
    'VerifiableCredential',
    'IdentityCredential',
    'EducationCredential',
    'EmploymentCredential',
    'DriversLicense',
    'Passport',
    'BankAccount',
    'ProofOfResidence',
    'HealthCredential',
    'AgeVerification',
  ];

  const credentialFormats = [
    { value: 'ldp_vc', label: 'JSON-LD (ldp_vc)' },
    { value: 'jwt_vc', label: 'JWT (jwt_vc)' },
    { value: 'ldp_vp', label: 'JSON-LD VP (ldp_vp)' },
    { value: 'jwt_vp', label: 'JWT VP (jwt_vp)' },
  ];

  // Check authentication before allowing form use
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <Shield className="h-5 w-5" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            You need to be logged in to create presentation requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Please log in to your account to access this feature.
            </p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="flex items-center gap-2"
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResult && createdRequest) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Shield className="h-5 w-5" />
            Presentation Request Created Successfully
          </CardTitle>
          <CardDescription>
            Your presentation request has been created and is now available for sharing
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">Request ID</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={createdRequest.request?.request_id || ''} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdRequest.request?.request_id || '', 'Request ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant="default">{createdRequest.request?.status || 'active'}</Badge>
              </div>
            </div>
          </div>

          {/* Share URL */}
          {createdRequest.share_url && (
            <div className="space-y-2">
              <Label className="font-medium">Share URL</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={createdRequest.share_url} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdRequest.share_url, 'Share URL')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* QR Code URL */}
          {createdRequest.qr_code_url && (
            <div className="space-y-2">
              <Label className="font-medium">QR Code URL</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={createdRequest.qr_code_url} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdRequest.qr_code_url, 'QR Code URL')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowResult(false);
                setCreatedRequest(null);
              }}
              className="flex items-center gap-2"
            >
              Create Another Request
            </Button>
            
            <div className="flex gap-2">
              {createdRequest.share_url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(createdRequest.share_url, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              )}
              
              {onCancel && (
                <Button
                  type="button"
                  variant="default"
                  onClick={onCancel}
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Create Presentation Request
        </CardTitle>
        <CardDescription>
          Create a new request for verifiable presentations from credential holders
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="verifierDid">Verifier DID *</Label>
              {loadingDIDs ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading your DIDs...</span>
                </div>
              ) : availableDIDs.length > 0 ? (
                <div className="space-y-2">
                  <Controller
                    name="verifierDid"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={errors.verifierDid ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select your DID as verifier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDIDs.map((didResponse) => (
                            <SelectItem key={didResponse.did} value={didResponse.did}>
                              <div className="flex flex-col items-start py-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm truncate max-w-[300px]">
                                    {didResponse.did}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {didResponse.method}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={didResponse.status === 'active' ? 'default' : 'secondary'} 
                                    className="text-xs"
                                  >
                                    {didResponse.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Created {new Date(didResponse.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose one of your DIDs to act as the verifier for this request ({availableDIDs.length} DID{availableDIDs.length !== 1 ? 's' : ''} available)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="verifierDid"
                    {...register('verifierDid')}
                    placeholder="did:example:123..."
                    className={errors.verifierDid ? 'border-red-500' : ''}
                  />
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>No available DIDs found.</strong> This could mean:
                    </p>
                    <ul className="text-sm text-yellow-800 mt-2 ml-4 list-disc">
                      <li>You haven't created any DIDs yet</li>
                      <li>Your DIDs are in a different status</li>
                      <li>There was an error loading your DIDs</li>
                    </ul>
                    <div className="mt-2">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-yellow-800 underline"
                        onClick={() => window.open('/auth/did', '_blank')}
                      >
                        Create a new DID
                      </Button>
                      {' or '}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-yellow-800 underline"
                        onClick={() => {
                          setLoadingDIDs(true);
                          // Re-trigger the useEffect by changing a dependency
                          window.location.reload();
                        }}
                      >
                        Refresh DIDs
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {errors.verifierDid && (
                <p className="text-sm text-red-500">{errors.verifierDid.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="verifierName">Verifier Name</Label>
              <Input
                id="verifierName"
                {...register('verifierName')}
                placeholder="Organization name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Identity Verification Request"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              A clear, descriptive title for your verification request
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what credentials you need and why"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Explain to holders why you need these credentials and how they will be used
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              {...register('purpose')}
              placeholder="e.g., Account verification, Age verification"
            />
            <p className="text-xs text-muted-foreground">
              The specific purpose for requesting these credentials
            </p>
          </div>

          {/* Required Credentials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Required Credentials *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCredentialRequirement}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Credential
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Credential Type *</Label>
                      <Controller
                        name={`requiredCredentials.${index}.type`}
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select credential type" />
                            </SelectTrigger>
                            <SelectContent>
                              {commonCredentialTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.requiredCredentials?.[index]?.type && (
                        <p className="text-sm text-red-500">
                          Credential type is required
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Controller
                        name={`requiredCredentials.${index}.format`}
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || 'ldp_vc'} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {credentialFormats.map((format) => (
                                <SelectItem key={format.value} value={format.value}>
                                  {format.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Controller
                          name={`requiredCredentials.${index}.essential`}
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label className="text-sm">Essential</Label>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCredentialRequirement(index)}
                        disabled={fields.length === 1}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* Additional credential fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Schema URL</Label>
                      <Input
                        {...register(`requiredCredentials.${index}.schema`)}
                        placeholder="https://schema.org/EducationalCredential"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Required Issuer DID</Label>
                      <Input
                        {...register(`requiredCredentials.${index}.issuer`)}
                        placeholder="did:example:issuer123"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Purpose</Label>
                    <Input
                      {...register(`requiredCredentials.${index}.purpose`)}
                      placeholder="Why is this credential needed?"
                    />
                  </div>

                  {/* Constraints */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Constraints (JSON) - Optional
                    </Label>
                    <Textarea
                      {...register(`requiredCredentials.${index}.constraints`)}
                      placeholder='Example: {"fields": [{"path": ["$.credentialSubject.age"], "filter": {"type": "number", "minimum": 18}}]}'
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Constraints định nghĩa điều kiện cụ thể cho credential:</strong></p>
                      <ul className="ml-4 list-disc space-y-1">
                        <li><strong>Age verification:</strong> {`{"fields": [{"path": ["$.credentialSubject.age"], "filter": {"type": "number", "minimum": 18}}]}`}</li>
                        <li><strong>Location requirement:</strong> {`{"fields": [{"path": ["$.credentialSubject.country"], "filter": {"type": "string", "const": "VN"}}]}`}</li>
                        <li><strong>Degree level:</strong> {`{"fields": [{"path": ["$.credentialSubject.degree"], "filter": {"type": "string", "enum": ["Bachelor", "Master", "PhD"]}}]}`}</li>
                      </ul>
                      <p className="mt-2"><strong>Có thể bỏ trống</strong> nếu chỉ cần kiểm tra loại credential mà không có điều kiện cụ thể.</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {errors.requiredCredentials && (
              <p className="text-sm text-red-500">
                {errors.requiredCredentials.message}
              </p>
            )}
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
              <Label>Show Advanced Options</Label>
            </div>

            {showAdvanced && (
              <Card className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxResponses" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Max Responses
                    </Label>
                    <Input
                      id="maxResponses"
                      type="number"
                      min="0"
                      {...register('maxResponses', { valueAsNumber: true })}
                      placeholder="Unlimited"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresAt" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expires At
                    </Label>
                    <Controller
                      control={control}
                      name="expiresAt"
                      render={({ field }) => (
                        <DateTimePicker
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Select expiration date and time"
                          error={!!errors.expiresAt}
                        />
                      )}
                    />
                    {errors.expiresAt && (
                      <p className="text-sm text-red-500">{errors.expiresAt.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Valid From</Label>
                    <Controller
                      control={control}
                      name="validFrom"
                      render={({ field }) => (
                        <DateTimePicker
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Select start date and time"
                          error={!!errors.validFrom}
                        />
                      )}
                    />
                    {errors.validFrom && (
                      <p className="text-sm text-red-500">{errors.validFrom.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Controller
                      control={control}
                      name="validUntil"
                      render={({ field }) => (
                        <DateTimePicker
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Select end date and time"
                          error={!!errors.validUntil}
                        />
                      )}
                    />
                    {errors.validUntil && (
                      <p className="text-sm text-red-500">{errors.validUntil.message}</p>
                    )}
                  </div>
                </div>

                {/* Verification Options */}
                <div className="space-y-4">
                  <h4 className="font-medium">Verification Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="challenge" className="flex items-center gap-2">
                        Challenge
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generateRandomChallenge}
                          className="h-6 w-6 p-0"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </Label>
                      <Input
                        id="challenge"
                        {...register('challenge')}
                        placeholder="Random challenge string"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="domain">Domain</Label>
                      <Input
                        id="domain"
                        {...register('domain')}
                        placeholder="example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nonce" className="flex items-center gap-2">
                        Nonce
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generateRandomNonce}
                          className="h-6 w-6 p-0"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </Label>
                      <Input
                        id="nonce"
                        {...register('nonce')}
                        placeholder="Random nonce"
                      />
                    </div>
                  </div>

                  {/* Verification Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Verification Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="verificationOptions.verify_signature"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label>Verify Signature</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Controller
                          name="verificationOptions.verify_expiration"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label>Verify Expiration</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Controller
                          name="verificationOptions.verify_revocation"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label>Verify Revocation</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Controller
                          name="verificationOptions.verify_issuer_trust"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label>Verify Issuer Trust</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Controller
                          name="verificationOptions.verify_schema"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label>Verify Schema</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Debug Panel - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="p-4 bg-muted border-dashed">
              <h4 className="font-medium text-muted-foreground mb-2">Debug Info</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Form Valid: {isValid ? '✅' : '❌'}</p>
                <p>User Authenticated: {isAuthenticated ? '✅' : '❌'}</p>
                <p>User: {user?.email || 'Not logged in'}</p>
                <p>Available DIDs: {availableDIDs.length}</p>
                <p>Selected DID: {watch('verifierDid') || 'None'}</p>
                <p>Title: {watch('title') || 'Empty'}</p>
                <p>Credentials: {watch('requiredCredentials')?.length || 0}</p>
                <p>Credentials Valid: {watch('requiredCredentials')?.every(cred => cred.type) ? '✅' : '❌'}</p>
                {Object.keys(errors).length > 0 && (
                  <div>
                    <p className="text-destructive">Errors ({Object.keys(errors).length}):</p>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="text-xs text-destructive space-y-1">
                        {Object.entries(errors).map(([key, error]) => {
                          // Safely extract error message
                          const getMessage = (err: any): string => {
                            if (typeof err === 'string') return err;
                            if (err && typeof err === 'object' && 'message' in err) return err.message;
                            if (Array.isArray(err)) return `Array with ${err.length} errors`;
                            return 'Invalid field';
                          };
                          
                          return (
                            <div key={key}>
                              <strong>{key}:</strong> {getMessage(error)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {!isValid && (
                  <div>
                    <p className="text-amber-600">Form Issues:</p>
                    <ul className="text-xs text-amber-600 ml-4 list-disc">
                      {!watch('verifierDid') && <li>Missing Verifier DID</li>}
                      {!watch('title') && <li>Missing Title</li>}
                      {(!watch('requiredCredentials') || watch('requiredCredentials')?.length === 0) && <li>No credential requirements</li>}
                      {watch('requiredCredentials')?.some(cred => !cred.type) && <li>Some credentials missing type</li>}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const testData = {
                        verifier_did: "did:example:test123",
                        title: "Test Request",
                        required_credentials: [{ type: "VerifiableCredential", essential: false }],
                        verification_options: {
                          verify_signature: true,
                          verify_expiration: true,
                          verify_revocation: true,
                          verify_issuer_trust: true,
                          verify_schema: true,
                        }
                      };
                      console.log('Testing API with data:', testData);
                      const result = await presentationRequestService.createRequest(testData);
                      console.log('Test API result:', result);
                      toast.success('API test successful!');
                    } catch (error) {
                      console.error('API test failed:', error);
                      toast.error('API test failed - check console');
                    }
                  }}
                >
                  Test API
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Current form values:', getValues());
                    console.log('Form errors:', errors);
                    console.log('Is form valid:', isValid);
                  }}
                >
                  Log Form State
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    // Force validation
                    const isFormValid = await trigger();
                    console.log('Manual validation result:', isFormValid);
                    console.log('Current errors after trigger:', errors);
                    toast.info(`Manual validation: ${isFormValid ? 'Valid' : 'Invalid'}`);
                  }}
                >
                  Force Validate
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleManualSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Creating...' : 'Manual Submit'}
                </Button>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  Create Request
                  {!isValid && (
                    <span className="text-xs opacity-70">(Manual validation on submit)</span>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
