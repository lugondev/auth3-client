import React from 'react'
import OAuth2ClientList from '@/components/oauth2/OAuth2ClientList'
import Link from 'next/link'

const OAuth2DashboardPage: React.FC = () => {
	return (
		<div className='space-y-6'>
			<h1 className='text-2xl font-bold'>OAuth2 Management</h1>
			<OAuth2ClientList />
			<div className='space-y-4'>
				<h2 className='text-xl font-semibold'>Actions</h2>
				<ul className='space-y-2'>
					<li>
						<Link href='/dashboard' className='text-blue-600 hover:text-blue-800 underline'>
							Back to Dashboard
						</Link>
					</li>
				</ul>
			</div>
		</div>
	)
}

export default OAuth2DashboardPage
