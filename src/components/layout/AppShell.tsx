import React from 'react'
import Header from './Header' // Reverted: Removed .tsx extension
import Sidebar from './Sidebar' // Changed to named import

interface AppShellProps {
	children: React.ReactNode
	sidebarType?: 'system' | 'tenant'
	tenantId?: string
	tenantName?: string
}

const AppShell: React.FC<AppShellProps> = ({children, sidebarType, tenantId, tenantName}) => {
	const [isSidebarOpen, setIsSidebarOpen] = React.useState(true) // Default to true for desktop

	const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

	return (
		<div className='flex h-screen bg-gray-100 dark:bg-gray-900'>
			{/* Sidebar: Hidden on mobile by default, visible on md and larger */}
			<div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-800 text-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
				<Sidebar type={sidebarType} tenantId={tenantId} tenantName={tenantName} />
			</div>

			{/* Overlay for mobile when sidebar is open */}
			{isSidebarOpen && <div className='fixed inset-0 z-20 bg-black opacity-50 md:hidden' onClick={toggleSidebar}></div>}

			<div className='flex flex-1 flex-col overflow-hidden'>
				<Header onMenuButtonClick={toggleSidebar} />
				<main className='flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-4 dark:bg-gray-900'>{children}</main>
			</div>
		</div>
	)
}

export default AppShell
