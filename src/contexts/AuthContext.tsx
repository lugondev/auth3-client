import {createContext, useContext, useEffect, useState} from 'react'
import {User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup} from 'firebase/auth'
import {auth} from '@/lib/firebase'

interface AuthContextType {
	user: User | null
	loading: boolean
	signIn: (email: string, password: string) => Promise<void>
	signUp: (email: string, password: string) => Promise<void>
	logout: () => Promise<void>
	signInWithGoogle: () => Promise<void>
	signInWithFacebook: () => Promise<void>
	signInWithApple: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({children}: {children: React.ReactNode}) {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUser(user)
			setLoading(false)
		})

		return () => unsubscribe()
	}, [])

	const signIn = async (email: string, password: string) => {
		await signInWithEmailAndPassword(auth, email, password)
	}

	const signUp = async (email: string, password: string) => {
		await createUserWithEmailAndPassword(auth, email, password)
	}

	const signInWithGoogle = async () => {
		const provider = new GoogleAuthProvider()
		await signInWithPopup(auth, provider)
	}

	const logout = async () => {
		await signOut(auth)
	}

	const signInWithFacebook = async () => {
		const provider = new FacebookAuthProvider()
		await signInWithPopup(auth, provider)
	}

	const signInWithApple = async () => {
		const provider = new OAuthProvider('apple.com')
		await signInWithPopup(auth, provider)
	}

	const value = {
		user,
		loading,
		signIn,
		signUp,
		logout,
		signInWithGoogle,
		signInWithFacebook,
		signInWithApple,
	}

	return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
