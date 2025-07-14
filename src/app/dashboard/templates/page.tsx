'use client'

import React from 'react'
import { redirect } from 'next/navigation'

/**
 * Templates Dashboard Page - Redirects to credential templates
 * Since templates are primarily for credentials, redirect to the main credential templates page
 */
export default function TemplatesPage() {
	// Redirect to credential templates page
	redirect('/dashboard/credentials/templates')
	
	return null
}
