/**
 * VP State Machine Service - API interactions for VP state management
 */

import { useState, useEffect } from 'react'
import apiClient from '@/lib/apiClient'
import { triggerPresentationRefresh } from '@/hooks/usePresentationRefresh'
import type {
  VPStateTransitionRecord,
  VPTransitionStatistics,
  VPStateTransitionFilters,
  VPStateTransitionRequest,
  VPStateTransitionResponse,
  VPStateEvent
} from '@/types/vp-state-machine'

const API_BASE_URL = '/api/v1/vp-state-machine'

/**
 * Trigger a VP state transition
 */
export async function triggerVPStateTransition(
  request: VPStateTransitionRequest
): Promise<VPStateTransitionResponse> {
  try {
    const response = await apiClient.post(`${API_BASE_URL}/transition`, request)
    const result = response.data as VPStateTransitionResponse
    
    // If state transition successful, trigger presentation refresh
    if (result.success) {
      console.log('🔄 VP state transition successful, triggering presentation refresh');
      await triggerPresentationRefresh();
    }
    
    return result
  } catch (error) {
    console.error('Error triggering VP state transition:', error)
    throw error
  }
}

/**
 * Get VP state transition history
 */
export async function getVPStateTransitionHistory(
  presentationId: string,
  filters?: VPStateTransitionFilters
): Promise<{
  transitions: VPStateTransitionRecord[]
  total: number
  pagination: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}> {
  try {
    const params = new URLSearchParams()
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.actor) params.append('actor', filters.actor)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.success !== undefined) params.append('success', filters.success.toString())
    if (filters?.fromState) params.append('fromState', filters.fromState)
    if (filters?.toState) params.append('toState', filters.toState)

    const queryString = params.toString()
    const url = queryString 
      ? `${API_BASE_URL}/presentations/${presentationId}/transitions?${queryString}`
      : `${API_BASE_URL}/presentations/${presentationId}/transitions`

    const response = await apiClient.get(url)
    return response.data as {
      transitions: VPStateTransitionRecord[]
      total: number
      pagination: {
        currentPage: number
        pageSize: number
        totalPages: number
        totalItems: number
      }
    }
  } catch (error) {
    console.error('Error fetching VP state transition history:', error)
    return {
      transitions: [],
      total: 0,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        totalItems: 0
      }
    }
  }
}

/**
 * Get VP state transition statistics
 */
export async function getVPStateTransitionStatistics(
  filters?: {
    startDate?: string
    endDate?: string
    presentationId?: string
    actor?: string
  }
): Promise<VPTransitionStatistics> {
  try {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.presentationId) params.append('presentationId', filters.presentationId)
    if (filters?.actor) params.append('actor', filters.actor)

    const queryString = params.toString()
    const url = queryString 
      ? `${API_BASE_URL}/statistics?${queryString}`
      : `${API_BASE_URL}/statistics`

    const response = await apiClient.get(url)
    return response.data as VPTransitionStatistics
  } catch (error) {
    console.error('Error fetching VP state transition statistics:', error)
    throw error
  }
}

/**
 * Get current VP state
 */
export async function getCurrentVPState(
  presentationId: string
): Promise<{
  currentState: string
  lastTransition?: VPStateTransitionRecord
}> {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/presentations/${presentationId}/current-state`)
    return response.data as {
      currentState: string
      lastTransition?: VPStateTransitionRecord
    }
  } catch (error) {
    console.error('Error fetching current VP state:', error)
    throw error
  }
}

/**
 * Get valid transitions for a VP state
 */
export async function getValidTransitions(
  presentationId: string,
  currentState: string
): Promise<{
  validTransitions: string[]
  rules: Record<string, any>
}> {
  try {
    const response = await apiClient.get(
      `${API_BASE_URL}/presentations/${presentationId}/valid-transitions?currentState=${currentState}`
    )
    return response.data as {
      validTransitions: string[]
      rules: Record<string, any>
    }
  } catch (error) {
    console.error('Error fetching valid transitions:', error)
    throw error
  }
}

/**
 * Check if a state transition is valid
 */
export async function isValidTransition(
  fromState: string,
  toState: string
): Promise<{
  valid: boolean
  reason?: string
}> {
  try {
    const response = await apiClient.get(
      `${API_BASE_URL}/validate-transition?fromState=${fromState}&toState=${toState}`
    )
    return response.data as {
      valid: boolean
      reason?: string
    }
  } catch (error) {
    console.error('Error validating transition:', error)
    return { valid: false, reason: 'Error validating transition' }
  }
}

/**
 * VP State Machine Event Listener using WebSocket
 */
export class VPStateEventListener {
  private ws: WebSocket | null = null
  private listeners: {
    [key: string]: ((event: VPStateEvent) => void)[]
  } = {}

  constructor(private presentationId?: string) {}

  connect() {
    if (this.ws) return

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}/ws/vp-state-events`
    this.ws = new WebSocket(wsUrl)

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as VPStateEvent
        
        // Filter by presentation ID if specified
        if (this.presentationId && data.presentationId !== this.presentationId) {
          return
        }

        // Emit event to listeners
        this.emit(data.type, data)
      } catch (error) {
        console.error('Error parsing VP state event:', error)
      }
    }

    this.ws.onclose = () => {
      // Reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  on(eventType: string, listener: (event: VPStateEvent) => void) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = []
    }
    this.listeners[eventType].push(listener)
  }

  off(eventType: string, listener: (event: VPStateEvent) => void) {
    if (this.listeners[eventType]) {
      this.listeners[eventType] = this.listeners[eventType].filter(l => l !== listener)
    }
  }

  private emit(eventType: string, event: VPStateEvent) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(listener => listener(event))
    }
  }
}

/**
 * React Hook for VP State Machine
 */
export function useVPStateMachine(presentationId?: string) {
  const [eventListener] = useState(() => new VPStateEventListener(presentationId))
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    eventListener.connect()
    setIsConnected(true)

    return () => {
      eventListener.disconnect()
      setIsConnected(false)
    }
  }, [eventListener])

  return {
    eventListener,
    isConnected,
    triggerTransition: triggerVPStateTransition,
    getHistory: getVPStateTransitionHistory,
    getStatistics: getVPStateTransitionStatistics,
    getCurrentState: getCurrentVPState,
    getValidTransitions,
    isValidTransition
  }
}
