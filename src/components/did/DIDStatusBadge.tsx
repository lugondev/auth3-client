'use client';

import { Badge } from '@/components/ui/badge';
import { DIDStatus } from '@/types/did';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DIDStatusBadgeProps {
  status: DIDStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * DIDStatusBadge component displays visual status indicators for DIDs
 * with appropriate colors and icons
 */
export function DIDStatusBadge({ status, showIcon = true, size = 'md' }: DIDStatusBadgeProps) {
  // Get status configuration
  const getStatusConfig = (status: DIDStatus) => {
    switch (status) {
      case DIDStatus.ACTIVE:
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
          icon: CheckCircle,
          label: 'Active'
        };
      case DIDStatus.DEACTIVATED:
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
          icon: AlertCircle,
          label: 'Deactivated'
        };
      case DIDStatus.REVOKED:
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300',
          icon: XCircle,
          label: 'Revoked'
        };
      default:
        return {
          variant: 'outline' as const,
          className: '',
          icon: AlertCircle,
          label: 'Unknown'
        };
    }
  };

  // Get size classes
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      default:
        return 'text-xs px-2.5 py-0.5';
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = getSizeClasses(size);

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses} flex items-center gap-1`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

/**
 * DIDStatusIndicator component for larger status displays
 */
export function DIDStatusIndicator({ status }: { status: DIDStatus }) {
  const config = {
    [DIDStatus.ACTIVE]: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle,
      label: 'Active',
      description: 'DID is active and can be used for authentication'
    },
    [DIDStatus.DEACTIVATED]: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: AlertCircle,
      label: 'Deactivated',
      description: 'DID has been deactivated and cannot be used'
    },
    [DIDStatus.REVOKED]: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: XCircle,
      label: 'Revoked',
      description: 'DID has been permanently revoked'
    }
  }[status] || {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: AlertCircle,
    label: 'Unknown',
    description: 'Status unknown'
  };

  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-full ${config.bgColor}`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
      </div>
      <div>
        <p className={`font-medium ${config.color}`}>{config.label}</p>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>
    </div>
  );
}