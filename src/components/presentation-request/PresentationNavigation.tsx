'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Send, 
  Plus,
  List 
} from 'lucide-react';

export function PresentationNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/presentation-requests',
      label: 'Manage Requests',
      icon: List,
      description: 'View and manage your presentation requests'
    },
    {
      href: '/presentation-requests?tab=create',
      label: 'Create Request',
      icon: Plus,
      description: 'Create a new presentation request'
    },
    {
      href: '/submit-presentation',
      label: 'Submit Presentation',
      icon: Send,
      description: 'Submit a verifiable presentation'
    }
  ];

  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Presentation Manager</h1>
          </div>
          
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href.split('?')[0];
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className={cn(
                    "flex items-center gap-2",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
