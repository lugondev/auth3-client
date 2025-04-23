'use client'

import {useAuth} from '@/contexts/AuthContext'
import {Button} from '@/components/ui/button'

export function AuthStatus() {
	const {user, signInWithGoogle, logout} = useAuth()

	if (!user) {
		return (
			<Button variant='outline' onClick={() => signInWithGoogle()}>
				Sign in with Google
			</Button>
		)
	}

	return (
		<div className='flex items-center gap-4'>
			<p className='text-sm text-foreground/60'>Signed in as {user.email}</p>
			<Button variant='outline' onClick={() => logout()}>
				Sign out
			</Button>
		</div>
	)
}
