'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Copy, 
  Download, 
  Eye, 
  Code2, 
  FileJson, 
  FileText,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import type { 
  DIDDocument, 
  DIDDocumentPreview as DIDDocumentPreviewType,
  DIDDocumentValidationResult
} from '@/types/did';

import { DIDDocumentValidator } from '@/utils/didDocumentValidator';

interface DIDDocumentPreviewProps {
  document: DIDDocument;
  className?: string;
}

export const DIDDocumentPreview: React.FC<DIDDocumentPreviewProps> = ({
  document,
  className = ''
}) => {
  const [activeFormat, setActiveFormat] = useState<'json' | 'json-ld' | 'yaml'>('json');
  const [showValidation, setShowValidation] = useState(false);

  // Generate formatted content for different formats
  const previews = useMemo(() => {
    const json = JSON.stringify(document, null, 2);
    
    // JSON-LD format (same as JSON but with explicit context highlighting)
    const jsonLd = JSON.stringify(document, null, 2);
    
    // YAML format (simple conversion)
    const yaml = convertToYaml(document);

    return {
      json: { format: 'json' as const, content: json, highlighted: true, downloadable: true },
      'json-ld': { format: 'json-ld' as const, content: jsonLd, highlighted: true, downloadable: true },
      yaml: { format: 'yaml' as const, content: yaml, highlighted: true, downloadable: true }
    };
  }, [document]);

  // Validation results
  const validation = useMemo(() => {
    return DIDDocumentValidator.validate(document);
  }, [document]);

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Copied',
        description: 'Document copied to clipboard'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const downloadDocument = (format: string, content: string) => {
    const blob = new Blob([content], { type: getContentType(format) });
    const url = URL.createObjectURL(blob);
    const a = globalThis.document.createElement('a');
    a.href = url;
    a.download = `did-document.${format}`;
    globalThis.document.body.appendChild(a);
    a.click();
    globalThis.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded',
      description: `Document downloaded as ${format.toUpperCase()}`
    });
  };

  const openInNewTab = (content: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Document Preview
          </h3>
          <p className="text-sm text-muted-foreground">
            Review your DID document in different formats
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowValidation(!showValidation)}
            className="flex items-center gap-2"
          >
            {validation.valid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            Validation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(previews[activeFormat].content)}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadDocument(activeFormat, previews[activeFormat].content)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openInNewTab(previews[activeFormat].content)}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
        </div>
      </div>

      {/* Validation Alert */}
      {showValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {validation.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Document Validation
              <Badge variant={validation.valid ? "default" : "destructive"}>
                Score: {validation.score}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Compliance Checks */}
            <div>
              <h4 className="font-medium mb-2">Compliance</h4>
              <div className="space-y-2">
                {validation.compliance.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      {check.compliant ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{check.standard} v{check.version}</span>
                    </div>
                    <Badge variant={check.compliant ? "default" : "destructive"}>
                      {check.compliant ? 'Compliant' : 'Issues'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors */}
            {validation.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Errors</h4>
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{error.field}:</strong> {error.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-yellow-600">Warnings</h4>
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{warning.field}:</strong> {warning.message}
                        {warning.suggestion && (
                          <div className="text-sm text-muted-foreground mt-1">
                            💡 {warning.suggestion}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {validation.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Suggestions</h4>
                <div className="space-y-1">
                  {validation.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{suggestion.field}</span>
                        <Badge variant="outline" className={
                          suggestion.priority === 'high' ? 'border-red-300 text-red-700' :
                          suggestion.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                          'border-green-300 text-green-700'
                        }>
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Preview */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeFormat} onValueChange={(value: any) => setActiveFormat(value)}>
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="json" className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON
                </TabsTrigger>
                <TabsTrigger value="json-ld" className="flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  JSON-LD
                </TabsTrigger>
                <TabsTrigger value="yaml" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  YAML
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              {Object.entries(previews).map(([format, preview]) => (
                <TabsContent key={format} value={format} className="mt-0">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono leading-relaxed">
                      <code className={`language-${format}`}>
                        {preview.content}
                      </code>
                    </pre>
                    
                    {/* Format-specific actions */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(preview.content)}
                        className="h-6 w-6 p-0"
                        title="Copy"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadDocument(format, preview.content)}
                        className="h-6 w-6 p-0"
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Format info */}
                  <div className="mt-4 p-3 bg-muted/50 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {getFormatDescription(format)}
                      </span>
                      <Badge variant="outline">
                        {getContentType(format)}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Document Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-xl font-bold">{document.verificationMethod?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Verification Methods</div>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-xl font-bold">{document.service?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Service Endpoints</div>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-xl font-bold">{document['@context']?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Contexts</div>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-xl font-bold">{JSON.stringify(document).length}</div>
              <div className="text-xs text-muted-foreground">Total Size (bytes)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
function convertToYaml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let result = '';

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        result += `${spaces}- ${convertToYaml(item, indent + 1).trim()}\n`;
      } else {
        result += `${spaces}- ${item}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        result += `${spaces}${key}:\n`;
        result += convertToYaml(value, indent + 1);
      } else if (typeof value === 'object' && value !== null) {
        result += `${spaces}${key}:\n`;
        result += convertToYaml(value, indent + 1);
      } else {
        result += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }
  }

  return result;
}

function getContentType(format: string): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'json-ld':
      return 'application/ld+json';
    case 'yaml':
      return 'application/x-yaml';
    default:
      return 'text/plain';
  }
}

function getFormatDescription(format: string): string {
  switch (format) {
    case 'json':
      return 'Standard JSON format for DID documents';
    case 'json-ld':
      return 'JSON-LD format with linked data contexts';
    case 'yaml':
      return 'Human-readable YAML format';
    default:
      return 'Document format';
  }
}

export default DIDDocumentPreview;
