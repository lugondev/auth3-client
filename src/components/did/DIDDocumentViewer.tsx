'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';
import { DIDDocument, VerificationMethod, ServiceEndpoint } from '@/types/did';
import { useState } from 'react';
import { toast } from 'sonner';

interface DIDDocumentViewerProps {
  document: DIDDocument;
  title?: string;
  showRawJson?: boolean;
  allowCopy?: boolean;
  allowDownload?: boolean;
}

/**
 * DIDDocumentViewer component displays formatted DID document
 * with structured view and raw JSON options
 */
export function DIDDocumentViewer({ 
  document: didDocument, 
  title = "DID Document", 
  showRawJson = true,
  allowCopy = true,
  allowDownload = true 
}: DIDDocumentViewerProps) {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [activeTab, setActiveTab] = useState('structured');

  // Copy document to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(didDocument, null, 2));
      toast.success('DID document copied to clipboard');
    } catch {
      toast.error('Failed to copy DID document');
    }
  };

  // Download document as JSON file
  const handleDownload = () => {
    try {
      const blob = new Blob([JSON.stringify(didDocument, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `did-document-${didDocument.id.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('DID document downloaded');
    } catch {
      toast.error('Failed to download DID document');
    }
  };

  // Render verification method
  const renderVerificationMethod = (vm: VerificationMethod, index: number) => (
    <Card key={vm.id || index} className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{vm.id}</CardTitle>
          <Badge variant="outline">{vm.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="text-sm">
          <span className="text-muted-foreground">Controller: </span>
          <span className="font-mono text-xs break-all">{vm.controller}</span>
        </div>
        
        {vm.publicKeyJwk && (
          <div className="text-sm">
            <span className="text-muted-foreground">Public Key (JWK): </span>
            <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
              {showSensitiveData ? (
                <pre>{JSON.stringify(vm.publicKeyJwk, null, 2)}</pre>
              ) : (
                <span className="text-muted-foreground">••• Hidden (click eye icon to show)</span>
              )}
            </div>
          </div>
        )}
        
        {vm.publicKeyMultibase && (
          <div className="text-sm">
            <span className="text-muted-foreground">Public Key (Multibase): </span>
            <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
              {showSensitiveData ? vm.publicKeyMultibase : '••• Hidden'}
            </div>
          </div>
        )}
        
        {vm.blockchainAccountId && (
          <div className="text-sm">
            <span className="text-muted-foreground">Blockchain Account: </span>
            <span className="font-mono text-xs">{vm.blockchainAccountId}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render service endpoint
  const renderServiceEndpoint = (service: ServiceEndpoint, index: number) => (
    <Card key={service.id || index} className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{service.id}</CardTitle>
          <Badge variant="outline">{service.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm">
          <span className="text-muted-foreground">Endpoint: </span>
          <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
            {typeof service.serviceEndpoint === 'string' 
              ? service.serviceEndpoint 
              : JSON.stringify(service.serviceEndpoint, null, 2)
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render reference array (for authentication, assertionMethod, etc.)
  const renderReferenceArray = (refs: (string | VerificationMethod)[] | undefined, title: string) => {
    if (!refs || refs.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="space-y-1">
          {refs.map((ref, index) => (
            <div key={index} className="text-xs font-mono bg-muted p-2 rounded break-all">
              {typeof ref === 'string' ? ref : ref.id}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="font-mono text-xs mt-1 break-all">
              {didDocument.id}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSensitiveData(!showSensitiveData)}
            >
              {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            {allowCopy && (
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {allowDownload && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="structured">Structured View</TabsTrigger>
            {showRawJson && <TabsTrigger value="raw">Raw JSON</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="structured" className="space-y-4 mt-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Context: </span>
                  <div className="mt-1">
                    {didDocument['@context'].map((ctx, index) => (
                      <Badge key={index} variant="outline" className="mr-1 mb-1 text-xs">
                        {ctx}
                      </Badge>
                    ))}
                  </div>
                </div>
                {didDocument.controller && (
                  <div>
                    <span className="text-muted-foreground">Controllers: </span>
                    <div className="mt-1">
                      {didDocument.controller.map((controller, index) => (
                        <div key={index} className="font-mono text-xs break-all bg-muted p-1 rounded mb-1">
                          {controller}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Verification Methods */}
            {didDocument.verificationMethod && didDocument.verificationMethod.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Verification Methods ({didDocument.verificationMethod.length})</h3>
                {didDocument.verificationMethod.map((vm, index) => renderVerificationMethod(vm, index))}
              </div>
            )}

            {/* Authentication Methods */}
            {renderReferenceArray(didDocument.authentication, 'Authentication Methods')}
            
            {/* Assertion Methods */}
            {renderReferenceArray(didDocument.assertionMethod, 'Assertion Methods')}
            
            {/* Key Agreement */}
            {renderReferenceArray(didDocument.keyAgreement, 'Key Agreement')}
            
            {/* Capability Invocation */}
            {renderReferenceArray(didDocument.capabilityInvocation, 'Capability Invocation')}
            
            {/* Capability Delegation */}
            {renderReferenceArray(didDocument.capabilityDelegation, 'Capability Delegation')}

            {/* Service Endpoints */}
            {didDocument.service && didDocument.service.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h3 className="font-semibold">Service Endpoints ({didDocument.service.length})</h3>
                {didDocument.service.map((service, index) => renderServiceEndpoint(service, index))}
              </div>
            )}

            {/* Also Known As */}
            {didDocument.alsoKnownAs && didDocument.alsoKnownAs.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <h3 className="font-semibold">Also Known As</h3>
                <div className="space-y-1">
                  {didDocument.alsoKnownAs.map((alias, index) => (
                    <div key={index} className="text-xs font-mono bg-muted p-2 rounded break-all">
                      {alias}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          {showRawJson && (
            <TabsContent value="raw" className="mt-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(didDocument, null, 2)}
                </pre>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}