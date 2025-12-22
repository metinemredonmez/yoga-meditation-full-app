'use client';

import { Badge } from '@/components/ui/badge';
import { IconCrown, IconLock } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function PremiumBadge({ className, size = 'md', showText = true }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 font-semibold',
        className
      )}
    >
      <IconCrown className={cn(sizeClasses[size], showText && 'mr-1')} />
      {showText && 'Premium'}
    </Badge>
  );
}

interface PremiumLockOverlayProps {
  className?: string;
  onClick?: () => void;
}

export function PremiumLockOverlay({ className, onClick }: PremiumLockOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer transition-opacity',
        className
      )}
      onClick={onClick}
    >
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-3 rounded-full mb-2">
        <IconLock className="h-6 w-6 text-white" />
      </div>
      <span className="text-white font-semibold text-sm">Premium Gerekli</span>
    </div>
  );
}

interface PremiumLockIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PremiumLockIcon({ className, size = 'md' }: PremiumLockIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div
      className={cn(
        'absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-500 p-1.5 rounded-full',
        className
      )}
    >
      <IconLock className={cn(sizeClasses[size], 'text-white')} />
    </div>
  );
}
