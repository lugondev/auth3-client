/**
 * React Hook for Client-side DID Generation
 * Provides easy-to-use interface for generating DIDs in React components
 */

import { useState, useCallback } from 'react'
import {
  generateDID,
  generateKeyPair,
  signMessage,
  verifySignature,
  exportPrivateKey,
  importPrivateKey,
  type KeyType,
  type DIDMethod,
  type DIDKeyResult,
  type DIDWebResult,
  type DIDPeerResult,
  type KeyPair
} from '@/lib/did-generation'

export interface DIDGenerationState {
  isGenerating: boolean
  error: string | null
  result: DIDKeyResult | DIDWebResult | DIDPeerResult | null
}

export interface DIDGenerationOptions {
  keyType?: KeyType
  domain?: string
  path?: string
  serviceEndpoint?: string
}

export interface SigningState {
  isSigning: boolean
  isVerifying: boolean
  error: string | null
  signature: string | null
  isValid: boolean | null
}

export function useDIDGeneration() {
  const [state, setState] = useState<DIDGenerationState>({
    isGenerating: false,
    error: null,
    result: null
  })

  const generateNewDID = useCallback(async (
    method: DIDMethod,
    options: DIDGenerationOptions = {}
  ) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const result = await generateDID(method, options)
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        result,
        error: null 
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate DID'
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage 
      }))
      throw error
    }
  }, [])

  const generateKeys = useCallback(async (keyType: KeyType = 'Ed25519') => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const keyPair = await generateKeyPair(keyType)
      setState(prev => ({ ...prev, isGenerating: false, error: null }))
      return keyPair
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate key pair'
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage 
      }))
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      error: null,
      result: null
    })
  }, [])

  return {
    ...state,
    generateNewDID,
    generateKeys,
    reset
  }
}

export function useCryptographicSigning() {
  const [state, setState] = useState<SigningState>({
    isSigning: false,
    isVerifying: false,
    error: null,
    signature: null,
    isValid: null
  })

  const sign = useCallback(async (
    message: string,
    privateKey: Uint8Array,
    keyType: KeyType
  ) => {
    setState(prev => ({ ...prev, isSigning: true, error: null }))

    try {
      const signature = await signMessage(message, privateKey, keyType)
      setState(prev => ({ 
        ...prev, 
        isSigning: false, 
        signature,
        error: null 
      }))
      return signature
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign message'
      setState(prev => ({ 
        ...prev, 
        isSigning: false, 
        error: errorMessage 
      }))
      throw error
    }
  }, [])

  const verify = useCallback(async (
    message: string,
    signature: string,
    publicKey: Uint8Array,
    keyType: KeyType
  ) => {
    setState(prev => ({ ...prev, isVerifying: true, error: null }))

    try {
      const isValid = await verifySignature(message, signature, publicKey, keyType)
      setState(prev => ({ 
        ...prev, 
        isVerifying: false, 
        isValid,
        error: null 
      }))
      return isValid
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify signature'
      setState(prev => ({ 
        ...prev, 
        isVerifying: false, 
        error: errorMessage 
      }))
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isSigning: false,
      isVerifying: false,
      error: null,
      signature: null,
      isValid: null
    })
  }, [])

  return {
    ...state,
    sign,
    verify,
    reset
  }
}

export function useKeyManagement() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportKey = useCallback(async (
    privateKey: Uint8Array,
    format: 'hex' | 'base64' | 'pem' = 'hex'
  ) => {
    setIsExporting(true)
    setError(null)

    try {
      const exported = exportPrivateKey(privateKey, format)
      setIsExporting(false)
      return exported
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export key'
      setError(errorMessage)
      setIsExporting(false)
      throw error
    }
  }, [])

  const importKey = useCallback(async (
    key: string,
    format: 'hex' | 'base64' | 'pem' = 'hex'
  ) => {
    setIsImporting(true)
    setError(null)

    try {
      const imported = importPrivateKey(key, format)
      setIsImporting(false)
      return imported
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import key'
      setError(errorMessage)
      setIsImporting(false)
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setIsExporting(false)
    setIsImporting(false)
    setError(null)
  }, [])

  return {
    isExporting,
    isImporting,
    error,
    exportKey,
    importKey,
    reset
  }
}

// Helper function to download key/DID as file
export function downloadAsFile(content: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Helper function to copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand('copy')
      textArea.remove()
      return result
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

// Helper function to validate DID format
export function validateDIDFormat(did: string): boolean {
  const didRegex = /^did:[a-z0-9]+:.*$/
  return didRegex.test(did)
}

// Helper function to extract method from DID
export function extractDIDMethod(did: string): string | null {
  const match = did.match(/^did:([a-z0-9]+):/)
  return match ? match[1] : null
}

// Helper function to format key pair for display
export function formatKeyPairForDisplay(keyPair: KeyPair) {
  return {
    privateKey: {
      hex: keyPair.privateKeyHex,
      base64: btoa(String.fromCharCode(...keyPair.privateKey)),
      truncated: `${keyPair.privateKeyHex.slice(0, 8)}...${keyPair.privateKeyHex.slice(-8)}`
    },
    publicKey: {
      hex: keyPair.publicKeyHex,
      base64: btoa(String.fromCharCode(...keyPair.publicKey)),
      multibase: keyPair.publicKeyMultibase,
      truncated: `${keyPair.publicKeyHex.slice(0, 8)}...${keyPair.publicKeyHex.slice(-8)}`
    }
  }
}
