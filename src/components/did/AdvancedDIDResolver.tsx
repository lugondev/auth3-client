'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Clock, 
  Globe, 
  Zap, 
  Database, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  History,
  GitCompare,
  Settings,
  Download,
  Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import type { 
  DIDDocument,
  UniversalResolutionResponse,
  ResolutionOptions,
  DIDResolutionHistory,
  DIDResolutionComparison,
  DIDDocumentDifference
} from '@/types/did';

import { didService } from '@/services/didService';
import { DIDDocumentPreview } from './DIDDocumentPreview';

interface AdvancedDIDResolverProps {
  initialDid?: string;
  onResolved?: (result: UniversalResolutionResponse) => void;
  className?: string;
}

export const AdvancedDIDResolver: React.FC<AdvancedDIDResolverProps> = ({
  initialDid = '',
  onResolved,
  className = ''
}) => {
  // Core state
  const [did, setDid] = useState(initialDid);
  const [result, setResult] = useState<UniversalResolutionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('resolver');

  // Resolution options
  const [options, setOptions] = useState<ResolutionOptions>({
    accept: 'application/did+ld+json',
    noCache: false,
    versionId: '',
    versionTime: ''
  });

  // History and comparison
  const [history, setHistory] = useState<DIDResolutionHistory[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [baselineResult, setBaselineResult] = useState<UniversalResolutionResponse | null>(null);
  const [comparison, setComparison] = useState<DIDResolutionComparison | null>(null);

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customResolver, setCustomResolver] = useState('');
  const [timeout, setTimeout] = useState(5000);
  const [retries, setRetries] = useState(3);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('did-resolution-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load resolution history:', error);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: DIDResolutionHistory[]) => {
    localStorage.setItem('did-resolution-history', JSON.stringify(newHistory));
    setHistory(newHistory);
  }, []);

  // Resolution function
  const resolveDID = useCallback(async () => {
    if (!did.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a DID to resolve',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      const resolverOptions = { ...options };
      
      // Clean up empty values
      if (!resolverOptions.versionId) delete resolverOptions.versionId;
      if (!resolverOptions.versionTime) delete resolverOptions.versionTime;

      const response = await didService.resolveUniversalDID(did.trim(), resolverOptions);
      const duration = Date.now() - startTime;

      setResult(response);
      onResolved?.(response);

      // Add to history
      const historyEntry: DIDResolutionHistory = {
        did: did.trim(),
        timestamp: new Date().toISOString(),
        result: response,
        options: resolverOptions,
        duration,
        status: response.resolutionResult === 'success' ? 'success' : 'error'
      };

      const newHistory = [historyEntry, ...history.slice(0, 19)]; // Keep last 20
      saveHistory(newHistory);

      toast({
        title: 'Success',
        description: `DID resolved in ${duration}ms`
      });
    } catch (err: any) {
      setError(err.message || 'Resolution failed');
      toast({
        title: 'Resolution Failed',
        description: err.message || 'Failed to resolve DID',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [did, options, history, saveHistory, onResolved]);

  // Comparison functions
  const setAsBaseline = useCallback(() => {
    if (result) {
      setBaselineResult(result);
      setComparisonMode(true);
      toast({
        title: 'Baseline Set',
        description: 'Current result set as comparison baseline'
      });
    }
  }, [result]);

  const compareWithBaseline = useCallback(() => {
    if (!baselineResult || !result) return;

    const differences = generateDifferences(baselineResult.didDocument, result.didDocument);
    
    const comparisonResult: DIDResolutionComparison = {
      did: did,
      baseline: baselineResult,
      current: result,
      differences,
      comparedAt: new Date().toISOString()
    };

    setComparison(comparisonResult);
    setActiveTab('comparison');
  }, [baselineResult, result, did]);

  // Load from history
  const loadFromHistory = useCallback((entry: DIDResolutionHistory) => {
    setDid(entry.did);
    setOptions(entry.options || {});
    setResult(entry.result);
  }, []);

  // Quick DID examples
  const quickDids = [
    'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    'did:web:example.com',
    'did:ethr:0x1234567890123456789012345678901234567890'
  ];

  const handleQuickResolve = useCallback((quickDid: string) => {
    setDid(quickDid);
    // Auto-resolve after setting
    const timer = globalThis.setTimeout(() => {
      if (quickDid) {
        resolveDID();
      }
    }, 100);
    
    // Clean up timer if component unmounts
    return () => globalThis.clearTimeout(timer);
  }, [resolveDID]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Advanced DID Resolution Interface
          </CardTitle>
          <CardDescription>
            Resolve DIDs with enhanced metadata, caching controls, and comparison tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* DID Input */}
          <div className="space-y-2">
            <Label htmlFor="did-input">DID to Resolve</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="did-input"
                  value={did}
                  onChange={(e) => setDid(e.target.value)}
                  placeholder="did:key:z6Mk..."
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      resolveDID();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={resolveDID} 
                disabled={loading || !did.trim()}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Resolve
              </Button>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="space-y-2">
            <Label>Quick Examples</Label>
            <div className="flex flex-wrap gap-2">
              {quickDids.map((quickDid, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickResolve(quickDid)}
                  className="font-mono text-xs"
                >
                  {quickDid.substring(0, 30)}...
                </Button>
              ))}
            </div>
          </div>

          {/* Resolution Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Resolution Options</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accept">Accept Format</Label>
                <Select 
                  value={options.accept} 
                  onValueChange={(value) => setOptions(prev => ({ ...prev, accept: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application/did+ld+json">DID+LD+JSON</SelectItem>
                    <SelectItem value="application/did+json">DID+JSON</SelectItem>
                    <SelectItem value="application/ld+json">LD+JSON</SelectItem>
                    <SelectItem value="application/json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="no-cache"
                  checked={options.noCache}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, noCache: checked }))}
                />
                <Label htmlFor="no-cache">Bypass Cache</Label>
              </div>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded">
                <div>
                  <Label htmlFor="version-id">Version ID</Label>
                  <Input
                    id="version-id"
                    value={options.versionId || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, versionId: e.target.value }))}
                    placeholder="Specific version identifier"
                  />
                </div>
                <div>
                  <Label htmlFor="version-time">Version Time</Label>
                  <Input
                    id="version-time"
                    type="datetime-local"
                    value={options.versionTime || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, versionTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeout(parseInt(e.target.value) || 5000)}
                    min="1000"
                    max="30000"
                  />
                </div>
                <div>
                  <Label htmlFor="retries">Max Retries</Label>
                  <Input
                    id="retries"
                    type="number"
                    value={retries}
                    onChange={(e) => setRetries(parseInt(e.target.value) || 3)}
                    min="0"
                    max="10"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-6 pt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="resolver" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Resolution
                  </TabsTrigger>
                  <TabsTrigger value="document" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Document
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History
                    {history.length > 0 && (
                      <Badge variant="secondary">{history.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="flex items-center gap-2">
                    <GitCompare className="h-4 w-4" />
                    Compare
                    {comparison && <Badge variant="secondary">Active</Badge>}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                {/* Resolution Tab */}
                <TabsContent value="resolver" className="mt-0 space-y-6">
                  <ResolutionResults 
                    result={result} 
                    onSetBaseline={setAsBaseline}
                    onCompare={compareWithBaseline}
                    canCompare={!!baselineResult}
                  />
                </TabsContent>

                {/* Document Tab */}
                <TabsContent value="document" className="mt-0">
                  {result.didDocument && (
                    <DIDDocumentPreview document={result.didDocument} />
                  )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-0">
                  <ResolutionHistory 
                    history={history} 
                    onLoadEntry={loadFromHistory}
                    onClearHistory={() => saveHistory([])}
                  />
                </TabsContent>

                {/* Comparison Tab */}
                <TabsContent value="comparison" className="mt-0">
                  {comparison ? (
                    <ComparisonView comparison={comparison} />
                  ) : (
                    <div className="text-center py-12">
                      <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Comparison Active</h3>
                      <p className="text-muted-foreground mb-4">
                        Set a baseline result and resolve again to compare documents
                      </p>
                      {result && (
                        <Button onClick={setAsBaseline}>
                          Set Current as Baseline
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Sub-components
interface ResolutionResultsProps {
  result: UniversalResolutionResponse;
  onSetBaseline: () => void;
  onCompare: () => void;
  canCompare: boolean;
}

const ResolutionResults: React.FC<ResolutionResultsProps> = ({
  result,
  onSetBaseline,
  onCompare,
  canCompare
}) => {
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Content copied to clipboard' });
  };

  return (
    <div className="space-y-6">
      {/* Status and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result.resolutionResult === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium capitalize">{result.resolutionResult}</span>
          <Badge variant="outline">{result.resolver}</Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSetBaseline}>
            Set as Baseline
          </Button>
          {canCompare && (
            <Button variant="outline" size="sm" onClick={onCompare}>
              Compare
            </Button>
          )}
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Resolution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono">{result.resolutionTime}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Cache Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Cached:</span>
                <Badge variant={result.cacheInfo.cached ? "default" : "outline"}>
                  {result.cacheInfo.cached ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Hit:</span>
                <Badge variant={result.cacheInfo.cacheHit ? "default" : "outline"}>
                  {result.cacheInfo.cacheHit ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Content Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm">{result.didResolutionMetadata.contentType}</code>
          </CardContent>
        </Card>
      </div>

      {/* Method-specific info */}
      {result.methodSpecificResolution && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Method-Specific Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-3 rounded overflow-auto">
              {JSON.stringify(result.methodSpecificResolution, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Document metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Document Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>
              <div className="font-mono">{result.didDocumentMetadata.created}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>
              <div className="font-mono">{result.didDocumentMetadata.updated}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ResolutionHistoryProps {
  history: DIDResolutionHistory[];
  onLoadEntry: (entry: DIDResolutionHistory) => void;
  onClearHistory: () => void;
}

const ResolutionHistory: React.FC<ResolutionHistoryProps> = ({
  history,
  onLoadEntry,
  onClearHistory
}) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Resolution History</h3>
        <p className="text-muted-foreground">
          Resolve some DIDs to see your history here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Resolution History</h3>
        <Button variant="outline" size="sm" onClick={onClearHistory}>
          Clear History
        </Button>
      </div>

      <div className="space-y-2">
        {history.map((entry, index) => (
          <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => onLoadEntry(entry)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono">{entry.did}</code>
                    <Badge variant={entry.status === 'success' ? "default" : "destructive"}>
                      {entry.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()} • {entry.duration}ms
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Load
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface ComparisonViewProps {
  comparison: DIDResolutionComparison;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ comparison }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Document Comparison</h3>
        <div className="text-sm text-muted-foreground">
          Compared at {new Date(comparison.comparedAt).toLocaleString()}
        </div>
      </div>

      {comparison.differences.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            No differences found between the baseline and current documents.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Found {comparison.differences.length} differences between documents.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            {comparison.differences.map((diff, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant={
                      diff.type === 'added' ? 'default' :
                      diff.type === 'removed' ? 'destructive' :
                      'secondary'
                    }>
                      {diff.type}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-medium">{diff.field}</div>
                      <div className="text-sm text-muted-foreground">{diff.path}</div>
                      {diff.oldValue !== undefined && (
                        <div className="mt-2">
                          <span className="text-sm text-red-600">- </span>
                          <code className="text-sm bg-red-50 px-1 rounded">
                            {typeof diff.oldValue === 'string' ? diff.oldValue : JSON.stringify(diff.oldValue)}
                          </code>
                        </div>
                      )}
                      {diff.newValue !== undefined && (
                        <div className="mt-1">
                          <span className="text-sm text-green-600">+ </span>
                          <code className="text-sm bg-green-50 px-1 rounded">
                            {typeof diff.newValue === 'string' ? diff.newValue : JSON.stringify(diff.newValue)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to generate differences
function generateDifferences(baseline?: DIDDocument, current?: DIDDocument): DIDDocumentDifference[] {
  const differences: DIDDocumentDifference[] = [];
  
  if (!baseline || !current) return differences;

  // Simple comparison - in a real implementation, you'd want a more sophisticated diff algorithm
  const baselineStr = JSON.stringify(baseline, null, 2);
  const currentStr = JSON.stringify(current, null, 2);
  
  if (baselineStr !== currentStr) {
    differences.push({
      path: 'document',
      type: 'modified',
      field: 'DID Document',
      oldValue: baseline,
      newValue: current
    });
  }

  return differences;
}

export default AdvancedDIDResolver;
