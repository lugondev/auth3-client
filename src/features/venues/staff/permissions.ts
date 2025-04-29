import { StaffRole } from '@/types/venue';

// Define specific permission strings
// Using a union type for better type safety if needed elsewhere
export type VenuePermission =
	| 'venue:manage:all' // Implicit for owner
	| 'venue:read:settings'
	| 'venue:manage:settings' // Implied by manage:all
	| 'venue:manage:staff'
	| 'venue:manage:tables'
	| 'venue:manage:reservations'
	| 'venue:manage:products'
	| 'venue:manage:events'
	| 'venue:manage:orders'
	| 'venue:read:reports' // Basic reporting view
	| 'venue:manage:reports'; // Advanced reporting/config

// Define the mapping of roles to their permissions
// Owner implicitly has all permissions, represented by 'venue:manage:all'
// We can add more granular permissions as needed.
const rolePermissions: Record<StaffRole, VenuePermission[]> = {
	owner: [
		'venue:manage:all', // Grant all permissions implicitly
		// Explicitly list all for clarity if preferred, but 'all' simplifies checks
		'venue:read:settings',
		'venue:manage:settings',
		'venue:manage:staff',
		'venue:manage:tables',
		'venue:manage:reservations',
		'venue:manage:products',
		'venue:manage:events',
		'venue:manage:orders',
		'venue:read:reports',
		'venue:manage:reports',
	],
	manager: [
		'venue:read:settings',
		'venue:manage:staff',
		'venue:manage:tables',
		'venue:manage:reservations', // Added based on common manager tasks
		'venue:manage:products',
		'venue:manage:events',
		'venue:manage:orders',
		'venue:read:reports',
	],
	staff: [
		'venue:read:settings',
		'venue:manage:tables',
		'venue:manage:orders',
	],
	hostess: [
		'venue:manage:tables',
		'venue:manage:reservations',
	],
	waiter: [
		'venue:manage:tables',
		'venue:manage:orders',
	],
	bartender: [
		'venue:manage:products',
		'venue:manage:orders',
	],
};

/**
 * Checks if a given role has a specific permission.
 * Owners implicitly have all permissions.
 *
 * @param role The staff role to check.
 * @param permission The permission string to verify.
 * @returns True if the role has the permission, false otherwise.
 */
export const hasPermission = (role: StaffRole | undefined | null, permission: VenuePermission): boolean => {
	if (!role) {
		return false; // No role, no permissions
	}

	const permissions = rolePermissions[role];
	if (!permissions) {
		return false; // Role not found in map (shouldn't happen with StaffRole type)
	}

	// Owner has all permissions implicitly or explicitly via 'venue:manage:all'
	if (permissions.includes('venue:manage:all')) {
		return true;
	}

	// Check if the specific permission is listed for the role
	return permissions.includes(permission);
};

// Example usage (conceptual):
// import { useCurrentUserVenueRole } from './hooks'; // Assume this hook exists
// import { hasPermission } from './permissions';
//
// const MyComponent = ({ venueId }) => {
//   const { role, isLoading } = useCurrentUserVenueRole(venueId);
//   const canManageStaff = hasPermission(role, 'venue:manage:staff');
//
//   if (isLoading) return <Spinner />;
//
//   return (
//     <div>
//       {canManageStaff && <button>Add Staff</button>}
//       {/* ... other components */}
//     </div>
//   );
// };
