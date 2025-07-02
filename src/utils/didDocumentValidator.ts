import type { 
  DIDDocument, 
  ValidationError, 
  ValidationWarning, 
  DIDDocumentValidationResult,
  ValidationSuggestion,
  ComplianceCheck
} from '@/types/did';

export class DIDDocumentValidator {
  /**
   * Validates a DID document according to W3C DID Core specification
   */
  static validate(document: DIDDocument): DIDDocumentValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];
    const compliance: ComplianceCheck[] = [];

    // Basic structure validation
    this.validateBasicStructure(document, errors);
    
    // Context validation
    this.validateContext(document, errors, warnings);
    
    // ID validation
    this.validateId(document, errors);
    
    // Verification methods validation
    this.validateVerificationMethods(document, errors, warnings);
    
    // Service endpoints validation
    this.validateServiceEndpoints(document, errors, warnings);
    
    // Authentication arrays validation
    this.validateAuthenticationArrays(document, errors, warnings);
    
    // Controller validation
    this.validateController(document, warnings);
    
    // Generate suggestions
    this.generateSuggestions(document, suggestions);
    
    // Check compliance
    this.checkCompliance(document, compliance);

    const valid = errors.length === 0;
    const score = this.calculateQualityScore(document, errors, warnings);

    return {
      valid,
      errors,
      warnings,
      suggestions,
      score,
      compliance
    };
  }

  private static validateBasicStructure(document: DIDDocument, errors: ValidationError[]) {
    if (!document) {
      errors.push({
        field: 'document',
        message: 'DID document cannot be null or undefined',
        code: 'DOCUMENT_NULL',
        severity: 'error'
      });
      return;
    }

    if (typeof document !== 'object') {
      errors.push({
        field: 'document',
        message: 'DID document must be an object',
        code: 'DOCUMENT_TYPE',
        severity: 'error'
      });
    }
  }

  private static validateContext(document: DIDDocument, errors: ValidationError[], warnings: ValidationWarning[]) {
    if (!document['@context']) {
      errors.push({
        field: '@context',
        message: 'DID document must have a @context property',
        code: 'CONTEXT_MISSING',
        severity: 'error'
      });
      return;
    }

    if (!Array.isArray(document['@context'])) {
      errors.push({
        field: '@context',
        message: '@context must be an array',
        code: 'CONTEXT_TYPE',
        severity: 'error'
      });
      return;
    }

    if (document['@context'].length === 0) {
      errors.push({
        field: '@context',
        message: '@context array cannot be empty',
        code: 'CONTEXT_EMPTY',
        severity: 'error'
      });
      return;
    }

    const requiredContext = 'https://www.w3.org/ns/did/v1';
    if (!document['@context'].includes(requiredContext)) {
      errors.push({
        field: '@context',
        message: `@context must include ${requiredContext}`,
        code: 'CONTEXT_W3C_MISSING',
        severity: 'error'
      });
    }

    // Check for deprecated contexts
    document['@context'].forEach((context, index) => {
      if (typeof context === 'string' && context.includes('did/v0')) {
        warnings.push({
          field: `@context[${index}]`,
          message: 'Using deprecated DID context version',
          suggestion: 'Consider updating to the latest DID context version'
        });
      }
    });
  }

  private static validateId(document: DIDDocument, errors: ValidationError[]) {
    if (!document.id) {
      errors.push({
        field: 'id',
        message: 'DID document must have an id property',
        code: 'ID_MISSING',
        severity: 'error'
      });
      return;
    }

    if (typeof document.id !== 'string') {
      errors.push({
        field: 'id',
        message: 'DID id must be a string',
        code: 'ID_TYPE',
        severity: 'error'
      });
      return;
    }

    if (!document.id.startsWith('did:')) {
      errors.push({
        field: 'id',
        message: 'DID id must start with "did:"',
        code: 'ID_FORMAT',
        severity: 'error'
      });
    }

    // Basic DID format validation
    const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/;
    if (!didRegex.test(document.id)) {
      errors.push({
        field: 'id',
        message: 'DID id format is invalid',
        code: 'ID_INVALID_FORMAT',
        severity: 'error'
      });
    }
  }

  private static validateVerificationMethods(document: DIDDocument, errors: ValidationError[], warnings: ValidationWarning[]) {
    if (!document.verificationMethod) return;

    if (!Array.isArray(document.verificationMethod)) {
      errors.push({
        field: 'verificationMethod',
        message: 'verificationMethod must be an array',
        code: 'VM_TYPE',
        severity: 'error'
      });
      return;
    }

    document.verificationMethod.forEach((vm, index) => {
      const field = `verificationMethod[${index}]`;

      if (!vm.id) {
        errors.push({
          field: `${field}.id`,
          message: 'Verification method must have an id',
          code: 'VM_ID_MISSING',
          severity: 'error'
        });
      }

      if (!vm.type) {
        errors.push({
          field: `${field}.type`,
          message: 'Verification method must have a type',
          code: 'VM_TYPE_MISSING',
          severity: 'error'
        });
      }

      if (!vm.controller) {
        errors.push({
          field: `${field}.controller`,
          message: 'Verification method must have a controller',
          code: 'VM_CONTROLLER_MISSING',
          severity: 'error'
        });
      }

      // Check for key material
      const hasKeyMaterial = vm.publicKeyJwk || vm.publicKeyMultibase || vm.blockchainAccountId;
      if (!hasKeyMaterial) {
        errors.push({
          field: `${field}`,
          message: 'Verification method must have key material (publicKeyJwk, publicKeyMultibase, or blockchainAccountId)',
          code: 'VM_KEY_MISSING',
          severity: 'error'
        });
      }

      // Validate key formats
      if (vm.publicKeyJwk) {
        if (!vm.publicKeyJwk.kty) {
          errors.push({
            field: `${field}.publicKeyJwk.kty`,
            message: 'JWK must have a key type (kty)',
            code: 'JWK_KTY_MISSING',
            severity: 'error'
          });
        }
      }
    });
  }

  private static validateServiceEndpoints(document: DIDDocument, errors: ValidationError[], warnings: ValidationWarning[]) {
    if (!document.service) return;

    if (!Array.isArray(document.service)) {
      errors.push({
        field: 'service',
        message: 'service must be an array',
        code: 'SERVICE_TYPE',
        severity: 'error'
      });
      return;
    }

    document.service.forEach((service, index) => {
      const field = `service[${index}]`;

      if (!service.id) {
        errors.push({
          field: `${field}.id`,
          message: 'Service endpoint must have an id',
          code: 'SERVICE_ID_MISSING',
          severity: 'error'
        });
      }

      if (!service.type) {
        errors.push({
          field: `${field}.type`,
          message: 'Service endpoint must have a type',
          code: 'SERVICE_TYPE_MISSING',
          severity: 'error'
        });
      }

      if (!service.serviceEndpoint) {
        errors.push({
          field: `${field}.serviceEndpoint`,
          message: 'Service endpoint must have a serviceEndpoint',
          code: 'SERVICE_ENDPOINT_MISSING',
          severity: 'error'
        });
      }

      // Validate URL format for string endpoints
      if (typeof service.serviceEndpoint === 'string') {
        try {
          new URL(service.serviceEndpoint);
        } catch {
          warnings.push({
            field: `${field}.serviceEndpoint`,
            message: 'Service endpoint URL may be invalid',
            suggestion: 'Ensure the URL follows proper format'
          });
        }
      }
    });
  }

  private static validateAuthenticationArrays(document: DIDDocument, errors: ValidationError[], warnings: ValidationWarning[]) {
    const authArrays = ['authentication', 'assertionMethod', 'keyAgreement', 'capabilityInvocation', 'capabilityDelegation'] as const;

    authArrays.forEach(arrayName => {
      const array = document[arrayName];
      if (!array) return;

      if (!Array.isArray(array)) {
        errors.push({
          field: arrayName,
          message: `${arrayName} must be an array`,
          code: 'AUTH_ARRAY_TYPE',
          severity: 'error'
        });
        return;
      }

      array.forEach((item, index) => {
        if (typeof item === 'string') {
          // Reference to verification method
          if (!item.startsWith('#') && !item.startsWith(document.id)) {
            warnings.push({
              field: `${arrayName}[${index}]`,
              message: 'Reference should be a fragment or full DID URL',
              suggestion: 'Use relative fragments (#key-1) or full DID URLs'
            });
          }
        } else if (typeof item === 'object') {
          // Embedded verification method
          if (!item.id || !item.type || !item.controller) {
            errors.push({
              field: `${arrayName}[${index}]`,
              message: 'Embedded verification method must have id, type, and controller',
              code: 'EMBEDDED_VM_INCOMPLETE',
              severity: 'error'
            });
          }
        }
      });
    });
  }

  private static validateController(document: DIDDocument, warnings: ValidationWarning[]) {
    if (!document.controller) return;

    if (Array.isArray(document.controller)) {
      if (document.controller.length === 0) {
        warnings.push({
          field: 'controller',
          message: 'Empty controller array',
          suggestion: 'Remove empty controller array or add controller DIDs'
        });
      }

      // Check each controller in array
      document.controller.forEach((controller, index) => {
        if (typeof controller === 'string' && !controller.startsWith('did:')) {
          warnings.push({
            field: `controller[${index}]`,
            message: 'Controller should be a valid DID',
            suggestion: 'Ensure controller is a valid DID identifier'
          });
        }
      });
    }
  }

  private static generateSuggestions(document: DIDDocument, suggestions: ValidationSuggestion[]) {
    // Suggest adding verification methods if none exist
    if (!document.verificationMethod || document.verificationMethod.length === 0) {
      suggestions.push({
        field: 'verificationMethod',
        message: 'Consider adding verification methods for key management',
        action: 'Add verification method',
        priority: 'high'
      });
    }

    // Suggest authentication methods
    if (!document.authentication || document.authentication.length === 0) {
      suggestions.push({
        field: 'authentication',
        message: 'Consider adding authentication methods for DID authentication',
        action: 'Add authentication method',
        priority: 'medium'
      });
    }

    // Suggest service endpoints for discoverability
    if (!document.service || document.service.length === 0) {
      suggestions.push({
        field: 'service',
        message: 'Consider adding service endpoints for enhanced discoverability',
        action: 'Add service endpoint',
        priority: 'low'
      });
    }
  }

  private static checkCompliance(document: DIDDocument, compliance: ComplianceCheck[]) {
    // W3C DID Core compliance
    const w3cIssues: string[] = [];
    
    if (!document['@context']?.includes('https://www.w3.org/ns/did/v1')) {
      w3cIssues.push('Missing required W3C DID context');
    }
    
    if (!document.id?.startsWith('did:')) {
      w3cIssues.push('Invalid DID format');
    }

    compliance.push({
      standard: 'W3C DID Core',
      compliant: w3cIssues.length === 0,
      version: '1.0',
      issues: w3cIssues
    });
  }

  private static calculateQualityScore(
    document: DIDDocument, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): number {
    let score = 100;

    // Deduct for errors
    score -= errors.length * 20;

    // Deduct for warnings
    score -= warnings.length * 5;

    // Bonus for completeness
    if (document.verificationMethod && document.verificationMethod.length > 0) score += 5;
    if (document.authentication && document.authentication.length > 0) score += 5;
    if (document.service && document.service.length > 0) score += 3;
    if (document.controller) score += 2;

    return Math.max(0, Math.min(100, score));
  }
}
