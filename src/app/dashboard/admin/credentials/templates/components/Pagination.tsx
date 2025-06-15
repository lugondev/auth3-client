'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
	if (totalPages <= 1) {
		return null
	}

	return (
		<div className="flex justify-center items-center gap-2 mt-6">
			<Button
				variant="outline"
				size="sm"
				disabled={currentPage === 1}
				onClick={() => onPageChange(currentPage - 1)}
			>
				Previous
			</Button>
			<span className="text-sm text-gray-600">
				Page {currentPage} of {totalPages}
			</span>
			<Button
				variant="outline"
				size="sm"
				disabled={currentPage === totalPages}
				onClick={() => onPageChange(currentPage + 1)}
			>
				Next
			</Button>
		</div>
	)
}