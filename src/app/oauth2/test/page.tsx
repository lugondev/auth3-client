'use client'

import {useState} from 'react'
import {handleOAuth2Authorization} from '@/services/oauth2Service'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {useAuth} from '@/contexts/AuthContext'

export default function OAuth2TestPage() {
	const {isAuthenticated, user} = useAuth()
	const [result, setResult] = useState<string>('')
	const [loading, setLoading] = useState(false)
	const [tokenInfo, setTokenInfo] = useState<string>('')

	const checkTokenInfo = () => {
		const globalAccessToken = localStorage.getItem('global_accessToken')
		const globalRefreshToken = localStorage.getItem('global_refreshToken')
		const tenantAccessToken = localStorage.getItem('tenant_accessToken')
		const tenantRefreshToken = localStorage.getItem('tenant_refreshToken')

		setTokenInfo(
			`
Global Access Token: ${globalAccessToken ? `${globalAccessToken.substring(0, 50)}...` : 'None'}
Global Refresh Token: ${globalRefreshToken ? `${globalRefreshToken.substring(0, 50)}...` : 'None'}
Tenant Access Token: ${tenantAccessToken ? `${tenantAccessToken.substring(0, 50)}...` : 'None'}
Tenant Refresh Token: ${tenantRefreshToken ? `${tenantRefreshToken.substring(0, 50)}...` : 'None'}
    `.trim(),
		)
	}

	const testOAuth2Flow = async () => {
		if (!isAuthenticated) {
			setResult('❌ User not authenticated. Please login first.')
			return
		}

		setLoading(true)
		setResult('')

		try {
			// First, let's test if we can call a protected endpoint to verify our token works
			console.log('🔑 Testing authentication with protected endpoint...')

			// Call a known protected endpoint first
			const authTestResponse = await fetch('http://localhost:8080/api/v1/oauth2/clients', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('global_accessToken') || localStorage.getItem('tenant_accessToken')}`,
					'Content-Type': 'application/json',
				},
			})

			console.log('🔑 Auth test response status:', authTestResponse.status)

			if (authTestResponse.status !== 200) {
				setResult(`❌ Authentication failed. Status: ${authTestResponse.status}. Please login again.`)
				return
			}

			const oauth2Params = {
				response_type: 'code',
				client_id: 'client_522ac41f-9ce5-4263-8b13-cb9958d68e1b', // Test public client
				redirect_uri: 'http://localhost:3000/oauth2/callback',
				scope: 'openid profile',
				state: 'test-state-' + Date.now(),
				nonce: 'test-nonce-' + Date.now(),
			}

			console.log('🧪 Starting OAuth2 test with params:', oauth2Params)

			// Use new simplified API - it will handle redirects automatically
			await handleOAuth2Authorization(oauth2Params.client_id, oauth2Params.redirect_uri, oauth2Params.scope, oauth2Params.state)

			setResult('✅ OAuth2 flow initiated successfully! You should be redirected...')
		} catch (error: unknown) {
			console.error('❌ OAuth2 test failed:', error)
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'

			// Check if this is an expected redirect message
			if (errorMessage.includes('Redirecting to')) {
				setResult(`✅ ${errorMessage}`)
			} else {
				setResult(`❌ Error: ${errorMessage}`)
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='container mx-auto p-6 max-w-2xl'>
			<Card>
				<CardHeader>
					<CardTitle>OAuth2 Flow Test</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div>
						<strong>Authentication Status:</strong> {isAuthenticated ? <span className='text-green-600'>✅ Authenticated as {user?.email}</span> : <span className='text-red-600'>❌ Not authenticated</span>}
					</div>

					<Button onClick={testOAuth2Flow} disabled={loading || !isAuthenticated} className='w-full'>
						{loading ? '🔄 Testing OAuth2 Flow...' : '🧪 Test OAuth2 Authorization'}
					</Button>

					<Button onClick={checkTokenInfo} variant='outline' className='w-full'>
						🔍 Check Token Info
					</Button>

					{tokenInfo && (
						<div className='p-4 bg-blue-50 rounded-lg'>
							<strong>Token Info:</strong>
							<pre className='mt-2 text-sm whitespace-pre-wrap'>{tokenInfo}</pre>
						</div>
					)}

					{result && (
						<div className='p-4 bg-gray-100 rounded-lg'>
							<strong>Result:</strong>
							<pre className='mt-2 text-sm whitespace-pre-wrap'>{result}</pre>
						</div>
					)}

					<div className='text-sm text-gray-600'>
						<p>
							<strong>How this test works:</strong>
						</p>
						<ol className='list-decimal list-inside space-y-1 mt-2'>
							<li>Checks if you're authenticated</li>
							<li>Calls the OAuth2 authorization flow</li>
							<li>Generates PKCE parameters if needed</li>
							<li>Sends POST request to /api/v1/oauth2/authorize</li>
							<li>Should return authorization code if successful</li>
						</ol>
						<p className='mt-2'>
							<strong>Test Client ID:</strong> client_522ac41f-9ce5-4263-8b13-cb9958d68e1b (Public Client)
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
