'use client'

import {useAuth} from '@/contexts/AuthContext'
import {Button} from '@/components/ui/button'

export function AuthStatus() {
	const {user, signInWithGoogle, signInWithFacebook, signInWithApple, logout} = useAuth()

	if (!user) {
		return (
			<div className='flex gap-2'>
				<Button variant='outline' onClick={() => signInWithGoogle()}>
					Sign in with Google
				</Button>
				<Button variant='outline' onClick={() => signInWithFacebook()}>
					Sign in with Facebook
				</Button>
				<Button variant='outline' onClick={() => signInWithApple()}>
					Sign in with Apple
				</Button>
			</div>
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
