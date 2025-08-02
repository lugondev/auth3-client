'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { TenantProfile, CreateTenantProfileRequest } from '@/types/tenant-profile';

const profileSchema = z.object({
  display_name: z.string().max(255).optional(),
  description: z.string().optional(),
  logo_url: z.string().url().max(500).optional().or(z.literal('')),
  website: z.string().url().max(255).optional().or(z.literal('')),
  contact_email: z.string().email().max(255).optional().or(z.literal('')),
  contact_phone: z.string().max(50).optional(),
  address: z.string().optional(),
  industry: z.string().max(100).optional(),
  company_size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  founded_year: z.number().min(1800).max(2100).optional(),
  tax_id: z.string().max(50).optional(),
  business_license: z.string().max(100).optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface TenantProfileFormProps {
  profile?: TenantProfile | null;
  onSubmit: (data: CreateTenantProfileRequest) => Promise<void>;
  onCancel: () => void;
}

export function TenantProfileForm({ profile, onSubmit, onCancel }: TenantProfileFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      description: profile?.description || '',
      logo_url: profile?.logo_url || '',
      website: profile?.website || '',
      contact_email: profile?.contact_email || '',
      contact_phone: profile?.contact_phone || '',
      address: profile?.address || '',
      industry: profile?.industry || '',
      company_size: profile?.company_size || undefined,
      founded_year: profile?.founded_year || undefined,
      tax_id: profile?.tax_id || '',
      business_license: profile?.business_license || '',
      linkedin: profile?.social_links?.linkedin || '',
      twitter: profile?.social_links?.twitter || '',
      facebook: profile?.social_links?.facebook || '',
      github: profile?.social_links?.github || '',
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      
      // Build social links object
      const socialLinks: { [key: string]: string } = {};
      if (data.linkedin) socialLinks.linkedin = data.linkedin;
      if (data.twitter) socialLinks.twitter = data.twitter;
      if (data.facebook) socialLinks.facebook = data.facebook;
      if (data.github) socialLinks.github = data.github;

      const cleanedData: CreateTenantProfileRequest = {
        display_name: data.display_name || undefined,
        description: data.description || undefined,
        logo_url: data.logo_url || undefined,
        website: data.website || undefined,
        contact_email: data.contact_email || undefined,
        contact_phone: data.contact_phone || undefined,
        address: data.address || undefined,
        industry: data.industry || undefined,
        company_size: data.company_size || undefined,
        founded_year: data.founded_year || undefined,
        tax_id: data.tax_id || undefined,
        business_license: data.business_license || undefined,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      };

      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Organization Name</Label>
              <Input
                id="display_name"
                {...form.register('display_name')}
                placeholder="Enter organization name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                {...form.register('industry')}
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Tell us about your organization"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                {...form.register('logo_url')}
                placeholder="https://example.com/logo.png"
                type="url"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...form.register('website')}
                placeholder="https://example.com"
                type="url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="company_size">Company Size</Label>
              <Select
                value={form.watch('company_size') || ''}
                onValueChange={(value) => form.setValue('company_size', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                  <SelectItem value="small">Small (11-50 employees)</SelectItem>
                  <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                  <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="founded_year">Founded Year</Label>
              <Input
                id="founded_year"
                {...form.register('founded_year', { valueAsNumber: true })}
                placeholder="e.g., 2020"
                type="number"
                min="1800"
                max="2100"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input
                id="tax_id"
                {...form.register('tax_id')}
                placeholder="Tax identification number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_license">Business License</Label>
              <Input
                id="business_license"
                {...form.register('business_license')}
                placeholder="Business license number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...form.register('address')}
              placeholder="Full business address"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                {...form.register('contact_email')}
                placeholder="contact@example.com"
                type="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                {...form.register('contact_phone')}
                placeholder="+1 (555) 123-4567"
                type="tel"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                {...form.register('linkedin')}
                placeholder="https://linkedin.com/company/..."
                type="url"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                {...form.register('twitter')}
                placeholder="https://twitter.com/..."
                type="url"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                {...form.register('facebook')}
                placeholder="https://facebook.com/..."
                type="url"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                {...form.register('github')}
                placeholder="https://github.com/..."
                type="url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {profile ? 'Update Profile' : 'Create Profile'}
        </Button>
      </div>
    </form>
  );
}
