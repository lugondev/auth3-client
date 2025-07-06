'use client';

import React, { useState } from 'react';
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
import { Plus, Trash2, Calendar, Clock, Shield, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { presentationRequestService } from '@/services/presentation-request-service';
import type { CreatePresentationRequestDTO, CredentialRequirement } from '@/types/presentation-request';

const credentialRequirementSchema = z.object({
  type: z.string().min(1, 'Credential type is required'),
  format: z.string().optional(),
  constraints: z.object({
    fields: z.array(z.object({
      path: z.array(z.string()),
      filter: z.object({
        type: z.string().optional(),
        pattern: z.string().optional(),
      }).optional(),
    })).optional(),
    limit_disclosure: z.string().optional(),
  }).optional(),
});

const presentationRequestSchema = z.object({
  verifierDid: z.string().min(1, 'Verifier DID is required'),
  verifierName: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  purpose: z.string().optional(),
  requiredCredentials: z.array(credentialRequirementSchema).min(1, 'At least one credential requirement is needed'),
  expiresAt: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  maxResponses: z.number().min(0).optional(),
  verificationOptions: z.object({
    challenge: z.string().optional(),
    domain: z.string().optional(),
    nonce: z.string().optional(),
    purpose: z.string().optional(),
  }).optional(),
});

type FormData = z.infer<typeof presentationRequestSchema>;

interface CreatePresentationRequestProps {
  onSuccess?: (request: any) => void;
  onCancel?: () => void;
}

export function CreatePresentationRequest({ onSuccess, onCancel }: CreatePresentationRequestProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(presentationRequestSchema),
    defaultValues: {
      requiredCredentials: [{ type: '', format: 'ldp_vc' }],
      verificationOptions: {},
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'requiredCredentials',
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Convert form data to API format
      const requestData: CreatePresentationRequestDTO = {
        verifier_did: data.verifierDid,
        verifier_name: data.verifierName,
        title: data.title,
        description: data.description,
        purpose: data.purpose,
        required_credentials: data.requiredCredentials,
        challenge: data.verificationOptions?.challenge,
        domain: data.verificationOptions?.domain,
        nonce: data.verificationOptions?.nonce,
        max_responses: data.maxResponses || undefined,
        expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        valid_from: data.validFrom ? new Date(data.validFrom).toISOString() : undefined,
        valid_until: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
        verification_options: {
          verify_signature: true,
          verify_expiration: true,
          verify_revocation: true,
          verify_issuer_trust: true,
          verify_schema: true,
        },
      };

      const result = await presentationRequestService.createRequest(requestData);
      
      toast.success('Presentation request created successfully!');
      onSuccess?.(result);
    } catch (error: any) {
      console.error('Failed to create presentation request:', error);
      toast.error(error.response?.data?.message || 'Failed to create presentation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCredentialRequirement = () => {
    append({ type: '', format: 'ldp_vc' });
  };

  const removeCredentialRequirement = (index: number) => {
    if (fields.length > 1) {
      remove(index);
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
  ];

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
              <Input
                id="verifierDid"
                {...register('verifierDid')}
                placeholder="did:example:123..."
                className={errors.verifierDid ? 'border-red-500' : ''}
              />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what credentials you need and why"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              {...register('purpose')}
              placeholder="e.g., Account verification, Age verification"
            />
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
                            <SelectItem value="ldp_vc">JSON-LD (ldp_vc)</SelectItem>
                            <SelectItem value="jwt_vc">JWT (jwt_vc)</SelectItem>
                            <SelectItem value="ldp_vp">JSON-LD VP (ldp_vp)</SelectItem>
                            <SelectItem value="jwt_vp">JWT VP (jwt_vp)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="flex items-end">
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
                      <Label htmlFor="challenge">Challenge</Label>
                      <Input
                        id="challenge"
                        {...register('verificationOptions.challenge')}
                        placeholder="Random challenge string"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="domain">Domain</Label>
                      <Input
                        id="domain"
                        {...register('verificationOptions.domain')}
                        placeholder="example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nonce">Nonce</Label>
                      <Input
                        id="nonce"
                        {...register('verificationOptions.nonce')}
                        placeholder="Random nonce"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verificationPurpose">Verification Purpose</Label>
                      <Input
                        id="verificationPurpose"
                        {...register('verificationOptions.purpose')}
                        placeholder="authentication"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

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
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
