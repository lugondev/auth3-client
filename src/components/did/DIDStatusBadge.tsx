import React from 'react'
import { Badge } from '@/components/ui/badge'
import { DIDStatus } from '@/types/did'

interface DIDStatusBadgeProps {
  status: string
  className?: string
}

export function DIDStatusBadge({ status, className }: DIDStatusBadgeProps) {
  switch (status) {
    case DIDStatus.ACTIVE:
      return (
        <Badge variant="default" className={`bg-green-100 text-green-800 ${className}`}>
          Active
        </Badge>
      )
    case DIDStatus.DEACTIVATED:
      return (
        <Badge variant="secondary" className={className}>
          Deactivated
        </Badge>
      )
    case DIDStatus.REVOKED:
      return (
        <Badge variant="destructive" className={className}>
          Revoked
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={className}>
          Unknown
        </Badge>
      )
  }
}
