'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { TenantProfilePublic } from '@/types/tenant-profile';
import { tenantProfileApi } from '@/services/tenant-profile';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function OrganizationDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;
  
  const [profile, setProfile] = useState<TenantProfilePublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      loadProfile();
    }
  }, [tenantId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await tenantProfileApi.getPublicProfile(tenantId);
      setProfile(response);
    } catch (error: any) {
      if (error.response?.status === 404) {
        notFound();
      } else {
        toast.error('Failed to load organization profile');
        console.error('Error loading profile:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/public/organizations">
              ← Back to Directory
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt="Organization Logo"
                  className="h-20 w-20 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center border">
                  <Icons.building className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {profile.display_name || 'Unnamed Organization'}
                  </CardTitle>
                  {profile.industry && (
                    <p className="text-lg text-muted-foreground mt-1">
                      {profile.industry}
                    </p>
                  )}
                  {profile.description && (
                    <CardDescription className="mt-2 max-w-2xl">
                      {profile.description}
                    </CardDescription>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  {profile.is_verified && (
                    <Badge variant="secondary" className="justify-center">
                      <Icons.check className="mr-1 h-4 w-4" />
                      Verified Organization
                    </Badge>
                  )}
                  {profile.is_trusted && (
                    <Badge variant="default" className="justify-center">
                      <Icons.shield className="mr-1 h-4 w-4" />
                      Trusted Partner
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.shield className="h-5 w-5" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {profile.is_verified && (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                    <Icons.check className="w-4 h-4 mr-2" />
                    Verified Organization
                  </Badge>
                )}
                {profile.is_trusted && (
                  <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
                    <Icons.shield className="w-4 h-4 mr-2" />
                    Trusted Partner
                  </Badge>
                )}
                {!profile.is_verified && !profile.is_trusted && (
                  <Badge variant="outline" className="text-gray-600">
                    Not Verified
                  </Badge>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Verification status is based on:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Profile completeness and accuracy</li>
                  <li>Identity verification and documentation</li>
                  <li>Community feedback and reputation</li>
                  <li>Account age and activity history</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {profile.company_size && (
                  <div className="flex items-center gap-3">
                    <Icons.users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Company Size</p>
                      <p className="text-sm text-muted-foreground">{profile.company_size} employees</p>
                    </div>
                  </div>
                )}

                {profile.founded_year && (
                  <div className="flex items-center gap-3">
                    <Icons.calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Founded</p>
                      <p className="text-sm text-muted-foreground">{profile.founded_year}</p>
                    </div>
                  </div>
                )}

                {profile.industry && (
                  <div className="flex items-center gap-3">
                    <Icons.building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Industry</p>
                      <p className="text-sm text-muted-foreground">{profile.industry}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Services or Features could go here in the future */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.website && (
                <div className="flex items-center gap-3">
                  <Icons.globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}

              {!profile.website && (
                <p className="text-sm text-muted-foreground">
                  No contact information available for public viewing.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Social Links */}
          {profile.social_links && Object.keys(profile.social_links).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.social_links.linkedin && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href={profile.social_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icons.linkedin className="mr-2 h-4 w-4" />
                      LinkedIn
                    </a>
                  </Button>
                )}

                {profile.social_links.twitter && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href={profile.social_links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icons.twitter className="mr-2 h-4 w-4" />
                      Twitter
                    </a>
                  </Button>
                )}

                {profile.social_links.github && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href={profile.social_links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icons.github className="mr-2 h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                )}
                {profile.social_links.facebook && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href={profile.social_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icons.facebook className="mr-2 h-4 w-4" />
                      Facebook
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Profile Verified</span>
                <div className="flex items-center gap-1">
                  {profile.is_verified ? (
                    <>
                      <Icons.check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Yes</span>
                    </>
                  ) : (
                    <>
                      <Icons.x className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">No</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Trusted Partner</span>
                <div className="flex items-center gap-1">
                  {profile.is_trusted ? (
                    <>
                      <Icons.shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">Yes</span>
                    </>
                  ) : (
                    <>
                      <Icons.x className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">No</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
