import {Inter} from 'next/font/google'
import './globals.css'
import {ClientProviders} from '@/components/providers/ClientProviders'

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
})

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body className={`${inter.variable} font-sans antialiased`}>
				<ClientProviders>{children}</ClientProviders>
			</body>
		</html>
	)
}
