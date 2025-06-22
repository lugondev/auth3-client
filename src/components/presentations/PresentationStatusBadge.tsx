import React from 'react'
import {Badge} from '@/components/ui/badge'
import {PresentationStatus} from '@/types/presentations'
import {CheckCircle, Clock, XCircle, AlertTriangle, Ban} from 'lucide-react'

interface PresentationStatusBadgeProps {
	status: PresentationStatus
	className?: string
}

/**
 * PresentationStatusBadge - Visual indicator for presentation status
 */
export function PresentationStatusBadge({status, className = ''}: PresentationStatusBadgeProps) {
	const getStatusConfig = (status: PresentationStatus) => {
		switch (status) {
			case PresentationStatus.VERIFIED:
				return {
					variant: 'default' as const,
					icon: CheckCircle,
					label: 'Verified',
					className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
				}
			case PresentationStatus.PENDING:
				return {
					variant: 'secondary' as const,
					icon: Clock,
					label: 'Pending',
					className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
				}
			case PresentationStatus.REJECTED:
				return {
					variant: 'destructive' as const,
					icon: XCircle,
					label: 'Rejected',
					className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
				}
			case PresentationStatus.EXPIRED:
				return {
					variant: 'outline' as const,
					icon: AlertTriangle,
					label: 'Expired',
					className: 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-300',
				}
			case PresentationStatus.REVOKED:
				return {
					variant: 'destructive' as const,
					icon: Ban,
					label: 'Revoked',
					className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
				}
			case PresentationStatus.SUBMITTED:
				return {
					variant: 'secondary' as const,
					icon: Clock,
					label: 'Submitted',
					className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
				}
			case PresentationStatus.DRAFT:
			default:
				return {
					variant: 'outline' as const,
					icon: Clock,
					label: 'Draft',
					className: 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-300',
				}
		}
	}

	const config = getStatusConfig(status)
	const Icon = config.icon

	return (
		<Badge variant={config.variant} className={`inline-flex items-center gap-1 ${config.className} ${className}`}>
			<Icon className='h-3 w-3' />
			{config.label}
		</Badge>
	)
}
