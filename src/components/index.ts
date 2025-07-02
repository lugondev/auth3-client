// Export all components from their respective directories
export * from './guards'
export * from './context'

// Presentation components
export { default as SelectiveDisclosure } from './presentations/SelectiveDisclosure'
export type { default as PresentationTemplate } from './presentations/PresentationTemplate'
export { default as BatchVerification } from './presentations/BatchVerification'
export type { default as PresentationAnalytics } from './presentations/PresentationAnalytics'

// DID components - Enhanced Document Management (DID-002)
export { DIDDocumentEditor } from './did/DIDDocumentEditor'
export { DIDServiceEndpointsManager } from './did/DIDServiceEndpointsManager'
export { DIDVerificationMethodsManager } from './did/DIDVerificationMethodsManager'
export { DIDDocumentPreview } from './did/DIDDocumentPreview'
export { AdvancedDIDResolver } from './did/AdvancedDIDResolver'