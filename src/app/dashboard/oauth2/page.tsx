import React from 'react'
import OAuth2ClientList from '@/components/oauth2/OAuth2ClientList'

const OAuth2DashboardPage: React.FC = () => {
	return (
		<div className='space-y-6'>
			<h1 className='text-2xl font-bold'>OAuth2 Management</h1>
			<OAuth2ClientList />
		</div>
	)
}

export default OAuth2DashboardPage
