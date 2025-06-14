'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Globe, ExternalLink, Copy, Settings } from 'lucide-react';
import { ServiceEndpoint } from '@/types/did';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

interface DIDServiceEndpointsProps {
  serviceEndpoints: ServiceEndpoint[];
  onAdd?: (service: Omit<ServiceEndpoint, 'id'>) => void;
  onEdit?: (id: string, service: Partial<ServiceEndpoint>) => void;
  onDelete?: (id: string) => void;
  readonly?: boolean;
  allowedTypes?: string[];
}

// Form schema for service endpoint
const serviceEndpointSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  serviceEndpoint: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
  routingKeys: z.string().optional(),
  accept: z.string().optional(),
});

type ServiceEndpointFormData = z.infer<typeof serviceEndpointSchema>;

/**
 * DIDServiceEndpoints component manages service endpoints
 * with add, edit, and delete functionality
 */
export function DIDServiceEndpoints({
  serviceEndpoints,
  onAdd,
  onEdit,
  onDelete,
  readonly = false,
  allowedTypes = [
    'DIDCommMessaging',
    'CredentialRepository',
    'LinkedDomains',
    'DIDConfiguration',
    'VerifiableCredentialService',
    'OpenIdConnectVersion1.0Service',
    'DecentralizedWebNode',
    'MessagingService',
    'SocialWebInboxService',
    'IdentityHub'
  ]
}: DIDServiceEndpointsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceEndpoint | null>(null);

  const form = useForm<ServiceEndpointFormData>({
    resolver: zodResolver(serviceEndpointSchema),
    defaultValues: {
      type: '',
      serviceEndpoint: '',
      description: '',
      routingKeys: '',
      accept: '',
    },
  });

  // Copy to clipboard
  const copyToClipboard = async (content: string | object | string[], label: string) => {
    try {
      const text = typeof content === 'string' ? content : 
                   Array.isArray(content) ? content.join(', ') : 
                   JSON.stringify(content, null, 2);
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  // Open service endpoint in new tab
  const openServiceEndpoint = (endpoint: string | object) => {
    const url = typeof endpoint === 'string' ? endpoint : JSON.stringify(endpoint);
    if (typeof endpoint === 'string' && (endpoint.startsWith('http://') || endpoint.startsWith('https://'))) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Invalid URL format');
    }
  };

  // Handle form submission
  const onSubmit = (data: ServiceEndpointFormData) => {
    try {
      const service: Omit<ServiceEndpoint, 'id'> = {
        type: data.type,
        serviceEndpoint: data.serviceEndpoint,
      };

      // Add optional fields
      if (data.description) {
        service.description = data.description;
      }

      if (data.routingKeys) {
        try {
          service.routingKeys = data.routingKeys.split(',').map(key => key.trim()).filter(Boolean);
        } catch {
          toast.error('Invalid routing keys format');
          return;
        }
      }

      if (data.accept) {
        try {
          service.accept = data.accept.split(',').map(type => type.trim()).filter(Boolean);
        } catch {
          toast.error('Invalid accept types format');
          return;
        }
      }

      if (editingService) {
        onEdit?.(editingService.id, service);
        setEditingService(null);
      } else {
        onAdd?.(service);
      }

      form.reset();
      setIsAddDialogOpen(false);
      toast.success(editingService ? 'Service endpoint updated' : 'Service endpoint added');
    } catch {
      toast.error('Failed to save service endpoint');
    }
  };

  // Start editing a service
  const startEdit = (service: ServiceEndpoint) => {
    setEditingService(service);
    form.reset({
      type: service.type,
      serviceEndpoint: typeof service.serviceEndpoint === 'string' ? service.serviceEndpoint : JSON.stringify(service.serviceEndpoint),
      description: service.description || '',
      routingKeys: service.routingKeys?.join(', ') || '',
      accept: service.accept?.join(', ') || '',
    });
    setIsAddDialogOpen(true);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingService(null);
    form.reset();
    setIsAddDialogOpen(false);
  };

  // Get service type icon and color
  const getServiceTypeInfo = (type: string) => {
    const typeMap: Record<string, { icon: string; color: string; description: string }> = {
      'DIDCommMessaging': { icon: '💬', color: 'bg-blue-100 text-blue-800', description: 'DIDComm messaging endpoint' },
      'CredentialRepository': { icon: '🏛️', color: 'bg-green-100 text-green-800', description: 'Credential storage service' },
      'LinkedDomains': { icon: '🔗', color: 'bg-purple-100 text-purple-800', description: 'Domain verification service' },
      'DIDConfiguration': { icon: '⚙️', color: 'bg-gray-100 text-gray-800', description: 'DID configuration service' },
      'VerifiableCredentialService': { icon: '📜', color: 'bg-yellow-100 text-yellow-800', description: 'VC issuance/verification' },
      'OpenIdConnectVersion1.0Service': { icon: '🔐', color: 'bg-red-100 text-red-800', description: 'OpenID Connect service' },
      'DecentralizedWebNode': { icon: '🌐', color: 'bg-indigo-100 text-indigo-800', description: 'Decentralized web node' },
      'MessagingService': { icon: '📨', color: 'bg-pink-100 text-pink-800', description: 'General messaging service' },
      'SocialWebInboxService': { icon: '📥', color: 'bg-teal-100 text-teal-800', description: 'Social web inbox' },
      'IdentityHub': { icon: '🏠', color: 'bg-orange-100 text-orange-800', description: 'Identity hub service' },
    };

    return typeMap[type] || { icon: '🔧', color: 'bg-gray-100 text-gray-800', description: 'Custom service' };
  };

  // Render service endpoint card
  const renderServiceEndpoint = (service: ServiceEndpoint) => {
    const typeInfo = getServiceTypeInfo(service.type);

    return (
      <Card key={service.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {service.id}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={typeInfo.color}>
                  <span className="mr-1">{typeInfo.icon}</span>
                  {service.type}
                </Badge>
              </div>
              {service.description && (
                <CardDescription className="text-sm">
                  {service.description}
                </CardDescription>
              )}
            </div>
            {!readonly && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openServiceEndpoint(service.serviceEndpoint)}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(service)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(service.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Service Endpoint URL */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Service Endpoint</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(service.serviceEndpoint, 'Service endpoint')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openServiceEndpoint(service.serviceEndpoint)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="p-2 bg-muted rounded text-xs font-mono break-all">
              {typeof service.serviceEndpoint === 'string' ? service.serviceEndpoint : JSON.stringify(service.serviceEndpoint, null, 2)}
            </div>
          </div>

          {/* Routing Keys */}
          {service.routingKeys && service.routingKeys.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Routing Keys</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(service.routingKeys!.join(', '), 'Routing keys')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {service.routingKeys.map((key, index) => (
                  <Badge key={index} variant="outline" className="text-xs font-mono">
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Accept Types */}
          {service.accept && service.accept.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Accept Types</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(service.accept!.join(', '), 'Accept types')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {service.accept.map((type, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Service Type Description */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            {typeInfo.description}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Endpoints
          </h3>
          <p className="text-sm text-muted-foreground">
            Services and endpoints associated with this DID
          </p>
        </div>
        {!readonly && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingService(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Edit Service Endpoint' : 'Add Service Endpoint'}
                </DialogTitle>
                <DialogDescription>
                  {editingService 
                    ? 'Update the service endpoint details'
                    : 'Add a new service endpoint to your DID document'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allowedTypes.map((type) => {
                              const typeInfo = getServiceTypeInfo(type);
                              return (
                                <SelectItem key={type} value={type}>
                                  <div className="flex items-center gap-2">
                                    <span>{typeInfo.icon}</span>
                                    <span>{type}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of service being provided
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceEndpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Endpoint URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/service" {...field} />
                        </FormControl>
                        <FormDescription>
                          The URL where the service can be accessed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of the service..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description of what this service provides
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Advanced Configuration (Optional)</h4>
                    
                    <FormField
                      control={form.control}
                      name="routingKeys"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Routing Keys</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="key1, key2, key3"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of routing keys for DIDComm messaging
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accept"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accept Types</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="didcomm/v2, didcomm/aip2;env=rfc587"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of accepted message types or protocols
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingService ? 'Update' : 'Add'} Service
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Service Endpoints List */}
      {serviceEndpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Service Endpoints</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add service endpoints to enable interactions with external services.
            </p>
            {!readonly && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Service
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {serviceEndpoints.map(renderServiceEndpoint)}
        </div>
      )}

      {/* Summary */}
      {serviceEndpoints.length > 0 && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
          <p className="font-medium mb-1">Summary:</p>
          <ul className="space-y-1">
            <li>• Total service endpoints: {serviceEndpoints.length}</li>
            <li>• Service types: {new Set(serviceEndpoints.map(s => s.type)).size} unique</li>
            <li>• With routing keys: {serviceEndpoints.filter(s => s.routingKeys?.length).length}</li>
            <li>• With accept types: {serviceEndpoints.filter(s => s.accept?.length).length}</li>
          </ul>
        </div>
      )}
    </div>
  );
}