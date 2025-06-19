'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DIDSkeletonVariant = 'list' | 'card' | 'details' | 'widget'

interface DIDSkeletonProps {
  variant?: DIDSkeletonVariant
  count?: number
  className?: string
}

/**
 * DIDSkeleton component provides consistent loading skeletons for DID-related components
 * with different variants for different contexts
 */
export function DIDSkeleton({ variant = 'list', count = 3, className = '' }: DIDSkeletonProps) {
  // Widget skeleton (for dashboard widgets)
  if (variant === 'widget') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Skeleton className='h-5 w-5' />
            <Skeleton className='h-6 w-32' />
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <Skeleton className='h-16' />
            <Skeleton className='h-16' />
          </div>
          <Skeleton className='h-8' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Card skeleton (for individual DID cards)
  if (variant === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between'>
                <div className='space-y-2'>
                  <Skeleton className='h-5 w-32' />
                  <Skeleton className='h-4 w-48' />
                </div>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-6 w-16' />
                  <Skeleton className='h-8 w-8 rounded-full' />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-16' />
                </div>
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-16' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Details skeleton (for DID details page)
  if (variant === 'details') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='flex items-start justify-between'>
          <div className='space-y-2'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-6 w-6' />
              <Skeleton className='h-8 w-40' />
              <Skeleton className='h-6 w-20' />
            </div>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-40' />
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-9 w-24' />
            <Skeleton className='h-9 w-24' />
            <Skeleton className='h-9 w-24' />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Skeleton className='flex-1 h-12' />
              <Skeleton className='h-9 w-9' />
              <Skeleton className='h-9 w-9' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-48' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <Skeleton className='h-64 w-full' />
              <div className='flex justify-end gap-2'>
                <Skeleton className='h-9 w-24' />
                <Skeleton className='h-9 w-24' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // List skeleton (default, for DID lists)
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className='p-6'>
            <div className='space-y-3'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
              <div className='flex gap-2'>
                <Skeleton className='h-6 w-16' />
                <Skeleton className='h-6 w-20' />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}