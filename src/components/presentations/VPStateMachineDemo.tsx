// VP State Machine Demo Component
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Play, 
  ArrowRight, 
  RefreshCw, 
  Activity, 
  CheckCircle, 
  XCircle,
  Clock,
  User
} from 'lucide-react'

import { VPStateTimeline } from '@/components/presentations/VPStateTimeline'
import { VPStateAnalytics } from '@/components/presentations/VPStateAnalytics'
import { 
  triggerVPStateTransition, 
  getValidTransitions,
  getCurrentVPState,
  VPStateEventListener 
} from '@/services/vpStateMachineService'

interface VPStateMachineDemoProps {
  presentationId?: string
  onPresentationSelect?: (id: string) => void
}

/**
 * VP State Machine Demo Component
 * 
 * Demonstrates all VP state transition capabilities:
 * - Manual state transitions
 * - Real-time event listening
 * - State validation
 * - Timeline visualization
 * - Analytics dashboard
 */
export function VPStateMachineDemo({ 
  presentationId, 
  onPresentationSelect 
}: VPStateMachineDemoProps) {
  // State management
  const [selectedVP, setSelectedVP] = useState<string>(presentationId || '')
  const [currentState, setCurrentState] = useState<string>('pending')
  const [validTransitions, setValidTransitions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [eventListener] = useState(() => new VPStateEventListener())
  const [events, setEvents] = useState<any[]>([])

  // Demo scenarios
  const demoScenarios = [
    {
      name: 'Happy Path Flow',
      description: 'Complete verification journey: pending → submitted → verified',
      steps: ['pending', 'submitted', 'verified'],
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      name: 'Rejection Flow',
      description: 'Verification fails: pending → submitted → rejected',
      steps: ['pending', 'submitted', 'rejected'],
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      name: 'Revocation Flow',
      description: 'Post-verification revocation: verified → revoked',
      steps: ['verified', 'revoked'],
      icon: RefreshCw,
      color: 'text-orange-600'
    },
    {
      name: 'Withdrawal Flow',
      description: 'User withdraws submission: submitted → pending',
      steps: ['submitted', 'pending'],
      icon: ArrowRight,
      color: 'text-blue-600'
    }
  ]

  // Initialize component
  useEffect(() => {
    if (selectedVP) {
      loadCurrentState()
      setupEventListener()
    }

    return () => {
      eventListener.disconnect()
    }
  }, [selectedVP])

  // Load current state and valid transitions
  const loadCurrentState = async () => {
    if (!selectedVP) return

    try {
      const stateInfo = await getCurrentVPState(selectedVP)
      setCurrentState(stateInfo.currentState)

      const transitionsInfo = await getValidTransitions(selectedVP, stateInfo.currentState)
      setValidTransitions(transitionsInfo.validTransitions)
    } catch (error) {
      console.error('Error loading VP state:', error)
      toast.error('Failed to load VP state information')
    }
  }

  // Setup real-time event listening
  const setupEventListener = () => {
    eventListener.connect()

    eventListener.on('STATE_CHANGED', (event) => {
      if (event.presentationId === selectedVP) {
        setCurrentState(event.toState)
        setEvents(prev => [...prev, { ...event, timestamp: new Date() }])
        
        toast.success(`VP transitioned to ${event.toState}`, {
          description: `Actor: ${event.actor}`
        })

        // Refresh valid transitions
        loadCurrentState()
      }
    })

    eventListener.on('TRANSITION_FAILED', (event) => {
      if (event.presentationId === selectedVP) {
        setEvents(prev => [...prev, { ...event, timestamp: new Date() }])
        toast.error(`Transition failed: ${event.metadata?.error || 'Unknown error'}`)
      }
    })
  }

  // Manual state transition
  const handleStateTransition = async (targetState: string, actor: string = 'demo_user') => {
    if (!selectedVP) {
      toast.error('Please select a presentation first')
      return
    }

    setLoading(true)
    try {
      await triggerVPStateTransition({
        presentationId: selectedVP,
        newState: targetState,
        actor,
        metadata: {
          source: 'demo_interface',
          timestamp: new Date().toISOString(),
          demo_action: true,
          previous_state: currentState
        }
      })

      toast.success(`Successfully triggered transition to ${targetState}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to transition: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Run demo scenario
  const runDemoScenario = async (scenario: typeof demoScenarios[0]) => {
    if (!selectedVP) {
      toast.error('Please select a presentation first')
      return
    }

    setLoading(true)
    toast.info(`Running scenario: ${scenario.name}`)

    try {
      for (let i = 0; i < scenario.steps.length - 1; i++) {
        const currentStep = scenario.steps[i]
        const nextStep = scenario.steps[i + 1]
        
        // Wait a bit between transitions for demo effect
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

        await triggerVPStateTransition({
          presentationId: selectedVP,
          newState: nextStep,
          actor: `demo_scenario_${scenario.name.toLowerCase().replace(' ', '_')}`,
          metadata: {
            scenario: scenario.name,
            step: i + 1,
            total_steps: scenario.steps.length - 1,
            timestamp: new Date().toISOString()
          }
        })

        toast.info(`Step ${i + 1}: ${currentStep} → ${nextStep}`)
      }

      toast.success(`Scenario "${scenario.name}" completed successfully!`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Scenario failed: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Get state badge color
  const getStateBadgeColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'verified': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'expired': return 'bg-gray-100 text-gray-600 border-gray-300'
      case 'revoked': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            VP State Machine Demo
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Presentation ID:</span>
              <input
                type="text"
                value={selectedVP}
                onChange={(e) => setSelectedVP(e.target.value)}
                placeholder="Enter presentation ID"
                className="px-3 py-1 border rounded text-sm"
              />
            </div>
            {currentState && (
              <Badge className={getStateBadgeColor(currentState)}>
                Current: {currentState}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manual">Manual Transitions</TabsTrigger>
          <TabsTrigger value="scenarios">Demo Scenarios</TabsTrigger>
          <TabsTrigger value="timeline">State Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Manual Transitions */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual State Transitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Valid transitions from {currentState}:</span>
                  {validTransitions.length === 0 ? (
                    <span className="text-gray-400">None available</span>
                  ) : null}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {validTransitions.map(state => (
                    <Button
                      key={state}
                      variant="outline"
                      onClick={() => handleStateTransition(state)}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <ArrowRight className="h-3 w-3" />
                      Transition to {state}
                    </Button>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={loadCurrentState}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh State
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Real-time Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-sm text-gray-500">No events yet. Trigger a state transition to see real-time updates.</p>
                ) : (
                  events.slice().reverse().map((event, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                        <span className="text-gray-600">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1">
                        {event.fromState} → {event.toState} 
                        <span className="text-gray-500 ml-2">by {event.actor}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demo Scenarios */}
        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Demo Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {demoScenarios.map((scenario) => {
                  const IconComponent = scenario.icon
                  return (
                    <Card key={scenario.name} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-5 w-5 ${scenario.color} mt-0.5`} />
                          <div className="flex-1">
                            <h3 className="font-semibold">{scenario.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              {scenario.steps.map((step, index) => (
                                <React.Fragment key={step}>
                                  <Badge variant="outline" className="text-xs">{step}</Badge>
                                  {index < scenario.steps.length - 1 && (
                                    <ArrowRight className="h-3 w-3" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              className="mt-3 w-full"
                              onClick={() => runDemoScenario(scenario)}
                              disabled={loading || !selectedVP}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Run Scenario
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* State Timeline */}
        <TabsContent value="timeline">
          {selectedVP ? (
            <VPStateTimeline
              presentationId={selectedVP}
              autoRefresh={true}
              showMetadata={true}
              onStatusChange={(status) => setCurrentState(status || 'unknown')}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Enter a presentation ID to view state timeline</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <VPStateAnalytics
            presentationId={selectedVP}
            autoRefresh={true}
            dateRange={{
              startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date().toISOString()
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default VPStateMachineDemo
