'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { YogaSpinner } from './yoga-spinner';

interface PageLoaderProps {
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

export function PageLoader({
  text = 'Sayfa yükleniyor...',
  fullScreen = true,
  overlay = true,
  className
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullScreen && 'fixed inset-0 z-50',
        overlay && 'bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="animate-fade-in-up">
        <YogaSpinner size="xl" text={text} />
      </div>
    </div>
  );
}

// Loading bar at top of page
export function LoadingBar({ show = true }: { show?: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden bg-muted">
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-loading-bar"
        style={{ width: '50%' }}
      />
    </div>
  );
}

// Inline loader for buttons/small areas
export function InlineLoader({
  text,
  className
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Container loader (for cards, sections)
export function ContainerLoader({
  text = 'Yükleniyor...',
  minHeight = '200px',
  className
}: {
  text?: string;
  minHeight?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border border-dashed',
        className
      )}
      style={{ minHeight }}
    >
      <YogaSpinner size="md" text={text} />
    </div>
  );
}

export default PageLoader;
