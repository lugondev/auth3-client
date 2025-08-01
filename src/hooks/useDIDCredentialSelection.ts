'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import didService from '@/services/didService';
import { credentialService } from '@/services/credentialService';
import type { DIDResponse } from '@/types/did';
import type { VerifiableCredential } from '@/services/credentialService';

export interface UseDIDCredentialSelectionProps {
  autoSelectFirstDID?: boolean;
  onDIDChange?: (did: string) => void;
  onCredentialsChange?: (credentials: VerifiableCredential[]) => void;
}

export function useDIDCredentialSelection({
  autoSelectFirstDID = true,
  onDIDChange,
  onCredentialsChange
}: UseDIDCredentialSelectionProps = {}) {
  const [availableDIDs, setAvailableDIDs] = useState<DIDResponse[]>([]);
  const [selectedDID, setSelectedDID] = useState<string>('');
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [selectedCredentials, setSelectedCredentials] = useState<VerifiableCredential[]>([]);
  const [loadingDIDs, setLoadingDIDs] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

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
      setSelectedCredentials([]);
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
      
      // Auto-select first DID if enabled and none selected
      if (autoSelectFirstDID && !selectedDID && userDIDs.length === 1) {
        handleDIDChange(userDIDs[0].did);
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
      
      // Load credentials for the selected DID
      const result = await credentialService.listCredentials({
        recipientDID: did,
        limit: 100,
        page: 1
      });
      
      // Filter credentials to only show those where subjectDID matches the selected DID
      const filteredCredentials = (result.credentials || []).filter(credential => {
        const subjectDID = (credential as any).subjectDID;
        const subjectId = credential.credentialSubject?.id;
        
        // Match exact DID - credential should belong to the selected DID as subject
        return subjectDID === did || 
               (typeof subjectId === 'string' && subjectId === did);
      });
      
      console.log(`🔍 Loaded ${result.credentials?.length || 0} total credentials, filtered to ${filteredCredentials.length} for subject DID: ${did}`);
      
      setCredentials(filteredCredentials);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      toast.error('Failed to load credentials for selected DID');
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleDIDChange = (did: string) => {
    setSelectedDID(did);
    setSelectedCredentials([]); // Reset selected credentials when DID changes
    onDIDChange?.(did);
  };

  const handleCredentialsChange = (newCredentials: VerifiableCredential[]) => {
    setSelectedCredentials(newCredentials);
    onCredentialsChange?.(newCredentials);
  };

  const refreshDIDs = () => {
    loadDIDs();
  };

  const refreshCredentials = () => {
    if (selectedDID) {
      loadCredentials(selectedDID);
    }
  };

  return {
    // State
    availableDIDs,
    selectedDID,
    credentials,
    selectedCredentials,
    loadingDIDs,
    loadingCredentials,
    
    // Actions
    handleDIDChange,
    handleCredentialsChange,
    refreshDIDs,
    refreshCredentials,
    
    // Computed values
    hasCredentials: credentials.length > 0,
    hasSelectedCredentials: selectedCredentials.length > 0,
    credentialCount: credentials.length,
    selectedCredentialCount: selectedCredentials.length,
  };
}
