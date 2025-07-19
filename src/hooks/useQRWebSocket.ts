/**
 * WebSocket Hook for QR Code Scanning
 * Connects to backend WebSocket for real-time QR scan communication
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// WebSocket message types for QR scanning
export enum QRMessageType {
  QR_SCAN_REQUEST = 'qr_scan_request',
  QR_SCAN_RESPONSE = 'qr_scan_response',
  QR_LOGIN_REQUEST = 'qr_login_request',
  QR_LOGIN_RESPONSE = 'qr_login_response',
  QR_STATUS_UPDATE = 'qr_status_update',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error'
}

// Connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// WebSocket message interface
export interface WSMessage {
  type: QRMessageType;
  request_id?: string;
  client_id?: string;
  data?: QRScanData | QRLoginData | QRStatusData | Record<string, unknown>;
  error?: string;
  timestamp: string;
}

// QR scan data
export interface QRScanData {
  qr_code: string;
  scan_timestamp: string;
  device_info?: {
    user_agent: string;
    platform: string;
  };
}

// QR login data
export interface QRLoginData {
  email: string;
  password: string;
  device_info?: {
    user_agent: string;
    platform: string;
  };
}

// QR status data
export interface QRStatusData {
  status: 'pending' | 'scanning' | 'authenticated' | 'failed' | 'expired';
  message?: string;
  auth_data?: Record<string, unknown>;
}

// Hook configuration
interface UseWebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

// Hook return type
interface UseWebSocketReturn {
  connectionState: ConnectionState;
  isConnected: boolean;
  clientId: string | null;
  sendQRScanRequest: (data: QRScanData) => Promise<string>;
  sendQRLoginRequest: (data: QRLoginData) => Promise<string>;
  responses: Map<string, WSMessage>;
  lastMessage: WSMessage | null;
  connect: () => void;
  disconnect: () => void;
  clearResponses: () => void;
}

// Default configuration
const DEFAULT_CONFIG: UseWebSocketConfig = {
  url: 'ws://localhost:8080/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  pingInterval: 30000
};

export function useQRWebSocket(config: UseWebSocketConfig = {}): UseWebSocketReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [clientId, setClientId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Map<string, WSMessage>>(new Map());
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pendingRequests = useRef<Map<string, (response: WSMessage) => void>>(new Map());

  // Generate unique request ID
  const generateRequestId = useCallback(() => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Send message and wait for response
  const sendMessage = useCallback((message: WSMessage): Promise<WSMessage> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const requestId = message.request_id || generateRequestId();
      message.request_id = requestId;
      message.timestamp = new Date().toISOString();

      // Store the resolve function for this request
      pendingRequests.current.set(requestId, resolve);

      // Send the message
      socketRef.current.send(JSON.stringify(message));

      // Set timeout for request
      setTimeout(() => {
        if (pendingRequests.current.has(requestId)) {
          pendingRequests.current.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 10000); // 10 second timeout
    });
  }, [generateRequestId]);

  // Send QR scan request
  const sendQRScanRequest = useCallback(async (data: QRScanData): Promise<string> => {
    const message: WSMessage = {
      type: QRMessageType.QR_SCAN_REQUEST,
      data,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await sendMessage(message);
      const responseData = response.data as Record<string, unknown>;
      return (responseData?.qr_token as string) || (responseData?.token as string) || 'success';
    } catch (error) {
      console.error('QR scan request failed:', error);
      throw error;
    }
  }, [sendMessage]);

  // Send QR login request
  const sendQRLoginRequest = useCallback(async (data: QRLoginData): Promise<string> => {
    const message: WSMessage = {
      type: QRMessageType.QR_LOGIN_REQUEST,
      data,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await sendMessage(message);
      const responseData = response.data as Record<string, unknown>;
      return (responseData?.auth_token as string) || (responseData?.token as string) || 'success';
    } catch (error) {
      console.error('QR login request failed:', error);
      throw error;
    }
  }, [sendMessage]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      setLastMessage(message);

      // Handle responses to pending requests
      if (message.request_id && pendingRequests.current.has(message.request_id)) {
        const resolve = pendingRequests.current.get(message.request_id);
        pendingRequests.current.delete(message.request_id);
        if (resolve) {
          resolve(message);
        }
        return;
      }

      // Store responses in map for general access
      if (message.request_id) {
        setResponses(prev => {
          const newMap = new Map(prev);
          newMap.set(message.request_id!, message);
          return newMap;
        });
      }

      // Handle specific message types
      switch (message.type) {
        case QRMessageType.QR_STATUS_UPDATE:
          console.log('QR Status Update:', message.data);
          break;
        case QRMessageType.ERROR:
          console.error('WebSocket Error:', message.error);
          break;
        case QRMessageType.PONG:
          // Pong received, connection is alive
          break;
        default:
          console.log('Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, []);

  // Start ping interval
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const pingMessage: WSMessage = {
          type: QRMessageType.PING,
          timestamp: new Date().toISOString()
        };
        socketRef.current.send(JSON.stringify(pingMessage));
      }
    }, finalConfig.pingInterval);
  }, [finalConfig.pingInterval]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionState(ConnectionState.CONNECTING);

    try {
      socketRef.current = new WebSocket(finalConfig.url!);

      socketRef.current.onopen = () => {
        setConnectionState(ConnectionState.CONNECTED);
        reconnectAttemptsRef.current = 0;
        startPingInterval();
        console.log('WebSocket connected to:', finalConfig.url);
      };

      socketRef.current.onmessage = handleMessage;

      socketRef.current.onclose = (event) => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setClientId(null);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnection if not intentional close
        if (event.code !== 1000 && reconnectAttemptsRef.current < finalConfig.maxReconnectAttempts!) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket disconnected. Reconnecting... (${reconnectAttemptsRef.current}/${finalConfig.maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, finalConfig.reconnectInterval);
        } else {
          console.log('WebSocket disconnected');
        }
      };

      socketRef.current.onerror = (error) => {
        setConnectionState(ConnectionState.ERROR);
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      setConnectionState(ConnectionState.ERROR);
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [finalConfig.url, finalConfig.reconnectInterval, finalConfig.maxReconnectAttempts, handleMessage, startPingInterval]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
      socketRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    setClientId(null);
    pendingRequests.current.clear();
  }, []);

  // Clear responses
  const clearResponses = useCallback(() => {
    setResponses(new Map());
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    clientId,
    sendQRScanRequest,
    sendQRLoginRequest,
    responses,
    lastMessage,
    connect,
    disconnect,
    clearResponses
  };
}
