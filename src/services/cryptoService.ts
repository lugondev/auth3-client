import * as secp256k1 from '@noble/secp256k1';

/**
 * Interface for generated key pair
 */
export interface GeneratedKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
}

/**
 * Supported key types for cryptographic operations
 */
export type KeyType = 'Ed25519' | 'secp256k1' | 'P-256';

/**
 * Crypto Service - Client-side cryptographic operations
 * 
 * This service provides methods for generating cryptographic key pairs
 * using Web Crypto API for supported algorithms.
 */
class CryptoService {
  /**
   * Generate a cryptographic key pair for the specified algorithm
   * @param keyType - The type of key to generate
   * @returns Promise resolving to the generated key pair
   */
  async generateKeyPair(keyType: KeyType): Promise<GeneratedKeyPair> {
    try {
      switch (keyType) {
        case 'Ed25519':
          return await this.generateEd25519KeyPair();
        case 'P-256':
          return await this.generateP256KeyPair();
        case 'secp256k1':
          return await this.generateSecp256k1KeyPair();
        default:
          throw new Error(`Unsupported key type: ${keyType}`);
      }
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw new Error(`Failed to generate ${keyType} key pair: ${error}`);
    }
  }

  /**
   * Generate Ed25519 key pair using Web Crypto API
   */
  private async generateEd25519KeyPair(): Promise<GeneratedKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519',
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export keys
    const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    // Convert to base58 format (similar to backend implementation)
    const publicKey = this.bufferToBase58(publicKeyBuffer);
    const privateKey = this.bufferToHex(privateKeyBuffer);
    const keyId = this.generateKeyId(publicKeyBuffer);

    return {
      publicKey: `z${publicKey}`, // Add multibase prefix
      privateKey,
      keyId: `#${keyId}`,
    };
  }

  /**
   * Generate P-256 key pair using Web Crypto API
   */
  private async generateP256KeyPair(): Promise<GeneratedKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export keys
    const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const publicKey = this.bufferToHex(publicKeyBuffer);
    const privateKey = this.bufferToHex(privateKeyBuffer);
    const keyId = this.generateKeyId(publicKeyBuffer);

    return {
      publicKey,
      privateKey,
      keyId: `#${keyId}`,
    };
  }

  /**
   * Generate secp256k1 key pair using @noble/secp256k1 library
   * Note: secp256k1 is not natively supported by Web Crypto API
   */
  private async generateSecp256k1KeyPair(): Promise<GeneratedKeyPair> {
    try {
      // Generate a random private key (32 bytes)
      const privateKeyBytes = secp256k1.utils.randomPrivateKey();

      // Get the corresponding public key
      const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false); // uncompressed format

      // Convert to hex strings
      const privateKeyHex = this.bufferToHex(privateKeyBytes.buffer as ArrayBuffer);
      const publicKeyHex = this.bufferToHex(publicKeyBytes.buffer as ArrayBuffer);

      // Generate key ID from public key
      const keyId = this.generateKeyId(publicKeyBytes.buffer as ArrayBuffer);

      return {
        publicKey: publicKeyHex,
        privateKey: privateKeyHex,
        keyId: `#${keyId}`,
      };
    } catch (error) {
      throw new Error(`Failed to generate secp256k1 key pair: ${error}`);
    }
  }

  /**
   * Convert ArrayBuffer to base58 string
   */
  private bufferToBase58(buffer: ArrayBuffer): string {
    // Simple base58 implementation - in production, use a proper library
    const bytes = new Uint8Array(buffer);
    return this.bytesToBase58(bytes);
  }

  /**
   * Convert ArrayBuffer to hex string
   */
  private bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate a key ID from public key bytes
   */
  private generateKeyId(publicKeyBuffer: ArrayBuffer): string {
    // Simple hash-based key ID generation
    const bytes = new Uint8Array(publicKeyBuffer);
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }

  /**
   * Generate random hex string
   */
  private generateRandomHex(length: number): string {
    const bytes = new Uint8Array(length / 2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Simple base58 encoding implementation
   */
  private bytesToBase58(bytes: Uint8Array): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';

    // Convert to big integer representation
    let num = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      num = num * BigInt(256) + BigInt(bytes[i]);
    }

    // Convert to base58
    while (num > 0) {
      const remainder = num % BigInt(58);
      result = alphabet[Number(remainder)] + result;
      num = num / BigInt(58);
    }

    // Handle leading zeros
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 0) {
        result = '1' + result;
      } else {
        break;
      }
    }

    return result;
  }
}

// Export singleton instance
export const cryptoService = new CryptoService();

// Export individual functions for convenience
export const generateKeyPair = (keyType: KeyType) => cryptoService.generateKeyPair(keyType);