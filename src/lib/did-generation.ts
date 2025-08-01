/**
 * Client-side DID Generation Utilities
 * Supports creating DIDs directly in the browser without server roundtrip
 */

import { ed25519 } from '@noble/curves/ed25519'
import { secp256k1 } from '@noble/curves/secp256k1'
import { p256 } from '@noble/curves/p256'
import { base58btc } from 'multiformats/bases/base58'
import { sha256 } from '@noble/hashes/sha256'

export type KeyType = 'Ed25519' | 'secp256k1' | 'P-256'
export type DIDMethod = 'did:key' | 'did:web' | 'did:peer'

export interface KeyPair {
  privateKey: Uint8Array
  publicKey: Uint8Array
  privateKeyHex: string
  publicKeyHex: string
  publicKeyMultibase: string
}

export interface DIDKeyResult {
  did: string
  didDocument: any
  keyPair: KeyPair
  verificationMethod: string
}

export interface DIDWebResult {
  did: string
  didDocument: any
  keyPair: KeyPair
  verificationMethod: string
  domain: string
  path?: string
}

export interface DIDPeerResult {
  did: string
  didDocument: any
  keyPair: KeyPair
  verificationMethod: string
  serviceEndpoint?: string
}

/**
 * Generate a cryptographic key pair for the specified key type
 */
export async function generateKeyPair(keyType: KeyType): Promise<KeyPair> {
  let privateKey: Uint8Array
  let publicKey: Uint8Array

  switch (keyType) {
    case 'Ed25519':
      privateKey = ed25519.utils.randomPrivateKey()
      publicKey = ed25519.getPublicKey(privateKey)
      break
    
    case 'secp256k1':
      privateKey = secp256k1.utils.randomPrivateKey()
      publicKey = secp256k1.getPublicKey(privateKey, false) // uncompressed
      break
    
    case 'P-256':
      privateKey = p256.utils.randomPrivateKey()
      publicKey = p256.getPublicKey(privateKey, false) // uncompressed
      break
    
    default:
      throw new Error(`Unsupported key type: ${keyType}`)
  }

  // Convert to hex strings
  const privateKeyHex = Array.from(privateKey, byte => byte.toString(16).padStart(2, '0')).join('')
  const publicKeyHex = Array.from(publicKey, byte => byte.toString(16).padStart(2, '0')).join('')

  // Create multibase encoded public key for did:key
  const publicKeyMultibase = createMultibasePublicKey(publicKey, keyType)

  return {
    privateKey,
    publicKey,
    privateKeyHex,
    publicKeyHex,
    publicKeyMultibase
  }
}

/**
 * Create multibase encoded public key
 */
function createMultibasePublicKey(publicKey: Uint8Array, keyType: KeyType): string {
  let codecBytes: Uint8Array

  switch (keyType) {
    case 'Ed25519':
      // Ed25519 multicodec: 0xed01
      codecBytes = new Uint8Array([0xed, 0x01, ...publicKey])
      break
    
    case 'secp256k1':
      // secp256k1 multicodec: 0xe701  
      codecBytes = new Uint8Array([0xe7, 0x01, ...publicKey])
      break
    
    case 'P-256':
      // P-256 multicodec: 0x1200
      codecBytes = new Uint8Array([0x12, 0x00, ...publicKey])
      break
    
    default:
      throw new Error(`Unsupported key type for multibase: ${keyType}`)
  }

  return base58btc.encode(codecBytes)
}

/**
 * Generate a did:key DID
 */
export async function generateDIDKey(keyType: KeyType = 'Ed25519'): Promise<DIDKeyResult> {
  const keyPair = await generateKeyPair(keyType)
  const did = `did:key:${keyPair.publicKeyMultibase}`
  const verificationMethod = `${did}#${keyPair.publicKeyMultibase}`

  const didDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1'
    ],
    id: did,
    verificationMethod: [
      {
        id: verificationMethod,
        type: getVerificationMethodType(keyType),
        controller: did,
        publicKeyMultibase: keyPair.publicKeyMultibase
      }
    ],
    authentication: [verificationMethod],
    assertionMethod: [verificationMethod],
    keyAgreement: keyType === 'Ed25519' ? [verificationMethod] : [],
    capabilityInvocation: [verificationMethod],
    capabilityDelegation: [verificationMethod]
  }

  return {
    did,
    didDocument,
    keyPair,
    verificationMethod
  }
}

/**
 * Generate a did:web DID
 */
export async function generateDIDWeb(
  domain: string, 
  path?: string, 
  keyType: KeyType = 'Ed25519'
): Promise<DIDWebResult> {
  if (!domain) {
    throw new Error('Domain is required for did:web')
  }

  const keyPair = await generateKeyPair(keyType)
  
  // Construct DID identifier
  let didPath = domain.replace(/:/g, '%3A')
  if (path) {
    didPath += `:${path.replace(/\//g, ':')}`
  }
  
  const did = `did:web:${didPath}`
  const verificationMethod = `${did}#key-1`

  const didDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1'
    ],
    id: did,
    verificationMethod: [
      {
        id: verificationMethod,
        type: getVerificationMethodType(keyType),
        controller: did,
        publicKeyMultibase: keyPair.publicKeyMultibase
      }
    ],
    authentication: [verificationMethod],
    assertionMethod: [verificationMethod],
    keyAgreement: keyType === 'Ed25519' ? [verificationMethod] : [],
    capabilityInvocation: [verificationMethod],
    capabilityDelegation: [verificationMethod]
  }

  return {
    did,
    didDocument,
    keyPair,
    verificationMethod,
    domain,
    path
  }
}

/**
 * Generate a did:peer DID (Method 0 - key only)
 */
export async function generateDIDPeer(
  keyType: KeyType = 'Ed25519',
  serviceEndpoint?: string
): Promise<DIDPeerResult> {
  const keyPair = await generateKeyPair(keyType)
  
  // Create peer DID using method 0 (single key)
  const did = `did:peer:0${keyPair.publicKeyMultibase}`
  const verificationMethod = `${did}#key-1`

  const didDocument: any = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1'
    ],
    id: did,
    verificationMethod: [
      {
        id: verificationMethod,
        type: getVerificationMethodType(keyType),
        controller: did,
        publicKeyMultibase: keyPair.publicKeyMultibase
      }
    ],
    authentication: [verificationMethod],
    assertionMethod: [verificationMethod],
    keyAgreement: keyType === 'Ed25519' ? [verificationMethod] : [],
    capabilityInvocation: [verificationMethod],
    capabilityDelegation: [verificationMethod]
  }

  // Add service endpoint if provided
  if (serviceEndpoint) {
    didDocument.service = [
      {
        id: `${did}#didcomm-1`,
        type: 'DIDCommMessaging',
        serviceEndpoint: serviceEndpoint
      }
    ]
  }

  return {
    did,
    didDocument,
    keyPair,
    verificationMethod,
    serviceEndpoint
  }
}

/**
 * Get verification method type based on key type
 */
function getVerificationMethodType(keyType: KeyType): string {
  switch (keyType) {
    case 'Ed25519':
      return 'Ed25519VerificationKey2020'
    case 'secp256k1':
      return 'EcdsaSecp256k1VerificationKey2019'
    case 'P-256':
      return 'EcdsaSecp256r1VerificationKey2019'
    default:
      throw new Error(`Unsupported key type: ${keyType}`)
  }
}

/**
 * Sign a message with the private key
 */
export async function signMessage(
  message: string | Uint8Array, 
  privateKey: Uint8Array, 
  keyType: KeyType
): Promise<string> {
  const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message

  let signature: Uint8Array

  switch (keyType) {
    case 'Ed25519':
      signature = ed25519.sign(messageBytes, privateKey)
      break
    
    case 'secp256k1':
      // Hash the message first for secp256k1
      const hash = sha256(messageBytes)
      signature = secp256k1.sign(hash, privateKey).toCompactRawBytes()
      break
    
    case 'P-256':
      // Hash the message first for P-256
      const hash256 = sha256(messageBytes)
      signature = p256.sign(hash256, privateKey).toCompactRawBytes()
      break
    
    default:
      throw new Error(`Unsupported key type for signing: ${keyType}`)
  }

  // Return base64 encoded signature
  return btoa(String.fromCharCode(...signature))
}

/**
 * Verify a signature
 */
export async function verifySignature(
  message: string | Uint8Array,
  signature: string,
  publicKey: Uint8Array,
  keyType: KeyType
): Promise<boolean> {
  try {
    const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
    const signatureBytes = new Uint8Array(atob(signature).split('').map(c => c.charCodeAt(0)))

    switch (keyType) {
      case 'Ed25519':
        return ed25519.verify(signatureBytes, messageBytes, publicKey)
      
      case 'secp256k1':
        const hash = sha256(messageBytes)
        return secp256k1.verify(signatureBytes, hash, publicKey)
      
      case 'P-256':
        const hash256 = sha256(messageBytes)
        return p256.verify(signatureBytes, hash256, publicKey)
      
      default:
        return false
    }
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Generate a random DID based on method
 */
export async function generateDID(
  method: DIDMethod,
  options: {
    keyType?: KeyType
    domain?: string
    path?: string
    serviceEndpoint?: string
  } = {}
): Promise<DIDKeyResult | DIDWebResult | DIDPeerResult> {
  const { keyType = 'Ed25519', domain, path, serviceEndpoint } = options

  switch (method) {
    case 'did:key':
      return generateDIDKey(keyType)
    
    case 'did:web':
      if (!domain) {
        throw new Error('Domain is required for did:web')
      }
      return generateDIDWeb(domain, path, keyType)
    
    case 'did:peer':
      return generateDIDPeer(keyType, serviceEndpoint)
    
    default:
      throw new Error(`Unsupported DID method: ${method}`)
  }
}

/**
 * Export private key in various formats
 */
export function exportPrivateKey(privateKey: Uint8Array, format: 'hex' | 'base64' | 'pem' = 'hex'): string {
  switch (format) {
    case 'hex':
      return Array.from(privateKey, byte => byte.toString(16).padStart(2, '0')).join('')
    
    case 'base64':
      return btoa(String.fromCharCode(...privateKey))
    
    case 'pem':
      const base64Key = btoa(String.fromCharCode(...privateKey))
      return `-----BEGIN PRIVATE KEY-----\n${base64Key}\n-----END PRIVATE KEY-----`
    
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Import private key from various formats
 */
export function importPrivateKey(key: string, format: 'hex' | 'base64' | 'pem' = 'hex'): Uint8Array {
  switch (format) {
    case 'hex':
      if (key.length % 2 !== 0) {
        throw new Error('Invalid hex string length')
      }
      return new Uint8Array(key.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    
    case 'base64':
      return new Uint8Array(atob(key).split('').map(c => c.charCodeAt(0)))
    
    case 'pem':
      const base64Match = key.match(/-----BEGIN PRIVATE KEY-----\n(.+)\n-----END PRIVATE KEY-----/)
      if (!base64Match) {
        throw new Error('Invalid PEM format')
      }
      return new Uint8Array(atob(base64Match[1]).split('').map(c => c.charCodeAt(0)))
    
    default:
      throw new Error(`Unsupported import format: ${format}`)
  }
}
