import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Copy, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { GenerateControlChallengeOutput } from '@/types/did'

interface ChallengeDisplayProps {
  challenge: GenerateControlChallengeOutput & { verification_method?: string }
  did: string
  onExpired?: () => void
}

const ChallengeDisplay: React.FC<ChallengeDisplayProps> = ({
  challenge,
  did,
  onExpired
}) => {
  const [showChallenge, setShowChallenge] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const expiresAt = new Date(challenge.expires_at).getTime()
      const remaining = Math.max(0, expiresAt - now)
      
      setTimeRemaining(remaining)
      setIsExpired(remaining === 0)
      
      if (remaining === 0 && onExpired) {
        onExpired()
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [challenge.expires_at, onExpired])

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    const totalDuration = 10 * 60 * 1000 // 10 minutes in milliseconds
    return Math.max(0, (timeRemaining / totalDuration) * 100)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    })
  }

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadChallengeData = () => {
    const data = {
      challenge_id: challenge.challenge_id,
      challenge: challenge.challenge,
      message: challenge.message,
      did: did,
      verification_method: challenge.verification_method,
      purpose: challenge.purpose,
      nonce: challenge.nonce,
      expires_at: challenge.expires_at,
      generated_at: new Date().toISOString()
    }
    
    downloadAsFile(JSON.stringify(data, null, 2), `challenge-${challenge.challenge_id}.json`)
  }

  return (
    <div className="space-y-4">
      {/* Status Alert */}
      {isExpired ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Challenge Expired:</strong> This challenge has expired. Please generate a new one to continue.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Challenge Active:</strong> You have {formatTimeRemaining(timeRemaining)} remaining to complete the signing process.
          </AlertDescription>
        </Alert>
      )}

      {/* Challenge Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Challenge Timer
          </CardTitle>
          <CardDescription>
            Time remaining before challenge expires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Time Remaining</span>
            <Badge variant={isExpired ? "destructive" : timeRemaining < 60000 ? "destructive" : "default"}>
              {isExpired ? "Expired" : formatTimeRemaining(timeRemaining)}
            </Badge>
          </div>
          <Progress 
            value={getProgressPercentage()} 
            className={`h-2 ${isExpired || timeRemaining < 60000 ? 'bg-red-100' : 'bg-green-100'}`}
          />
          <div className="text-xs text-muted-foreground">
            Expires at: {new Date(challenge.expires_at).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Challenge Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Challenge Details
          </CardTitle>
          <CardDescription>
            Information about the generated challenge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Challenge ID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Challenge ID</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(challenge.challenge_id, 'Challenge ID')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="font-mono bg-muted p-2 rounded text-sm">
              {challenge.challenge_id}
            </div>
          </div>

          {/* Challenge Data */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Challenge</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowChallenge(!showChallenge)}
                >
                  {showChallenge ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(challenge.challenge, 'Challenge')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="font-mono bg-muted p-2 rounded text-sm break-all">
              {showChallenge ? challenge.challenge : '••••••••••••••••••••••••••••••••••••••••'}
            </div>
          </div>

          {/* Message to Sign */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Message to Sign</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(challenge.message, 'Message')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadAsFile(challenge.message, 'challenge-message.txt')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="font-mono bg-green-50 border border-green-200 p-3 rounded text-sm whitespace-pre-wrap">
              {challenge.message}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Purpose</Label>
              <Badge variant="outline">{challenge.purpose}</Badge>
            </div>
            <div>
              <Label>Nonce</Label>
              <div className="font-mono bg-muted p-1 rounded text-xs">
                {challenge.nonce}
              </div>
            </div>
          </div>

          {/* DID Information */}
          <div className="space-y-2">
            <Label>DID</Label>
            <div className="font-mono bg-muted p-2 rounded text-sm break-all">
              {did}
            </div>
          </div>

          {challenge.verification_method && (
            <div className="space-y-2">
              <Label>Verification Method</Label>
              <div className="font-mono bg-muted p-2 rounded text-sm break-all">
                {challenge.verification_method}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadChallengeData}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChallengeDisplay
