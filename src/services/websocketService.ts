/**
 * WebSocket Service - Manage real-time connections for verification updates
 */

import { toast } from 'sonner';

// WebSocket connection states
export enum ConnectionState {
	CONNECTING = 'connecting',
	OPEN = 'open',
	CLOSED = 'closed',
	ERROR = 'error'
}

// WebSocket message types
export enum MessageType {
	VERIFICATION_UPDATE = 'verification_update',
	VERIFICATION_COMPLETE = 'verification_complete',
	ERROR = 'error',
	SYSTEM = 'system'
}

// WebSocket message interface
export interface WebSocketMessage {
	type: MessageType;
	data: any;
	timestamp: string;
}

// WebSocket connection callback handlers
export interface WebSocketHandlers {
	onVerificationUpdate?: (data: any) => void;
	onVerificationComplete?: (data: any) => void;
	onConnectionChange?: (state: ConnectionState) => void;
	onError?: (error: Error) => void;
}

export class WebSocketService {
	private socket: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private handlers: WebSocketHandlers = {};
	private connectionState: ConnectionState = ConnectionState.CLOSED;

	// Connect to WebSocket server
	connect(url: string, handlers: WebSocketHandlers = {}): Promise<void> {
		this.handlers = handlers;
		this.connectionState = ConnectionState.CONNECTING;

		this.notifyConnectionChange();

		return new Promise((resolve, reject) => {
			try {
				this.socket = new WebSocket(url);

				this.socket.onopen = () => {
					this.connectionState = ConnectionState.OPEN;
					this.reconnectAttempts = 0;
					this.notifyConnectionChange();
					resolve();
				};

				this.socket.onmessage = (event) => {
					this.handleMessage(event);
				};

				this.socket.onclose = () => {
					this.connectionState = ConnectionState.CLOSED;
					this.notifyConnectionChange();
					this.attemptReconnect(url);
				};

				this.socket.onerror = (error) => {
					this.connectionState = ConnectionState.ERROR;
					this.notifyConnectionChange();
					if (this.handlers.onError) {
						this.handlers.onError(new Error('WebSocket connection error'));
					}
					reject(error);
				};
			} catch (error) {
				this.connectionState = ConnectionState.ERROR;
				this.notifyConnectionChange();
				reject(error);
			}
		});
	}

	// Disconnect from WebSocket server
	disconnect(): void {
		if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
			this.socket.close();
		}

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		this.socket = null;
		this.connectionState = ConnectionState.CLOSED;
		this.notifyConnectionChange();
	}

	// Send message to WebSocket server
	send(data: any): boolean {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(data));
			return true;
		}
		return false;
	}

	// Subscribe to verification updates for a specific verification ID
	subscribeToVerification(verificationId: string): boolean {
		return this.send({
			action: 'subscribe',
			target: 'verification',
			id: verificationId
		});
	}

	// Unsubscribe from verification updates
	unsubscribeFromVerification(verificationId: string): boolean {
		return this.send({
			action: 'unsubscribe',
			target: 'verification',
			id: verificationId
		});
	}

	// Get current connection state
	getConnectionState(): ConnectionState {
		return this.connectionState;
	}

	// Handle incoming WebSocket message
	private handleMessage(event: MessageEvent): void {
		try {
			const message = JSON.parse(event.data) as WebSocketMessage;

			switch (message.type) {
				case MessageType.VERIFICATION_UPDATE:
					if (this.handlers.onVerificationUpdate) {
						this.handlers.onVerificationUpdate(message.data);
					}
					break;

				case MessageType.VERIFICATION_COMPLETE:
					if (this.handlers.onVerificationComplete) {
						this.handlers.onVerificationComplete(message.data);
					}
					break;

				case MessageType.ERROR:
					if (this.handlers.onError) {
						this.handlers.onError(new Error(message.data.message || 'Unknown WebSocket error'));
					}
					toast.error(`Verification error: ${message.data.message || 'Unknown error'}`);
					break;

				case MessageType.SYSTEM:
					// Handle system messages
					console.log('System message:', message.data);
					break;

				default:
					console.warn('Unknown WebSocket message type:', message.type);
			}
		} catch (error) {
			console.error('Error handling WebSocket message:', error);
		}
	}

	// Attempt to reconnect to WebSocket server
	private attemptReconnect(url: string): void {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;

			const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

			this.reconnectTimeout = setTimeout(() => {
				console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
				this.connect(url, this.handlers).catch(error => {
					console.error('Reconnection failed:', error);
				});
			}, delay);
		} else {
			console.error('Max reconnection attempts reached');
			if (this.handlers.onError) {
				this.handlers.onError(new Error('Max reconnection attempts reached'));
			}
		}
	}

	// Notify connection state change
	private notifyConnectionChange(): void {
		if (this.handlers.onConnectionChange) {
			this.handlers.onConnectionChange(this.connectionState);
		}
	}
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
