/**
 * Credential API helper functions for the VC page
 */
import { VerifiableCredential } from '@/types/credentials';
import {
	listCredentials as listTenantCredentials,
	getCredential as getTenantCredential,
	revokeCredential as revokeTenantCredential,
	VerifiableCredential as TenantVerifiableCredential
} from '@/services/tenantCredentialService';
import { CredentialListFilters } from '@/services/credentialService';

// Define an interface that matches the actual shape we'll use in the component
// Export this so it can be imported in the page component
export interface CredentialWithStatusInfo extends Omit<VerifiableCredential, 'credentialStatus'> {
	credentialStatus?: {
		id?: string;
		type?: string;
		status?: 'active' | 'revoked' | 'suspended';
	}
}

/**
 * Get tenant credentials
 * @param tenantId The tenant ID
 * @returns List of tenant's verifiable credentials
 */
export async function getTenantCredentials(tenantId: string): Promise<CredentialWithStatusInfo[]> {
	try {
		// Configure filters to get credentials for this tenant
		const filters: CredentialListFilters = {
			limit: 50, // Reasonable limit for pagination
			page: 1
		};

		// Call the tenant-scoped API service
		const response = await listTenantCredentials(tenantId, filters);

		// Map the service response to match the expected structure in the component
		return response.credentials.map((cred: TenantVerifiableCredential) => {
			// Convert from service model to component-compatible model
			const credential: CredentialWithStatusInfo = {
				'@context': cred['@context'],
				id: cred.id,
				type: cred.type,
				issuer: cred.issuer,
				issuedAt: cred.issuedAt || cred.issuanceDate, // Use issuanceDate or issuedAt if available
				expirationDate: cred.expirationDate,
				credentialSubject: cred.credentialSubject,
				subjectDID: cred.subjectDID || (typeof cred.credentialSubject.id === 'string' ? cred.credentialSubject.id : ''),
				// Keep credential status as an object with status property - this matches what the page component expects
				credentialStatus: cred.credentialStatus ? {
					id: cred.credentialStatus.id,
					type: cred.credentialStatus.type,
					status: cred.credentialStatus.status,
				} : undefined,
				// Include proof if available
				proof: cred.proof ? {
					type: cred.proof.type,
					created: cred.proof.created,
					proofPurpose: cred.proof.proofPurpose,
					verificationMethod: cred.proof.verificationMethod,
					// Map either jws or proofValue
					jws: cred.proof.proofValue,
				} : undefined
			};

			return credential;
		});
	} catch (error) {
		console.error('Error fetching tenant credentials:', error);
		throw new Error('Failed to fetch credentials');
	}
}

/**
 * Get a specific credential by ID for a tenant
 * @param tenantId The tenant ID
 * @param credentialId The credential ID
 * @returns Specific tenant's verifiable credential
 */
export async function getTenantCredentialById(tenantId: string, credentialId: string): Promise<CredentialWithStatusInfo> {
	try {
		// Use tenant-scoped API to get specific credential
		const credential = await getTenantCredential(tenantId, credentialId);

		// Convert from service model to component-compatible model
		const result: CredentialWithStatusInfo = {
			'@context': credential['@context'],
			id: credential.id,
			type: credential.type,
			issuer: credential.issuer,
			issuedAt: credential.issuanceDate,
			expirationDate: credential.expirationDate,
			credentialSubject: credential.credentialSubject,
			subjectDID: typeof credential.credentialSubject.id === 'string' ? credential.credentialSubject.id : '',
			// Keep credential status as an object with status property
			credentialStatus: credential.credentialStatus ? {
				id: credential.credentialStatus.id,
				type: credential.credentialStatus.type,
				status: credential.credentialStatus.status,
			} : undefined,
			// Include proof if available
			proof: credential.proof ? {
				type: credential.proof.type,
				created: credential.proof.created,
				proofPurpose: credential.proof.proofPurpose,
				verificationMethod: credential.proof.verificationMethod,
				// Map either jws or proofValue
				jws: credential.proof.proofValue,
			} : undefined
		};

		return result;
	} catch (error) {
		console.error('Error fetching tenant credential by ID:', error);
		throw new Error('Failed to fetch credential');
	}
}

/**
 * Revoke a credential using tenant-scoped API
 * @param tenantId The tenant ID
 * @param credentialId The credential ID to revoke
 * @param issuerDID The issuer DID
 * @param reason Optional reason for revocation
 */
export async function revokeCredential(tenantId: string, credentialId: string, issuerDID: string, reason?: string): Promise<void> {
	try {
		await revokeTenantCredential(tenantId, credentialId, {
			issuerDID,
			reason: reason || 'Revoked from tenant dashboard'
		});
		console.log(`Credential ${credentialId} revoked successfully for tenant ${tenantId}`);
	} catch (error) {
		console.error(`Error revoking credential ${credentialId} for tenant ${tenantId}:`, error);
		throw new Error('Failed to revoke credential');
	}
}
