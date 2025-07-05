/**
 * VP State Machine Types - For managing VP lifecycle states
 */

// VP State Transition Record
export interface VPStateTransitionRecord {
  id: string
  presentationId: string
  fromState: string
  toState: string
  actor: string
  timestamp: string
  success: boolean
  errorMessage?: string
  duration: number // in milliseconds
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// VP State Machine Events
export interface VPStateEvent {
  type: 'STATE_CHANGED' | 'TRANSITION_COMPLETED' | 'TRANSITION_FAILED'
  presentationId: string
  fromState: string
  toState: string
  actor: string
  timestamp: string
  success: boolean
  metadata?: Record<string, any>
}

// VP Transition Statistics
export interface VPTransitionStatistics {
  totalTransitions: number
  successfulTransitions: number
  failedTransitions: number
  successRate: number
  averageDuration: number
  transitionsByState: Record<string, Record<string, number>>
  transitionsByActor: Record<string, number>
  dailyStats?: DailyTransitionStats[]
}

export interface DailyTransitionStats {
  date: string
  total: number
  successful: number
  failed: number
}

// VP State Machine Service Types
export interface VPStateTransitionFilters {
  presentationId?: string
  actor?: string
  startDate?: string
  endDate?: string
  success?: boolean
  fromState?: string
  toState?: string
  page?: number
  limit?: number
}

export interface VPStateTransitionRequest {
  presentationId: string
  newState: string
  actor: string
  metadata?: Record<string, any>
}

export interface VPStateTransitionResponse {
  success: boolean
  transitionId: string
  presentationId: string
  fromState: string
  toState: string
  timestamp: string
  duration: number
  errorMessage?: string
}

// VP State Machine UI Components Types
export interface VPStateTimelineProps {
  presentationId: string
  transitions: VPStateTransitionRecord[]
  loading?: boolean
  className?: string
}

export interface VPStateAnalyticsProps {
  statistics: VPTransitionStatistics
  loading?: boolean
  className?: string
}

export interface VPStateEventListenerProps {
  onStateChanged?: (event: VPStateEvent) => void
  onTransitionCompleted?: (event: VPStateEvent) => void
  onTransitionFailed?: (event: VPStateEvent) => void
}
