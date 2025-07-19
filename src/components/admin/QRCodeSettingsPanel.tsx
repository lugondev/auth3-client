'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, QrCode, Clock, Shield, Smartphone } from 'lucide-react'

interface QRCodeSettings {
  enabled: boolean
  session_ttl: number
  poll_interval: number
  max_poll_duration: number
  max_sessions: number
  size: number
  challenge_length?: number
  require_encryption?: boolean
}

export function QRCodeSettingsPanel() {
  const [settings, setSettings] = useState<QRCodeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load settings
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/v1/oauth2/qr/settings')
      if (!response.ok) {
        throw new Error('Failed to load QR settings')
      }
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  // Save settings (this would require admin API)
  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Note: This endpoint would need to be implemented for admin users
      const response = await fetch('/api/v1/oauth2/qr/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Add proper auth
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Unable to load QR code settings. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Settings Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            QR Code Login Settings
          </CardTitle>
          <CardDescription>
            Configure QR code authentication options for your application
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enabled">QR Code Login</Label>
              <p className="text-sm text-gray-600">
                Enable or disable QR code authentication
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => prev ? { ...prev, enabled: checked } : null)
                }
              />
              <Badge variant={settings.enabled ? 'default' : 'secondary'}>
                {settings.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>

          {/* Session Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session_ttl" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Session TTL (seconds)
              </Label>
              <Input
                id="session_ttl"
                type="number"
                value={settings.session_ttl}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  session_ttl: parseInt(e.target.value) || 300
                } : null)}
                min={60}
                max={3600}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-gray-500">
                How long QR codes remain valid (60-3600 seconds)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_sessions" className="flex items-center gap-1">
                <QrCode className="h-4 w-4" />
                Max Concurrent Sessions
              </Label>
              <Input
                id="max_sessions"
                type="number"
                value={settings.max_sessions}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  max_sessions: parseInt(e.target.value) || 1000
                } : null)}
                min={10}
                max={10000}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-gray-500">
                Maximum active QR sessions (10-10000)
              </p>
            </div>
          </div>

          {/* Polling Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poll_interval" className="flex items-center gap-1">
                <Smartphone className="h-4 w-4" />
                Poll Interval (seconds)
              </Label>
              <Input
                id="poll_interval"
                type="number"
                value={settings.poll_interval}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  poll_interval: parseInt(e.target.value) || 2
                } : null)}
                min={1}
                max={30}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-gray-500">
                How often web clients check for updates (1-30 seconds)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_poll_duration" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Max Poll Duration (seconds)
              </Label>
              <Input
                id="max_poll_duration"
                type="number"
                value={settings.max_poll_duration}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  max_poll_duration: parseInt(e.target.value) || 300
                } : null)}
                min={30}
                max={3600}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-gray-500">
                Maximum time clients will poll (30-3600 seconds)
              </p>
            </div>
          </div>

          {/* QR Code Display Settings */}
          <div className="space-y-2">
            <Label htmlFor="size" className="flex items-center gap-1">
              <QrCode className="h-4 w-4" />
              QR Code Size (pixels)
            </Label>
            <Input
              id="size"
              type="number"
              value={settings.size}
              onChange={(e) => setSettings(prev => prev ? {
                ...prev,
                size: parseInt(e.target.value) || 256
              } : null)}
              min={128}
              max={512}
              disabled={!settings.enabled}
            />
            <p className="text-xs text-gray-500">
              Default QR code image size (128-512 pixels)
            </p>
          </div>

          {/* Security Settings */}
          {(settings.challenge_length || settings.require_encryption) && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Security Settings
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.challenge_length && (
                  <div className="space-y-2">
                    <Label>Challenge Length</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{settings.challenge_length} bytes</Badge>
                      <span className="text-xs text-gray-500">Random challenge size</span>
                    </div>
                  </div>
                )}

                {settings.require_encryption && (
                  <div className="space-y-2">
                    <Label>Encryption Required</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={settings.require_encryption ? 'default' : 'secondary'}>
                        {settings.require_encryption ? 'Required' : 'Optional'}
                      </Badge>
                      <span className="text-xs text-gray-500">QR payload encryption</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert>
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription className="text-green-600">
                Settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={saveSettings} 
              disabled={saving || !settings.enabled}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button 
              onClick={loadSettings} 
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <h4 className="font-medium">Recommended Settings:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Session TTL: 300 seconds (5 minutes) for optimal user experience</li>
              <li>Poll Interval: 2-3 seconds to balance responsiveness and server load</li>
              <li>Max Sessions: Based on your expected concurrent users</li>
              <li>QR Size: 256px for mobile scanning, larger for desktop display</li>
            </ul>
          </div>
          
          <div className="text-sm space-y-2">
            <h4 className="font-medium">Security Considerations:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Shorter session TTL reduces exposure time but may frustrate users</li>
              <li>Enable encryption for sensitive environments</li>
              <li>Monitor failed scan attempts for potential abuse</li>
              <li>Implement rate limiting on QR generation endpoints</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
