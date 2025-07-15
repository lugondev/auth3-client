import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useGlobalTemplateRole } from '@/hooks/useGlobalTemplateRole';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GlobalTemplateRolesSectionProps {
	selectedRole: string | null;
	onOpenRolePermsModal: (roleName: string) => void;
}

export function GlobalTemplateRolesSection({ 
	selectedRole, 
	onOpenRolePermsModal 
}: GlobalTemplateRolesSectionProps) {
	const { state, actions } = useGlobalTemplateRole();
	const [deletingRole, setDeletingRole] = useState<string | null>(null);

	const handleDeleteRole = async (roleName: string) => {
		if (window.confirm(`Are you sure you want to delete the global template role "${roleName}"? This will remove it from all tenants.`)) {
			setDeletingRole(roleName);
			try {
				await actions.deleteGlobalTemplateRole(roleName);
			} finally {
				setDeletingRole(null);
			}
		}
	};

	const handleCreateDefaultRoles = async () => {
		if (window.confirm('This will create default global template roles (TenantAdmin, TenantManager, TenantMember, TenantViewer). Continue?')) {
			await actions.createGlobalTemplateRoles();
		}
	};

	if (state.loading.initial) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Global Template Roles</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex justify-center items-center py-8">
						<Loader2 className="h-6 w-6 animate-spin" />
						<span className="ml-2">Loading global template roles...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Global Template Roles</span>
					<Button 
						onClick={handleCreateDefaultRoles}
						disabled={state.loading.create}
						variant="outline"
						size="sm"
					>
						{state.loading.create ? (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						) : (
							<Plus className="h-4 w-4 mr-2" />
						)}
						Create Default Roles
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{state.error && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{state.error}</AlertDescription>
					</Alert>
				)}

				{state.roles.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<p>No global template roles found.</p>
						<p className="text-sm mt-2">
							Click "Create Default Roles" to create standard template roles that will be available to all tenants.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="text-sm text-muted-foreground mb-4">
							<p>
								Global template roles are automatically available to all tenants. 
								Changes to these roles will affect all tenants immediately.
							</p>
						</div>
						
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{state.roles.map((roleName) => (
								<Card key={roleName} className="relative">
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-2">
											<h4 className="font-medium text-sm">{roleName}</h4>
											<Badge variant="secondary" className="text-xs">
												Global
											</Badge>
										</div>
										
										<div className="flex gap-2 mt-3">
											<Button
												variant="outline"
												size="sm"
												onClick={() => onOpenRolePermsModal(roleName)}
												disabled={state.loading.update && selectedRole === roleName}
												className="flex-1"
											>
												{state.loading.update && selectedRole === roleName ? (
													<Loader2 className="h-3 w-3 animate-spin mr-1" />
												) : (
													<Edit className="h-3 w-3 mr-1" />
												)}
												Edit Permissions
											</Button>
											
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDeleteRole(roleName)}
												disabled={deletingRole === roleName}
												className="text-destructive hover:text-destructive"
											>
												{deletingRole === roleName ? (
													<Loader2 className="h-3 w-3 animate-spin" />
												) : (
													<Trash2 className="h-3 w-3" />
												)}
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
