'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Pause,
  LucideIcon
} from 'lucide-react';
import { CredentialStatus } from '@/types/credentials';

interface CredentialStatusBadgeProps {
  status: CredentialStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
}

/**
 * CredentialStatusBadge Component
 * Displays credential status with appropriate colors and icons
 */
export function CredentialStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  variant = 'default'
}: CredentialStatusBadgeProps) {
  /**
   * Get status configuration including color, icon, and label
   */
  const getStatusConfig = (status: CredentialStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'expired':
        return {
          label: 'Expired',
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
          icon: XCircle,
          iconColor: 'text-red-600'
        };
      case 'revoked':
        return {
          label: 'Revoked',
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
          icon: XCircle,
          iconColor: 'text-gray-600'
        };
      case 'suspended':
        return {
          label: 'Suspended',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
          icon: Pause,
          iconColor: 'text-yellow-600'
        };

      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
          icon: AlertTriangle,
          iconColor: 'text-gray-600'
        };
    }
  };

  /**
   * Get size classes for badge and icon
   */
  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return {
          badge: 'text-xs px-2 py-1',
          icon: 'h-3 w-3'
        };
      case 'md':
        return {
          badge: 'text-sm px-2.5 py-1.5',
          icon: 'h-4 w-4'
        };
      case 'lg':
        return {
          badge: 'text-base px-3 py-2',
          icon: 'h-5 w-5'
        };
      default:
        return {
          badge: 'text-sm px-2.5 py-1.5',
          icon: 'h-4 w-4'
        };
    }
  };

  /**
   * Get variant classes
   */
  const getVariantClasses = (variant: 'default' | 'outline' | 'secondary', statusConfig: {
    label: string;
    className: string;
    icon: LucideIcon;
    iconColor: string;
  }) => {
    switch (variant) {
      case 'outline':
        return `border ${statusConfig.className.replace('bg-', 'border-').replace('hover:bg-', 'hover:border-')} bg-transparent`;
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'default':
      default:
        return statusConfig.className;
    }
  };

  const statusConfig = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);
  const Icon = statusConfig.icon;
  const variantClasses = getVariantClasses(variant, statusConfig);

  return (
    <Badge 
      className={`
        inline-flex items-center gap-1.5 font-medium transition-colors
        ${sizeClasses.badge}
        ${variantClasses}
      `}
    >
      {showIcon && (
        <Icon className={`${sizeClasses.icon} ${statusConfig.iconColor}`} />
      )}
      <span>{statusConfig.label}</span>
    </Badge>
  );
}

/**
 * CredentialStatusBadgeList Component
 * Displays multiple status badges for different verification states
 */
interface CredentialStatusBadgeListProps {
  statuses: CredentialStatus[];
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function CredentialStatusBadgeList({ 
  statuses, 
  size = 'sm',
  showIcon = true,
  variant = 'outline',
  className = ''
}: CredentialStatusBadgeListProps) {
  if (statuses.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {statuses.map((status, index) => (
        <CredentialStatusBadge
          key={`${status}-${index}`}
          status={status}
          size={size}
          showIcon={showIcon}
          variant={variant}
        />
      ))}
    </div>
  );
}

/**
 * CredentialStatusIndicator Component
 * Simple dot indicator for status without text
 */
interface CredentialStatusIndicatorProps {
  status: CredentialStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CredentialStatusIndicator({ 
  status, 
  size = 'md',
  className = ''
}: CredentialStatusIndicatorProps) {
  const statusConfig: Record<CredentialStatus, string> = {
    active: 'bg-green-500',
    expired: 'bg-red-500',
    revoked: 'bg-gray-500',
    suspended: 'bg-yellow-500'
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div 
      className={`
        rounded-full 
        ${statusConfig[status]} 
        ${sizeClasses[size]}
        ${className}
      `}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}

export default CredentialStatusBadge;