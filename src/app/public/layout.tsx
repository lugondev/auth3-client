'use client';

import { Toaster } from 'sonner';
import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A3</span>
              </div>
              <span className="font-semibold text-lg">Auth3</span>
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link
                href="/public/organizations"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Organization Directory
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">A3</span>
                </div>
                <span className="font-semibold">Auth3</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Secure digital identity and credential management platform.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <div className="space-y-2">
                <Link href="/public/organizations" className="block text-sm text-muted-foreground hover:text-foreground">
                  Organization Directory
                </Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground">
                  Features
                </Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground">
                  Security
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground">
                  Help Center
                </Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground">
                  Contact Us
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Icons.twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Icons.github className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Icons.linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2024 Auth3. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
