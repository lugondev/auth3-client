import {TenantDataTable} from '@/components/admin/tenants/TenantDataTable'
import {columns} from '@/components/admin/tenants/TenantColumns'
// import {getTenants} from '@/services/tenantService' // Commented out as data fetching is in DataTable
import {Button} from '@/components/ui/button'
import Link from 'next/link'

// TODO: Add revalidation or make this a client component if frequent updates are needed without full page reloads.
// For now, assuming server-side rendering with initial data fetch.

export default async function AdminTenantsPage() {
	// Initial fetch on the server. Client-side table will handle subsequent fetches for pagination/filtering.
	// This is a common pattern but can be adjusted based on UX needs (e.g., full client-side fetching).
	// const initialTenants = await getTenants({ page: 1, page_size: 10 }); // Default initial load

	return (
		<div className='container mx-auto py-10'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold'>Tenant Management</h1>
				<Button asChild>
					<Link href='/admin/tenants/new'>Create New Tenant</Link>
				</Button>
			</div>
			{/* 
        The TenantDataTable component is now responsible for its own data fetching
        and state management. We pass the columns definition.
      */}
			<TenantDataTable columns={columns} />
		</div>
	)
}
