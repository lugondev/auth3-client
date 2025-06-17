import { jwtDecode } from 'jwt-decode';
import { JWTPayload } from '@/types/jwt';

export function decodeJwt<T>(accessToken: string): T {
	const decoded = jwtDecode<T>(accessToken)
	// check T is JWTPayload
	if (decoded && typeof decoded === 'object' && 'scopes' in decoded) {
		if (decoded['scopes'] && Array.isArray(decoded['scopes']) && !!decoded['scopes'].length) {
			(decoded as unknown as JWTPayload).permissions = decoded.scopes as string[];
		}
	}
	return decoded;
}