import { useEffect, useState } from 'react'
import { listDIDs } from '@/services/didService'
import type { DIDResponse } from '@/types/did'

export function useUserDIDs() {
	const [dids, setDIDs] = useState<DIDResponse[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		setLoading(true)
		listDIDs({ limit: 100 })
			.then((res) => setDIDs(res.dids || []))
			.catch((err) => setError(err?.message || 'Failed to load DIDs'))
			.finally(() => setLoading(false))
	}, [])

	return { dids, loading, error }
}
