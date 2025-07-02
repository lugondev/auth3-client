'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'

interface VerifiableCredential {
  id: string
  type: string[]
  credentialSubject: Record<string, any>
  issuer: string
  issuanceDate: string
  expirationDate?: string
  [key: string]: any
}

interface SelectiveDisclosureProps {
  isOpen: boolean
  onClose: () => void
  credential: VerifiableCredential
  onSuccess?: (sdCredential: VerifiableCredential) => void
  className?: string
}

interface FieldInfo {
  key: string
  value: any
  type: string
  sensitive: boolean
  required: boolean
  displayName: string
}

interface SelectiveDisclosureResult {
  sdCredential: VerifiableCredential
  disclosedFields: string[]
  message: string
}

interface SupportedMethod {
  name: string
  type: string
  description: string
  supported: boolean
}

interface SupportedMethodsResponse {
  supportedMethods: SupportedMethod[]
  capabilities: Record<string, boolean>
}

/**
 * SelectiveDisclosure Component - Advanced credential field selection
 * 
 * Features:
 * - Visual field picker with metadata
 * - BBS+ signature support detection
 * - Privacy-preserving credential creation
 * - Field categorization and recommendations
 * - Real-time privacy assessment
 */
export function SelectiveDisclosure({ 
  isOpen, 
  onClose, 
  credential, 
  onSuccess,
  className = '' 
}: SelectiveDisclosureProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [supportedMethods, setSupportedMethods] = useState<SupportedMethodsResponse | null>(null)
  const [methodsLoading, setMethodsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('fields')
  const [showPreview, setShowPreview] = useState(false)

  // Parse credential subject fields
  const fieldInfo = useMemo((): FieldInfo[] => {
    if (!credential?.credentialSubject) return []

    const fields: FieldInfo[] = []
    const subject = credential.credentialSubject

    Object.entries(subject).forEach(([key, value]) => {
      if (key === 'id') return // Skip subject ID

      fields.push({
        key,
        value,
        type: typeof value,
        sensitive: detectSensitiveField(key, value),
        required: detectRequiredField(key),
        displayName: formatDisplayName(key)
      })
    })

    return fields.sort((a, b) => {
      // Sort by: required first, then non-sensitive, then alphabetical
      if (a.required !== b.required) return a.required ? -1 : 1
      if (a.sensitive !== b.sensitive) return a.sensitive ? 1 : -1
      return a.displayName.localeCompare(b.displayName)
    })
  }, [credential])

  // Load supported methods on mount
  useEffect(() => {
    loadSupportedMethods()
  }, [])

  // Auto-select required fields
  useEffect(() => {
    const requiredFields = fieldInfo.filter(f => f.required).map(f => f.key)
    setSelectedFields(new Set(requiredFields))
  }, [fieldInfo])

  /**
   * Load supported selective disclosure methods
   */
  const loadSupportedMethods = async () => {
    try {
      setMethodsLoading(true)
      const response = await apiClient.get<SupportedMethodsResponse>(
        '/api/v1/credentials/selective-disclosure/methods'
      )
      setSupportedMethods(response.data)
    } catch (error) {
      console.error('Error loading supported methods:', error)
      toast.error('Failed to load selective disclosure capabilities')
    } finally {
      setMethodsLoading(false)
    }
  }

  /**
   * Create selective disclosure credential
   */
  const handleCreateSelectiveDisclosure = async () => {
    if (selectedFields.size === 0) {
      toast.error('Please select at least one field to disclose')
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post<SelectiveDisclosureResult>(
        '/api/v1/credentials/selective-disclosure',
        {
          credential_id: credential.id,
          fields_to_disclose: Array.from(selectedFields)
        }
      )

      toast.success('Selective disclosure credential created successfully')
      onSuccess?.(response.data.sdCredential)
      onClose()
    } catch (error: any) {
      console.error('Error creating selective disclosure credential:', error)
      toast.error(error.response?.data?.message || 'Failed to create selective disclosure credential')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Toggle field selection
   */
  const toggleField = (fieldKey: string, required: boolean) => {
    if (required) {
      toast.warning('Required fields cannot be deselected')
      return
    }

    const newSelected = new Set(selectedFields)
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey)
    } else {
      newSelected.add(fieldKey)
    }
    setSelectedFields(newSelected)
  }

  /**
   * Select/deselect all non-required fields
   */
  const toggleAllFields = (select: boolean) => {
    const newSelected = new Set(selectedFields)
    
    fieldInfo.forEach(field => {
      if (field.required) return // Keep required fields
      
      if (select) {
        newSelected.add(field.key)
      } else {
        newSelected.delete(field.key)
      }
    })
    
    setSelectedFields(newSelected)
  }

  /**
   * Get privacy assessment
   */
  const getPrivacyAssessment = () => {
    const totalFields = fieldInfo.length
    const selectedCount = selectedFields.size
    const sensitiveSelected = fieldInfo.filter(f => 
      selectedFields.has(f.key) && f.sensitive
    ).length

    let level: 'high' | 'medium' | 'low' = 'high'
    let color = 'green'
    let description = 'Excellent privacy protection'

    if (selectedCount > totalFields * 0.7) {
      level = 'low'
      color = 'red'
      description = 'Most fields disclosed - consider reducing'
    } else if (sensitiveSelected > 0 || selectedCount > totalFields * 0.4) {
      level = 'medium' 
      color = 'yellow'
      description = 'Moderate privacy protection'
    }

    return { level, color, description, selectedCount, totalFields, sensitiveSelected }
  }

  /**
   * Render field selection interface
   */
  const renderFieldSelection = () => {
    const categorizedFields = {
      required: fieldInfo.filter(f => f.required),
      recommended: fieldInfo.filter(f => !f.required && !f.sensitive),
      sensitive: fieldInfo.filter(f => !f.required && f.sensitive)
    }

    return (
      <div className="space-y-4">
        {/* Required Fields */}
        {categorizedFields.required.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Required Fields
              </CardTitle>
              <CardDescription className="text-xs">
                These fields are mandatory and will always be included
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {categorizedFields.required.map(field => (
                <FieldItem 
                  key={field.key}
                  field={field}
                  selected={true}
                  disabled={true}
                  onToggle={() => {}}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recommended Fields */}
        {categorizedFields.recommended.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Recommended Fields
              </CardTitle>
              <CardDescription className="text-xs">
                Non-sensitive information suitable for disclosure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {categorizedFields.recommended.map(field => (
                <FieldItem 
                  key={field.key}
                  field={field}
                  selected={selectedFields.has(field.key)}
                  disabled={false}
                  onToggle={() => toggleField(field.key, field.required)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Sensitive Fields */}
        {categorizedFields.sensitive.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Sensitive Fields
              </CardTitle>
              <CardDescription className="text-xs">
                Potentially sensitive information - consider carefully before disclosing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {categorizedFields.sensitive.map(field => (
                <FieldItem 
                  key={field.key}
                  field={field}
                  selected={selectedFields.has(field.key)}
                  disabled={false}
                  onToggle={() => toggleField(field.key, field.required)}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  /**
   * Render preview of disclosed information
   */
  const renderPreview = () => {
    const selectedData = fieldInfo
      .filter(f => selectedFields.has(f.key))
      .reduce((acc, field) => {
        acc[field.displayName] = field.value
        return acc
      }, {} as Record<string, any>)

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Disclosure Preview</CardTitle>
          <CardDescription className="text-xs">
            This information will be included in the selective disclosure credential
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <pre className="text-xs bg-muted p-3 rounded overflow-auto">
              {JSON.stringify(selectedData, null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  const privacyAssessment = getPrivacyAssessment()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Selective Disclosure
          </DialogTitle>
          <DialogDescription>
            Choose which credential fields to disclose while maintaining privacy for others
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fields">Field Selection</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="methods">Methods</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="h-96 overflow-auto mt-4">
              {/* Quick Actions */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllFields(true)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllFields(false)}
                  >
                    Select None
                  </Button>
                </div>

                {/* Privacy Assessment */}
                <Badge 
                  variant={privacyAssessment.level === 'high' ? 'default' : 
                          privacyAssessment.level === 'medium' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  Privacy: {privacyAssessment.level.toUpperCase()}
                </Badge>
              </div>

              {/* Privacy Alert */}
              <Alert className="mb-4">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {privacyAssessment.description} ({privacyAssessment.selectedCount}/{privacyAssessment.totalFields} fields selected
                  {privacyAssessment.sensitiveSelected > 0 && `, ${privacyAssessment.sensitiveSelected} sensitive`})
                </AlertDescription>
              </Alert>

              {renderFieldSelection()}
            </TabsContent>

            <TabsContent value="preview" className="h-96 overflow-auto mt-4">
              {renderPreview()}
            </TabsContent>

            <TabsContent value="methods" className="h-96 overflow-auto mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Supported Methods</CardTitle>
                  <CardDescription className="text-xs">
                    Available selective disclosure methods and capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {methodsLoading ? (
                    <div className="text-center py-4">Loading methods...</div>
                  ) : supportedMethods ? (
                    <div className="space-y-3">
                      {supportedMethods.supportedMethods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <h4 className="font-medium text-sm">{method.name}</h4>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                          <Badge variant={method.supported ? "default" : "secondary"}>
                            {method.supported ? "Supported" : "Not Available"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Failed to load methods
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedFields.size} field(s) selected for disclosure
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSelectiveDisclosure}
              disabled={loading || selectedFields.size === 0}
            >
              {loading ? 'Creating...' : 'Create Selective Disclosure'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Individual field item component
 */
interface FieldItemProps {
  field: FieldInfo
  selected: boolean
  disabled: boolean
  onToggle: () => void
}

function FieldItem({ field, selected, disabled, onToggle }: FieldItemProps) {
  const renderValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  return (
    <div className={`flex items-center space-x-3 p-2 rounded border ${
      selected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
    } ${disabled ? 'opacity-60' : ''}`}>
      <Checkbox
        checked={selected}
        disabled={disabled}
        onCheckedChange={onToggle}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">
            {field.displayName}
          </Label>
          
          {field.required && (
            <Badge variant="outline" className="text-xs">Required</Badge>
          )}
          
          {field.sensitive && (
            <Badge variant="destructive" className="text-xs">Sensitive</Badge>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground truncate">
          {renderValue(field.value)}
        </p>
      </div>

      {field.sensitive && (
        <EyeOff className="h-4 w-4 text-orange-500 flex-shrink-0" />
      )}
    </div>
  )
}

/**
 * Helper functions
 */
function detectSensitiveField(key: string, value: any): boolean {
  const sensitiveKeywords = [
    'ssn', 'social', 'tax', 'passport', 'license', 'phone', 'email',
    'address', 'birth', 'age', 'salary', 'income', 'password', 'secret'
  ]
  
  const keyLower = key.toLowerCase()
  return sensitiveKeywords.some(keyword => keyLower.includes(keyword))
}

function detectRequiredField(key: string): boolean {
  const requiredKeywords = ['name', 'id', 'type', 'title']
  const keyLower = key.toLowerCase()
  return requiredKeywords.some(keyword => keyLower.includes(keyword))
}

function formatDisplayName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

export default SelectiveDisclosure
