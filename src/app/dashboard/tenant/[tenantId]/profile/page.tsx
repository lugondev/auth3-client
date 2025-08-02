'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { TenantProfile } from '@/types/tenant-profile';
import { tenantProfileApi } from '@/services/tenant-profile';
import { TenantProfileForm } from './components/tenant-profile-form';

export default function TenantProfilePage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [tenantId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await tenantProfileApi.getProfile(tenantId) as TenantProfile;
      setProfile(data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Profile doesn't exist yet
        setProfile(null);
      } else {
        toast.error('Failed to load profile');
        console.error('Error loading profile:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (data: any) => {
    try {
      const newProfile = await tenantProfileApi.createProfile(tenantId, data) as TenantProfile;
      setProfile(newProfile);
      setEditing(false);
      toast.success('Profile created successfully');
    } catch (error) {
      toast.error('Failed to create profile');
      console.error('Error creating profile:', error);
    }
  };

  const handleUpdateProfile = async (data: any) => {
    try {
      const updatedProfile = await tenantProfileApi.updateProfile(tenantId, data) as TenantProfile;
      setProfile(updatedProfile);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  const handleRequestVerification = async () => {
    try {
      await tenantProfileApi.requestVerification(tenantId);
      toast.success('Verification requested successfully');
      loadProfile();
    } catch (error) {
      toast.error('Failed to request verification');
      console.error('Error requesting verification:', error);
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    
    try {
      await tenantProfileApi.deleteProfile(tenantId);
      setProfile(null);
      toast.success('Profile deleted successfully');
    } catch (error) {
      toast.error('Failed to delete profile');
      console.error('Error deleting profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile && !editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tenant Profile</h1>
            <p className="text-muted-foreground">
              Create a business profile to showcase your organization
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Profile Found</CardTitle>
            <CardDescription>
              This tenant doesn't have a profile yet. Create one to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setEditing(true)}>
              <Icons.plus className="mr-2 h-4 w-4" />
              Create Profile
            </Button>
          </CardContent>
        </Card>

        {editing && (
          <TenantProfileForm
            onSubmit={handleCreateProfile}
            onCancel={() => setEditing(false)}
          />
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {profile ? 'Edit Profile' : 'Create Profile'}
            </h1>
            <p className="text-muted-foreground">
              {profile ? 'Update your business information' : 'Create a business profile'}
            </p>
          </div>
        </div>

        <TenantProfileForm
          profile={profile}
          onSubmit={profile ? handleUpdateProfile : handleCreateProfile}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenant Profile</h1>
          <p className="text-muted-foreground">
            Manage your business profile and verification status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Icons.pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button variant="destructive" onClick={handleDeleteProfile}>
            <Icons.trash className="mr-2 h-4 w-4" />
            Delete Profile
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="trust">Trust Score</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {profile && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {profile.logo_url && (
                        <img 
                          src={profile.logo_url} 
                          alt="Logo" 
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      {profile.display_name || 'Unnamed Organization'}
                      <div className="flex gap-1">
                        {profile.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Icons.check className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                        {profile.is_trusted && (
                          <Badge variant="default" className="text-xs">
                            <Icons.shield className="mr-1 h-3 w-3" />
                            Trusted
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {profile.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.website && (
                      <div className="flex items-center gap-2">
                        <Icons.globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                    
                    {profile.contact_email && (
                      <div className="flex items-center gap-2">
                        <Icons.mail className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${profile.contact_email}`}
                          className="text-primary hover:underline"
                        >
                          {profile.contact_email}
                        </a>
                      </div>
                    )}

                    {profile.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Icons.phone className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.contact_phone}</span>
                      </div>
                    )}

                    {profile.industry && (
                      <div className="flex items-center gap-2">
                        <Icons.building className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.industry}</span>
                      </div>
                    )}

                    {profile.company_size && (
                      <div className="flex items-center gap-2">
                        <Icons.users className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.company_size} employees</span>
                      </div>
                    )}

                    {profile.founded_year && (
                      <div className="flex items-center gap-2">
                        <Icons.calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Founded in {profile.founded_year}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trust & Verification</CardTitle>
                    <CardDescription>
                      Your organization's trust metrics and verification status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.is_verified && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Icons.check className="w-4 h-4 mr-1" />
                          Verified Organization
                        </Badge>
                      )}
                      {profile.is_trusted && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          <Icons.shield className="w-4 h-4 mr-1" />
                          Trusted Partner
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.social_links.linkedin && (
                        <Button variant="outline" size="sm" asChild>
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
                        <Button variant="outline" size="sm" asChild>
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
                        <Button variant="outline" size="sm" asChild>
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
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="verification">
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Organization verification and trust status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {profile.is_verified ? (
                        <Icons.check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Icons.x className="w-5 h-5 text-red-600" />
                      )}
                      <span className={profile.is_verified ? "text-green-600" : "text-red-600"}>
                        {profile.is_verified ? "Verified" : "Not Verified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.is_trusted ? (
                        <Icons.shield className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Icons.x className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={profile.is_trusted ? "text-blue-600" : "text-gray-400"}>
                        {profile.is_trusted ? "Trusted Partner" : "Not Trusted"}
                      </span>
                    </div>
                  </div>
                  {profile.verification_date && (
                    <p className="text-sm text-gray-600">
                      Verified on {new Date(profile.verification_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trust">
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle>Trust & Credibility</CardTitle>
                <CardDescription>Organization trust indicators and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Icons.shield className="w-5 h-5 text-blue-600" />
                      <span>Trusted Status: </span>
                      <Badge variant={profile.is_trusted ? "default" : "secondary"}>
                        {profile.is_trusted ? "Trusted" : "Standard"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icons.check className="w-5 h-5 text-green-600" />
                      <span>Verification: </span>
                      <Badge variant={profile.is_verified ? "default" : "secondary"}>
                        {profile.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
