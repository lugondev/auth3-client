/**
 * Credential Widget Component for Dashboard
 * Displays user's Verifiable Credentials overview and quick actions
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { VerifiableCredential } from '@/types/credentials'
import * as vcService from '@/services/vcService'
import { Award, Shield, Clock, AlertTriangle, Plus, Eye, FileCheck } from 'lucide-react'
import Link from 'next/link'

interface CredentialWidgetProps {
  className?: string
}

interface CredentialStats {
  total: number
  active: number
  expired: number
  revoked: number
  recentlyIssued: number
  recentlyReceived: number
}

/**
 * Get status color for credential badge
 */
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'expired':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'revoked':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'suspended':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

/**
 * Get status icon for credential
 */
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <Shield className="h-4 w-4" />
    case 'expired':
      return <Clock className="h-4 w-4" />
    case 'revoked':
    case 'suspended':
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <FileCheck className="h-4 w-4" />
  }
}

/**
 * Format credential type for display
 */
const formatCredentialType = (types: string[]): string => {
  // Remove VerifiableCredential from display
  const displayTypes = types.filter(type => type !== 'VerifiableCredential')
  if (displayTypes.length === 0) return 'Credential'
  return displayTypes[0].replace(/([A-Z])/g, ' $1').trim()
}

/**
 * Check if credential is expired
 */
const isExpired = (credential: VerifiableCredential): boolean => {
  if (!credential.expirationDate) return false
  return new Date(credential.expirationDate) < new Date()
}

export function CredentialWidget({ className }: CredentialWidgetProps) {
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([])
  const [stats, setStats] = useState<CredentialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch user's credentials
        const credentialsResponse = await vcService.listCredentials()
        const userCredentials = credentialsResponse.credentials
        setCredentials(userCredentials)
        
        // Calculate stats
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        
        const stats: CredentialStats = {
          total: userCredentials.length,
          active: userCredentials.filter(cred => 
            cred.status === 'active' && !isExpired(cred)
          ).length,
          expired: userCredentials.filter(cred => isExpired(cred)).length,
          revoked: userCredentials.filter(cred => 
            cred.status === 'revoked'
          ).length,
          recentlyIssued: userCredentials.filter(cred => 
            new Date(cred.issuanceDate) > thirtyDaysAgo
          ).length,
          recentlyReceived: userCredentials.filter(cred => 
            new Date(cred.issuanceDate) > thirtyDaysAgo
          ).length,
        }
        setStats(stats)
      } catch (err) {
        console.error('Failed to fetch credentials:', err)
        setError('Failed to load credentials')
      } finally {
        setLoading(false)
      }
    }

    fetchCredentials()
  }, [])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-8" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Award className="h-5 w-5" />
            Credentials Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Credentials Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats?.total || 0}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.active || 0}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Active</div>
          </div>
        </div>

        {/* Status Distribution */}
        {stats && stats.total > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Status</h4>
            <div className="flex flex-wrap gap-1">
              {stats.expired > 0 && (
                <Badge className={`text-xs ${getStatusColor('expired')}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  Expired: {stats.expired}
                </Badge>
              )}
              {stats.revoked > 0 && (
                <Badge className={`text-xs ${getStatusColor('revoked')}`}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Revoked: {stats.revoked}
                </Badge>
              )}
              {stats.recentlyIssued > 0 && (
                <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  <Plus className="h-3 w-3 mr-1" />
                  Recent: {stats.recentlyIssued}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Recent Credentials */}
        {credentials.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Recent Credentials</h4>
            <div className="space-y-2">
              {credentials.slice(0, 2).map((credential) => {
                const status = isExpired(credential) ? 'expired' : credential.credentialStatus || 'active'
                return (
                  <div key={credential.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <div>
                        <div className="text-sm font-medium truncate max-w-[120px]">
                          {formatCredentialType(credential.type)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(credential.issuanceDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      className={`text-xs ${getStatusColor(status)}`}
                    >
                      {status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href="/dashboard/credentials/issue">
              <Plus className="h-4 w-4 mr-1" />
              Issue
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/dashboard/credentials">
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Link>
          </Button>
        </div>

        {/* Empty State */}
        {credentials.length === 0 && (
          <div className="text-center py-4">
            <Award className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              No credentials found. Issue or receive your first credential.
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/credentials/issue">
                  <Plus className="h-4 w-4 mr-1" />
                  Issue
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/credentials/verify">
                  <FileCheck className="h-4 w-4 mr-1" />
                  Verify
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}