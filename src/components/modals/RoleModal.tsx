'use client'

import {useState} from 'react'

interface RoleModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (data: {name: string; permissions: string[]}) => void
	role?: {
		id: string
		name: string
		permissions: string[]
	}
}

export default function RoleModal({isOpen, onClose, onSubmit, role}: RoleModalProps) {
	const [name, setName] = useState(role?.name || '')
	const [permissions, setPermissions] = useState<string[]>(role?.permissions || [])
	const [newPermission, setNewPermission] = useState('')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit({name, permissions})
		onClose()
	}

	const addPermission = () => {
		if (newPermission && !permissions.includes(newPermission)) {
			setPermissions([...permissions, newPermission])
			setNewPermission('')
		}
	}

	const removePermission = (permission: string) => {
		setPermissions(permissions.filter((p) => p !== permission))
	}

	if (!isOpen) return null

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
			<div className='bg-white rounded-lg p-6 w-full max-w-md'>
				<h2 className='text-xl font-bold mb-4'>{role ? 'Edit Role' : 'Add New Role'}</h2>
				<form onSubmit={handleSubmit}>
					<div className='mb-4'>
						<label className='block text-sm font-medium mb-2'>Role Name</label>
						<input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-full border rounded px-3 py-2' required />
					</div>

					<div className='mb-4'>
						<label className='block text-sm font-medium mb-2'>Permissions</label>
						<div className='flex gap-2 mb-2'>
							<input type='text' value={newPermission} onChange={(e) => setNewPermission(e.target.value)} className='flex-1 border rounded px-3 py-2' placeholder='Add permission' />
							<button type='button' onClick={addPermission} className='bg-blue-500 text-white px-4 py-2 rounded'>
								Add
							</button>
						</div>
						<div className='flex flex-wrap gap-2'>
							{permissions.map((permission) => (
								<span key={permission} className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-2'>
									{permission}
									<button type='button' onClick={() => removePermission(permission)} className='text-blue-800 hover:text-blue-900'>
										×
									</button>
								</span>
							))}
						</div>
					</div>

					<div className='flex justify-end gap-2'>
						<button type='button' onClick={onClose} className='px-4 py-2 border rounded hover:bg-gray-50'>
							Cancel
						</button>
						<button type='submit' className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'>
							{role ? 'Update' : 'Create'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
