/**
 * VP State Machine Types - For managing VP lifecycle states
 */

// VP State Transition Record
export interface VPStateTransitionRecord {
  id: string
  presentationId: string // Changed from presentationId to match JSON
  fromState: string     // Changed from fromState to match JSON
  toState: string       // Changed from toState to match JSON
  actor: string
  timestamp: string
  success: boolean
  errorMessage?: string // Changed from errorMessage to match JSON
  duration: number       // in milliseconds
  metadata?: {
    actor: string
    errors: string[]
    warnings: string[]
    notExpired: boolean
    proofValid: boolean
    domainValid: boolean
    holderValid: boolean
    challengeValid: boolean
    credentialsValid: boolean
    verificationValid: boolean
    verificationMethod: string
    verificationService: Record<string, string>
  }
  presentation?: unknown     // Added to match JSON (nullable)
  createdAt: string     // Changed from createdAt to match JSON
  updatedAt: string     // Changed from updatedAt to match JSON
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
  metadata?: Record<string, string>
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
  metadata?: Record<string, string>
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
