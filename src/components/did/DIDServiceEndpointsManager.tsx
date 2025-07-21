'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ExternalLink, Globe, MessageSquare, Key } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import type { 
  ServiceEndpointResponse,
  ServiceEndpointsListResponse,
  AddServiceEndpointRequest,
  UpdateServiceEndpointRequest,
  ServiceEndpointFormData
} from '@/types/did';

import didService from '@/services/didService';

interface DIDServiceEndpointsManagerProps {
  did: string;
  readonly?: boolean;
  onUpdate?: () => void;
  className?: string;
}

export const DIDServiceEndpointsManager: React.FC<DIDServiceEndpointsManagerProps> = ({
  did,
  readonly = false,
  onUpdate,
  className = ''
}) => {
  const [endpoints, setEndpoints] = useState<ServiceEndpointResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<ServiceEndpointResponse | null>(null);
  const [formData, setFormData] = useState<ServiceEndpointFormData>({
    id: '',
    type: '',
    serviceEndpoint: '',
    description: '',
    routingKeys: [],
    accept: [],
    priority: 0,
    properties: {}
  });

  // Load service endpoints
  const loadEndpoints = useCallback(async () => {
    try {
      setLoading(true);
      const response = await didService.getServiceEndpoints(did);
      setEndpoints(response.services);
    } catch (error) {
      console.error('Failed to load service endpoints:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service endpoints',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [did]);

  useEffect(() => {
    if (did) {
      loadEndpoints();
    }
  }, [did, loadEndpoints]);

  // Form handlers
  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      type: '',
      serviceEndpoint: '',
      description: '',
      routingKeys: [],
      accept: [],
      priority: 0,
      properties: {}
    });
    setEditingEndpoint(null);
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((endpoint: ServiceEndpointResponse) => {
    setFormData({
      id: endpoint.id.includes('#') ? endpoint.id.split('#')[1] : endpoint.id,
      type: endpoint.type,
      serviceEndpoint: typeof endpoint.serviceEndpoint === 'string' ? endpoint.serviceEndpoint : JSON.stringify(endpoint.serviceEndpoint),
      description: endpoint.description || '',
      routingKeys: endpoint.routingKeys || [],
      accept: endpoint.accept || [],
      priority: endpoint.priority || 0,
      properties: endpoint.properties ? 
        Object.fromEntries(Object.entries(endpoint.properties).map(([k, v]) => [k, String(v)])) : 
        {}
    });
    setEditingEndpoint(endpoint);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.id || !formData.type || !formData.serviceEndpoint) {
      toast({
        title: 'Validation Error',
        description: 'ID, Type, and Service Endpoint are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingEndpoint) {
        // Update existing endpoint
        const updateRequest: UpdateServiceEndpointRequest = {
          type: formData.type,
          serviceEndpoint: formData.serviceEndpoint,
          description: formData.description,
          routingKeys: formData.routingKeys,
          accept: formData.accept,
          priority: formData.priority,
          properties: formData.properties
        };

        await didService.updateServiceEndpoint(did, formData.id, updateRequest);
        
        toast({
          title: 'Success',
          description: 'Service endpoint updated successfully'
        });
      } else {
        // Add new endpoint
        const addRequest: AddServiceEndpointRequest = {
          id: formData.id,
          type: formData.type,
          serviceEndpoint: formData.serviceEndpoint,
          description: formData.description,
          routingKeys: formData.routingKeys,
          accept: formData.accept,
          priority: formData.priority,
          properties: formData.properties
        };

        await didService.addServiceEndpoint(did, addRequest);
        
        toast({
          title: 'Success',
          description: 'Service endpoint added successfully'
        });
      }

      setDialogOpen(false);
      resetForm();
      await loadEndpoints();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to save service endpoint:', error);
      toast({
        title: 'Error',
        description: 'Failed to save service endpoint',
        variant: 'destructive'
      });
    }
  }, [did, formData, editingEndpoint, loadEndpoints, onUpdate, resetForm]);

  const handleDelete = useCallback(async (endpoint: ServiceEndpointResponse) => {
    try {
      const serviceId = endpoint.id.includes('#') ? endpoint.id.split('#')[1] : endpoint.id;
      await didService.removeServiceEndpoint(did, serviceId);
      
      toast({
        title: 'Success',
        description: 'Service endpoint removed successfully'
      });

      await loadEndpoints();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to remove service endpoint:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove service endpoint',
        variant: 'destructive'
      });
    }
  }, [did, loadEndpoints, onUpdate]);

  // Service type icons
  const getServiceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'didcommv1':
      case 'didcommv2':
        return <MessageSquare className="h-4 w-4" />;
      case 'linkeddomains':
        return <Globe className="h-4 w-4" />;
      case 'credentialregistry':
        return <Key className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading service endpoints...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Service Endpoints</h3>
          <p className="text-sm text-muted-foreground">
            Manage service endpoints for discoverability and communication
          </p>
        </div>
        {!readonly && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Endpoint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEndpoint ? 'Edit Service Endpoint' : 'Add Service Endpoint'}
                </DialogTitle>
                <DialogDescription>
                  Configure a service endpoint for your DID document
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id">ID</Label>
                    <Input
                      id="id"
                      value={formData.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="e.g., did-communication"
                      disabled={!!editingEndpoint}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIDCommV1">DIDComm V1</SelectItem>
                        <SelectItem value="DIDCommV2">DIDComm V2</SelectItem>
                        <SelectItem value="LinkedDomains">Linked Domains</SelectItem>
                        <SelectItem value="CredentialRegistry">Credential Registry</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="serviceEndpoint">Service Endpoint</Label>
                  <Input
                    id="serviceEndpoint"
                    value={formData.serviceEndpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceEndpoint: e.target.value }))}
                    placeholder="https://example.com/didcomm"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description of this service endpoint"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="routingKeys">Routing Keys (comma-separated)</Label>
                    <Input
                      id="routingKeys"
                      value={formData.routingKeys.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        routingKeys: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                      }))}
                      placeholder="key1, key2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accept">Accept Types (comma-separated)</Label>
                    <Input
                      id="accept"
                      value={formData.accept.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        accept: e.target.value.split(',').map(a => a.trim()).filter(a => a) 
                      }))}
                      placeholder="application/json, application/ld+json"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingEndpoint ? 'Update' : 'Add'} Endpoint
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Endpoints List */}
      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No service endpoints configured</p>
            {!readonly && (
              <p className="text-sm text-muted-foreground mt-1">
                Add service endpoints to enable discoverability and communication
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getServiceIcon(endpoint.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{endpoint.id}</h4>
                        <Badge variant="outline">{endpoint.type}</Badge>
                        {endpoint.priority && endpoint.priority > 0 && (
                          <Badge variant="secondary">Priority {endpoint.priority}</Badge>
                        )}
                      </div>
                      
                      <div className="mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {typeof endpoint.serviceEndpoint === 'string' 
                            ? endpoint.serviceEndpoint 
                            : JSON.stringify(endpoint.serviceEndpoint)
                          }
                        </code>
                      </div>

                      {endpoint.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {endpoint.description}
                        </p>
                      )}

                      {(endpoint.routingKeys && endpoint.routingKeys.length > 0) && (
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">Routing Keys: </span>
                          {endpoint.routingKeys.map((key, index) => (
                            <Badge key={index} variant="outline" className="mr-1 text-xs">
                              {key}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {(endpoint.accept && endpoint.accept.length > 0) && (
                        <div className="mt-1">
                          <span className="text-xs text-muted-foreground">Accept: </span>
                          {endpoint.accept.map((type, index) => (
                            <Badge key={index} variant="outline" className="mr-1 text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {!readonly && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(endpoint)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(endpoint)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DIDServiceEndpointsManager;
