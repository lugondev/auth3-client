'use client'

import React, {Component, ReactNode} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {AlertCircle, RefreshCw} from 'lucide-react'

interface ErrorBoundaryState {
	hasError: boolean
	error?: Error
}

interface ErrorBoundaryProps {
	children: ReactNode
	fallback?: ReactNode
}

/**
 * Error Boundary Component
 * Catches React errors and provides graceful fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = {hasError: false}
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {hasError: true, error}
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('Error caught by ErrorBoundary:', error, errorInfo)
	}

	handleReset = () => {
		this.setState({hasError: false, error: undefined})
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback
			}

			return (
				<Card className="m-4">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-red-600">
							<AlertCircle className="h-5 w-5" />
							Something went wrong
						</CardTitle>
						<CardDescription>
							An error occurred while rendering this component
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{this.state.error && (
							<div className="text-sm text-muted-foreground bg-muted p-3 rounded">
								<strong>Error:</strong> {this.state.error.message}
							</div>
						)}
						<Button onClick={this.handleReset} className="flex items-center gap-2">
							<RefreshCw className="h-4 w-4" />
							Try Again
						</Button>
					</CardContent>
				</Card>
			)
		}

		return this.props.children
	}
}
