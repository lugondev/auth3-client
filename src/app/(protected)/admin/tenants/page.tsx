'use client'

import React, {useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {listTenants} from '@/services/tenantService'
import {AllTenantsResponse} from '@/types/tenantManagement'
import {useAuth} from '@/contexts/AuthContext'
import {TenantTable} from '@/components/tenants/TenantTable'
import {Button} from '@/components/ui/button'
import {ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight} from 'lucide-react'

const ITEMS_PER_PAGE = 10

const TenantManagementPage = () => {
	const [page, setPage] = useState(1)
	const {user} = useAuth()
	const isAdmin = user?.roles?.includes('SystemSuperAdmin') || false

	const {
		data: allTenantsData,
		isLoading: isLoadingAll,
		error: errorAll,
	} = useQuery<AllTenantsResponse, Error>({
		queryKey: ['allTenantsForAdmin', page],
		queryFn: () => listTenants(ITEMS_PER_PAGE, (page - 1) * ITEMS_PER_PAGE),
		enabled: isAdmin,
	})

	const totalPages = allTenantsData?.total_pages || 1

	const handlePageChange = (newPage: number) => {
		setPage(newPage)
	}

	if (!isAdmin) {
		return null
	}

	return (
		<div className='container mx-auto p-4'>
			<div className='mb-6'>
				<h1 className='text-2xl font-bold text-gray-800 dark:text-gray-100'>Tenant Management</h1>
			</div>

			<div className='mt-4 p-4 border rounded-md dark:border-gray-700 space-y-4'>
				{isLoadingAll && <p className='text-gray-500 dark:text-gray-400'>Loading tenants...</p>}
				{errorAll && <p className='text-red-500'>Error loading tenants: {errorAll.message}</p>}
				{allTenantsData && allTenantsData.tenants && <TenantTable tenants={allTenantsData.tenants} isAdmin={true} />}
				{allTenantsData && allTenantsData.tenants?.length === 0 && <p className='text-gray-500 dark:text-gray-400'>No tenants found in the system.</p>}

				{allTenantsData && allTenantsData.tenants && allTenantsData.tenants.length > 0 && (
					<div className='flex items-center justify-between space-x-2'>
						<div className='text-sm text-muted-foreground'>
							Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, allTenantsData.total)} of {allTenantsData.total} entries
						</div>
						<div className='flex items-center space-x-2'>
							<Button variant='outline' size='icon' onClick={() => handlePageChange(1)} disabled={page === 1}>
								<ChevronsLeft className='h-4 w-4' />
							</Button>
							<Button variant='outline' size='icon' onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
								<ChevronLeft className='h-4 w-4' />
							</Button>
							<div className='text-sm font-medium'>
								Page {page} of {totalPages}
							</div>
							<Button variant='outline' size='icon' onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
								<ChevronRight className='h-4 w-4' />
							</Button>
							<Button variant='outline' size='icon' onClick={() => handlePageChange(totalPages)} disabled={page >= totalPages}>
								<ChevronsRight className='h-4 w-4' />
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default TenantManagementPage
