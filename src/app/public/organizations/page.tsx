'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { TenantProfilePublic, PublicProfilesListResponse } from '@/types/tenant-profile';
import { tenantProfileApi } from '@/services/tenant-profile';
import Link from 'next/link';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Media',
  'Real Estate',
  'Transportation',
  'Other'
];

export default function PublicProfilesPage() {
  const [profiles, setProfiles] = useState<TenantProfilePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0
  });

  useEffect(() => {
    loadProfiles();
  }, [selectedIndustry, verifiedOnly, trustedOnly, pagination.offset]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await tenantProfileApi.listPublicProfiles({
        limit: pagination.limit,
        offset: pagination.offset,
        industry: selectedIndustry || undefined,
        verified_only: verifiedOnly,
        trusted_only: trustedOnly,
      }) as PublicProfilesListResponse;

      setProfiles(response.profiles);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      toast.error('Failed to load profiles');
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadProfiles();
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const filteredProfiles = profiles.filter(profile =>
    !searchTerm || 
    profile.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization Directory</h1>
          <p className="text-muted-foreground">
            Browse verified organizations and their public profiles
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All industries</SelectItem>
                  {INDUSTRIES.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verification</label>
              <div className="flex gap-2">
                <Button
                  variant={verifiedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                >
                  <Icons.check className="mr-1 h-3 w-3" />
                  Verified
                </Button>
                <Button
                  variant={trustedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTrustedOnly(!trustedOnly)}
                >
                  <Icons.shield className="mr-1 h-3 w-3" />
                  Trusted
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button onClick={handleSearch} className="w-full">
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${filteredProfiles.length} of ${pagination.total} organizations`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => (
              <Card key={profile.tenant_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {profile.logo_url && (
                        <img
                          src={profile.logo_url}
                          alt="Logo"
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          {profile.display_name || 'Unnamed Organization'}
                        </CardTitle>
                        {profile.industry && (
                          <p className="text-sm text-muted-foreground">
                            {profile.industry}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
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
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {profile.description && (
                    <CardDescription className="line-clamp-2">
                      {profile.description}
                    </CardDescription>
                  )}

                  <div className="space-y-2">
                    {profile.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Icons.globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}

                    {profile.company_size && (
                      <div className="flex items-center gap-2 text-sm">
                        <Icons.users className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.company_size} employees</span>
                      </div>
                    )}

                    {profile.founded_year && (
                      <div className="flex items-center gap-2 text-sm">
                        <Icons.calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Founded {profile.founded_year}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {profile.is_verified && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Icons.check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {profile.is_trusted && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          <Icons.shield className="w-3 h-3 mr-1" />
                          Trusted
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {profile.social_links?.linkedin && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={profile.social_links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Icons.linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {profile.social_links?.twitter && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={profile.social_links.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Icons.twitter className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {profile.social_links?.github && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={profile.social_links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Icons.github className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.total > pagination.limit && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={pagination.offset === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
              {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.offset + pagination.limit)}
              disabled={pagination.offset + pagination.limit >= pagination.total}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
