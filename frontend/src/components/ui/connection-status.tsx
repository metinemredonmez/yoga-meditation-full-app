'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  getSocketStatus,
  onSocketStatusChange,
  forceReconnect,
  type SocketStatus
} from '@/lib/socket';
import { Wifi, WifiOff, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<SocketStatus, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
  animate?: boolean;
}> = {
  connected: {
    icon: Wifi,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Bağlı',
  },
  connecting: {
    icon: Loader2,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'Bağlanıyor...',
    animate: true,
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Bağlantı kesildi',
  },
  error: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Bağlantı hatası',
  },
};

export function ConnectionStatus({
  className,
  showLabel = false,
  size = 'sm',
}: ConnectionStatusProps) {
  const [status, setStatus] = React.useState<SocketStatus>(() => getSocketStatus());

  React.useEffect(() => {
    const unsubscribe = onSocketStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const config = statusConfig[status];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  const handleReconnect = () => {
    forceReconnect();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 rounded-full px-2 py-1',
              config.bgColor,
              className
            )}
          >
            <Icon
              className={cn(
                iconSize,
                config.color,
                config.animate && 'animate-spin'
              )}
            />
            {showLabel && (
              <span className={cn('text-xs font-medium', config.color)}>
                {config.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2">
          <span>{config.label}</span>
          {(status === 'disconnected' || status === 'error') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleReconnect}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Minimal dot indicator
export function ConnectionDot({ className }: { className?: string }) {
  const [status, setStatus] = React.useState<SocketStatus>(() => getSocketStatus());

  React.useEffect(() => {
    const unsubscribe = onSocketStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const dotColors: Record<SocketStatus, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-gray-400',
    error: 'bg-red-500',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              dotColors[status],
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {statusConfig[status].label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConnectionStatus;
