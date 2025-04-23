import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from '@/components/ui/card'

export default function Home() {
	return (
		<div className='container mx-auto p-6'>
			<Card>
				<CardHeader>
					<CardTitle>Welcome to the App</CardTitle>
					<CardDescription>This is a demo of Firebase Authentication in Next.js with shadcn/ui components</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground'>Sign in using your Google account to access protected features and content.</p>
				</CardContent>
				<CardFooter>
					<Button asChild>
						<Link href='/protected'>View Protected Page</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
}
