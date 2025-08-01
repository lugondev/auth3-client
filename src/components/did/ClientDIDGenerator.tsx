/**
 * Client-side DID Generation Component
 * Allows users to generate DIDs locally without server interaction
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Copy, Download, Eye, EyeOff, Key, Globe, Users, RefreshCw, Shield } from 'lucide-react'
import { useDIDGeneration, useKeyManagement, downloadAsFile, copyToClipboard, formatKeyPairForDisplay } from '@/hooks/use-did-generation'
import { type KeyType, type DIDMethod } from '@/lib/did-generation'
import { toast } from 'sonner'

interface ClientDIDGeneratorProps {
  onGenerated?: (result: any) => void
  className?: string
}

export function ClientDIDGenerator({ onGenerated, className }: ClientDIDGeneratorProps) {
  const { generateNewDID, isGenerating, error: generationError, result, reset } = useDIDGeneration()
  const { exportKey, isExporting } = useKeyManagement()
  
  const [options, setOptions] = useState({
    method: 'did:key' as DIDMethod,
    keyType: 'Ed25519' as KeyType,
    domain: '',
    path: '',
    serviceEndpoint: ''
  })
  
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  // Handle client-side DID generation
  const handleGenerate = async () => {
    try {
      reset()
      const generatedResult = await generateNewDID(options.method, {
        keyType: options.keyType,
        domain: options.domain || undefined,
        path: options.path || undefined,
        serviceEndpoint: options.serviceEndpoint || undefined
      })
      
      toast.success('DID generated successfully!')
      onGenerated?.(generatedResult)
    } catch (error) {
      toast.error('Failed to generate DID')
    }
  }

  // Copy functions
  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      toast.success(`${label} copied to clipboard`)
    } else {
      toast.error('Failed to copy to clipboard')
    }
  }

  // Download functions
  const handleDownloadDID = () => {
    if (!result) return
    const content = JSON.stringify(result.didDocument, null, 2)
    downloadAsFile(content, `${result.did.replace(/:/g, '_')}.json`, 'application/json')
    toast.success('DID document downloaded')
  }

  const handleDownloadPrivateKey = async () => {
    if (!result) return
    try {
      const privateKeyPem = await exportKey(result.keyPair.privateKey, 'pem')
      downloadAsFile(privateKeyPem, `${result.did.replace(/:/g, '_')}_private_key.pem`)
      toast.success('Private key downloaded')
    } catch (error) {
      toast.error('Failed to export private key')
    }
  }

  const displayKeyPair = result ? formatKeyPairForDisplay(result.keyPair) : null

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Client-side DID Generation
          </CardTitle>
          <CardDescription>
            Generate a DID directly in your browser using cryptographic libraries. Private keys never leave your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-method">DID Method</Label>
              <Select
                value={options.method}
                onValueChange={(value: DIDMethod) => 
                  setOptions(prev => ({ ...prev, method: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select DID method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="did:key">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      did:key
                      <Badge variant="secondary">Recommended</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="did:web">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      did:web
                    </div>
                  </SelectItem>
                  <SelectItem value="did:peer">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      did:peer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-keytype">Key Type</Label>
              <Select
                value={options.keyType}
                onValueChange={(value: KeyType) => 
                  setOptions(prev => ({ ...prev, keyType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select key type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ed25519">
                    Ed25519
                    <Badge variant="secondary" className="ml-2">Recommended</Badge>
                  </SelectItem>
                  <SelectItem value="secp256k1">secp256k1</SelectItem>
                  <SelectItem value="P-256">P-256</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {options.method === 'did:web' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={options.domain}
                  onChange={(e) => setOptions(prev => ({ ...prev, domain: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="path">Path (optional)</Label>
                <Input
                  id="path"
                  placeholder="users/alice"
                  value={options.path}
                  onChange={(e) => setOptions(prev => ({ ...prev, path: e.target.value }))}
                />
              </div>
            </div>
          )}

          {options.method === 'did:peer' && (
            <div className="space-y-2">
              <Label htmlFor="service-endpoint">Service Endpoint (optional)</Label>
              <Input
                id="service-endpoint"
                placeholder="https://example.com/didcomm"
                value={options.serviceEndpoint}
                onChange={(e) => setOptions(prev => ({ ...prev, serviceEndpoint: e.target.value }))}
              />
            </div>
          )}

          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || (options.method === 'did:web' && !options.domain)}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Generate DID
              </>
            )}
          </Button>

          {generationError && (
            <Alert variant="destructive">
              <AlertDescription>{generationError}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-6 pt-6">
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Generated DID</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(result.did, 'DID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadDID}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>DID Identifier</Label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {result.did}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Verification Method</Label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {result.verificationMethod}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Private Key</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(displayKeyPair?.privateKey.hex || '', 'Private key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPrivateKey}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {showPrivateKey ? displayKeyPair?.privateKey.hex : displayKeyPair?.privateKey.truncated}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Public Key (Multibase)</Label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {result.keyPair.publicKeyMultibase}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>DID Document</Label>
                  <Textarea
                    value={JSON.stringify(result.didDocument, null, 2)}
                    readOnly
                    className="font-mono text-sm h-32"
                  />
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Notice:</strong> Your private key is generated locally and never sent to our servers. 
                    Make sure to save it securely before leaving this page.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
