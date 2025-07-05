'use client'

import React, { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Clock, User, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'

import type { VPStateTransitionRecord } from '@/types/vp-state-machine'
import { getVPStateTransitionHistory } from '@/services/vpStateMachineService'

interface VPStateTimelineProps {
  presentationId: string
  className?: string
  showMetadata?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  onStatusChange?: (currentStatus: string | null) => void
}

/**
 * VPStateTimeline Component - Displays the state transition history for a VP
 * 
 * Features:
 * - Chronological timeline of state transitions
 * - Success/failure indicators
 * - Actor information
 * - Duration tracking
 * - Expandable metadata
 * - Auto-refresh capability
 */
export function VPStateTimeline({
  presentationId,
  className = '',
  showMetadata = true,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  onStatusChange
}: VPStateTimelineProps) {
  const [transitions, setTransitions] = useState<VPStateTransitionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Load transition history
  const loadTransitions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getVPStateTransitionHistory(presentationId, {
        page: 1,
        limit: 50 // Get all recent transitions
      })
      setTransitions(response.transitions)
      
      // Extract current status from the latest successful transition
      const currentTransition = response.transitions.find(transition => transition.success)
      const currentState = currentTransition?.toState || null
      
      // Notify parent component of status change
      if (onStatusChange) {
        onStatusChange(currentState)
      }
    } catch (err) {
      setError('Failed to load state transition history')
      console.error('Error loading VP state transitions:', err)
      
      // Clear status on error
      if (onStatusChange) {
        onStatusChange(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransitions()
  }, [presentationId])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(loadTransitions, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, presentationId])

  const toggleExpanded = (transitionId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(transitionId)) {
      newExpanded.delete(transitionId)
    } else {
      newExpanded.add(transitionId)
    }
    setExpandedItems(newExpanded)
  }

  const getStateIcon = (transition: VPStateTransitionRecord) => {
    if (transition.success) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStateBadgeColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'expired':
        return 'bg-gray-100 text-gray-600 border-gray-300'
      case 'revoked':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  const formatDuration = (duration: number) => {
    if (duration < 1000) {
      return `${duration}ms`
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`
    } else {
      return `${(duration / 60000).toFixed(1)}m`
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            State Transition Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
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
            <AlertTriangle className="h-5 w-5" />
            Error Loading Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={loadTransitions}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (transitions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            State Transition Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No state transitions found for this presentation.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          State Transition Timeline
          <Badge variant="secondary" className="ml-auto">
            {transitions.length} transitions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transitions.map((transition, index) => (
            <div key={transition.id} className="relative">
              {/* Timeline line */}
              {index < transitions.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
              )}
              
              <div className="flex items-start gap-4">
                {/* Status indicator */}
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-gray-200">
                  {getStateIcon(transition)}
                </div>
                
                {/* Transition details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline"
                          className={getStateBadgeColor(transition.fromState)}
                        >
                          {transition.fromState}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge 
                          variant="outline"
                          className={getStateBadgeColor(transition.toState)}
                        >
                          {transition.toState}
                        </Badge>
                        {!transition.success && (
                          <Badge variant="destructive" className="ml-2">
                            Failed
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[200px]" title={transition.actor}>
                            {transition.actor}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(transition.duration)}</span>
                        </div>
                        <span title={format(new Date(transition.timestamp), 'PPpp')}>
                          {formatDistanceToNow(new Date(transition.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {transition.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {transition.errorMessage}
                        </div>
                      )}
                    </div>
                    
                    {/* Expand/Collapse metadata */}
                    {showMetadata && transition.metadata && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleExpanded(transition.id)}
                          >
                            {expandedItems.has(transition.id) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                            <pre className="whitespace-pre-wrap text-gray-700">
                              {JSON.stringify(transition.metadata, null, 2)}
                            </pre>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {autoRefresh && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Auto-refreshing every {refreshInterval / 1000}s</span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTransitions}
                className="h-6 px-2 py-1 text-xs"
              >
                Refresh Now
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
