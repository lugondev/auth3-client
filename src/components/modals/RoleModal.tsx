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
        // Use a semi-transparent background variable for the backdrop
        <div className='fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center'>
            {/* Use card background and foreground for the modal content */}
            <div className='bg-card text-card-foreground rounded-lg p-6 w-full max-w-md border'>
				<h2 className='text-xl font-bold mb-4'>{role ? 'Edit Role' : 'Add New Role'}</h2>
				<form onSubmit={handleSubmit}>
					<div className='mb-4'>
						{/* Use default text color for labels */}
						<label className='block text-sm font-medium mb-2'>Role Name</label>
						{/* Use input background and border */}
						<input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-full border bg-input rounded px-3 py-2' required />
					</div>

					<div className='mb-4'>
						<label className='block text-sm font-medium mb-2'>Permissions</label>
						<div className='flex gap-2 mb-2'>
							{/* Use input background and border */}
							<input type='text' value={newPermission} onChange={(e) => setNewPermission(e.target.value)} className='flex-1 border bg-input rounded px-3 py-2' placeholder='Add permission' />
							{/* Use primary button colors */}
							<button type='button' onClick={addPermission} className='bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90'>
								Add
							</button>
						</div>
						<div className='flex flex-wrap gap-2'>
							{permissions.map((permission) => (
								// Use accent colors for permission badges
								(<span key={permission} className='bg-accent text-accent-foreground text-xs px-2 py-1 rounded flex items-center gap-2'>
                                    {permission}
                                    {/* Use accent foreground for remove button */}
                                    <button type='button' onClick={() => removePermission(permission)} className='text-accent-foreground hover:text-accent-foreground/80'>
										×
									</button>
                                </span>)
							))}
						</div>
					</div>

					<div className='flex justify-end gap-2'>
						{/* Use muted hover background for cancel button */}
						<button type='button' onClick={onClose} className='px-4 py-2 border rounded hover:bg-muted/50'>
							Cancel
						</button>
						{/* Use primary button colors */}
						<button type='submit' className='bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90'>
							{role ? 'Update' : 'Create'}
						</button>
					</div>
				</form>
			</div>
        </div>
    );
}
