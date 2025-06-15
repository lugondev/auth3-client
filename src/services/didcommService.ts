import apiClient from '@/lib/apiClient';
import {
  DIDCommMessage,
  DIDCommConnection,
  DIDCommProtocol,
  SendMessageRequest,
  CreateConnectionRequest,
  MessageListResponse,
  ConnectionListResponse
} from '@/types/didcomm';

// DIDComm Service Implementation

/**
 * DIDComm Service for handling decentralized messaging and connections
 * Provides functionality for sending/receiving messages, managing connections,
 * and handling DIDComm protocols
 */
class DIDCommService {
  private baseUrl = '/api/v1/didcomm';

  /**
   * Send a DIDComm message to one or more recipients
   */
  async sendMessage(request: SendMessageRequest): Promise<DIDCommMessage> {
    const response = await apiClient.post<DIDCommMessage>(`${this.baseUrl}/messages/send`, request);
    return response.data;
  }

  /**
   * Receive and process incoming DIDComm messages
   */
  async receiveMessage(encryptedMessage: string): Promise<DIDCommMessage> {
    const response = await apiClient.post<DIDCommMessage>(`${this.baseUrl}/messages/receive`, {
      message: encryptedMessage
    });
    return response.data;
  }

  /**
   * Get list of messages with pagination and filtering
   */
  async getMessages(params?: {
    page?: number;
    limit?: number;
    thread_id?: string;
    type?: string;
    from?: string;
    to?: string;
  }): Promise<MessageListResponse> {
    const response = await apiClient.get<MessageListResponse>(`${this.baseUrl}/messages`, { params });
    return response.data;
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<DIDCommMessage> {
    const response = await apiClient.get<DIDCommMessage>(`${this.baseUrl}/messages/${messageId}`);
    return response.data;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete<void>(`${this.baseUrl}/messages/${messageId}`);
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    await apiClient.patch<void>(`${this.baseUrl}/messages/${messageId}/read`);
  }

  /**
   * Create a new DIDComm connection
   */
  async createConnection(request: CreateConnectionRequest): Promise<DIDCommConnection> {
    const response = await apiClient.post<DIDCommConnection>(`${this.baseUrl}/connections`, request);
    return response.data;
  }

  /**
   * Get list of connections with pagination and filtering
   */
  async getConnections(params?: {
    page?: number;
    limit?: number;
    state?: string;
    their_did?: string;
  }): Promise<ConnectionListResponse> {
    const response = await apiClient.get<ConnectionListResponse>(`${this.baseUrl}/connections`, { params });
    return response.data;
  }

  /**
   * Get a specific connection by ID
   */
  async getConnection(connectionId: string): Promise<DIDCommConnection> {
    const response = await apiClient.get<DIDCommConnection>(`${this.baseUrl}/connections/${connectionId}`);
    return response.data;
  }

  /**
   * Update connection state or metadata
   */
  async updateConnection(connectionId: string, updates: Partial<DIDCommConnection>): Promise<DIDCommConnection> {
    const response = await apiClient.patch<DIDCommConnection>(`${this.baseUrl}/connections/${connectionId}`, updates);
    return response.data;
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    await apiClient.delete<void>(`${this.baseUrl}/connections/${connectionId}`);
  }

  /**
   * Create a connection invitation
   */
  async createConnectionInvitation(request: CreateConnectionRequest): Promise<DIDCommConnection> {
    const response = await apiClient.post<DIDCommConnection>(`${this.baseUrl}/connections/invitation`, request);
    return response.data;
  }

  /**
   * Accept a connection invitation
   */
  async acceptConnectionInvitation(connectionId: string): Promise<DIDCommConnection> {
    const response = await apiClient.post<DIDCommConnection>(`${this.baseUrl}/connections/${connectionId}/accept`);
    return response.data;
  }

  /**
   * Reject a connection invitation
   */
  async rejectConnectionInvitation(connectionId: string): Promise<void> {
    await apiClient.post<void>(`${this.baseUrl}/connections/${connectionId}/reject`);
  }

  /**
   * Get available DIDComm protocols
   */
  async getProtocols(): Promise<DIDCommProtocol[]> {
    const response = await apiClient.get<DIDCommProtocol[]>(`${this.baseUrl}/protocols`);
    return response.data;
  }

  /**
   * Get protocol details by ID
   */
  async getProtocol(protocolId: string): Promise<DIDCommProtocol> {
    const response = await apiClient.get<DIDCommProtocol>(`${this.baseUrl}/protocols/${protocolId}`);
    return response.data;
  }

  /**
   * Encrypt a message for DIDComm transport
   */
  async encryptMessage(message: DIDCommMessage, recipientDids: string[]): Promise<string> {
    const response = await apiClient.post<{ encrypted_message: string }>(`${this.baseUrl}/encrypt`, {
      message,
      recipients: recipientDids
    });
    return response.data.encrypted_message;
  }

  /**
   * Decrypt a received DIDComm message
   */
  async decryptMessage(encryptedMessage: string): Promise<DIDCommMessage> {
    const response = await apiClient.post<DIDCommMessage>(`${this.baseUrl}/decrypt`, {
      encrypted_message: encryptedMessage
    });
    return response.data;
  }

  /**
   * Get message thread by thread ID
   */
  async getMessageThread(threadId: string): Promise<DIDCommMessage[]> {
    const response = await apiClient.get<DIDCommMessage[]>(`${this.baseUrl}/threads/${threadId}`);
    return response.data;
  }

  /**
   * Search messages by content or metadata
   */
  async searchMessages(query: string, filters?: {
    type?: string;
    from?: string;
    to?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<DIDCommMessage[]> {
    const response = await apiClient.get<DIDCommMessage[]>(`${this.baseUrl}/messages/search`, {
      params: { q: query, ...filters }
    });
    return response.data;
  }
}

export const didcommService = new DIDCommService();
export default didcommService;