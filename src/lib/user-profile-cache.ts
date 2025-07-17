import { UserOutput } from '@/types/user'

// User profile cache service to prevent API spam
class UserProfileCache {
	private cache: Map<string, { data: UserOutput; timestamp: number }> = new Map()
	private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

	getKey(userId: string, contextMode: string): string {
		return `${userId}-${contextMode}`
	}

	get(userId: string, contextMode: string): UserOutput | null {
		const key = this.getKey(userId, contextMode)
		const cached = this.cache.get(key)

		if (!cached) return null

		const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION
		if (isExpired) {
			this.cache.delete(key)
			return null
		}

		return cached.data
	}

	set(userId: string, contextMode: string, data: UserOutput) {
		const key = this.getKey(userId, contextMode)
		this.cache.set(key, {
			data,
			timestamp: Date.now()
		})
	}

	clear(userId?: string, contextMode?: string) {
		if (userId && contextMode) {
			const key = this.getKey(userId, contextMode)
			this.cache.delete(key)
		} else {
			this.cache.clear()
		}
	}

	// Clear expired entries
	cleanup() {
		const now = Date.now()
		for (const [key, value] of this.cache.entries()) {
			if (now - value.timestamp > this.CACHE_DURATION) {
				this.cache.delete(key)
			}
		}
	}
}

export const userProfileCache = new UserProfileCache()

// Cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
	setInterval(() => {
		userProfileCache.cleanup()
	}, 10 * 60 * 1000)
}
