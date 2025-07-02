'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Shield,
  FileCheck,
  Eye,
  Play,
  Pause,
  StopCircle,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'

interface VerifiableCredential {
  id: string
  type: string[]
  credentialSubject: Record<string, any>
  issuer: string
  issuanceDate: string
  expirationDate?: string
  proof?: any
  [key: string]: any
}

interface VerifiablePresentation {
  id: string
  type: string[]
  verifiableCredential: VerifiableCredential[]
  holder: string
  proof?: any
  [key: string]: any
}

interface VerificationResult {
  id: string
  status: 'pending' | 'verified' | 'failed' | 'warning'
  credential: VerifiableCredential
  errors: string[]
  warnings: string[]
  checks: VerificationCheck[]
  duration: number
  timestamp: string
  metadata: VerificationMetadata
}

interface VerificationCheck {
  name: string
  status: 'passed' | 'failed' | 'skipped' | 'warning'
  message: string
  details?: Record<string, any>
}

interface VerificationMetadata {
  issuerVerified: boolean
  schemaValid: boolean
  signatureValid: boolean
  notExpired: boolean
  notRevoked: boolean
  trustScore: number
}

interface BatchVerificationProps {
  isOpen: boolean
  onClose: () => void
  items: (VerifiableCredential | VerifiablePresentation)[]
  onComplete?: (results: VerificationResult[]) => void
  mode?: 'credentials' | 'presentations'
  className?: string
}

interface BatchProgress {
  total: number
  completed: number
  verified: number
  failed: number
  warnings: number
  currentItem?: string
  estimatedTime?: number
}

/**
 * BatchVerification Component - Multi-credential verification interface
 * 
 * Features:
 * - Parallel verification processing
 * - Real-time progress tracking  
 * - Detailed verification results
 * - Export capabilities
 * - Resume/pause functionality
 */
export function BatchVerification({ 
  isOpen, 
  onClose, 
  items = [],
  onComplete,
  mode = 'credentials',
  className = '' 
}: BatchVerificationProps) {
  const [results, setResults] = useState<VerificationResult[]>([])
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    completed: 0,
    verified: 0,
    failed: 0,
    warnings: 0
  })
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeTab, setActiveTab] = useState('progress')
  const [selectedResult, setSelectedResult] = useState<VerificationResult | null>(null)
  const [verificationQueue, setVerificationQueue] = useState<(VerifiableCredential | VerifiablePresentation)[]>([])

  // Initialize verification queue
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setVerificationQueue([...items])
      setResults([])
      setProgress({
        total: items.length,
        completed: 0,
        verified: 0,
        failed: 0,
        warnings: 0
      })
    }
  }, [isOpen, items])

  /**
   * Start batch verification
   */
  const startVerification = useCallback(async () => {
    if (verificationQueue.length === 0) return

    setIsRunning(true)
    setIsPaused(false)
    
    const startTime = Date.now()
    
    try {
      // Process items in batches of 3 for performance
      const batchSize = 3
      const batches = []
      
      for (let i = 0; i < verificationQueue.length; i += batchSize) {
        batches.push(verificationQueue.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        if (isPaused) break

        // Process batch in parallel
        const batchPromises = batch.map(item => verifyItem(item))
        const batchResults = await Promise.all(batchPromises)
        
        // Update results and progress
        setResults(prev => [...prev, ...batchResults])
        
        setProgress(prev => {
          const newCompleted = prev.completed + batch.length
          const newVerified = prev.verified + batchResults.filter(r => r.status === 'verified').length
          const newFailed = prev.failed + batchResults.filter(r => r.status === 'failed').length
          const newWarnings = prev.warnings + batchResults.filter(r => r.status === 'warning').length
          
          const elapsedTime = Date.now() - startTime
          const avgTimePerItem = elapsedTime / newCompleted
          const estimatedTime = avgTimePerItem * (prev.total - newCompleted)

          return {
            ...prev,
            completed: newCompleted,
            verified: newVerified,
            failed: newFailed,
            warnings: newWarnings,
            estimatedTime: Math.round(estimatedTime / 1000) // in seconds
          }
        })

        // Short delay between batches to prevent overwhelming the API
        if (!isPaused) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      setIsRunning(false)
      
      // Call completion callback
      onComplete?.(results)
      
      toast.success('Batch verification completed')
    } catch (error) {
      console.error('Batch verification error:', error)
      toast.error('Batch verification failed')
      setIsRunning(false)
    }
  }, [verificationQueue, isPaused, results, onComplete])

  /**
   * Verify individual item
   */
  const verifyItem = async (item: VerifiableCredential | VerifiablePresentation): Promise<VerificationResult> => {
    const startTime = Date.now()
    
    try {
      setProgress(prev => ({ 
        ...prev, 
        currentItem: item.id || 'Unknown ID' 
      }))

      const endpoint = mode === 'credentials' 
        ? '/api/v1/credentials/verify'
        : '/api/v1/presentations/verify'

      const response = await apiClient.post(endpoint, {
        [mode === 'credentials' ? 'credential' : 'presentation']: item
      })

      const duration = Date.now() - startTime
      const verificationData = response.data

      // Map API response to our result format
      const result: VerificationResult = {
        id: item.id || `temp_${Date.now()}`,
        status: determineStatus(verificationData),
        credential: mode === 'credentials' ? item as VerifiableCredential : (item as VerifiablePresentation).verifiableCredential[0],
        errors: (verificationData as any).errors || [],
        warnings: (verificationData as any).warnings || [],
        checks: mapVerificationChecks(verificationData),
        duration,
        timestamp: new Date().toISOString(),
        metadata: extractMetadata(verificationData)
      }

      return result
    } catch (error: any) {
      const duration = Date.now() - startTime
      
      return {
        id: item.id || `temp_${Date.now()}`,
        status: 'failed',
        credential: mode === 'credentials' ? item as VerifiableCredential : (item as VerifiablePresentation).verifiableCredential[0],
        errors: [error.response?.data?.message || 'Verification failed'],
        warnings: [],
        checks: [],
        duration,
        timestamp: new Date().toISOString(),
        metadata: {
          issuerVerified: false,
          schemaValid: false,
          signatureValid: false,
          notExpired: false,
          notRevoked: false,
          trustScore: 0
        }
      }
    }
  }

  /**
   * Pause verification
   */
  const pauseVerification = () => {
    setIsPaused(true)
    toast.info('Verification paused')
  }

  /**
   * Resume verification
   */
  const resumeVerification = () => {
    setIsPaused(false)
    toast.info('Verification resumed')
  }

  /**
   * Stop verification
   */
  const stopVerification = () => {
    setIsRunning(false)
    setIsPaused(false)
    toast.info('Verification stopped')
  }

  /**
   * Export results
   */
  const exportResults = () => {
    const exportData = {
      summary: {
        total: progress.total,
        verified: progress.verified,
        failed: progress.failed,
        warnings: progress.warnings,
        timestamp: new Date().toISOString()
      },
      results: results
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `verification-results-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Render progress tab
   */
  const renderProgressTab = () => {
    const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0

    return (
      <div className="space-y-4">
        {/* Overall Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Verification Progress</span>
              <Badge variant={isRunning ? "default" : "secondary"}>
                {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span>{progress.completed} of {progress.total} items</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>

            {progress.currentItem && (
              <p className="text-xs text-muted-foreground">
                Currently processing: {progress.currentItem}
              </p>
            )}

            {progress.estimatedTime && progress.estimatedTime > 0 && (
              <p className="text-xs text-muted-foreground">
                Estimated time remaining: {Math.floor(progress.estimatedTime / 60)}m {progress.estimatedTime % 60}s
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-semibold">{progress.verified}</span>
              </div>
              <p className="text-xs text-muted-foreground">Verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="font-semibold">{progress.failed}</span>
              </div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">{progress.warnings}</span>
              </div>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{progress.total - progress.completed}</span>
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-2">
          {!isRunning && progress.completed < progress.total && (
            <Button onClick={startVerification} size="sm">
              <Play className="h-3 w-3 mr-1" />
              Start Verification
            </Button>
          )}

          {isRunning && !isPaused && (
            <Button onClick={pauseVerification} variant="outline" size="sm">
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
          )}

          {isRunning && isPaused && (
            <Button onClick={resumeVerification} size="sm">
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
          )}

          {isRunning && (
            <Button onClick={stopVerification} variant="destructive" size="sm">
              <StopCircle className="h-3 w-3 mr-1" />
              Stop
            </Button>
          )}
        </div>
      </div>
    )
  }

  /**
   * Render results tab
   */
  const renderResultsTab = () => (
    <div className="space-y-3">
      <ScrollArea className="h-80">
        {results.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No verification results yet
          </div>
        ) : (
          results.map((result) => (
            <Card key={result.id} className="mb-3">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.status === 'verified' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {result.status === 'failed' && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {result.status === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    {result.status === 'pending' && (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                    
                    <div>
                      <p className="text-sm font-medium">
                        {result.credential.credentialSubject.name || result.credential.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.credential.type?.join(', ') || 'Unknown Type'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={
                      result.status === 'verified' ? 'default' :
                      result.status === 'failed' ? 'destructive' :
                      result.status === 'warning' ? 'secondary' : 'outline'
                    } className="text-xs">
                      {result.status}
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedResult(result)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="mt-2 text-xs text-muted-foreground">
                  <span>Trust Score: {Math.round(result.metadata.trustScore * 100)}% • </span>
                  <span>Duration: {result.duration}ms</span>
                  {result.errors.length > 0 && (
                    <span> • {result.errors.length} error(s)</span>
                  )}
                  {result.warnings.length > 0 && (
                    <span> • {result.warnings.length} warning(s)</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollArea>
    </div>
  )

  /**
   * Render detail view for selected result
   */
  const renderDetailView = () => {
    if (!selectedResult) return null

    return (
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Verification Details
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {/* Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={
                    selectedResult.status === 'verified' ? 'default' :
                    selectedResult.status === 'failed' ? 'destructive' :
                    selectedResult.status === 'warning' ? 'secondary' : 'outline'
                  }>
                    {selectedResult.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              {/* Checks */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Verification Checks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedResult.checks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{check.name}</span>
                      <Badge variant={
                        check.status === 'passed' ? 'default' :
                        check.status === 'failed' ? 'destructive' :
                        check.status === 'warning' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {check.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Errors */}
              {selectedResult.errors.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {selectedResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {selectedResult.warnings.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-yellow-600">Warnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {selectedResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedResult(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`max-w-4xl max-h-[90vh] ${className}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Batch Verification
            </DialogTitle>
            <DialogDescription>
              Verify multiple {mode} simultaneously with detailed progress tracking
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
              </TabsList>

              <div className="h-96 overflow-auto mt-4">
                <TabsContent value="progress">{renderProgressTab()}</TabsContent>
                <TabsContent value="results">{renderResultsTab()}</TabsContent>
              </div>
            </Tabs>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {progress.total} items • {progress.completed} completed
            </div>
            
            <div className="flex gap-2">
              {results.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportResults}>
                  <Download className="h-3 w-3 mr-1" />
                  Export Results
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail view dialog */}
      {renderDetailView()}
    </>
  )
}

/**
 * Helper functions
 */
function determineStatus(verificationData: any): 'verified' | 'failed' | 'warning' | 'pending' {
  if (verificationData.errors?.length > 0) return 'failed'
  if (verificationData.warnings?.length > 0) return 'warning'
  if (verificationData.valid === true) return 'verified'
  return 'pending'
}

function mapVerificationChecks(verificationData: any): VerificationCheck[] {
  const checks: VerificationCheck[] = []
  
  if (verificationData.checks) {
    Object.entries(verificationData.checks).forEach(([name, result]: [string, any]) => {
      checks.push({
        name: formatCheckName(name),
        status: result.passed ? 'passed' : 'failed',
        message: result.message || '',
        details: result.details
      })
    })
  }

  return checks
}

function extractMetadata(verificationData: any): VerificationMetadata {
  return {
    issuerVerified: verificationData.issuerVerified || false,
    schemaValid: verificationData.schemaValid || false,
    signatureValid: verificationData.signatureValid || false,
    notExpired: verificationData.notExpired || false,
    notRevoked: verificationData.notRevoked || false,
    trustScore: verificationData.trustScore || 0
  }
}

function formatCheckName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

export default BatchVerification
