'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { TenantProfile } from '@/types/tenant-profile';

interface VerificationStatusProps {
  profile: TenantProfile;
  onRequestVerification: () => Promise<void>;
  detailed?: boolean;
}

export function VerificationStatus({ profile, onRequestVerification, detailed = false }: VerificationStatusProps) {
  const getVerificationStatus = () => {
    if (profile.is_verified && profile.is_trusted) {
      return {
        status: 'Verified & Trusted',
        variant: 'default' as const,
        icon: Icons.shield,
        color: 'text-green-600',
        description: 'Your organization is fully verified and trusted.'
      };
    }
    
    if (profile.is_verified) {
      return {
        status: 'Verified',
        variant: 'secondary' as const,
        icon: Icons.check,
        color: 'text-blue-600',
        description: 'Your organization has been officially verified.'
      };
    }
    
    return {
      status: 'Unverified',
      variant: 'outline' as const,
      icon: Icons.x,
      color: 'text-orange-600',
      description: 'Your organization is not yet verified. Request verification to increase trust.'
    };
  };

  const verificationInfo = getVerificationStatus();

  if (!detailed) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <verificationInfo.icon className={`h-4 w-4 ${verificationInfo.color}`} />
            <span className="text-sm font-medium">Verification Status</span>
          </div>
          <Badge variant={verificationInfo.variant}>
            {verificationInfo.status}
          </Badge>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {verificationInfo.description}
        </p>
        
        {!profile.is_verified && (
          <Button size="sm" onClick={onRequestVerification} className="w-full">
            <Icons.shield className="mr-2 h-4 w-4" />
            Request Verification
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <verificationInfo.icon className={`h-5 w-5 ${verificationInfo.color}`} />
          Verification Status
        </CardTitle>
        <CardDescription>
          Verification helps establish trust and credibility for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 ${
            profile.is_verified ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
          }`}>
            <verificationInfo.icon className={`h-8 w-8 ${verificationInfo.color}`} />
          </div>
          
          <div className="space-y-2">
            <Badge variant={verificationInfo.variant} className="text-base px-4 py-1">
              {verificationInfo.status}
            </Badge>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {verificationInfo.description}
            </p>
          </div>

          {profile.verification_date && (
            <p className="text-xs text-muted-foreground">
              Verified on {new Date(profile.verification_date).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icons.check className={`h-4 w-4 ${profile.is_verified ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">Organization Verified</span>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Official verification of your organization's legitimacy and identity.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icons.shield className={`h-4 w-4 ${profile.is_trusted ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">Trusted Status</span>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Enhanced trust level based on verification and platform activity.
            </p>
          </div>
        </div>

        {!profile.is_verified && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h5 className="font-semibold text-sm mb-2">Verification Requirements:</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete business profile information</li>
                <li>• Valid business registration documents</li>
                <li>• Proof of address and contact information</li>
                <li>• Identity verification of key personnel</li>
                <li>• Additional industry-specific documentation if applicable</li>
              </ul>
            </div>
            
            <Button onClick={onRequestVerification} className="w-full">
              <Icons.shield className="mr-2 h-4 w-4" />
              Request Verification
            </Button>
          </div>
        )}

        {profile.is_verified && !profile.is_trusted && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h5 className="font-semibold text-sm text-blue-900 mb-2">
              Eligible for Trusted Status
            </h5>
            <p className="text-sm text-blue-700">
              Your organization is verified and may be eligible for trusted status. 
              This is typically granted based on platform activity, compliance history, 
              and community engagement.
            </p>
          </div>
        )}

        {profile.is_verified && profile.is_trusted && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h5 className="font-semibold text-sm text-green-900 mb-2">
              🎉 Congratulations!
            </h5>
            <p className="text-sm text-green-700">
              Your organization has achieved the highest level of verification and trust. 
              This provides maximum credibility and access to premium platform features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
