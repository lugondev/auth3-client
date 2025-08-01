/**
 * Demo page for client-side DID generation
 * Test the new DID generation capabilities
 */

'use client'

import { ClientDIDGenerator } from '@/components/did/ClientDIDGenerator'

export default function DIDGenerationDemoPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Client-side DID Generation Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test the new client-side DID generation capabilities. DIDs are generated locally using cryptographic libraries.
        </p>
      </div>

      <ClientDIDGenerator 
        onGenerated={(result) => {
          console.log('Generated DID:', result)
        }}
      />
    </div>
  )
}
