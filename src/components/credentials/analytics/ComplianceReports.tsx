'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {FileText, Download, Calendar, BarChart2, CheckCircle, AlertTriangle} from 'lucide-react'
import {format} from 'date-fns'

interface ComplianceReportItem {
	id: string
	name: string
	createdAt: string
	type: string
	status: 'completed' | 'pending' | 'failed'
	downloadUrl?: string
}

interface ComplianceReportsProps {
	onGenerateReport: (reportType: 'daily' | 'weekly' | 'monthly') => void
	timeRange: {
		start: string
		end: string
	}
}

export function ComplianceReports({onGenerateReport, timeRange}: ComplianceReportsProps) {
	const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
	const [loading, setLoading] = useState<boolean>(false)

	// Normally this would come from an API call but for now using mock data
	const [reports, setReports] = useState<ComplianceReportItem[]>([
		{
			id: 'report-1',
			name: 'Monthly Compliance Report - May 2025',
			createdAt: '2025-05-15T10:30:00Z',
			type: 'monthly',
			status: 'completed',
			downloadUrl: '#',
		},
		{
			id: 'report-2',
			name: 'Weekly Compliance Report - Week 22, 2025',
			createdAt: '2025-06-01T14:15:00Z',
			type: 'weekly',
			status: 'completed',
			downloadUrl: '#',
		},
		{
			id: 'report-3',
			name: 'Daily Compliance Report - June 20, 2025',
			createdAt: '2025-06-20T09:45:00Z',
			type: 'daily',
			status: 'pending',
		},
	])

	const handleGenerateReport = async () => {
		try {
			setLoading(true)
			await onGenerateReport(reportType)

			// Mock adding a new report to the list
			const now = new Date()
			const newReport: ComplianceReportItem = {
				id: `report-${reports.length + 1}`,
				name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Compliance Report - ${format(now, 'MMMM d, yyyy')}`,
				createdAt: now.toISOString(),
				type: reportType,
				status: 'pending',
			}

			setReports([newReport, ...reports])

			// Simulate report completion after 2 seconds
			setTimeout(() => {
				setReports((prev) => prev.map((report) => (report.id === newReport.id ? {...report, status: 'completed', downloadUrl: '#'} : report)))
			}, 2000)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='space-y-6'>
			{/* Report Generator */}
			<Card>
				<CardHeader>
					<CardTitle>Generate Compliance Report</CardTitle>
					<CardDescription>Create reports for auditing and compliance purposes based on credential issuance and verification data</CardDescription>
				</CardHeader>
				<CardContent className='flex flex-col sm:flex-row gap-4'>
					<div className='flex-1'>
						<p className='mb-2 text-sm text-muted-foreground'>Time Range</p>
						<div className='p-3 border rounded-md bg-muted/20'>
							<div className='flex items-center gap-4'>
								<Calendar className='h-4 w-4 text-muted-foreground' />
								<div>
									<p className='text-sm font-medium'>From {format(new Date(timeRange.start), 'MMMM d, yyyy')}</p>
									<p className='text-sm font-medium'>To {format(new Date(timeRange.end), 'MMMM d, yyyy')}</p>
								</div>
							</div>
						</div>
					</div>
					<div className='flex-1'>
						<p className='mb-2 text-sm text-muted-foreground'>Report Type</p>
						<Select value={reportType} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setReportType(value)}>
							<SelectTrigger>
								<SelectValue placeholder='Select report type' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='daily'>Daily Report</SelectItem>
								<SelectItem value='weekly'>Weekly Report</SelectItem>
								<SelectItem value='monthly'>Monthly Report</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
				<CardFooter>
					<Button onClick={handleGenerateReport} disabled={loading}>
						<FileText className='h-4 w-4 mr-2' />
						{loading ? 'Generating...' : 'Generate Report'}
					</Button>
				</CardFooter>
			</Card>

			{/* Report Metrics */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>Total Reports</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex items-center'>
							<BarChart2 className='h-4 w-4 mr-2 text-muted-foreground' />
							<div className='text-2xl font-bold'>{reports.length}</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>Completed</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex items-center'>
							<CheckCircle className='h-4 w-4 mr-2 text-green-500' />
							<div className='text-2xl font-bold'>{reports.filter((r) => r.status === 'completed').length}</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>Pending</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex items-center'>
							<AlertTriangle className='h-4 w-4 mr-2 text-amber-500' />
							<div className='text-2xl font-bold'>{reports.filter((r) => r.status === 'pending').length}</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Reports List */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Reports</CardTitle>
					<CardDescription>Previously generated compliance reports available for download</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Report Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className='w-[100px]'></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{reports.map((report) => (
								<TableRow key={report.id}>
									<TableCell className='font-medium'>{report.name}</TableCell>
									<TableCell className='capitalize'>{report.type}</TableCell>
									<TableCell>{format(new Date(report.createdAt), 'MMM d, yyyy')}</TableCell>
									<TableCell>
										<span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${report.status === 'completed' ? 'bg-green-50 text-green-700' : report.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
											{report.status === 'completed' && <CheckCircle className='mr-1 h-3 w-3' />}
											{report.status === 'pending' && <AlertTriangle className='mr-1 h-3 w-3' />}
											<span className='capitalize'>{report.status}</span>
										</span>
									</TableCell>
									<TableCell>
										{report.status === 'completed' && report.downloadUrl && (
											<Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
												<span className='sr-only'>Download</span>
												<Download className='h-4 w-4' />
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
							{reports.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className='text-center py-4'>
										No reports generated yet
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	)
}
