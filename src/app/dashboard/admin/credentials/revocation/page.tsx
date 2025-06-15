'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Search, AlertTriangle, Shield, Clock, Eye, Download, RefreshCw, Ban, FileX, Calendar, TrendingUp, AlertCircle} from 'lucide-react'

// Mock data for revoked credentials
const mockRevokedCredentials = [
	{
		id: '1',
		credentialId: 'cred_001',
		holderName: 'John Doe',
		holderEmail: 'john.doe@example.com',
		credentialType: 'University Degree',
		issuer: 'MIT University',
		issuedDate: '2023-06-15',
		revokedDate: '2024-01-20',
		revokedBy: 'admin@mit.edu',
		reason: 'Academic misconduct',
		status: 'revoked',
		revocationMethod: 'status_list',
	},
	{
		id: '2',
		credentialId: 'cred_002',
		holderName: 'Jane Smith',
		holderEmail: 'jane.smith@example.com',
		credentialType: 'Professional Certificate',
		issuer: 'Tech Corp',
		issuedDate: '2023-08-10',
		revokedDate: '2024-01-18',
		revokedBy: 'hr@techcorp.com',
		reason: 'Employment terminated',
		status: 'revoked',
		revocationMethod: 'registry',
	},
	{
		id: '3',
		credentialId: 'cred_003',
		holderName: 'Bob Johnson',
		holderEmail: 'bob.johnson@example.com',
		credentialType: 'Identity Verification',
		issuer: 'Gov Agency',
		issuedDate: '2023-12-01',
		revokedDate: '2024-01-22',
		revokedBy: 'system@gov.agency',
		reason: 'Document expired',
		status: 'revoked',
		revocationMethod: 'bitstring',
	},
]

const mockStats = {
	totalRevoked: 156,
	thisMonth: 23,
	thisWeek: 8,
	pendingRevocation: 5,
	revocationRate: 2.3,
	topReasons: [
		{reason: 'Employment terminated', count: 45},
		{reason: 'Academic misconduct', count: 32},
		{reason: 'Document expired', count: 28},
		{reason: 'Security breach', count: 18},
	],
}

// Revoke Credential Form Component
function RevokeCredentialForm({onClose}: {onClose: () => void}) {
	const [formData, setFormData] = useState({
		credentialId: '',
		reason: '',
		description: '',
		notifyHolder: true,
		effectiveDate: new Date().toISOString().split('T')[0],
	})

	return (
		<div className='space-y-4'>
			<div>
				<Label htmlFor='credentialId'>Credential ID</Label>
				<Input id='credentialId' value={formData.credentialId} onChange={(e) => setFormData((prev) => ({...prev, credentialId: e.target.value}))} placeholder='Enter credential ID to revoke' />
			</div>

			<div>
				<Label htmlFor='reason'>Revocation Reason</Label>
				<Select value={formData.reason} onValueChange={(value) => setFormData((prev) => ({...prev, reason: value}))}>
					<SelectTrigger>
						<SelectValue placeholder='Select reason' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='employment_terminated'>Employment Terminated</SelectItem>
						<SelectItem value='academic_misconduct'>Academic Misconduct</SelectItem>
						<SelectItem value='document_expired'>Document Expired</SelectItem>
						<SelectItem value='security_breach'>Security Breach</SelectItem>
						<SelectItem value='fraud_detected'>Fraud Detected</SelectItem>
						<SelectItem value='other'>Other</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label htmlFor='description'>Description</Label>
				<Textarea id='description' value={formData.description} onChange={(e) => setFormData((prev) => ({...prev, description: e.target.value}))} placeholder='Provide additional details about the revocation' />
			</div>

			<div>
				<Label htmlFor='effectiveDate'>Effective Date</Label>
				<Input id='effectiveDate' type='date' value={formData.effectiveDate} onChange={(e) => setFormData((prev) => ({...prev, effectiveDate: e.target.value}))} />
			</div>

			<Alert>
				<AlertTriangle className='h-4 w-4' />
				<AlertDescription>This action cannot be undone. The credential will be permanently revoked and the holder will be notified.</AlertDescription>
			</Alert>

			<div className='flex justify-end gap-2 pt-4'>
				<Button variant='outline' onClick={onClose}>
					Cancel
				</Button>
				<Button
					variant='destructive'
					onClick={() => {
						console.log('Revoking credential:', formData)
						onClose()
					}}>
					Revoke Credential
				</Button>
			</div>
		</div>
	)
}

export default function RevocationManagementPage() {
	const [revokedCredentials] = useState(mockRevokedCredentials)
	const [searchTerm, setSearchTerm] = useState('')
	const [filterReason, setFilterReason] = useState('all')
	const [filterMethod, setFilterMethod] = useState('all')
	const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)

	const filteredCredentials = revokedCredentials.filter((credential) => {
		const matchesSearch = credential.holderName.toLowerCase().includes(searchTerm.toLowerCase()) || credential.credentialId.toLowerCase().includes(searchTerm.toLowerCase()) || credential.credentialType.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesReason = filterReason === 'all' || credential.reason.toLowerCase().includes(filterReason.toLowerCase())
		const matchesMethod = filterMethod === 'all' || credential.revocationMethod === filterMethod
		return matchesSearch && matchesReason && matchesMethod
	})

	const getReasonBadge = (reason: string) => {
		const reasonConfig: Record<string, string> = {
			'Academic misconduct': 'bg-red-100 text-red-800',
			'Employment terminated': 'bg-orange-100 text-orange-800',
			'Document expired': 'bg-yellow-100 text-yellow-800',
			'Security breach': 'bg-purple-100 text-purple-800',
		}
		return <Badge className={reasonConfig[reason] || 'bg-gray-100 text-gray-800'}>{reason}</Badge>
	}

	const getMethodBadge = (method: string) => {
		const methodConfig: Record<string, string> = {
			status_list: 'bg-blue-100 text-blue-800',
			registry: 'bg-green-100 text-green-800',
			bitstring: 'bg-indigo-100 text-indigo-800',
		}
		return <Badge className={methodConfig[method] || 'bg-gray-100 text-gray-800'}>{method.replace('_', ' ').toUpperCase()}</Badge>
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold'>Revocation Management</h1>
					<p className='text-gray-600 mt-1'>Manage credential revocations and monitor revocation status</p>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' className='flex items-center gap-2'>
						<Download className='w-4 h-4' />
						Export Report
					</Button>
					<Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
						<DialogTrigger asChild>
							<Button variant='destructive' className='flex items-center gap-2'>
								<Ban className='w-4 h-4' />
								Revoke Credential
							</Button>
						</DialogTrigger>
						<DialogContent className='max-w-2xl'>
							<DialogHeader>
								<DialogTitle>Revoke Credential</DialogTitle>
							</DialogHeader>
							<RevokeCredentialForm onClose={() => setIsRevokeDialogOpen(false)} />
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>Total Revoked</p>
								<p className='text-2xl font-bold'>{mockStats.totalRevoked}</p>
							</div>
							<FileX className='w-8 h-8 text-red-500' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>This Month</p>
								<p className='text-2xl font-bold text-orange-600'>{mockStats.thisMonth}</p>
							</div>
							<Calendar className='w-8 h-8 text-orange-500' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>This Week</p>
								<p className='text-2xl font-bold text-yellow-600'>{mockStats.thisWeek}</p>
							</div>
							<Clock className='w-8 h-8 text-yellow-500' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>Pending</p>
								<p className='text-2xl font-bold text-blue-600'>{mockStats.pendingRevocation}</p>
							</div>
							<AlertCircle className='w-8 h-8 text-blue-500' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>Revocation Rate</p>
								<p className='text-2xl font-bold text-purple-600'>{mockStats.revocationRate}%</p>
							</div>
							<TrendingUp className='w-8 h-8 text-purple-500' />
						</div>
					</CardContent>
				</Card>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Main Content */}
				<div className='lg:col-span-2 space-y-6'>
					{/* Filters and Search */}
					<Card>
						<CardContent className='p-4'>
							<div className='flex flex-col md:flex-row gap-4'>
								<div className='flex-1'>
									<div className='relative'>
										<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
										<Input placeholder='Search by holder, credential ID, or type...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
									</div>
								</div>
								<Select value={filterReason} onValueChange={setFilterReason}>
									<SelectTrigger className='w-48'>
										<SelectValue placeholder='Filter by reason' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Reasons</SelectItem>
										<SelectItem value='employment'>Employment</SelectItem>
										<SelectItem value='academic'>Academic</SelectItem>
										<SelectItem value='expired'>Expired</SelectItem>
										<SelectItem value='security'>Security</SelectItem>
									</SelectContent>
								</Select>
								<Select value={filterMethod} onValueChange={setFilterMethod}>
									<SelectTrigger className='w-48'>
										<SelectValue placeholder='Filter by method' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Methods</SelectItem>
										<SelectItem value='status_list'>Status List</SelectItem>
										<SelectItem value='registry'>Registry</SelectItem>
										<SelectItem value='bitstring'>Bitstring</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* Revoked Credentials List */}
					<Card>
						<CardHeader>
							<CardTitle>Revoked Credentials ({filteredCredentials.length})</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='space-y-4'>
								{filteredCredentials.map((credential) => (
									<div key={credential.id} className='border rounded-lg p-4 hover:bg-gray-50'>
										<div className='flex items-center justify-between'>
											<div className='flex-1'>
												<div className='flex items-center gap-3 mb-2'>
													<h3 className='text-lg font-semibold'>{credential.holderName}</h3>
													<Badge variant='outline'>{credential.credentialType}</Badge>
													{getReasonBadge(credential.reason)}
													{getMethodBadge(credential.revocationMethod)}
												</div>
												<div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
													<div>
														<p>
															<strong>Credential ID:</strong> {credential.credentialId}
														</p>
														<p>
															<strong>Holder Email:</strong> {credential.holderEmail}
														</p>
														<p>
															<strong>Issuer:</strong> {credential.issuer}
														</p>
													</div>
													<div>
														<p>
															<strong>Issued:</strong> {credential.issuedDate}
														</p>
														<p>
															<strong>Revoked:</strong> {credential.revokedDate}
														</p>
														<p>
															<strong>Revoked By:</strong> {credential.revokedBy}
														</p>
													</div>
												</div>
											</div>
											<div className='flex items-center gap-2'>
												<Button variant='ghost' size='sm'>
													<Eye className='w-4 h-4' />
												</Button>
												<Button variant='ghost' size='sm'>
													<Download className='w-4 h-4' />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className='space-y-6'>
					{/* Top Revocation Reasons */}
					<Card>
						<CardHeader>
							<CardTitle>Top Revocation Reasons</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								{mockStats.topReasons.map((item, index) => (
									<div key={index} className='flex items-center justify-between'>
										<span className='text-sm'>{item.reason}</span>
										<div className='flex items-center gap-2'>
											<div className='w-16 bg-gray-200 rounded-full h-2'>
												<div className='bg-blue-500 h-2 rounded-full' style={{width: `${(item.count / mockStats.topReasons[0].count) * 100}%`}}></div>
											</div>
											<span className='text-sm font-medium'>{item.count}</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle>Quick Actions</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2'>
							<Button variant='outline' className='w-full justify-start'>
								<RefreshCw className='w-4 h-4 mr-2' />
								Refresh Status
							</Button>
							<Button variant='outline' className='w-full justify-start'>
								<Download className='w-4 h-4 mr-2' />
								Export All
							</Button>
							<Button variant='outline' className='w-full justify-start'>
								<Shield className='w-4 h-4 mr-2' />
								Audit Trail
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
