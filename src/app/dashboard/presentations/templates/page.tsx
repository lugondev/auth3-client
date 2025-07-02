'use client'

import React, { useState, useEffect } from 'react'
import PresentationTemplateComponent from '@/components/presentations/PresentationTemplate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Edit3, 
  Eye, 
  Copy, 
  Trash2,
  Download,
  Upload,
  Tag,
  Clock
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
  usage_count: number
  created_at: string
  updated_at: string
  created_by: string
  is_public: boolean
  tags: string[]
}

export default function PresentationTemplatesPage() {
  const [templates, setTemplates] = useState<PresentationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')

  // Load templates
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      
      // Since backend doesn't have presentation templates endpoint,
      // we'll create mock data for now
      const mockTemplates: PresentationTemplate[] = [
        {
          id: '1',
          name: 'Education Verification Template',
          description: 'Template for verifying educational credentials including degrees and certificates',
          version: '1.0.0',
          category: 'Education',
          credentialTypes: ['EducationCredential', 'DegreeCredential'],
          requiredFields: ['degree', 'institution', 'graduationDate', 'studentId'],
          optionalFields: ['gpa', 'honors', 'courses'],
          usage_count: 145,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'University System',
          is_public: true,
          tags: ['education', 'degree', 'university']
        },
        {
          id: '2',
          name: 'Employment Verification Template',
          description: 'Template for verifying employment history and professional credentials',
          version: '2.1.0',
          category: 'Employment',
          credentialTypes: ['EmploymentCredential', 'ProfessionalCredential'],
          requiredFields: ['position', 'company', 'startDate', 'employeeId'],
          optionalFields: ['endDate', 'salary', 'department', 'supervisor'],
          usage_count: 89,
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'HR Department',
          is_public: false,
          tags: ['employment', 'work', 'professional']
        },
        {
          id: '3', 
          name: 'Identity Verification Template',
          description: 'Basic identity verification template for personal identification',
          version: '1.5.0',
          category: 'Identity',
          credentialTypes: ['IdentityCredential', 'PersonalID'],
          requiredFields: ['fullName', 'dateOfBirth', 'idNumber'],
          optionalFields: ['address', 'phone', 'email'],
          usage_count: 234,
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'Government Agency',
          is_public: true,
          tags: ['identity', 'personal', 'id']
        },
        {
          id: '4',
          name: 'Medical Certification Template',
          description: 'Template for medical certifications and health credentials',
          version: '1.2.0',
          category: 'Healthcare',
          credentialTypes: ['MedicalCredential', 'HealthCertificate'],
          requiredFields: ['licenseNumber', 'issuingAuthority', 'expirationDate'],
          optionalFields: ['specialization', 'restrictions', 'renewalDate'],
          usage_count: 67,
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'Medical Board',
          is_public: true,
          tags: ['medical', 'healthcare', 'certification']
        },
        {
          id: '5',
          name: 'Financial Verification Template',
          description: 'Template for financial credentials and banking verification',
          version: '1.0.0',
          category: 'Finance',
          credentialTypes: ['FinancialCredential', 'BankingCredential'],
          requiredFields: ['accountNumber', 'bankName', 'accountType'],
          optionalFields: ['balance', 'creditScore', 'accountStatus'],
          usage_count: 23,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'Financial Institution',
          is_public: false,
          tags: ['finance', 'banking', 'financial']
        }
      ]
      
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]

  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setModalMode('create')
    setShowTemplateModal(true)
  }

  const handleEditTemplate = (template: PresentationTemplate) => {
    setSelectedTemplate(template)
    setModalMode('edit')
    setShowTemplateModal(true)
  }

  const handleViewTemplate = (template: PresentationTemplate) => {
    setSelectedTemplate(template)
    setModalMode('view')
    setShowTemplateModal(true)
  }

  const handleDuplicateTemplate = async (template: PresentationTemplate) => {
    try {
      const duplicatedTemplate: Partial<PresentationTemplate> = {
        ...template,
        id: '',
        name: `${template.name} (Copy)`,
        usage_count: 0
      }
      
      setSelectedTemplate(duplicatedTemplate as PresentationTemplate)
      setModalMode('create')
      setShowTemplateModal(true)
    } catch (error) {
      toast.error('Failed to duplicate template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      // Since backend doesn't have presentation templates endpoint,
      // we'll just remove from local state for now
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast.success('Template deleted successfully')
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const handleTemplateSuccess = (template: PresentationTemplate) => {
    toast.success(`Template ${modalMode === 'create' ? 'created' : 'updated'} successfully`)
    
    if (modalMode === 'create') {
      // Add new template to local state
      const newTemplate = {
        ...template,
        id: Date.now().toString(), // Simple ID generation for demo
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
        created_by: 'Current User'
      }
      setTemplates(prev => [newTemplate, ...prev])
    } else {
      // Update existing template in local state
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...template, updated_at: new Date().toISOString() } : t
      ))
    }
    
    setShowTemplateModal(false)
  }

  const exportTemplate = async (template: PresentationTemplate) => {
    try {
      const blob = new Blob([JSON.stringify(template, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.name.replace(/\s+/g, '_')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Template exported successfully')
    } catch (error) {
      toast.error('Failed to export template')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Presentation Templates</h1>
          <p className="text-muted-foreground">Create and manage reusable presentation templates</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Available templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Templates</CardTitle>
            <Tag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {templates.filter(t => t.is_public).length}
            </div>
            <p className="text-xs text-muted-foreground">Shared with community</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{categories.length - 1}</div>
            <p className="text-xs text-muted-foreground">Different categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Math.max(...templates.map(t => t.usage_count), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Highest usage count</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Browse and manage your presentation templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No templates found</p>
              <Button onClick={handleCreateTemplate}>Create Your First Template</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description || 'No description'}
                        </CardDescription>
                      </div>
                      {template.is_public && (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                      {template.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                      {template.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{template.tags.length - 2}</Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>Required fields: {template.requiredFields.length}</p>
                      <p>Optional fields: {template.optionalFields.length}</p>
                      <p>Used {template.usage_count} times</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewTemplate(template)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportTemplate(template)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Modal */}
      <PresentationTemplateComponent
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        template={selectedTemplate}
        mode={modalMode}
        onSuccess={handleTemplateSuccess}
      />
    </div>
  )
}
