// DIDComm Types and Interfaces

export interface DIDCommMessage {
  id: string;
  type: string;
  from: string;
  to: string[];
  body: string | Record<string, unknown>;
  created_time: string;
  expires_time?: string;
  attachments?: DIDCommAttachment[];
  thread_id?: string;
  parent_thread_id?: string;
  read?: boolean;
  direction: 'inbound' | 'outbound';
}

export interface DIDCommAttachment {
  id: string;
  description?: string;
  filename?: string;
  mime_type?: string;
  lastmod_time?: string;
  byte_count?: number;
  data: {
    base64?: string;
    json?: Record<string, unknown>;
    links?: string[];
  };
}

export interface DIDCommConnection {
  id: string;
  their_did: string;
  my_did: string;
  their_label?: string;
  my_label?: string;
  state: ConnectionState;
  created_at: string;
  updated_at: string;
  invitation?: ConnectionInvitation;
  request?: ConnectionRequest;
  response?: ConnectionResponse;
  metadata?: Record<string, unknown>;
}

export type ConnectionState = 
  | 'invitation-sent'
  | 'invitation-received'
  | 'request-sent'
  | 'request-received'
  | 'response-sent'
  | 'response-received'
  | 'active'
  | 'error'
  | 'abandoned';

export interface ConnectionInvitation {
  '@type': string;
  '@id': string;
  label: string;
  recipientKeys: string[];
  serviceEndpoint: string;
  routingKeys?: string[];
}

export interface ConnectionRequest {
  '@type': string;
  '@id': string;
  label: string;
  connection: {
    DID: string;
    DIDDoc: Record<string, unknown>;
  };
}

export interface ConnectionResponse {
  '@type': string;
  '@id': string;
  '~thread': {
    thid: string;
  };
  connection: {
    DID: string;
    DIDDoc: Record<string, unknown>;
  };
}

export interface DIDCommProtocol {
  id: string;
  name: string;
  version: string;
  description?: string;
  roles: string[];
  message_types: string[];
  documentation?: string;
}

export interface MessageThread {
  id: string;
  messages: DIDCommMessage[];
  participants: string[];
  created_at: string;
  updated_at: string;
  subject?: string;
  status: 'active' | 'archived' | 'deleted';
}

export interface SendMessageRequest {
  to: string;
  type: string;
  body: Record<string, unknown>;
  thread_id?: string;
  parent_thread_id?: string;
  attachments?: DIDCommAttachment[];
  expires_time?: string;
}

export interface CreateConnectionRequest {
  their_did?: string;
  my_did?: string;
  their_label?: string;
  my_label?: string;
  invitation?: ConnectionInvitation;
  auto_accept?: boolean;
  invitation_url?: string;
}

export interface MessageListResponse {
  messages: DIDCommMessage[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ConnectionListResponse {
  connections: DIDCommConnection[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface MessageSearchFilters {
  type?: string;
  from?: string;
  to?: string;
  date_from?: string;
  date_to?: string;
  thread_id?: string;
  read?: boolean;
  direction?: 'inbound' | 'outbound';
}

export interface ConnectionFilters {
  state?: ConnectionState;
  their_did?: string;
  my_did?: string;
  label?: string;
}

// Message type constants
export const MESSAGE_TYPES = {
  // Basic messaging
  BASIC_MESSAGE: 'https://didcomm.org/basicmessage/2.0/message',
  
  // Connection protocol
  CONNECTION_INVITATION: 'https://didcomm.org/connections/1.0/invitation',
  CONNECTION_REQUEST: 'https://didcomm.org/connections/1.0/request',
  CONNECTION_RESPONSE: 'https://didcomm.org/connections/1.0/response',
  
  // Trust ping
  TRUST_PING: 'https://didcomm.org/trust_ping/1.0/ping',
  TRUST_PING_RESPONSE: 'https://didcomm.org/trust_ping/1.0/ping_response',
  
  // Credential exchange
  CREDENTIAL_OFFER: 'https://didcomm.org/issue-credential/2.0/offer-credential',
  CREDENTIAL_REQUEST: 'https://didcomm.org/issue-credential/2.0/request-credential',
  CREDENTIAL_ISSUE: 'https://didcomm.org/issue-credential/2.0/issue-credential',
  
  // Presentation exchange
  PRESENTATION_REQUEST: 'https://didcomm.org/present-proof/2.0/request-presentation',
  PRESENTATION: 'https://didcomm.org/present-proof/2.0/presentation',
  
  // Problem report
  PROBLEM_REPORT: 'https://didcomm.org/report-problem/1.0/problem-report',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// Protocol constants
export const PROTOCOLS = {
  BASIC_MESSAGE: {
    id: 'https://didcomm.org/basicmessage/2.0',
    name: 'Basic Message',
    version: '2.0'
  },
  CONNECTIONS: {
    id: 'https://didcomm.org/connections/1.0',
    name: 'Connections',
    version: '1.0'
  },
  TRUST_PING: {
    id: 'https://didcomm.org/trust_ping/1.0',
    name: 'Trust Ping',
    version: '1.0'
  },
  ISSUE_CREDENTIAL: {
    id: 'https://didcomm.org/issue-credential/2.0',
    name: 'Issue Credential',
    version: '2.0'
  },
  PRESENT_PROOF: {
    id: 'https://didcomm.org/present-proof/2.0',
    name: 'Present Proof',
    version: '2.0'
  }
} as const;

// Error types
export interface DIDCommError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const ERROR_CODES = {
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  CONNECTION_NOT_FOUND: 'CONNECTION_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  PROTOCOL_NOT_SUPPORTED: 'PROTOCOL_NOT_SUPPORTED',
  INVALID_DID: 'INVALID_DID',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Dashboard Widget Types
export interface DIDCommSummary {
  total_messages: number;
  unread_messages: number;
  total_connections: number;
  active_connections: number;
  pending_connections: number;
  messages_today: number;
  messages_this_week: number;
}

export interface RecentMessage {
  id: string;
  type: string;
  from: string;
  to: string[];
  subject?: string;
  created_time: string;
  read: boolean;
  direction: 'inbound' | 'outbound';
  thread_id?: string;
}

export interface RecentConnection {
  id: string;
  their_did: string;
  their_label?: string;
  state: ConnectionState;
  created_at: string;
  last_activity?: string;
}

// Message Analytics Types
export interface MessageAnalytics {
  total_sent: number;
  total_received: number;
  messages_by_type: Record<string, number>;
  messages_by_day: MessageActivityPoint[];
  response_time_avg: number;
  most_active_connections: ConnectionActivity[];
}

export interface MessageActivityPoint {
  date: string;
  sent: number;
  received: number;
}

export interface ConnectionActivity {
  connection_id: string;
  their_did: string;
  their_label?: string;
  message_count: number;
  last_message: string;
}

// Advanced Message Types
export interface EncryptedMessage {
  protected: string;
  recipients: MessageRecipient[];
  iv: string;
  ciphertext: string;
  tag: string;
}

export interface MessageRecipient {
  encrypted_key: string;
  header: {
    kid: string;
    alg: string;
  };
}

export interface MessageDeliveryStatus {
  message_id: string;
  recipient: string;
  status: 'pending' | 'delivered' | 'failed' | 'read';
  timestamp: string;
  error?: string;
}

// Connection Management Types
export interface ConnectionInvitationQR {
  invitation: ConnectionInvitation;
  qr_code: string;
  invitation_url: string;
  expires_at?: string;
}

export interface ConnectionStatistics {
  total: number;
  by_state: Record<ConnectionState, number>;
  created_today: number;
  created_this_week: number;
  created_this_month: number;
  most_active: RecentConnection[];
}

// Message Threading Types
export interface ThreadInfo {
  thread_id: string;
  parent_thread_id?: string;
  message_count: number;
  participants: string[];
  last_message: string;
  last_activity: string;
  subject?: string;
  status: 'active' | 'archived' | 'closed';
}

export interface ThreadMessage extends DIDCommMessage {
  thread_position: number;
  is_reply: boolean;
  replied_to?: string;
}

// Protocol Handler Types
export interface ProtocolHandler {
  protocol: string;
  version: string;
  handler: (message: DIDCommMessage) => Promise<DIDCommMessage | null>;
  supported_message_types: string[];
}

export interface ProtocolRegistry {
  handlers: Map<string, ProtocolHandler>;
  register: (handler: ProtocolHandler) => void;
  unregister: (protocol: string) => void;
  handle: (message: DIDCommMessage) => Promise<DIDCommMessage | null>;
}

// Message Templates
export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  body_template: Record<string, unknown>;
  variables: TemplateVariable[];
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  default_value?: unknown;
  description?: string;
}

// Message Routing Types
export interface MessageRoute {
  pattern: string;
  handler: string;
  priority: number;
  conditions?: RouteCondition[];
}

export interface RouteCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
}

// Webhook Types
export interface WebhookConfig {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
  created_at: string;
  last_triggered?: string;
}

export type WebhookEvent = 
  | 'message.received'
  | 'message.sent'
  | 'connection.created'
  | 'connection.updated'
  | 'connection.deleted'
  | 'protocol.completed'
  | 'error.occurred';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
  webhook_id: string;
}

// Message Search and Filtering
export interface AdvancedMessageFilters extends MessageSearchFilters {
  has_attachments?: boolean;
  protocol?: string;
  thread_id?: string;
  content_search?: string;
  size_min?: number;
  size_max?: number;
}

export interface MessageSearchResult {
  messages: DIDCommMessage[];
  total: number;
  facets: {
    types: Record<string, number>;
    senders: Record<string, number>;
    protocols: Record<string, number>;
  };
  search_time_ms: number;
}

// Message Backup and Export
export interface MessageExportOptions {
  format: 'json' | 'csv' | 'mbox';
  include_attachments: boolean;
  date_range?: {
    from: string;
    to: string;
  };
  filters?: AdvancedMessageFilters;
  encryption?: {
    enabled: boolean;
    password?: string;
  };
}

export interface MessageBackup {
  id: string;
  created_at: string;
  message_count: number;
  size_bytes: number;
  encrypted: boolean;
  download_url?: string;
  expires_at?: string;
}