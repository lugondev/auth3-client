import { PaginationMeta } from "./";

// Base Notification Types
export interface Notification {
	id: string;
	user_id: string;
	title: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'security' | 'marketing';
	status: 'unread' | 'read' | 'archived';
	priority: 'low' | 'normal' | 'high' | 'urgent';
	category?: string;
	data?: Record<string, unknown>; // Additional data for the notification
	action_url?: string; // URL to navigate when notification is clicked
	action_text?: string; // Text for action button
	image_url?: string;
	expires_at?: string; // ISO date string
	read_at?: string; // ISO date string
	archived_at?: string; // ISO date string
	created_at: string; // ISO date string
	updated_at: string; // ISO date string
	sent_via: ('email' | 'sms' | 'push' | 'in_app')[];
	delivery_status: {
		email?: 'pending' | 'sent' | 'delivered' | 'failed';
		sms?: 'pending' | 'sent' | 'delivered' | 'failed';
		push?: 'pending' | 'sent' | 'delivered' | 'failed';
		in_app?: 'pending' | 'sent' | 'delivered' | 'failed';
	};
}

export interface NotificationListResponse {
	notifications: Notification[];
	meta: PaginationMeta;
	unread_count: number;
}

// Notification Preferences
export interface NotificationPreferences {
	user_id: string;
	email_notifications: {
		enabled: boolean;
		types: {
			security: boolean;
			system: boolean;
			marketing: boolean;
			account: boolean;
			tenant: boolean;
			oauth2: boolean;
		};
		frequency: 'immediate' | 'daily' | 'weekly' | 'never';
		quiet_hours: {
			enabled: boolean;
			start_time: string; // HH:MM format
			end_time: string; // HH:MM format
			timezone: string;
		};
	};
	sms_notifications: {
		enabled: boolean;
		types: {
			security: boolean;
			account: boolean;
			urgent: boolean;
		};
	};
	push_notifications: {
		enabled: boolean;
		types: {
			security: boolean;
			system: boolean;
			marketing: boolean;
			account: boolean;
			tenant: boolean;
		};
		quiet_hours: {
			enabled: boolean;
			start_time: string;
			end_time: string;
			timezone: string;
		};
	};
	in_app_notifications: {
		enabled: boolean;
		types: {
			security: boolean;
			system: boolean;
			marketing: boolean;
			account: boolean;
			tenant: boolean;
			oauth2: boolean;
		};
		auto_mark_read: boolean;
		show_desktop: boolean;
	};
	language: string;
	timezone: string;
	updated_at: string;
}

// Notification Creation and Management
export interface CreateNotificationRequest {
	title: string;
	message: string;
	type: Notification['type'];
	priority?: Notification['priority'];
	category?: string;
	target_users?: string[]; // User IDs
	target_roles?: string[]; // Role names
	target_tenants?: string[]; // Tenant IDs
	target_all_users?: boolean;
	data?: Record<string, unknown>;
	action_url?: string;
	action_text?: string;
	image_url?: string;
	schedule_at?: string; // ISO date string
	expires_at?: string; // ISO date string
	send_via?: ('email' | 'sms' | 'push' | 'in_app')[];
	template_id?: string; // Use predefined template
	template_variables?: Record<string, unknown>; // Variables for template
}

export interface UpdateNotificationRequest {
	title?: string;
	message?: string;
	type?: Notification['type'];
	priority?: Notification['priority'];
	category?: string;
	data?: Record<string, unknown>;
	action_url?: string;
	action_text?: string;
	image_url?: string;
	expires_at?: string;
}

export interface BulkNotificationRequest {
	notifications: CreateNotificationRequest[];
	batch_size?: number; // For rate limiting
	delay_between_batches?: number; // Seconds
}

export interface BulkNotificationResponse {
	total_notifications: number;
	successful: number;
	failed: number;
	batch_id: string;
	status: 'processing' | 'completed' | 'failed';
	results: {
		index: number;
		status: 'success' | 'failed';
		notification_id?: string;
		error?: string;
	}[];
	created_at: string;
	completed_at?: string;
}

// Notification Templates
export interface NotificationTemplate {
	id: string;
	name: string;
	description?: string;
	type: Notification['type'];
	category?: string;
	subject_template: string; // Template for email subject/notification title
	body_template: string; // Template for email body/notification message
	variables: {
		name: string;
		type: 'string' | 'number' | 'boolean' | 'date' | 'url';
		description?: string;
		required: boolean;
		default_value?: string | number | boolean | null;
	}[];
	status: 'active' | 'inactive' | 'draft';
	locale: string;
	version: number;
	created_by: string;
	updated_by?: string;
	created_at: string;
	updated_at: string;
}

export interface NotificationTemplateListResponse {
	templates: NotificationTemplate[];
	meta: PaginationMeta;
}

export interface CreateNotificationTemplateRequest {
	name: string;
	description?: string;
	type: Notification['type'];
	category?: string;
	subject_template: string;
	body_template: string;
	variables: NotificationTemplate['variables'];
	status?: 'active' | 'inactive' | 'draft';
	locale?: string;
}

export interface UpdateNotificationTemplateRequest {
	name?: string;
	description?: string;
	type?: Notification['type'];
	category?: string;
	subject_template?: string;
	body_template?: string;
	variables?: NotificationTemplate['variables'];
	status?: 'active' | 'inactive' | 'draft';
	locale?: string;
}

// Notification Statistics
export interface NotificationStatsResponse {
	total_sent: number;
	total_delivered: number;
	total_failed: number;
	total_read: number;
	total_unread: number;
	delivery_rate: number; // percentage
	read_rate: number; // percentage
	by_type: Record<string, {
		sent: number;
		delivered: number;
		failed: number;
		read: number;
	}>;
	by_channel: {
		email: {
			sent: number;
			delivered: number;
			failed: number;
			open_rate: number;
			click_rate: number;
		};
		sms: {
			sent: number;
			delivered: number;
			failed: number;
		};
		push: {
			sent: number;
			delivered: number;
			failed: number;
			open_rate: number;
		};
		in_app: {
			sent: number;
			delivered: number;
			read: number;
		};
	};
	time_series: {
		date: string;
		sent: number;
		delivered: number;
		failed: number;
		read: number;
	}[];
	generated_at: string;
}

// Real-time Notification Events
export interface NotificationEvent {
	type: 'new_notification' | 'notification_read' | 'notification_updated' | 'notification_deleted';
	notification: Notification;
	timestamp: string;
}

// Notification Delivery Status
export interface NotificationDeliveryStatus {
	notification_id: string;
	user_id: string;
	channel: 'email' | 'sms' | 'push' | 'in_app';
	status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
	error_message?: string;
	delivered_at?: string;
	opened_at?: string;
	clicked_at?: string;
	attempts: number;
	next_retry_at?: string;
	created_at: string;
	updated_at: string;
}

// Notification Queue Management (Admin)
export interface NotificationQueueStats {
	pending: number;
	processing: number;
	completed: number;
	failed: number;
	retrying: number;
	queue_size: number;
	average_processing_time: number; // in milliseconds
	throughput_per_minute: number;
	last_processed_at?: string;
}

export interface NotificationQueueItem {
	id: string;
	notification_id: string;
	user_id: string;
	channel: 'email' | 'sms' | 'push' | 'in_app';
	status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
	priority: number;
	attempts: number;
	max_attempts: number;
	error_message?: string;
	scheduled_at: string;
	processed_at?: string;
	completed_at?: string;
	next_retry_at?: string;
	created_at: string;
	updated_at: string;
}