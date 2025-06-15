export interface AuditLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  tenant?: {
    id: string;
    name: string;
  };
}

export interface AuditLogFilter {
  user_id?: string;
  tenant_id?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  risk_level?: string;
  ip_address?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogSummary {
  total_events: number;
  events_by_action: Record<string, number>;
  events_by_resource: Record<string, number>;
  events_by_risk: Record<string, number>;
  events_by_hour: Record<string, number>;
  top_users: UserActivitySummary[];
  top_ips: IPActivitySummary[];
  security_alerts: SecurityAlertSummary[];
}

export interface UserActivitySummary {
  user_id: string;
  user_email: string;
  event_count: number;
  last_activity: string;
}

export interface IPActivitySummary {
  ip_address: string;
  event_count: number;
  unique_users: number;
  last_activity: string;
  location?: string;
}

export interface SecurityAlertSummary {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  count: number;
  first_seen: string;
  last_seen: string;
}

// Action types based on backend
export const ActionTypes = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFY: 'email_verify',
  
  // DID Operations
  DID_CREATE: 'did_create',
  DID_UPDATE: 'did_update',
  DID_DELETE: 'did_delete',
  DID_RESOLVE: 'did_resolve',
  
  // OAuth2
  OAUTH2_AUTHORIZE: 'oauth2_authorize',
  OAUTH2_TOKEN: 'oauth2_token',
  
  // User Management
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  
  // Tenant Management
  TENANT_CREATE: 'tenant_create',
  TENANT_UPDATE: 'tenant_update',
  TENANT_DELETE: 'tenant_delete',
  
  // RBAC
  ROLE_ASSIGN: 'role_assign',
  ROLE_REVOKE: 'role_revoke',
  PERMISSION_GRANT: 'permission_grant',
  PERMISSION_REVOKE: 'permission_revoke',
} as const;

export const ResourceTypes = {
  USER: 'user',
  TENANT: 'tenant',
  DID: 'did',
  OAUTH2_CLIENT: 'oauth2_client',
  ROLE: 'role',
  PERMISSION: 'permission',
  SESSION: 'session',
} as const;

export type ActionType = typeof ActionTypes[keyof typeof ActionTypes];
export type ResourceType = typeof ResourceTypes[keyof typeof ResourceTypes];