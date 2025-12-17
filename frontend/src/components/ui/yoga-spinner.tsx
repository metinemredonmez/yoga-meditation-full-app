'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface YogaSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-20 h-20 text-3xl',
  xl: 'w-28 h-28 text-4xl',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export function YogaSpinner({
  size = 'lg',
  text = 'Yükleniyor...',
  className
}: YogaSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      {/* Lotus Circle Container */}
      <div className="relative">
        {/* Outer Ripple Effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30',
            'animate-ping',
            sizeClasses[size]
          )}
        />

        {/* Second Ripple (delayed) */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br from-purple-300/20 to-pink-300/20',
            'animate-ping animation-delay-300',
            sizeClasses[size]
          )}
          style={{ animationDelay: '0.3s' }}
        />

        {/* Main Lotus Circle */}
        <div
          className={cn(
            'relative rounded-full',
            'bg-gradient-to-br from-purple-500 via-purple-400 to-pink-500',
            'shadow-lg shadow-purple-500/50',
            'animate-pulse',
            'flex items-center justify-center',
            sizeClasses[size]
          )}
        >
          {/* Yoga Icon */}
          <span className="animate-breathe filter drop-shadow-lg">
            🧘
          </span>

          {/* Inner Glow */}
          <div
            className="absolute inset-2 rounded-full bg-white/10 animate-glow"
          />
        </div>

        {/* Lotus Petals (decorative) */}
        <LotusDecoration size={size} />
      </div>

      {/* Loading Text */}
      {text && (
        <span
          className={cn(
            'text-muted-foreground animate-pulse font-medium',
            textSizeClasses[size]
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
}

function LotusDecoration({ size }: { size: 'sm' | 'md' | 'lg' | 'xl' }) {
  const petalSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const offset = {
    sm: '-top-1 -bottom-1 -left-1 -right-1',
    md: '-top-1.5 -bottom-1.5 -left-1.5 -right-1.5',
    lg: '-top-2 -bottom-2 -left-2 -right-2',
    xl: '-top-3 -bottom-3 -left-3 -right-3',
  };

  return (
    <>
      {/* Top Petal */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 rounded-full bg-purple-300/60 animate-petal-float',
          petalSize[size],
          offset[size].split(' ')[0]
        )}
        style={{ animationDelay: '0s' }}
      />
      {/* Bottom Petal */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 rounded-full bg-pink-300/60 animate-petal-float',
          petalSize[size],
          offset[size].split(' ')[1]
        )}
        style={{ animationDelay: '0.5s', bottom: offset[size].includes('-bottom') ? '-0.5rem' : undefined }}
      />
      {/* Left Petal */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 rounded-full bg-purple-200/60 animate-petal-float',
          petalSize[size],
          offset[size].split(' ')[2]
        )}
        style={{ animationDelay: '0.25s', left: '-0.5rem' }}
      />
      {/* Right Petal */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 rounded-full bg-pink-200/60 animate-petal-float',
          petalSize[size],
          offset[size].split(' ')[3]
        )}
        style={{ animationDelay: '0.75s', right: '-0.5rem' }}
      />
    </>
  );
}

// Simpler version for inline use
export function YogaSpinnerMini({ className }: { className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-spin flex items-center justify-center">
        <span className="text-xs">🧘</span>
      </div>
    </div>
  );
}

export default YogaSpinner;
