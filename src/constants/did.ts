// DID-related constants

export const DID_METHODS = {
	KEY: 'key',
	WEB: 'web',
	ETHR: 'ethr',
	VBSN: 'VBSN',
	PEER: 'peer'
} as const;

export const KEY_TYPES = {
	ED25519: 'Ed25519',
	SECP256K1: 'secp256k1',
	P256: 'P-256'
} as const;

export const ETHEREUM_NETWORKS = {
	MAINNET: 'mainnet',
	GOERLI: 'goerli',
	SEPOLIA: 'sepolia',
	POLYGON: 'polygon',
	MUMBAI: 'mumbai',
	ARBITRUM: 'arbitrum',
	OPTIMISM: 'optimism'
} as const;

export const ETHEREUM_NETWORK_LABELS = {
	[ETHEREUM_NETWORKS.MAINNET]: 'Ethereum Mainnet',
	[ETHEREUM_NETWORKS.GOERLI]: 'Goerli Testnet',
	[ETHEREUM_NETWORKS.SEPOLIA]: 'Sepolia Testnet',
	[ETHEREUM_NETWORKS.POLYGON]: 'Polygon',
	[ETHEREUM_NETWORKS.MUMBAI]: 'Mumbai Testnet',
	[ETHEREUM_NETWORKS.ARBITRUM]: 'Arbitrum One',
	[ETHEREUM_NETWORKS.OPTIMISM]: 'Optimism'
} as const;

export const RECOMMENDED_KEY_TYPES = {
	[DID_METHODS.KEY]: KEY_TYPES.ED25519,
	[DID_METHODS.WEB]: KEY_TYPES.ED25519,
	[DID_METHODS.ETHR]: KEY_TYPES.SECP256K1,
	[DID_METHODS.VBSN]: KEY_TYPES.ED25519,
	[DID_METHODS.PEER]: KEY_TYPES.ED25519
} as const;

export const DID_METHOD_INFO = {
	[DID_METHODS.KEY]: {
		title: 'DID:Key',
		description: 'Simple cryptographic key-based DID method',
		icon: 'Key'
	},
	[DID_METHODS.WEB]: {
		title: 'DID:Web',
		description: 'Web-based DID method using domain verification',
		icon: 'Globe'
	},
	[DID_METHODS.ETHR]: {
		title: 'DID:Ethr',
		description: 'Ethereum-based DID method',
		icon: 'Coins'
	},
	[DID_METHODS.VBSN]: {
		title: 'DID:VBSN',
		description: 'Vietnam Blockchain Service Network DID method',
		icon: 'Network'
	},
	[DID_METHODS.PEER]: {
		title: 'DID:Peer',
		description: 'Peer-to-peer DID method for direct communication',
		icon: 'Users'
	}
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
	ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
	DOMAIN: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
	URL: /^https?:\/\/.+/
} as const;
