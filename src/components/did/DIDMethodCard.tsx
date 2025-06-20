import React from 'react'
import {Label} from '@/components/ui/label'
import {RadioGroupItem} from '@/components/ui/radio-group'
import {DID_METHOD_INFO} from '@/constants/did'
import {Key, Globe, Coins, Network, Users} from 'lucide-react'

interface DIDMethodCardProps {
	method: string
	selectedMethod: string
	onSelect: (method: string) => void
}

export const DIDMethodCard: React.FC<DIDMethodCardProps> = ({method, selectedMethod, onSelect}) => {
	const info = DID_METHOD_INFO[method as keyof typeof DID_METHOD_INFO]

	if (!info) return null

	const IconComponent =
		{
			Key,
			Globe,
			Coins,
			Network,
			Users,
		}[info.icon] || Key

	return (
		<div className='flex items-center space-x-2'>
			<RadioGroupItem value={method} id={method} checked={selectedMethod === method} onChange={() => onSelect(method)} />
			<Label htmlFor={method} className='flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 flex-1'>
				<IconComponent className='h-5 w-5' />
				<div>
					<div className='font-medium'>{info.title}</div>
					<div className='text-sm text-gray-500 dark:text-gray-400'>{info.description}</div>
				</div>
			</Label>
		</div>
	)
}

export default DIDMethodCard
