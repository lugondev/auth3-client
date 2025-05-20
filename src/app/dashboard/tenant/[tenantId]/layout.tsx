'use client'

import React, {useEffect} from 'react'
import {useParams, useRouter} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'

interface TenantLayoutProps {
	children: React.ReactNode
}

export default function TenantLayout({children}: TenantLayoutProps) {
	const params = useParams()
	const router = useRouter()
	const {user, loading} = useAuth()
	const tenantId = params.tenantId as string

	useEffect(() => {
		if (loading) return
		// If no user or tenant_id mismatch, redirect
		if (!user || !user.tenant_id || user.tenant_id !== tenantId) {
			router.replace('/dashboard')
		}
	}, [user, tenantId, loading, router])

	// Optionally, show nothing or a loader while checking
	if (loading) {
		return null
	}
	if (!user || !user.tenant_id || user.tenant_id !== tenantId) {
		// Prevent flicker before redirect
		return null
	}

	return <>{children}</>
}
