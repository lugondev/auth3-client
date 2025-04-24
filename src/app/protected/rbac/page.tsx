'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleModal from '@/components/modals/RoleModal';

interface Role {
	id: string
	name: string
	permissions: string[]
}

interface User {
	id: string
	email: string
	fullName: string
	role: string
}

export default function RBACManagement() {
	const [roles, setRoles] = useState<Role[]>([])
	const [users, setUsers] = useState<User[]>([])
	const {token} = useAuth()

	useEffect(() => {
		// Fetch roles and users
		const fetchData = async () => {
			try {
				const [rolesRes, usersRes] = await Promise.all([
					fetch('/api/v1/roles', {
						headers: {
							'Authorization': `Bearer ${token}`,
						},
					}),
					fetch('/api/v1/users/search', {
						headers: {
							'Authorization': `Bearer ${token}`,
						},
					}),
				])

				const rolesData = await rolesRes.json()
				const usersData = await usersRes.json()

				setRoles(rolesData)
				setUsers(usersData.users)
			} catch (error) {
				console.error('Error fetching RBAC data:', error)
			}
		}

		fetchData()
	}, [token])

	const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [searchQuery, setSearchQuery] = useState('');

	const handleAddRole = async (data: { name: string; permissions: string[] }) => {
		try {
			const response = await fetch('/api/v1/roles', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				const newRole = await response.json();
				setRoles([...roles, newRole]);
			}
		} catch (error) {
			console.error('Error adding role:', error);
		}
	};

	const handleEditRole = async (data: { name: string; permissions: string[] }) => {
		if (!selectedRole) return;

		try {
			const response = await fetch(`/api/v1/roles/${selectedRole.id}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				const updatedRole = await response.json();
				setRoles(roles.map(role => 
					role.id === selectedRole.id ? updatedRole : role
				));
			}
		} catch (error) {
			console.error('Error updating role:', error);
		}
	};

	const handleDeleteRole = async (roleId: string) => {
		if (!confirm('Are you sure you want to delete this role?')) return;

		try {
			const response = await fetch(`/api/v1/roles/${roleId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});

			if (response.ok) {
				setRoles(roles.filter(role => role.id !== roleId));
			}
		} catch (error) {
			console.error('Error deleting role:', error);
		}
	};

	const handleChangeUserRole = async (userId: string, roleId: string) => {
		try {
			const response = await fetch(`/api/v1/users/${userId}/role`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ roleId }),
			});

			if (response.ok) {
				const updatedUser = await response.json();
				setUsers(users.map(user =>
					user.id === userId ? updatedUser : user
				));
			}
		} catch (error) {
			console.error('Error updating user role:', error);
		}
	};

	const filteredUsers = users.filter(user =>
		user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
		user.email.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className='p-6'>
			<h1 className='text-2xl font-bold mb-6'>Role-Based Access Control</h1>

			{/* Roles Management Section */}
			<div className='mb-8'>
				<div className='flex justify-between items-center mb-4'>
					<h2 className='text-xl font-semibold'>Roles</h2>
					<button 
						className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
						onClick={() => {
							setSelectedRole(null);
							setIsRoleModalOpen(true);
						}}
					>
						Add New Role
					</button>
				</div>
				<div className='grid gap-4'>
					{roles.map((role) => (
						<div key={role.id} className='border p-4 rounded-lg'>
							<h3 className='font-medium'>{role.name}</h3>
							<div className='mt-2'>
								<h4 className='text-sm text-gray-600'>Permissions:</h4>
								<div className='flex flex-wrap gap-2 mt-1'>
									{role.permissions.map((permission) => (
										<span key={permission} className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded'>
											{permission}
										</span>
									))}
								</div>
							</div>
							<div className='mt-4 flex gap-2'>
								<button className='text-indigo-600 hover:text-indigo-900'>Edit</button>
								<button className='text-red-600 hover:text-red-900'>Delete</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Users Management Section */}
			<div>
				<div className='flex justify-between items-center mb-4'>
					<h2 className='text-xl font-semibold'>Users</h2>
					<div className='flex gap-2'>
						<input 
							type='text' 
							placeholder='Search users...' 
							className='border rounded px-3 py-2'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
				<div className='overflow-x-auto'>
					<table className='min-w-full'>
						<thead>
							<tr className='bg-gray-50'>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Name</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Email</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Role</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{users.map((user) => (
								<tr key={user.id}>
									<td className='px-6 py-4 whitespace-nowrap'>{user.fullName}</td>
									<td className='px-6 py-4 whitespace-nowrap'>{user.email}</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<select className='border rounded px-2 py-1' value={user.role} onChange={(e) => console.log('Change role', e.target.value)}>
											{roles.map((role) => (
												<option key={role.id} value={role.id}>
													{role.name}
												</option>
											))}
										</select>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<button className='text-indigo-600 hover:text-indigo-900 mr-4'>Edit</button>
										<button className='text-red-600 hover:text-red-900'>Remove</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<RoleModal
				isOpen={isRoleModalOpen}
				onClose={() => {
					setIsRoleModalOpen(false);
					setSelectedRole(null);
				}}
				onSubmit={selectedRole ? handleEditRole : handleAddRole}
				role={selectedRole || undefined}
			/>
		</div>
	);
}
