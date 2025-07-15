'use client'

import { useState } from 'react'
import { Shield, Check, X, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'

import { credentialService } from '@/services/credentialService'
import type { VerifiableCredential, VerifyCredentialResponse } from '@/services/credentialService'

interface QuickVerifyButtonProps {
	credential: VerifiableCredential
	variant?: 'icon' | 'dropdown'
	size?: 'sm' | 'default'
	className?: string
}

/**
 * QuickVerifyButton Component - Quick verification action for credentials
 * 
 * Features:
 * - Instant verification trigger
 * - Loading states
 * - Results display with tooltips
 * - Two variants: icon button or dropdown item
 */
export function QuickVerifyButton({ 
	credential, 
	variant = 'dropdown',
	size = 'default',
	className = '' 
}: QuickVerifyButtonProps) {
	const [isVerifying, setIsVerifying] = useState(false)
	const [lastResult, setLastResult] = useState<VerifyCredentialResponse | null>(null)

	const handleVerify = async (e?: React.MouseEvent) => {
		e?.preventDefault()
		e?.stopPropagation()

		if (isVerifying) return

		setIsVerifying(true)
		try {
			const result = await credentialService.verifyCredential({
				credential
			})
			
			setLastResult(result)
			
			if (result.valid) {
				toast.success('Credential verification passed', {
					description: 'All verification checks completed successfully'
				})
			} else {
				toast.warning('Credential verification failed', {
					description: result.errors?.join(', ') || 'Some verification checks failed'
				})
			}
		} catch (error) {
			console.error('Verification error:', error)
			toast.error('Verification failed', {
				description: 'Unable to verify credential at this time'
			})
			setLastResult(null)
		} finally {
			setIsVerifying(false)
		}
	}

	const getResultIcon = () => {
		if (isVerifying) {
			return <Loader2 className="h-4 w-4 animate-spin" />
		}
		
		if (!lastResult) {
			return <Shield className="h-4 w-4" />
		}
		
		if (lastResult.valid) {
			return <Check className="h-4 w-4 text-green-600" />
		}
		
		return <X className="h-4 w-4 text-red-600" />
	}

	const getResultTooltip = () => {
		if (isVerifying) {
			return 'Verifying credential...'
		}
		
		if (!lastResult) {
			return 'Click to verify credential'
		}
		
		if (lastResult.valid) {
			return 'Verification passed'
		}
		
		return `Verification failed: ${lastResult.errors?.join(', ') || 'Unknown error'}`
	}

	const getResultBadge = () => {
		if (isVerifying) {
			return (
				<Badge variant="secondary" className="gap-1">
					<Loader2 className="h-3 w-3 animate-spin" />
					Verifying
				</Badge>
			)
		}
		
		if (!lastResult) return null
		
		if (lastResult.valid) {
			return (
				<Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
					<Check className="h-3 w-3" />
					Valid
				</Badge>
			)
		}
		
		return (
			<Badge variant="secondary" className="gap-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
				<AlertTriangle className="h-3 w-3" />
				Invalid
			</Badge>
		)
	}

	if (variant === 'icon') {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size={size}
							onClick={handleVerify}
							disabled={isVerifying}
							className={`p-2 ${className}`}
						>
							{getResultIcon()}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{getResultTooltip()}</p>
						{lastResult && !lastResult.valid && lastResult.errors && (
							<div className="mt-1 text-xs">
								{lastResult.errors.map((error, index) => (
									<div key={index}>• {error}</div>
								))}
							</div>
						)}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	return (
		<DropdownMenuItem 
			onClick={handleVerify}
			disabled={isVerifying}
			className="gap-2"
		>
			{getResultIcon()}
			<span>Quick Verify</span>
			{lastResult && getResultBadge()}
		</DropdownMenuItem>
	)
}
