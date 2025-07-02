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
import { Plus, Edit, Trash2, Key, Shield, Fingerprint, Coins } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import type { 
  VerificationMethodResponse,
  VerificationMethodsListResponse,
  AddVerificationMethodRequest,
  UpdateVerificationMethodRequest,
  VerificationMethodFormData,
  JWK
} from '@/types/did';

import { didService } from '@/services/didService';

interface DIDVerificationMethodsManagerProps {
  did: string;
  readonly?: boolean;
  onUpdate?: () => void;
  className?: string;
}

export const DIDVerificationMethodsManager: React.FC<DIDVerificationMethodsManagerProps> = ({
  did,
  readonly = false,
  onUpdate,
  className = ''
}) => {
  const [methods, setMethods] = useState<VerificationMethodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<VerificationMethodResponse | null>(null);
  const [formData, setFormData] = useState<VerificationMethodFormData>({
    id: '',
    type: '',
    controller: did,
    keyFormat: 'jwk',
    properties: {}
  });

  // Load verification methods
  const loadMethods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await didService.getVerificationMethods(did);
      setMethods(response.verificationMethods);
    } catch (error) {
      console.error('Failed to load verification methods:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification methods',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [did]);

  useEffect(() => {
    if (did) {
      loadMethods();
    }
  }, [did, loadMethods]);

  // Form handlers
  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      type: '',
      controller: did,
      keyFormat: 'jwk',
      properties: {}
    });
    setEditingMethod(null);
  }, [did]);

  const openAddDialog = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((method: VerificationMethodResponse) => {
    let keyFormat: 'jwk' | 'multibase' | 'base58' | 'pem' | 'blockchain' = 'jwk';
    
    if (method.publicKeyMultibase) keyFormat = 'multibase';
    else if (method.publicKeyBase58) keyFormat = 'base58';
    else if (method.publicKeyPem) keyFormat = 'pem';
    else if (method.blockchainAccountId || method.ethereumAddress) keyFormat = 'blockchain';

    setFormData({
      id: method.id.includes('#') ? method.id.split('#')[1] : method.id,
      type: method.type,
      controller: method.controller,
      keyFormat,
      publicKeyJwk: method.publicKeyJwk,
      publicKeyMultibase: method.publicKeyMultibase,
      publicKeyBase58: method.publicKeyBase58,
      publicKeyPem: method.publicKeyPem,
      blockchainAccountId: method.blockchainAccountId,
      ethereumAddress: method.ethereumAddress,
      properties: method.properties ? 
        Object.fromEntries(Object.entries(method.properties).map(([k, v]) => [k, String(v)])) : 
        {}
    });
    setEditingMethod(method);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.id || !formData.type || !formData.controller) {
      toast({
        title: 'Validation Error',
        description: 'ID, Type, and Controller are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingMethod) {
        // Update existing method
        const updateRequest: UpdateVerificationMethodRequest = {
          type: formData.type,
          controller: formData.controller,
          publicKeyJwk: formData.publicKeyJwk,
          publicKeyMultibase: formData.publicKeyMultibase,
          publicKeyBase58: formData.publicKeyBase58,
          publicKeyPem: formData.publicKeyPem,
          blockchainAccountId: formData.blockchainAccountId,
          ethereumAddress: formData.ethereumAddress,
          properties: formData.properties
        };

        await didService.updateVerificationMethod(did, formData.id, updateRequest);
        
        toast({
          title: 'Success',
          description: 'Verification method updated successfully'
        });
      } else {
        // Add new method
        const addRequest: AddVerificationMethodRequest = {
          id: formData.id,
          type: formData.type,
          controller: formData.controller,
          publicKeyJwk: formData.publicKeyJwk,
          publicKeyMultibase: formData.publicKeyMultibase,
          publicKeyBase58: formData.publicKeyBase58,
          publicKeyPem: formData.publicKeyPem,
          blockchainAccountId: formData.blockchainAccountId,
          ethereumAddress: formData.ethereumAddress,
          properties: formData.properties
        };

        await didService.addVerificationMethod(did, addRequest);
        
        toast({
          title: 'Success',
          description: 'Verification method added successfully'
        });
      }

      setDialogOpen(false);
      resetForm();
      await loadMethods();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to save verification method:', error);
      toast({
        title: 'Error',
        description: 'Failed to save verification method',
        variant: 'destructive'
      });
    }
  }, [did, formData, editingMethod, loadMethods, onUpdate, resetForm]);

  const handleDelete = useCallback(async (method: VerificationMethodResponse) => {
    try {
      const methodId = method.id.includes('#') ? method.id.split('#')[1] : method.id;
      await didService.removeVerificationMethod(did, methodId);
      
      toast({
        title: 'Success',
        description: 'Verification method removed successfully'
      });

      await loadMethods();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to remove verification method:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove verification method',
        variant: 'destructive'
      });
    }
  }, [did, loadMethods, onUpdate]);

  // Method type icons
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'Ed25519VerificationKey2020':
      case 'Ed25519VerificationKey2018':
        return <Key className="h-4 w-4" />;
      case 'EcdsaSecp256k1VerificationKey2019':
      case 'EcdsaSecp256k1RecoveryMethod2020':
        return <Shield className="h-4 w-4" />;
      case 'EcdsaSecp256r1VerificationKey2019':
        return <Fingerprint className="h-4 w-4" />;
      case 'EthereumEip712Signature2021':
        return <Coins className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading verification methods...</span>
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
          <h3 className="text-lg font-medium">Verification Methods</h3>
          <p className="text-sm text-muted-foreground">
            Manage cryptographic keys for authentication and digital signatures
          </p>
        </div>
        {!readonly && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Method
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'Edit Verification Method' : 'Add Verification Method'}
                </DialogTitle>
                <DialogDescription>
                  Configure a cryptographic verification method for your DID document
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
                      placeholder="e.g., key-1"
                      disabled={!!editingMethod}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select verification method type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ed25519VerificationKey2020">Ed25519VerificationKey2020</SelectItem>
                        <SelectItem value="Ed25519VerificationKey2018">Ed25519VerificationKey2018</SelectItem>
                        <SelectItem value="EcdsaSecp256k1VerificationKey2019">EcdsaSecp256k1VerificationKey2019</SelectItem>
                        <SelectItem value="EcdsaSecp256k1RecoveryMethod2020">EcdsaSecp256k1RecoveryMethod2020</SelectItem>
                        <SelectItem value="EcdsaSecp256r1VerificationKey2019">EcdsaSecp256r1VerificationKey2019</SelectItem>
                        <SelectItem value="EthereumEip712Signature2021">EthereumEip712Signature2021</SelectItem>
                        <SelectItem value="JsonWebKey2020">JsonWebKey2020</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="controller">Controller</Label>
                  <Input
                    id="controller"
                    value={formData.controller}
                    onChange={(e) => setFormData(prev => ({ ...prev, controller: e.target.value }))}
                    placeholder="DID that controls this verification method"
                  />
                </div>

                <div>
                  <Label>Key Format</Label>
                  <Select value={formData.keyFormat} onValueChange={(value: any) => setFormData(prev => ({ ...prev, keyFormat: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jwk">JSON Web Key (JWK)</SelectItem>
                      <SelectItem value="multibase">Multibase</SelectItem>
                      <SelectItem value="base58">Base58</SelectItem>
                      <SelectItem value="pem">PEM</SelectItem>
                      <SelectItem value="blockchain">Blockchain Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Key material inputs based on format */}
                {formData.keyFormat === 'jwk' && (
                  <div>
                    <Label htmlFor="publicKeyJwk">Public Key JWK (JSON)</Label>
                    <Textarea
                      id="publicKeyJwk"
                      value={formData.publicKeyJwk ? JSON.stringify(formData.publicKeyJwk, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const jwk = JSON.parse(e.target.value);
                          setFormData(prev => ({ ...prev, publicKeyJwk: jwk }));
                        } catch {
                          // Invalid JSON, keep typing
                        }
                      }}
                      placeholder='{"kty": "OKP", "crv": "Ed25519", "x": "..."}'
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {formData.keyFormat === 'multibase' && (
                  <div>
                    <Label htmlFor="publicKeyMultibase">Public Key Multibase</Label>
                    <Input
                      id="publicKeyMultibase"
                      value={formData.publicKeyMultibase || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, publicKeyMultibase: e.target.value }))}
                      placeholder="z6Mk..."
                      className="font-mono"
                    />
                  </div>
                )}

                {formData.keyFormat === 'base58' && (
                  <div>
                    <Label htmlFor="publicKeyBase58">Public Key Base58</Label>
                    <Input
                      id="publicKeyBase58"
                      value={formData.publicKeyBase58 || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, publicKeyBase58: e.target.value }))}
                      placeholder="H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
                      className="font-mono"
                    />
                  </div>
                )}

                {formData.keyFormat === 'pem' && (
                  <div>
                    <Label htmlFor="publicKeyPem">Public Key PEM</Label>
                    <Textarea
                      id="publicKeyPem"
                      value={formData.publicKeyPem || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, publicKeyPem: e.target.value }))}
                      placeholder="-----BEGIN PUBLIC KEY-----..."
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {formData.keyFormat === 'blockchain' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="blockchainAccountId">Blockchain Account ID</Label>
                      <Input
                        id="blockchainAccountId"
                        value={formData.blockchainAccountId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, blockchainAccountId: e.target.value }))}
                        placeholder="eip155:1:0x..."
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ethereumAddress">Ethereum Address</Label>
                      <Input
                        id="ethereumAddress"
                        value={formData.ethereumAddress || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, ethereumAddress: e.target.value }))}
                        placeholder="0x..."
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingMethod ? 'Update' : 'Add'} Method
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Methods List */}
      {methods.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No verification methods configured</p>
            {!readonly && (
              <p className="text-sm text-muted-foreground mt-1">
                Add verification methods to enable digital signatures and authentication
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {methods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getMethodIcon(method.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{method.id}</h4>
                        <Badge variant="outline">{method.type}</Badge>
                      </div>
                      
                      <div className="mt-1">
                        <span className="text-sm text-muted-foreground">Controller: </span>
                        <code className="text-sm bg-muted px-1 py-0.5 rounded font-mono">
                          {method.controller}
                        </code>
                      </div>

                      {/* Key material display */}
                      <div className="mt-2 space-y-1">
                        {method.publicKeyJwk && (
                          <div>
                            <span className="text-xs text-muted-foreground">JWK: </span>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                              {JSON.stringify(method.publicKeyJwk).substring(0, 50)}...
                            </code>
                          </div>
                        )}
                        
                        {method.publicKeyMultibase && (
                          <div>
                            <span className="text-xs text-muted-foreground">Multibase: </span>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                              {method.publicKeyMultibase.substring(0, 30)}...
                            </code>
                          </div>
                        )}

                        {method.publicKeyBase58 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Base58: </span>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                              {method.publicKeyBase58.substring(0, 30)}...
                            </code>
                          </div>
                        )}

                        {method.blockchainAccountId && (
                          <div>
                            <span className="text-xs text-muted-foreground">Blockchain: </span>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                              {method.blockchainAccountId}
                            </code>
                          </div>
                        )}

                        {method.ethereumAddress && (
                          <div>
                            <span className="text-xs text-muted-foreground">Ethereum: </span>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                              {method.ethereumAddress}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {!readonly && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(method)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method)}
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

export default DIDVerificationMethodsManager;
