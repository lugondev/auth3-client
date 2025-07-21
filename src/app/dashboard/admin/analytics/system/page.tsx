'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {SystemAnalyticsDashboard} from '@/components/dashboard/SystemAnalyticsDashboard'

export default function SystemAnalyticsPage() {
	const {loading} = useAuth()

	if (loading) {
		return <div>Loading...</div>
	}

	return (
		<div className='container mx-auto p-4 md:p-6'>
			<SystemAnalyticsDashboard />
		</div>
	)
}
