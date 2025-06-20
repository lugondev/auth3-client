import { VALIDATION_PATTERNS } from '@/constants/did';

export interface ValidationResult {
	isValid: boolean;
	error?: string;
}

export const validateDIDFormData = {
	domain: (domain: string): ValidationResult => {
		if (!domain) {
			return { isValid: false, error: 'Domain is required for did:web method' };
		}
		if (!VALIDATION_PATTERNS.DOMAIN.test(domain)) {
			return { isValid: false, error: 'Invalid domain format' };
		}
		return { isValid: true };
	},

	ethereumAddress: (address: string): ValidationResult => {
		if (!address) {
			return { isValid: true }; // Optional field
		}
		if (!VALIDATION_PATTERNS.ETHEREUM_ADDRESS.test(address)) {
			return { isValid: false, error: 'Invalid Ethereum address format' };
		}
		return { isValid: true };
	},

	peerEndpoint: (endpoint: string): ValidationResult => {
		if (!endpoint) {
			return { isValid: true }; // Optional field
		}
		if (!VALIDATION_PATTERNS.URL.test(endpoint)) {
			return { isValid: false, error: 'Peer endpoint must be a valid HTTP/HTTPS URL' };
		}
		return { isValid: true };
	},

	serviceEndpoint: (endpoint: string): ValidationResult => {
		if (!endpoint) {
			return { isValid: false, error: 'Service endpoint is required' };
		}
		if (!VALIDATION_PATTERNS.URL.test(endpoint)) {
			return { isValid: false, error: 'Service endpoint must be a valid HTTP/HTTPS URL' };
		}
		return { isValid: true };
	}
};

interface FormData {
	domain?: string;
	ethereumAddress?: string;
	peerEndpoint?: string;
}

export const validateFormByMethod = (method: string, formData: FormData): ValidationResult => {
	switch (method) {
		case 'web':
			return validateDIDFormData.domain(formData.domain || '');

		case 'ethr':
			if (formData.ethereumAddress) {
				return validateDIDFormData.ethereumAddress(formData.ethereumAddress);
			}
			return { isValid: true };

		case 'peer':
			if (formData.peerEndpoint) {
				return validateDIDFormData.peerEndpoint(formData.peerEndpoint);
			}
			return { isValid: true };

		case 'key':
		case 'ion':
		default:
			return { isValid: true };
	}
};
