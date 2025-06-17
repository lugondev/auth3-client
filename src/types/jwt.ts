export interface JWTPayload {
	sub: string;
	email: string;
	roles?: string[];
	permissions?: string[];
	scopes?: string[];
	tenant_id?: string;
	exp: number;
}