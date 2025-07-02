'use client'

import * as React from 'react'
import {CalendarIcon, ChevronLeft, ChevronRight} from 'lucide-react'
import {format, parse, isValid} from 'date-fns'
import {DayPicker, DropdownProps} from 'react-day-picker'

import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'

interface EnhancedDatePickerProps {
	value?: string
	onChange?: (date: string) => void
	placeholder?: string
	className?: string
	disabled?: boolean
	minDate?: Date
	maxDate?: Date
}

// Generate years array (20 years back, 10 years forward from current year)
const generateYears = () => {
	const currentYear = new Date().getFullYear()
	const years = []
	for (let year = currentYear - 20; year <= currentYear + 10; year++) {
		years.push(year)
	}
	return years
}

// Month names for dropdown
const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

// Custom month/year dropdown components
const CustomDropdown = ({value, onChange, children, ...props}: DropdownProps): React.ReactElement | null => {
	const options = React.Children.toArray(children) as React.ReactElement[]
	const selected = options.find((child) => child.props.value === value)

	return (
		<Select
			value={value?.toString()}
			onValueChange={(newValue) => {
				const changeEvent = {
					target: {value: newValue},
				} as React.ChangeEvent<HTMLSelectElement>
				onChange?.(changeEvent)
			}}>
			<SelectTrigger className='h-8 w-fit px-2'>
				<SelectValue>{selected?.props?.children || value}</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.props.value} value={option.props.value?.toString() || ''}>
						{option.props.children}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

export function EnhancedDatePicker({value, onChange, placeholder = 'Pick a date', className, disabled, minDate, maxDate}: EnhancedDatePickerProps) {
	const [isOpen, setIsOpen] = React.useState(false)
	const [inputValue, setInputValue] = React.useState('')
	const [month, setMonth] = React.useState<Date>(() => {
		if (value) {
			const parsed = parse(value, 'yyyy-MM-dd', new Date())
			return isValid(parsed) ? parsed : new Date()
		}
		return new Date()
	})

	// Sync input value with prop value
	React.useEffect(() => {
		if (value) {
			const parsed = parse(value, 'yyyy-MM-dd', new Date())
			if (isValid(parsed)) {
				setInputValue(format(parsed, 'yyyy-MM-dd'))
			} else {
				setInputValue(value)
			}
		} else {
			setInputValue('')
		}
	}, [value])

	const selectedDate = React.useMemo(() => {
		if (!value) return undefined
		const parsed = parse(value, 'yyyy-MM-dd', new Date())
		return isValid(parsed) ? parsed : undefined
	}, [value])

	const handleDateSelect = (date: Date | undefined) => {
		if (date) {
			const formattedDate = format(date, 'yyyy-MM-dd')
			setInputValue(formattedDate)
			onChange?.(formattedDate)
			setIsOpen(false)
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		setInputValue(newValue)

		// Try to parse the input value
		if (newValue) {
			// Support multiple date formats
			let parsed: Date | null = null

			// Try yyyy-MM-dd format first
			parsed = parse(newValue, 'yyyy-MM-dd', new Date())
			if (!isValid(parsed)) {
				// Try yyyy/MM/dd format
				parsed = parse(newValue, 'yyyy/MM/dd', new Date())
			}
			if (!isValid(parsed)) {
				// Try dd/MM/yyyy format
				parsed = parse(newValue, 'dd/MM/yyyy', new Date())
			}
			if (!isValid(parsed)) {
				// Try MM/dd/yyyy format
				parsed = parse(newValue, 'MM/dd/yyyy', new Date())
			}

			if (isValid(parsed)) {
				const formattedDate = format(parsed, 'yyyy-MM-dd')
				onChange?.(formattedDate)
				setMonth(parsed)
			}
		} else {
			onChange?.('')
		}
	}

	const handleInputBlur = () => {
		// If input is empty, clear the value
		if (!inputValue.trim()) {
			onChange?.('')
			return
		}

		// If input has valid date, format it properly
		if (selectedDate) {
			setInputValue(format(selectedDate, 'yyyy-MM-dd'))
		}
	}

	const displayValue = selectedDate ? format(selectedDate, 'PPP') : inputValue || ''

	return (
		<div className={cn('relative', className)}>
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						className={cn(
							'w-full justify-start text-left font-normal',
							!selectedDate && !inputValue && 'text-muted-foreground',
							disabled && 'cursor-not-allowed opacity-50',
						)}
						disabled={disabled}>
						<CalendarIcon className='mr-2 h-4 w-4' />
						{displayValue || placeholder}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='start'>
					<div className='p-3 space-y-3'>
						{/* Direct input */}
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Enter date manually</label>
							<Input
								type='date'
								value={inputValue}
								onChange={handleInputChange}
								onBlur={handleInputBlur}
								placeholder='yyyy-mm-dd'
								className='w-full'
								min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
								max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
							/>
							<p className='text-xs text-muted-foreground'>Or use the calendar below</p>
						</div>

						{/* Enhanced calendar with year/month dropdowns */}
						<DayPicker
							mode='single'
							selected={selectedDate}
							onSelect={handleDateSelect}
							month={month}
							onMonthChange={setMonth}
							disabled={disabled ? true : undefined}
							fromDate={minDate}
							toDate={maxDate}
							captionLayout='dropdown-buttons'
							components={{
								Dropdown: CustomDropdown,
								IconLeft: ({className, ...props}) => <ChevronLeft className={cn('h-4 w-4', className)} {...props} />,
								IconRight: ({className, ...props}) => <ChevronRight className={cn('h-4 w-4', className)} {...props} />,
							}}
							className='p-0'
							classNames={{
								months: 'flex flex-col sm:flex-row gap-2',
								month: 'flex flex-col gap-2',
								caption: 'flex justify-center pt-1 relative items-center gap-2',
								caption_label: 'text-sm font-medium hidden', // Hide default label since we use dropdowns
								caption_dropdowns: 'flex gap-2',
								nav: 'flex items-center gap-1',
								nav_button: cn('h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-300 rounded'),
								nav_button_previous: 'absolute left-1',
								nav_button_next: 'absolute right-1',
								table: 'w-full border-collapse mt-2',
								head_row: 'flex',
								head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
								row: 'flex w-full mt-2',
								cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
								day: cn('h-8 w-8 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md'),
								day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
								day_today: 'bg-accent text-accent-foreground',
								day_outside: 'text-muted-foreground opacity-50',
								day_disabled: 'text-muted-foreground opacity-25',
							}}
						/>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}
