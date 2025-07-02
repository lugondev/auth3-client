'use client'

import React from 'react'
import {LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'

interface ChartData {
	[key: string]: string | number
}

interface AnalyticsChartProps {
	title: string
	data: ChartData[]
	type: 'line' | 'bar' | 'area' | 'pie'
	dataKey?: string
	xAxisKey?: string
	loading?: boolean
	height?: number
	colors?: string[]
	className?: string
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb']

export function AnalyticsChart({title, data, type, dataKey = 'value', xAxisKey = 'name', loading = false, height = 300, colors = DEFAULT_COLORS, className = ''}: AnalyticsChartProps) {
	if (loading) {
		return (
			<Card className={className}>
				<CardHeader>
					<Skeleton className='h-6 w-32' />
				</CardHeader>
				<CardContent>
					<Skeleton className='w-full' style={{height: `${height}px`}} />
				</CardContent>
			</Card>
		)
	}

	const renderChart = () => {
		switch (type) {
			case 'line':
				return (
					<LineChart data={data}>
						<CartesianGrid strokeDasharray='3 3' className='opacity-30' />
						<XAxis dataKey={xAxisKey} tick={{fontSize: 12}} tickLine={false} />
						<YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
						<Tooltip
							contentStyle={{
								backgroundColor: 'hsl(var(--background))',
								border: '1px solid hsl(var(--border))',
								borderRadius: '6px',
							}}
						/>
						<Line type='monotone' dataKey={dataKey} stroke={colors[0]} strokeWidth={2} dot={{fill: colors[0], strokeWidth: 2, r: 4}} activeDot={{r: 6, stroke: colors[0], strokeWidth: 2}} />
					</LineChart>
				)

			case 'bar':
				return (
					<BarChart data={data}>
						<CartesianGrid strokeDasharray='3 3' className='opacity-30' />
						<XAxis dataKey={xAxisKey} tick={{fontSize: 12}} tickLine={false} />
						<YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
						<Tooltip
							contentStyle={{
								backgroundColor: 'hsl(var(--background))',
								border: '1px solid hsl(var(--border))',
								borderRadius: '6px',
							}}
						/>
						<Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
					</BarChart>
				)

			case 'area':
				return (
					<AreaChart data={data}>
						<CartesianGrid strokeDasharray='3 3' className='opacity-30' />
						<XAxis dataKey={xAxisKey} tick={{fontSize: 12}} tickLine={false} />
						<YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
						<Tooltip
							contentStyle={{
								backgroundColor: 'hsl(var(--background))',
								border: '1px solid hsl(var(--border))',
								borderRadius: '6px',
							}}
						/>
						<Area type='monotone' dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
					</AreaChart>
				)

			case 'pie':                        return (
                                <PieChart>
                                        <Pie data={data} cx='50%' cy='50%' outerRadius={80} fill={colors[0]} dataKey={dataKey} label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                                         {data.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                         ))}
						</Pie>
						<Tooltip
							contentStyle={{
								backgroundColor: 'hsl(var(--background))',
								border: '1px solid hsl(var(--border))',
								borderRadius: '6px',
							}}
						/>
					</PieChart>
				)

			default:
				return <div>Unsupported chart type</div>
		}
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className='text-lg font-semibold'>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width='100%' height={height}>
					{renderChart()}
				</ResponsiveContainer>
			</CardContent>
		</Card>
	)
}

// Multi-line chart component for comparing multiple data series
interface MultiLineChartProps {
	title: string
	data: ChartData[]
	lines: Array<{
		dataKey: string
		name: string
		color: string
	}>
	xAxisKey?: string
	loading?: boolean
	height?: number
	className?: string
}

export function MultiLineChart({title, data, lines, xAxisKey = 'name', loading = false, height = 300, className = ''}: MultiLineChartProps) {
	if (loading) {
		return (
			<Card className={className}>
				<CardHeader>
					<Skeleton className='h-6 w-32' />
				</CardHeader>
				<CardContent>
					<Skeleton className='w-full' style={{height: `${height}px`}} />
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className='text-lg font-semibold'>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width='100%' height={height}>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray='3 3' className='opacity-30' />
						<XAxis dataKey={xAxisKey} tick={{fontSize: 12}} tickLine={false} />
						<YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
						<Tooltip
							contentStyle={{
								backgroundColor: 'hsl(var(--background))',
								border: '1px solid hsl(var(--border))',
								borderRadius: '6px',
							}}
						/>
						<Legend />
						{lines.map((line, index) => (
							<Line key={line.dataKey + '-' + index} type='monotone' dataKey={line.dataKey} stroke={line.color} strokeWidth={2} dot={{fill: line.color, strokeWidth: 2, r: 4}} activeDot={{r: 6, stroke: line.color, strokeWidth: 2}} name={line.name} />
						))}
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	)
}
