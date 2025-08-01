'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { RefreshCw, User, Shield, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import didService from '@/services/didService';
import { credentialService } from '@/services/credentialService';
import type { DIDResponse } from '@/types/did';
import type { VerifiableCredential } from '@/services/credentialService';

interface DIDCredentialSelectorProps {
  onDIDSelected?: (did: string) => void;
  onCredentialsSelected?: (credentials: VerifiableCredential[]) => void;
  selectedDID?: string;
  selectedCredentials?: string[];
}

export function DIDCredentialSelector({
  onDIDSelected,
  onCredentialsSelected,
  selectedDID,
  selectedCredentials = []
}: DIDCredentialSelectorProps) {
  const [availableDIDs, setAvailableDIDs] = useState<DIDResponse[]>([]);
  const [loadingDIDs, setLoadingDIDs] = useState(false);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCredIds, setSelectedCredIds] = useState<string[]>(selectedCredentials);

  // Load user's DIDs
  useEffect(() => {
    loadDIDs();
  }, []);

  // Load credentials when DID changes
  useEffect(() => {
    if (selectedDID) {
      loadCredentials(selectedDID);
    } else {
      setCredentials([]);
    }
  }, [selectedDID]);

  const loadDIDs = async () => {
    try {
      setLoadingDIDs(true);
      const result = await didService.listDIDs({ limit: 100 });
      
      // Filter active DIDs
      const userDIDs = result.dids?.filter(didResponse => {
        const status = didResponse?.status;
        return status === 'active' || status === 'created' || status === 'confirmed' || status === 'published';
      }) || [];
      
      setAvailableDIDs(userDIDs);
      
      // Auto-select first DID if none selected
      if (!selectedDID && userDIDs.length === 1) {
        onDIDSelected?.(userDIDs[0].did);
      }
    } catch (error) {
      console.error('Failed to load DIDs:', error);
      toast.error('Failed to load your DIDs');
    } finally {
      setLoadingDIDs(false);
    }
  };

  const loadCredentials = async (did: string) => {
    try {
      setLoadingCredentials(true);
      
      // Load credentials for the selected DID using listCredentials
      const result = await credentialService.listCredentials({
        recipientDID: did,
        limit: 100,
        page: 1
      });
      
      // Filter credentials to only show those where subjectDID matches the selected DID
      const filteredCredentials = (result.credentials || []).filter(credential => {
        const subjectDID = (credential as any).subjectDID;
        // Match exact DID or check if credential subject ID matches the DID
        return subjectDID === did || credential.credentialSubject?.id === did;
      });
      
      console.log(`📋 Loaded ${result.credentials?.length || 0} total credentials, filtered to ${filteredCredentials.length} matching subject DID: ${did}`);
      
      setCredentials(filteredCredentials);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      toast.error('Failed to load credentials for selected DID');
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleDIDChange = (did: string) => {
    onDIDSelected?.(did);
    setSelectedCredIds([]); // Reset selected credentials when DID changes
  };

  const handleCredentialToggle = (credId: string, credential: VerifiableCredential) => {
    const newSelected = selectedCredIds.includes(credId)
      ? selectedCredIds.filter(id => id !== credId)
      : [...selectedCredIds, credId];
    
    setSelectedCredIds(newSelected);
    
    // Get the actual credential objects for the selected IDs
    const selectedCredentials = credentials.filter(cred => 
      newSelected.includes(cred.id || '')
    );
    
    onCredentialsSelected?.(selectedCredentials);
  };

  const filteredCredentials = credentials.filter(credential => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const issuerStr = typeof credential.issuer === 'string' 
        ? credential.issuer 
        : credential.issuer?.id || '';
      const matchesSearch = 
        credential.type?.some((type: string) => type.toLowerCase().includes(searchLower)) ||
        issuerStr.toLowerCase().includes(searchLower) ||
        JSON.stringify(credential.credentialSubject).toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filterType !== 'all') {
      const hasType = credential.type?.some((type: string) =>
        type.toLowerCase().includes(filterType.toLowerCase())
      );
      if (!hasType) return false;
    }
    
    return true;
  });  const getCredentialTypes = () => {
    const types = new Set<string>();
    credentials.forEach(cred => {
      cred.type?.forEach((type: string) => {
        if (type !== 'VerifiableCredential') {
          types.add(type);
        }
      });
    });
    return Array.from(types);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'revoked':
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* DID Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Your DID
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDIDs ? (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading your DIDs...</span>
            </div>
          ) : availableDIDs.length > 0 ? (
            <div className="space-y-2">
              <Select value={selectedDID} onValueChange={handleDIDChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your DID" />
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
              <p className="text-xs text-muted-foreground">
                Select a DID to view its associated credentials ({availableDIDs.length} DID{availableDIDs.length !== 1 ? 's' : ''} available)
              </p>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No DIDs found. Please create a DID first to view credentials.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credentials Selection */}
      {selectedDID && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Available Credentials
                {credentials.length > 0 && (
                  <Badge variant="secondary">{credentials.length}</Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            {showFilters && (
              <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search credentials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Type Filter</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {getCredentialTypes().map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {loadingCredentials ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading credentials...</span>
              </div>
            ) : filteredCredentials.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Select credentials to include in the presentation request:
                  </p>
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded">
                    {filteredCredentials.length} credential{filteredCredentials.length !== 1 ? 's' : ''} for this DID
                  </div>
                </div>
                
                {/* Filter info */}
                <div className="p-2 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Showing only credentials where Subject DID matches selected DID</span>
                  </div>
                </div>
                
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredCredentials.map((credential) => {
                      const credId = credential.id || '';
                      const isSelected = selectedCredIds.includes(credId);
                      const issuerStr = typeof credential.issuer === 'string' 
                        ? credential.issuer 
                        : credential.issuer?.id || 'Unknown';
                      const credentialStatus = credential.credentialStatus?.status || 'unknown';
                      
                      return (
                        <div
                          key={credId}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:bg-muted/50'
                          }`}
                          onClick={() => handleCredentialToggle(credId, credential)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => {}} // Controlled by parent click
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-sm truncate">
                                  {credential.type?.filter((t: string) => t !== 'VerifiableCredential').join(', ') || 'Unknown Type'}
                                </h4>
                                <Badge 
                                  className={`text-xs ${getStatusColor(credentialStatus)}`}
                                >
                                  {credentialStatus}
                                </Badge>
                              </div>

                              {/* Credential ID */}
                              <div className="mb-2 p-2 bg-muted/30 rounded border">
                                <div className="text-xs text-muted-foreground">
                                  <strong>ID:</strong>
                                  <div className="font-mono text-xs mt-1 break-all">{credId}</div>
                                </div>
                              </div>

                              {/* Subject DID */}
                              {(credential as any).subjectDID && (
                                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                  <div className="text-xs text-blue-700 dark:text-blue-300">
                                    <strong>Subject DID:</strong>
                                    <div className="font-mono text-xs mt-1 break-all">{(credential as any).subjectDID}</div>
                                  </div>
                                </div>
                              )}

                              {/* Subject ID (if different from subjectDID) */}
                              {credential.credentialSubject?.id && 
                               credential.credentialSubject.id !== (credential as any).subjectDID && (
                                <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200 dark:border-purple-800">
                                  <div className="text-xs text-purple-700 dark:text-purple-300">
                                    <strong>Subject ID:</strong>
                                    <div className="font-mono text-xs mt-1 break-all">{String(credential.credentialSubject.id)}</div>
                                  </div>
                                </div>
                              )}

                              <p className="text-xs text-muted-foreground mb-2">
                                Issuer: {issuerStr}
                              </p>
                              {credential.credentialSubject && (
                                <div className="text-xs text-muted-foreground">
                                  Subject: {JSON.stringify(credential.credentialSubject).substring(0, 100)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                {selectedCredIds.length > 0 && (
                  <div className="mt-3 p-3 bg-primary/10 rounded-md">
                    <p className="text-sm font-medium text-primary">
                      {selectedCredIds.length} credential{selectedCredIds.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== 'all' 
                    ? 'No credentials match your filters'
                    : 'No credentials found where Subject DID matches this DID'
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search filters'
                    : 'This DID may not be the subject of any issued credentials'
                  }
                </p>
                {(searchTerm || filterType !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                    }}
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
