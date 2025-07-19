import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, AxiosRequestHeaders } from 'axios'
import { toast } from 'sonner'
import { addCSRFHeader } from './csrf'
import { rateLimiter, RATE_LIMIT_CONFIGS, isRateLimitError } from './rateLimiter'
import { tokenManager } from './token-storage'
import { contextManager } from './context-manager'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
console.log(`🔗 API Base URL: ${API_BASE_URL}`);


// Permission API endpoints that need CSRF protection
const PERMISSION_ENDPOINTS = [
	'/api/v1/tenants/',
	'/api/v1/rbac/',
	'/api/v1/permissions/',
	'/api/v1/roles/'
]

// Rate limit endpoint mapping
const ENDPOINT_RATE_LIMITS: Record<string, string> = {
	'/api/v1/rbac/check': RATE_LIMIT_CONFIGS.PERMISSION_CHECK,
	'/api/v1/rbac/check-bulk': RATE_LIMIT_CONFIGS.PERMISSION_BULK_CHECK,
	'/api/v1/permissions': RATE_LIMIT_CONFIGS.PERMISSION_REFRESH,
	'/api/v1/auth/login': RATE_LIMIT_CONFIGS.AUTH_LOGIN,
	'/api/v1/auth/refresh': RATE_LIMIT_CONFIGS.AUTH_REFRESH,
	'/api/v1/users': RATE_LIMIT_CONFIGS.USER_CREATE,
}

function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

class ApiClient {
	private instance: AxiosInstance
	private isRefreshing = false
	private failedQueue: Array<{
		resolve: (value: unknown) => void
		reject: (reason?: AxiosError | null) => void
	}> = []

	constructor() {
		this.instance = axios.create({
			baseURL: API_BASE_URL,
			timeout: 30000,
			maxRedirects: 0, // Don't follow redirects for API calls
			validateStatus: (status) => status < 400, // Accept 2xx and 3xx as success
			headers: {
				'Content-Type': 'application/json',
				'X-Request-ID': generateUUID(),
			},
			withCredentials: false, // Disable credentials to avoid CORS issues
		})

		this.setupInterceptors()
	}

	private setupInterceptors() {
		// Request interceptor
		this.instance.interceptors.request.use(
			(config) => {
				// Add auth token if available
				if (typeof window !== 'undefined') {
					// Get current context mode and tokens from tokenManager
					const currentMode = contextManager.getCurrentMode()
					const tokens = tokenManager.getTokens(currentMode)
					const token = tokens.accessToken

					// Debug logging (can be removed in production)
					if (process.env.NODE_ENV === 'development') {
						console.log(`🔍 API Request - Mode: ${currentMode}, URL: ${config.url}, Token: ${token ? 'Present' : 'Missing'}`)
					}

					if (token && !config.headers?.['__skipAuthRefresh']) {
						config.headers = config.headers || {}
						config.headers.Authorization = `Bearer ${token}`
					}

					// Add tenant context headers if in tenant mode
					if (currentMode === 'tenant') {
						const contextState = contextManager.getContextState('tenant')
						if (contextState?.tenantId) {
							config.headers = config.headers || {}
							config.headers['X-Tenant-ID'] = contextState.tenantId
							config.headers['X-Context-Mode'] = 'tenant'
							if (process.env.NODE_ENV === 'development') {
								console.log(`🏢 Tenant headers added - Tenant ID: ${contextState.tenantId}`)
							}
						}
					} else if (currentMode === 'global') {
						config.headers = config.headers || {}
						config.headers['X-Context-Mode'] = 'global'
						if (process.env.NODE_ENV === 'development') {
							console.log(`🌐 Global headers added`)
						}
					}

					// Add CSRF protection for permission APIs
					const isPermissionEndpoint = PERMISSION_ENDPOINTS.some(endpoint =>
						config.url?.includes(endpoint)
					)
					const isMutationMethod = ['post', 'put', 'patch', 'delete'].includes(
						config.method?.toLowerCase() || ''
					)

					if (isPermissionEndpoint && isMutationMethod) {
						const csrfHeaders = addCSRFHeader(config.headers as Record<string, string> || {})
						config.headers = csrfHeaders as AxiosRequestHeaders
					}

					// Apply rate limiting
					const rateLimitEndpoint = this.getRateLimitEndpoint(config.url || '')
					if (rateLimitEndpoint) {
						const userId = this.getUserIdFromToken(token || undefined)
						const rateLimitResult = rateLimiter.checkLimit(rateLimitEndpoint, userId)

						if (!rateLimitResult.allowed) {
							const error = new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.retryAfter || 0) / 1000)} seconds.`) as Error & {
								rateLimitExceeded: boolean
								retryAfter?: number
							}
							error.rateLimitExceeded = true
							error.retryAfter = rateLimitResult.retryAfter
							return Promise.reject(error)
						}
					}
				}

				// Remove skip auth header if present
				if (config.headers?.['__skipAuthRefresh']) {
					delete config.headers['__skipAuthRefresh']
				}

				return config
			},
			(error) => {
				return Promise.reject(error)
			},
		)

		// Response interceptor
		this.instance.interceptors.response.use(
			(response) => {
				// Handle redirect responses (302) for OAuth2 endpoints
				if (response.status === 302) {
					const location = response.headers['location']
					console.warn('🚨 API returned redirect:', location)

					// For OAuth2 endpoints, redirects are part of the authorization flow
					if (response.config.url?.includes('/oauth2/')) {
						// Check if redirect is to login page (user not authenticated)
						if (location?.includes('/login')) {
							const error = new Error(`OAuth2 authorization requires login - redirect to: ${location}`) as Error & {
								response?: AxiosResponse;
								isOAuth2LoginRedirect?: boolean
							}
							error.response = response
							error.isOAuth2LoginRedirect = true
							throw error
						}

						// Check if redirect is to authorize page (user authenticated, needs consent)
						if (location?.includes('/auth/oauth2/authorize')) {
							const error = new Error(`OAuth2 authorization requires user consent - redirect to: ${location}`) as Error & {
								response?: AxiosResponse;
								isOAuth2ConsentRedirect?: boolean
							}
							error.response = response
							error.isOAuth2ConsentRedirect = true
							throw error
						}

						// Other OAuth2 redirects
						const error = new Error(`OAuth2 flow redirect: ${location}`) as Error & {
							response?: AxiosResponse;
							isOAuth2Redirect?: boolean
						}
						error.response = response
						error.isOAuth2Redirect = true
						throw error
					}

					// Convert other redirects to an error to prevent browser from following it
					const error = new Error(`API returned redirect to: ${location}`) as Error & {
						response?: AxiosResponse;
						isRedirect?: boolean
					}
					error.response = response
					error.isRedirect = true
					throw error
				}

				// Check if we got HTML when expecting JSON (happens during redirects)
				const contentType = response.headers['content-type']
				if (contentType && contentType.includes('text/html') && response.config.url?.includes('/api/')) {
					console.warn('🚨 Received HTML response for API endpoint, likely due to authentication redirect')
					throw new Error('Authentication required - received redirect instead of API response')
				}
				return response
			},
			async (error: AxiosError) => {
				const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
				const statusCode = error.response?.status

				// Handle rate limit errors
				if (isRateLimitError(error)) {
					toast.error('Rate limit exceeded. Please try again later.')
					return Promise.reject(error)
				}

				// Handle 401 errors and token refresh
				if (statusCode === 401 && !originalRequest.url?.includes('/auth/refresh') && !originalRequest._retry) {
					if (this.isRefreshing) {
						return new Promise((resolve, reject) => {
							this.failedQueue.push({ resolve, reject })
						}).then(token => {
							if (originalRequest.headers) {
								originalRequest.headers.Authorization = `Bearer ${token}`
							}
							return this.instance(originalRequest)
						}).catch(err => {
							return Promise.reject(err)
						})
					}

					originalRequest._retry = true
					this.isRefreshing = true

					try {
						const newToken = await this.refreshToken()
						this.processQueue(null, newToken)

						if (originalRequest.headers) {
							originalRequest.headers.Authorization = `Bearer ${newToken}`
						}

						return this.instance(originalRequest)
					} catch (refreshError) {
						this.processQueue(refreshError as AxiosError, null)
						this.handleAuthFailure()
						return Promise.reject(refreshError)
					} finally {
						this.isRefreshing = false
					}
				}

				// Handle other errors
				if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
					toast.error((error.response.data as { message: string }).message)
				} else if (error.message) {
					toast.error(error.message)
				}

				return Promise.reject(error)
			},
		)
	}

	private getRateLimitEndpoint(url: string): string | null {
		for (const [endpoint, rateLimitKey] of Object.entries(ENDPOINT_RATE_LIMITS)) {
			if (url.includes(endpoint)) {
				return rateLimitKey
			}
		}
		return RATE_LIMIT_CONFIGS.DEFAULT
	}

	private getUserIdFromToken(token?: string): string | undefined {
		if (!token) return undefined

		try {
			const payload = JSON.parse(atob(token.split('.')[1]))
			return payload.sub || payload.user_id
		} catch {
			return undefined
		}
	}

	private async refreshToken(): Promise<string> {
		// Get current context mode and refresh token from tokenManager
		const currentMode = contextManager.getCurrentMode()
		const tokens = tokenManager.getTokens(currentMode)
		const refreshToken = tokens.refreshToken

		if (!refreshToken) {
			throw new Error('No refresh token available')
		}

		console.log(`🔄 Refreshing token for context: ${currentMode}`)

		// Prepare refresh request data with context information
		const requestData = {
			refresh_token: refreshToken,
			context_mode: currentMode
		}

		// Add headers for context
		const headers: Record<string, string> = { '__skipAuthRefresh': 'true' }
		if (currentMode === 'tenant') {
			const contextState = contextManager.getContextState('tenant')
			if (contextState?.tenantId) {
				headers['X-Tenant-ID'] = contextState.tenantId
				headers['X-Context-Mode'] = 'tenant'
			}
		} else {
			headers['X-Context-Mode'] = 'global'
		}

		const response = await this.instance.post('/api/v1/auth/refresh',
			requestData,
			{ headers }
		)

		const { access_token } = response.data
		// Update tokens in tokenManager instead of localStorage
		tokenManager.setTokens(currentMode, access_token, refreshToken)

		console.log(`✅ Token refreshed successfully for context: ${currentMode}`)
		return access_token
	}

	private processQueue(error: AxiosError | null, token: string | null = null) {
		this.failedQueue.forEach(prom => {
			if (error) {
				prom.reject(error)
			} else {
				prom.resolve(token)
			}
		})
		this.failedQueue = []
	}

	private handleAuthFailure() {
		// Clear tokens from tokenManager instead of localStorage
		const currentMode = contextManager.getCurrentMode()
		tokenManager.clearTokens(currentMode)

		if (typeof window !== 'undefined') {
			window.location.href = '/login'
		}
	}

	// Public API methods
	get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.instance.get(url, config)
	}

	post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.instance.post(url, data, config)
	}

	put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.instance.put(url, data, config)
	}

	patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.instance.patch(url, data, config)
	}

	delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.instance.delete(url, config)
	}

	// Expose defaults for compatibility
	get defaults() {
		return this.instance.defaults
	}
}

// Export singleton instance
const apiClient = new ApiClient()
export default apiClient