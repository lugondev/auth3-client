'use client'

import React, {useState} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {TenantSelector} from '@/components/tenants/TenantSelector'
import {ContextSwitcher} from '@/components/context/ContextSwitcher'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Separator} from '@/components/ui/separator'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {useAuth} from '@/contexts/AuthContext'
import {getOwnedTenants, getJoinedTenants, createTenant} from '@/services/tenantService'
import {
	Building2,
	Plus,
	Users,
	Crown,
	Settings,
	ExternalLink,
	Loader2,
	CheckCircle,
	XCircle,
} from 'lucide-react'
import {toast} from 'sonner'

interface CreateTenantForm {
	name: string
	slug: string
}

export default function TenantManagementPage() {
	const {user, currentMode, currentTenantId} = useAuth()
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [createForm, setCreateForm] = useState<CreateTenantForm>({
		name: '',
		slug: '',
	})
	const queryClient = useQueryClient()

	// Fetch owned tenants
	const {
		data: ownedTenants,
		isLoading: isLoadingOwned,
		error: ownedError,
	} = useQuery({
		queryKey: ['ownedTenants'],
		queryFn: () => getOwnedTenants(50, 0),
		enabled: !!user,
	})

	// Fetch joined tenants
	const {
		data: joinedTenants,
		isLoading: isLoadingJoined,
		error: joinedError,
	} = useQuery({
		queryKey: ['joinedTenants'],
		queryFn: () => getJoinedTenants(50, 0),
		enabled: !!user,
	})

	// Create tenant mutation
	const createTenantMutation = useMutation({
		mutationFn: createTenant,
		onSuccess: () => {
			toast.success('Tenant created successfully!')
			setIsCreateModalOpen(false)
			setCreateForm({name: '', slug: ''})
			// Refetch both owned and joined tenants
			queryClient.invalidateQueries({queryKey: ['ownedTenants']})
			queryClient.invalidateQueries({queryKey: ['joinedTenants']})
		},
		onError: (error) => {
			toast.error(`Failed to create tenant: ${error.message}`)
		},
	})

	const handleCreateTenant = async () => {
		if (!createForm.name.trim() || !createForm.slug.trim()) {
			toast.error('Name and slug are required')
			return
		}

		createTenantMutation.mutate({
			name: createForm.name.trim(),
			slug: createForm.slug.trim(),
		})
	}

	// Auto-generate slug from name
	const handleNameChange = (name: string) => {
		setCreateForm(prev => ({
			...prev,
			name,
			slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
		}))
	}

	return (
		<div className="space-y-8">
			{/* Page Header */}
			<div className="mb-6">
				<h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
				<p className="text-muted-foreground mt-2">
					Manage your organizations and memberships
				</p>
			</div>

			{/* Context and Quick Actions */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building2 className="h-5 w-5" />
								Tenant Selector
							</CardTitle>
							<CardDescription>
								Switch between your tenants and global context
							</CardDescription>
						</CardHeader>
						<CardContent>
							<TenantSelector
								variant="full"
								showGlobalOption={true}
								showCreateButton={true}
								showManageButton={false}
								onCreateTenant={() => setIsCreateModalOpen(true)}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								Context Switcher
							</CardTitle>
							<CardDescription>
								Switch authentication context mode
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ContextSwitcher
								variant="card"
								showRefreshButton={true}
								showCurrentContext={true}
								showTenantInfo={true}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Quick Stats</CardTitle>
							<CardDescription>Your tenant overview</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between">
								<span className="text-sm font-medium">Owned Tenants:</span>
								<Badge variant="default">
									{ownedTenants?.tenants?.length || 0}
								</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-sm font-medium">Member Of:</span>
								<Badge variant="secondary">
									{joinedTenants?.memberships?.length || 0}
								</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-sm font-medium">Current Context:</span>
								<Badge variant={currentMode === 'global' ? 'outline' : 'default'}>
									{currentMode === 'global' ? 'Global' : 'Tenant'}
								</Badge>
							</div>
						</CardContent>
					</Card>
				</div>

			{/* Owned Tenants Section */}
			<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Crown className="h-5 w-5 text-yellow-500" />
									Owned Tenants
								</CardTitle>
								<CardDescription>
									Organizations you own and have full control over
								</CardDescription>
							</div>
							<Button onClick={() => setIsCreateModalOpen(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Create Tenant
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{isLoadingOwned ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin" />
								<span className="ml-2">Loading owned tenants...</span>
							</div>
						) : ownedError ? (
							<div className="text-center py-8 text-red-600">
								Error loading owned tenants: {ownedError.message}
							</div>
						) : ownedTenants?.tenants && ownedTenants.tenants.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Slug</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Created</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{ownedTenants.tenants.map((tenant) => (
										<TableRow key={tenant.id}>
											<TableCell className="font-medium">
												<div className="flex items-center gap-2">
													<Building2 className="h-4 w-4 text-green-600" />
													{tenant.name}
													{currentTenantId === tenant.id && (
														<Badge variant="secondary" className="text-xs">
															Current
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell className="font-mono text-sm">
												{tenant.slug}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													{tenant.is_active ? (
														<>
															<CheckCircle className="h-4 w-4 text-green-600" />
															<span className="text-green-600">Active</span>
														</>
													) : (
														<>
															<XCircle className="h-4 w-4 text-red-600" />
															<span className="text-red-600">Inactive</span>
														</>
													)}
												</div>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'N/A'}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Button
														variant="outline"
														size="sm"
														asChild
													>
														<a href={`/dashboard/admin/tenants/${tenant.id}`}>
															<Settings className="h-3 w-3 mr-1" />
															Manage
														</a>
													</Button>
													<Button
														variant="ghost"
														size="sm"
														asChild
													>
														<a href={`/dashboard/tenant/${tenant.id}`} target="_blank">
															<ExternalLink className="h-3 w-3" />
														</a>
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
								<p>You don't own any tenants yet.</p>
								<Button 
									className="mt-4" 
									onClick={() => setIsCreateModalOpen(true)}
								>
									Create Your First Tenant
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

			{/* Joined Tenants Section */}
			<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5 text-blue-500" />
							Tenant Memberships
						</CardTitle>
						<CardDescription>
							Organizations you're a member of
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoadingJoined ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin" />
								<span className="ml-2">Loading memberships...</span>
							</div>
						) : joinedError ? (
							<div className="text-center py-8 text-red-600">
								Error loading memberships: {joinedError.message}
							</div>
						) : joinedTenants?.memberships && joinedTenants.memberships.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Organization</TableHead>
										<TableHead>Slug</TableHead>
										<TableHead>Roles</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Joined</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{joinedTenants.memberships.map((membership) => (
										<TableRow key={membership.tenant_id}>
											<TableCell className="font-medium">
												<div className="flex items-center gap-2">
													<Building2 className="h-4 w-4 text-blue-600" />
													{membership.tenant_name}
													{currentTenantId === membership.tenant_id && (
														<Badge variant="secondary" className="text-xs">
															Current
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell className="font-mono text-sm">
												{membership.tenant_slug}
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{membership.user_roles.map((role) => (
														<Badge key={role} variant="outline" className="text-xs">
															{role}
														</Badge>
													))}
												</div>
											</TableCell>
											<TableCell>
												<Badge 
													variant={membership.user_status === 'active' ? 'default' : 'secondary'}
													className="text-xs"
												>
													{membership.user_status}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{new Date(membership.joined_at).toLocaleDateString()}
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													asChild
												>
													<a href={`/dashboard/tenant/${membership.tenant_id}`} target="_blank">
														<ExternalLink className="h-3 w-3" />
													</a>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
								<p>You're not a member of any organizations yet.</p>
							</div>
						)}
					</CardContent>
				</Card>

			{/* Create Tenant Dialog */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Create New Tenant</DialogTitle>
							<DialogDescription>
								Create a new organization to manage users, credentials, and resources.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Organization Name</Label>
								<Input
									id="name"
									value={createForm.name}
									onChange={(e) => handleNameChange(e.target.value)}
									placeholder="My Organization"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="slug">Slug</Label>
								<Input
									id="slug"
									value={createForm.slug}
									onChange={(e) => setCreateForm(prev => ({...prev, slug: e.target.value}))}
									placeholder="my-organization"
									className="font-mono"
								/>
								<p className="text-xs text-muted-foreground">
									URL-friendly identifier (auto-generated from name)
								</p>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsCreateModalOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								onClick={handleCreateTenant}
								disabled={createTenantMutation.isPending || !createForm.name.trim() || !createForm.slug.trim()}
							>
								{createTenantMutation.isPending && (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								)}
								Create Tenant
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
		</div>
	)
}
