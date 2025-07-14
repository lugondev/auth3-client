'use client'

import { useParams, usePathname } from 'next/navigation'

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // If this is a specific tenant route (with tenantId), let the [tenantId] layout handle it
  if (pathname.match(/^\/dashboard\/tenant\/[^\/]+/)) {
    return <>{children}</>
  }

  // For other tenant routes (/dashboard/tenant, /dashboard/tenant/management, etc.)
  // These should use normal dashboard layout with AppShell
  return <>{children}</>
}
