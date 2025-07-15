import { useState, useEffect, useCallback } from 'react';
import { 
	getGlobalTemplateRoles, 
	createGlobalTemplateRoles, 
	updateGlobalTemplateRole, 
	deleteGlobalTemplateRole
} from '@/services/globalTemplateRoleService';

export interface GlobalTemplateRoleState {
	roles: string[];
	loading: {
		initial: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	error: string | null;
	selectedRole: string | null;
}

export interface GlobalTemplateRoleActions {
	fetchGlobalTemplateRoles: () => Promise<void>;
	createGlobalTemplateRoles: (roles?: string[]) => Promise<void>;
	updateGlobalTemplateRole: (roleName: string, permissions?: [string, string][]) => Promise<void>;
	deleteGlobalTemplateRole: (roleName: string) => Promise<void>;
	setSelectedRole: (role: string | null) => void;
	setError: (error: string | null) => void;
}

export interface UseGlobalTemplateRoleReturn {
	state: GlobalTemplateRoleState;
	actions: GlobalTemplateRoleActions;
}

const initialState: GlobalTemplateRoleState = {
	roles: [],
	loading: {
		initial: true,
		create: false,
		update: false,
		delete: false,
	},
	error: null,
	selectedRole: null,
};

export function useGlobalTemplateRole(): UseGlobalTemplateRoleReturn {
	const [state, setState] = useState<GlobalTemplateRoleState>(initialState);

	const setLoading = (loadingState: Partial<GlobalTemplateRoleState['loading']>) => {
		setState((prev) => ({ 
			...prev, 
			loading: { ...prev.loading, ...loadingState } 
		}));
	};

	const setError = (error: string | null) => {
		setState((prev) => ({ ...prev, error }));
	};

	const setSelectedRole = (role: string | null) => {
		setState((prev) => ({ ...prev, selectedRole: role }));
	};

	const fetchGlobalTemplateRoles = useCallback(async () => {
		setLoading({ initial: true });
		setError(null);
		try {
			const roles = await getGlobalTemplateRoles();
			setState((prev) => ({ 
				...prev, 
				roles,
				loading: { ...prev.loading, initial: false }
			}));
		} catch (err) {
			console.error('Error fetching global template roles:', err);
			let errorMessage = 'Failed to fetch global template roles';
			if (err instanceof Error) errorMessage = err.message;
			else if (typeof err === 'string') errorMessage = err;
			setError(errorMessage);
			setLoading({ initial: false });
		}
	}, []);

	const createGlobalTemplateRolesAction = useCallback(async (roles?: string[]) => {
		setLoading({ create: true });
		setError(null);
		try {
			await createGlobalTemplateRoles(roles);
			// Refresh the roles list after creation
			await fetchGlobalTemplateRoles();
		} catch (err) {
			console.error('Error creating global template roles:', err);
			let errorMessage = 'Failed to create global template roles';
			if (err instanceof Error) errorMessage = err.message;
			else if (typeof err === 'string') errorMessage = err;
			setError(errorMessage);
		} finally {
			setLoading({ create: false });
		}
	}, [fetchGlobalTemplateRoles]);

	const updateGlobalTemplateRoleAction = useCallback(async (roleName: string, permissions?: [string, string][]) => {
		setLoading({ update: true });
		setError(null);
		try {
			await updateGlobalTemplateRole(roleName, permissions);
			// Refresh the roles list after update
			await fetchGlobalTemplateRoles();
		} catch (err) {
			console.error('Error updating global template role:', err);
			let errorMessage = 'Failed to update global template role';
			if (err instanceof Error) errorMessage = err.message;
			else if (typeof err === 'string') errorMessage = err;
			setError(errorMessage);
		} finally {
			setLoading({ update: false });
		}
	}, [fetchGlobalTemplateRoles]);

	const deleteGlobalTemplateRoleAction = useCallback(async (roleName: string) => {
		setLoading({ delete: true });
		setError(null);
		try {
			await deleteGlobalTemplateRole(roleName);
			// Remove the role from the local state
			setState((prev) => ({ 
				...prev, 
				roles: prev.roles.filter(role => role !== roleName),
				selectedRole: prev.selectedRole === roleName ? null : prev.selectedRole
			}));
		} catch (err) {
			console.error('Error deleting global template role:', err);
			let errorMessage = 'Failed to delete global template role';
			if (err instanceof Error) errorMessage = err.message;
			else if (typeof err === 'string') errorMessage = err;
			setError(errorMessage);
		} finally {
			setLoading({ delete: false });
		}
	}, []);

	useEffect(() => {
		fetchGlobalTemplateRoles();
	}, [fetchGlobalTemplateRoles]);

	return {
		state,
		actions: {
			fetchGlobalTemplateRoles,
			createGlobalTemplateRoles: createGlobalTemplateRolesAction,
			updateGlobalTemplateRole: updateGlobalTemplateRoleAction,
			deleteGlobalTemplateRole: deleteGlobalTemplateRoleAction,
			setSelectedRole,
			setError,
		},
	};
}
