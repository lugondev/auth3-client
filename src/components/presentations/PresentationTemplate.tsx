'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  Eye,
  Settings,
  CheckCircle,
  AlertTriangle,
  Save,
  Edit3
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'

interface PresentationTemplate {
  id: string
  name: string
  description: string
  version: string
  category: string
  credentialTypes: string[]
  requiredFields: string[]
  optionalFields: string[]
  schema: TemplateSchema
  settings: TemplateSettings
  usage_count: number
  created_at: string
  updated_at: string
  created_by: string
  is_public: boolean
  tags: string[]
}

interface TemplateSchema {
  title: string
  type: string
  properties: Record<string, SchemaProperty>
  required: string[]
  additionalProperties: boolean
}

interface SchemaProperty {
  type: string
  title?: string
  description?: string
  enum?: string[]
  format?: string
  pattern?: string
  minimum?: number
  maximum?: number
  items?: SchemaProperty
}

interface TemplateSettings {
  allowSelectiveDisclosure: boolean
  requireVerification: boolean
  expirationDays?: number
  maxUses?: number
  accessControl: 'public' | 'private' | 'restricted'
  requiredIssuerTypes: string[]
}

interface PresentationTemplateProps {
  isOpen: boolean
  onClose: () => void
  template?: PresentationTemplate | null
  onSuccess?: (template: PresentationTemplate) => void
  mode?: 'create' | 'edit' | 'view'
  className?: string
}

interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
}

/**
 * PresentationTemplate Component - Template creation and management
 * 
 * Features:
 * - Visual template builder
 * - Schema definition and validation
 * - Template categorization and tagging
 * - Reusable presentation formats
 * - Import/export capabilities
 */
export function PresentationTemplate({ 
  isOpen, 
  onClose, 
  template = null,
  onSuccess,
  mode = 'create',
  className = '' 
}: PresentationTemplateProps) {
  const [formData, setFormData] = useState<Partial<PresentationTemplate>>({
    name: '',
    description: '',
    category: '',
    credentialTypes: [],
    requiredFields: [],
    optionalFields: [],
    tags: [],
    is_public: false,
    schema: {
      title: '',
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    },
    settings: {
      allowSelectiveDisclosure: true,
      requireVerification: true,
      accessControl: 'private',
      requiredIssuerTypes: []
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [templates, setTemplates] = useState<PresentationTemplate[]>([])
  const [activeTab, setActiveTab] = useState('basic')
  const [newField, setNewField] = useState({ name: '', type: 'string', required: false })
  const [newTag, setNewTag] = useState('')

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadCategories()
      loadExistingTemplates()
      
      if (template && mode !== 'create') {
        setFormData(template)
      }
    }
  }, [isOpen, template, mode])

  /**
   * Load template categories
   */
  const loadCategories = async () => {
    try {
      // Mock categories - replace with actual API call
      const mockCategories: TemplateCategory[] = [
        { id: 'identity', name: 'Identity Verification', description: 'Personal identity documents', icon: '👤' },
        { id: 'education', name: 'Educational Credentials', description: 'Academic achievements', icon: '🎓' },
        { id: 'professional', name: 'Professional Certifications', description: 'Work-related credentials', icon: '💼' },
        { id: 'healthcare', name: 'Healthcare Records', description: 'Medical and health information', icon: '🏥' },
        { id: 'financial', name: 'Financial Documents', description: 'Banking and financial records', icon: '💰' },
        { id: 'government', name: 'Government Issued', description: 'Official government documents', icon: '🏛️' },
        { id: 'membership', name: 'Memberships', description: 'Organization memberships', icon: '🎫' },
        { id: 'other', name: 'Other', description: 'Miscellaneous templates', icon: '📄' }
      ]
      setCategories(mockCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  /**
   * Load existing templates for reference
   */
  const loadExistingTemplates = async () => {
    try {
      const response = await apiClient.get<{ templates: PresentationTemplate[] }>(
        '/api/v1/presentations/templates'
      )
      setTemplates(response.data.templates || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  /**
   * Save template
   */
  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('Template name is required')
      return
    }

    if (!formData.category) {
      toast.error('Please select a category')
      return
    }

    setLoading(true)
    try {
      const endpoint = mode === 'create' || !template?.id 
        ? '/api/v1/presentations/templates'
        : `/api/v1/presentations/templates/${template.id}`
      
      const method = mode === 'create' || !template?.id ? 'post' : 'put'
      
      const response = await apiClient[method]<PresentationTemplate>(endpoint, {
        ...formData,
        schema: {
          ...formData.schema,
          title: formData.name,
          required: formData.requiredFields || []
        }
      })

      toast.success(`Template ${mode === 'create' ? 'created' : 'updated'} successfully`)
      onSuccess?.(response.data)
      onClose()
    } catch (error: any) {
      console.error('Error saving template:', error)
      toast.error(error.response?.data?.message || `Failed to ${mode === 'create' ? 'create' : 'update'} template`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Add field to schema
   */
  const handleAddField = () => {
    if (!newField.name.trim()) {
      toast.error('Field name is required')
      return
    }

    const fieldKey = newField.name.toLowerCase().replace(/\s+/g, '_')
    
    // Update schema properties
    const updatedSchema = {
      ...formData.schema!,
      properties: {
        ...formData.schema!.properties,
        [fieldKey]: {
          type: newField.type,
          title: newField.name,
          description: `${newField.name} field`
        }
      }
    }

    // Update required/optional fields
    const updatedRequired = newField.required 
      ? [...(formData.requiredFields || []), fieldKey]
      : formData.requiredFields || []
    
    const updatedOptional = !newField.required
      ? [...(formData.optionalFields || []), fieldKey]
      : formData.optionalFields || []

    setFormData({
      ...formData,
      schema: updatedSchema,
      requiredFields: updatedRequired,
      optionalFields: updatedOptional
    })

    setNewField({ name: '', type: 'string', required: false })
  }

  /**
   * Remove field from schema
   */
  const handleRemoveField = (fieldKey: string) => {
    const { [fieldKey]: removedProp, ...remainingProps } = formData.schema!.properties

    setFormData({
      ...formData,
      schema: {
        ...formData.schema!,
        properties: remainingProps
      },
      requiredFields: formData.requiredFields?.filter(f => f !== fieldKey) || [],
      optionalFields: formData.optionalFields?.filter(f => f !== fieldKey) || []
    })
  }

  /**
   * Add tag
   */
  const handleAddTag = () => {
    if (!newTag.trim()) return
    
    const tags = formData.tags || []
    if (!tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...tags, newTag.trim()]
      })
    }
    setNewTag('')
  }

  /**
   * Remove tag
   */
  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || []
    })
  }

  /**
   * Export template
   */
  const handleExport = () => {
    const exportData = {
      ...formData,
      version: '1.0',
      exported_at: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.name?.replace(/\s+/g, '_') || 'template'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Import template
   */
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setFormData({
          ...imported,
          id: undefined, // Remove ID for new template
          created_at: undefined,
          updated_at: undefined
        })
        toast.success('Template imported successfully')
      } catch (error) {
        toast.error('Invalid template file')
      }
    }
    reader.readAsText(file)
  }

  /**
   * Validate template
   */
  const validateTemplate = () => {
    const errors: string[] = []
    
    if (!formData.name?.trim()) errors.push('Name is required')
    if (!formData.category) errors.push('Category is required')
    if (!formData.requiredFields?.length && !formData.optionalFields?.length) {
      errors.push('At least one field is required')
    }

    return errors
  }

  const validationErrors = validateTemplate()
  const isValid = validationErrors.length === 0

  /**
   * Render basic information tab
   */
  const renderBasicTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter template name"
            disabled={mode === 'view'}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category || ''}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            disabled={mode === 'view'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this template is for"
          rows={3}
          disabled={mode === 'view'}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
              {mode !== 'view' && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              )}
            </Badge>
          ))}
        </div>
        {mode !== 'view' && (
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              className="text-sm"
            />
            <Button size="sm" onClick={handleAddTag}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  /**
   * Render fields configuration tab
   */
  const renderFieldsTab = () => (
    <div className="space-y-4">
      {/* Add new field */}
      {mode !== 'view' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add Field</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                placeholder="Field name"
                className="text-sm"
              />
              <Select
                value={newField.type}
                onValueChange={(value) => setNewField({ ...newField, type: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="array">Array</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="rounded"
                />
                <Label className="text-xs">Required</Label>
                <Button size="sm" onClick={handleAddField}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Required Fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Required Fields ({formData.requiredFields?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {formData.requiredFields?.map((field) => (
              <div key={field} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="text-sm font-medium">
                    {formData.schema?.properties[field]?.title || field}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.schema?.properties[field]?.type || 'string'})
                  </span>
                </div>
                {mode !== 'view' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveField(field)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {(!formData.requiredFields?.length) && (
              <p className="text-sm text-muted-foreground">No required fields</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Optional Fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" />
            Optional Fields ({formData.optionalFields?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {formData.optionalFields?.map((field) => (
              <div key={field} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="text-sm font-medium">
                    {formData.schema?.properties[field]?.title || field}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.schema?.properties[field]?.type || 'string'})
                  </span>
                </div>
                {mode !== 'view' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveField(field)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {(!formData.optionalFields?.length) && (
              <p className="text-sm text-muted-foreground">No optional fields</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  /**
   * Render settings tab
   */
  const renderSettingsTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Presentation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Allow Selective Disclosure</Label>
              <p className="text-xs text-muted-foreground">
                Enable privacy-preserving field selection
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings?.allowSelectiveDisclosure || false}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings!,
                  allowSelectiveDisclosure: e.target.checked
                }
              })}
              disabled={mode === 'view'}
              className="rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Require Verification</Label>
              <p className="text-xs text-muted-foreground">
                Mandate credential verification before presentation
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings?.requireVerification || false}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings!,
                  requireVerification: e.target.checked
                }
              })}
              disabled={mode === 'view'}
              className="rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Public Template</Label>
              <p className="text-xs text-muted-foreground">
                Make this template available to other users
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.is_public || false}
              onChange={(e) => setFormData({
                ...formData,
                is_public: e.target.checked
              })}
              disabled={mode === 'view'}
              className="rounded"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Access Control</Label>
            <Select
              value={formData.settings?.accessControl || 'private'}
              onValueChange={(value: 'public' | 'private' | 'restricted') => 
                setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings!,
                    accessControl: value
                  }
                })
              }
              disabled={mode === 'view'}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  /**
   * Render schema preview tab
   */
  const renderSchemaTab = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">JSON Schema Preview</CardTitle>
        <CardDescription className="text-xs">
          Generated schema based on your field configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
            {JSON.stringify(formData.schema, null, 2)}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'} Presentation Template
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a reusable template for presentation requirements'
              : mode === 'edit'
              ? 'Modify the presentation template'
              : 'View presentation template details'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
            </TabsList>

            <div className="h-96 overflow-auto mt-4">
              <TabsContent value="basic">{renderBasicTab()}</TabsContent>
              <TabsContent value="fields">{renderFieldsTab()}</TabsContent>
              <TabsContent value="settings">{renderSettingsTab()}</TabsContent>
              <TabsContent value="schema">{renderSchemaTab()}</TabsContent>
            </div>
          </Tabs>

          {/* Validation Errors */}
          {!isValid && mode !== 'view' && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="text-sm list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {mode !== 'view' && (
              <>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-template"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.getElementById('import-template')?.click()}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Import
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {mode !== 'view' && (
              <Button 
                onClick={handleSave}
                disabled={loading || !isValid}
              >
                {loading ? 'Saving...' : (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    {mode === 'create' ? 'Create Template' : 'Update Template'}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PresentationTemplate
