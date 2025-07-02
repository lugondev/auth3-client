'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Shield,
  Clock,
  Eye,
  Users,
  Globe,
  Lock,
  Calendar,
  Link2,
  Settings,
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Download,
  Mail,
  QrCode
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'

interface ShareSettings {
  allowedViewers?: string[]
  accessType: 'public' | 'restricted' | 'password'
  password?: string
  expiresAt?: string
  maxViews?: number
  allowDownload: boolean
  allowSharing: boolean
  trackViews: boolean
  requireAuth: boolean
  notifyOnAccess: boolean
  customMessage?: string
  allowedDomains?: string[]
}

interface ShareLink {
  id: string
  token: string
  url: string
  settings: ShareSettings
  createdAt: string
  expiresAt?: string
  viewCount: number
  maxViews?: number
  isActive: boolean
  lastAccessed?: string
}

interface SharingOptionsProps {
  presentationId: string
  onShareCreated?: (shareLink: ShareLink) => void
  onClose?: () => void
  className?: string
}

/**
 * SharingOptions Component - Advanced sharing configuration
 * 
 * Features:
 * - Secure link generation with expiration
 * - Access control (public, restricted, password-protected)
 * - View limits and tracking
 * - Custom permissions and settings
 * - Domain restrictions
 * - Download and re-sharing controls
 */
export default function SharingOptions({
  presentationId,
  onShareCreated,
  onClose,
  className = ''
}: SharingOptionsProps) {
  const [settings, setSettings] = useState<ShareSettings>({
    accessType: 'public',
    allowDownload: true,
    allowSharing: false,
    trackViews: true,
    requireAuth: false,
    notifyOnAccess: false
  })
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [copied, setCopied] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Generate expiration date options
  const expirationOptions = [
    { value: '1h', label: '1 Hour', hours: 1 },
    { value: '1d', label: '1 Day', hours: 24 },
    { value: '3d', label: '3 Days', hours: 72 },
    { value: '7d', label: '1 Week', hours: 168 },
    { value: '30d', label: '1 Month', hours: 720 },
    { value: '90d', label: '3 Months', hours: 2160 },
    { value: 'never', label: 'Never', hours: 0 }
  ]

  const updateSetting = <K extends keyof ShareSettings>(
    key: K,
    value: ShareSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const generateExpirationDate = (hours: number): string => {
    if (hours === 0) return '' // Never expires
    const date = new Date()
    date.setHours(date.getHours() + hours)
    return date.toISOString()
  }

  const createSecureShare = async () => {
    try {
      setLoading(true)
      
      const response = await apiClient.post<ShareLink>(
        `/api/v1/presentations/${presentationId}/share`,
        settings
      )
      
      const newShareLink = response.data
      setShareLink(newShareLink)
      onShareCreated?.(newShareLink)
      toast.success('Secure share link created successfully!')
      
    } catch (error) {
      console.error('Error creating share link:', error)
      toast.error('Failed to create secure share link')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadShareInfo = () => {
    if (!shareLink) return

    const shareInfo = {
      url: shareLink.url,
      settings: shareLink.settings,
      createdAt: shareLink.createdAt,
      expiresAt: shareLink.expiresAt,
      instructions: {
        access: 'Click the URL to access the shared presentation',
        security: 'This link is secured according to your sharing preferences',
        expiration: shareLink.expiresAt ? `Link expires on ${new Date(shareLink.expiresAt).toLocaleString()}` : 'Link never expires'
      }
    }

    const blob = new Blob([JSON.stringify(shareInfo, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `share-info-${shareLink.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Share information downloaded')
  }

  const renderSecurityLevel = () => {
    let level = 'Low'
    let color = 'bg-green-100 text-green-800'
    let icon = <Globe className="h-4 w-4" />

    if (settings.accessType === 'password' || settings.requireAuth) {
      level = 'High'
      color = 'bg-red-100 text-red-800'
      icon = <Lock className="h-4 w-4" />
    } else if (settings.accessType === 'restricted' || settings.maxViews) {
      level = 'Medium'
      color = 'bg-yellow-100 text-yellow-800'
      icon = <Shield className="h-4 w-4" />
    }

    return (
      <div className="flex items-center gap-2">
        <Badge className={color}>
          {icon}
          {level} Security
        </Badge>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {!shareLink ? (
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Sharing Settings
                </CardTitle>
                <CardDescription>
                  Configure basic access and expiration settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Access Type</Label>
                  <Select
                    value={settings.accessType}
                    onValueChange={(value: 'public' | 'restricted' | 'password') => 
                      updateSetting('accessType', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Public - Anyone with link
                        </div>
                      </SelectItem>
                      <SelectItem value="restricted">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Restricted - Specific users only
                        </div>
                      </SelectItem>
                      <SelectItem value="password">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Password Protected
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.accessType === 'password' && (
                  <div>
                    <Label htmlFor="password">Access Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={settings.password || ''}
                      onChange={(e) => updateSetting('password', e.target.value)}
                      placeholder="Enter access password"
                    />
                  </div>
                )}

                {settings.accessType === 'restricted' && (
                  <div>
                    <Label htmlFor="viewers">Allowed Viewers (emails)</Label>
                    <Textarea
                      id="viewers"
                      value={settings.allowedViewers?.join('\n') || ''}
                      onChange={(e) => updateSetting('allowedViewers', 
                        e.target.value.split('\n').filter(email => email.trim())
                      )}
                      placeholder="user1@example.com&#10;user2@example.com"
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <Label>Link Expiration</Label>
                  <Select
                    value={settings.expiresAt ? 'custom' : 'never'}
                    onValueChange={(value) => {
                      const option = expirationOptions.find(opt => opt.value === value)
                      if (option) {
                        updateSetting('expiresAt', option.hours > 0 ? generateExpirationDate(option.hours) : undefined)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expirationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="custom-message">Custom Message</Label>
                  <Textarea
                    id="custom-message"
                    value={settings.customMessage || ''}
                    onChange={(e) => updateSetting('customMessage', e.target.value)}
                    placeholder="Add a custom message for viewers..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure advanced security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Viewers must be logged in to access
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireAuth}
                    onCheckedChange={(checked) => updateSetting('requireAuth', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Track Views</Label>
                    <p className="text-sm text-muted-foreground">
                      Monitor who accesses the presentation
                    </p>
                  </div>
                  <Switch
                    checked={settings.trackViews}
                    onCheckedChange={(checked) => updateSetting('trackViews', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notify on Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notifications when someone views
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyOnAccess}
                    onCheckedChange={(checked) => updateSetting('notifyOnAccess', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="max-views">Maximum Views</Label>
                  <Input
                    id="max-views"
                    type="number"
                    min="1"
                    value={settings.maxViews || ''}
                    onChange={(e) => updateSetting('maxViews', 
                      e.target.value ? parseInt(e.target.value) : undefined
                    )}
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <Label htmlFor="allowed-domains">Allowed Domains</Label>
                  <Textarea
                    id="allowed-domains"
                    value={settings.allowedDomains?.join('\n') || ''}
                    onChange={(e) => updateSetting('allowedDomains',
                      e.target.value.split('\n').filter(domain => domain.trim())
                    )}
                    placeholder="example.com&#10;company.org"
                    rows={2}
                  />
                </div>

                <div className="pt-4 border-t">
                  <Label>Current Security Level</Label>
                  {renderSecurityLevel()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Permissions
                </CardTitle>
                <CardDescription>
                  Fine-tune what viewers can do with the presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Download</Label>
                    <p className="text-sm text-muted-foreground">
                      Viewers can download the presentation
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowDownload}
                    onCheckedChange={(checked) => updateSetting('allowDownload', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Re-sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Viewers can share with others
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowSharing}
                    onCheckedChange={(checked) => updateSetting('allowSharing', checked)}
                  />
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Security Note</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        These settings control access to the shared presentation. 
                        More restrictive settings provide better security but may 
                        limit accessibility.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Secure Share Link Created
            </CardTitle>
            <CardDescription>
              Your presentation has been securely shared
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Share URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={shareLink.url}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(shareLink.url)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareLink.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Created:</span>
                <p>{new Date(shareLink.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium">Expires:</span>
                <p>{shareLink.expiresAt ? new Date(shareLink.expiresAt).toLocaleString() : 'Never'}</p>
              </div>
              <div>
                <span className="font-medium">Views:</span>
                <p>{shareLink.viewCount} / {shareLink.maxViews || '∞'}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge className={shareLink.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {shareLink.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadShareInfo}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Info
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const subject = encodeURIComponent('Shared Presentation')
                  const body = encodeURIComponent(`I'm sharing a verifiable presentation with you:\n\n${shareLink.url}\n\n${shareLink.settings.customMessage || ''}`)
                  window.open(`mailto:?subject=${subject}&body=${body}`)
                }}
                className="flex-1"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
        {!shareLink && (
          <Button
            onClick={createSecureShare}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Secure Link'}
          </Button>
        )}
      </div>
    </div>
  )
}
