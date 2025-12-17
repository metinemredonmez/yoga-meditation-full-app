'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type MediaType = 'image' | 'video' | 'audio' | 'podcast';

interface MediaPlaceholderProps {
  type: MediaType;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  text?: string;
  onClick?: () => void;
  showUploadHint?: boolean;
}

const sizeClasses = {
  sm: 'h-24 w-24',
  md: 'h-40 w-full',
  lg: 'h-64 w-full',
  full: 'h-full w-full min-h-[200px]',
};

// Image Placeholder - Gray box with image icon
function ImagePlaceholder({ className, text, showUploadHint }: Omit<MediaPlaceholderProps, 'type'>) {
  return (
    <div className={cn('flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl', className)}>
      <svg
        className="w-12 h-12 text-gray-400 mb-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      {text && <span className="text-sm text-gray-500 font-medium">{text}</span>}
      {showUploadHint && (
        <span className="text-xs text-gray-400 mt-1">Görsel yüklemek için tıklayın</span>
      )}
    </div>
  );
}

// Video Placeholder - Thumbnail with play icon overlay
function VideoPlaceholder({ className, text, showUploadHint }: Omit<MediaPlaceholderProps, 'type'>) {
  return (
    <div className={cn('relative flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl overflow-hidden', className)}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="video-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect x="0" y="0" width="10" height="10" fill="currentColor" className="text-indigo-500" />
          </pattern>
          <rect fill="url(#video-pattern)" width="100" height="100" />
        </svg>
      </div>

      {/* Play button */}
      <div className="relative z-10 w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg mb-2">
        <svg
          className="w-8 h-8 text-indigo-600 ml-1"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      {text && <span className="relative z-10 text-sm text-indigo-600 font-medium">{text}</span>}
      {showUploadHint && (
        <span className="relative z-10 text-xs text-indigo-400 mt-1">Video yüklemek için tıklayın</span>
      )}

      {/* Film strip decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/10 flex items-center justify-around px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-3 h-3 bg-white/30 rounded-sm" />
        ))}
      </div>
    </div>
  );
}

// Audio/Podcast Placeholder - Waveform with audio icon
function AudioPlaceholder({ className, text, showUploadHint }: Omit<MediaPlaceholderProps, 'type'>) {
  return (
    <div className={cn('flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-teal-100 rounded-xl', className)}>
      {/* Waveform visualization */}
      <div className="flex items-center gap-1 mb-3">
        {[3, 5, 2, 7, 4, 8, 3, 6, 2, 5, 7, 4, 3, 6, 4].map((height, i) => (
          <div
            key={i}
            className="w-1 bg-gradient-to-t from-green-500 to-teal-400 rounded-full opacity-60"
            style={{ height: `${height * 4}px` }}
          />
        ))}
      </div>

      {/* Audio icon */}
      <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-md mb-2">
        <svg
          className="w-6 h-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        </svg>
      </div>

      {text && <span className="text-sm text-green-600 font-medium">{text}</span>}
      {showUploadHint && (
        <span className="text-xs text-green-400 mt-1">Ses dosyası yüklemek için tıklayın</span>
      )}
    </div>
  );
}

// Podcast Placeholder - Special design for podcasts
function PodcastPlaceholder({ className, text, showUploadHint }: Omit<MediaPlaceholderProps, 'type'>) {
  return (
    <div className={cn('flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl', className)}>
      {/* Microphone icon */}
      <div className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center shadow-md mb-3">
        <svg
          className="w-7 h-7 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </div>

      {/* Soundwave bars */}
      <div className="flex items-end gap-1 h-8 mb-2">
        {[2, 4, 6, 8, 6, 8, 4, 6, 3, 5, 7, 5, 3].map((height, i) => (
          <div
            key={i}
            className="w-1.5 bg-gradient-to-t from-purple-500 to-pink-400 rounded-full animate-pulse"
            style={{
              height: `${height * 3}px`,
              animationDelay: `${i * 100}ms`
            }}
          />
        ))}
      </div>

      {text && <span className="text-sm text-purple-600 font-medium">{text}</span>}
      {showUploadHint && (
        <span className="text-xs text-purple-400 mt-1">Podcast yüklemek için tıklayın</span>
      )}
    </div>
  );
}

// Main MediaPlaceholder component
export function MediaPlaceholder({
  type,
  className,
  size = 'md',
  text,
  onClick,
  showUploadHint = false,
}: MediaPlaceholderProps) {
  const combinedClassName = cn(
    sizeClasses[size],
    onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
    className
  );

  const handleClick = onClick ? onClick : undefined;

  const props = {
    className: combinedClassName,
    text,
    showUploadHint,
  };

  const content = (() => {
    switch (type) {
      case 'image':
        return <ImagePlaceholder {...props} />;
      case 'video':
        return <VideoPlaceholder {...props} />;
      case 'audio':
        return <AudioPlaceholder {...props} />;
      case 'podcast':
        return <PodcastPlaceholder {...props} />;
      default:
        return <ImagePlaceholder {...props} />;
    }
  })();

  if (onClick) {
    return (
      <button type="button" onClick={handleClick} className="w-full">
        {content}
      </button>
    );
  }

  return content;
}

// Media Display component - Shows media or placeholder
interface MediaDisplayProps {
  type: MediaType;
  src?: string | null;
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  placeholderText?: string;
  showPlayButton?: boolean;
  onPlay?: () => void;
}

export function MediaDisplay({
  type,
  src,
  alt = '',
  className,
  size = 'md',
  placeholderText,
  showPlayButton = true,
  onPlay,
}: MediaDisplayProps) {
  const sizeClass = sizeClasses[size];

  // No source - show placeholder
  if (!src) {
    return (
      <MediaPlaceholder
        type={type}
        className={cn(sizeClass, className)}
        text={placeholderText}
      />
    );
  }

  // Image
  if (type === 'image') {
    return (
      <div className={cn('relative overflow-hidden rounded-xl', sizeClass, className)}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Video
  if (type === 'video') {
    return (
      <div className={cn('relative overflow-hidden rounded-xl group', sizeClass, className)}>
        <video
          src={src}
          className="w-full h-full object-cover"
          preload="metadata"
          playsInline
        />
        {showPlayButton && (
          <button
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-indigo-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
      </div>
    );
  }

  // Audio / Podcast - Show player
  if (type === 'audio' || type === 'podcast') {
    return (
      <div className={cn('relative rounded-xl overflow-hidden', sizeClass, className)}>
        <div className={cn(
          'absolute inset-0',
          type === 'podcast'
            ? 'bg-gradient-to-br from-purple-100 to-pink-100'
            : 'bg-gradient-to-br from-green-100 to-teal-100'
        )} />
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
          <audio src={src} controls className="w-full max-w-md" />
        </div>
      </div>
    );
  }

  return null;
}

// Upload Placeholder - Specifically for upload interfaces
interface UploadPlaceholderProps {
  type: MediaType;
  className?: string;
  onUpload?: () => void;
  isDragging?: boolean;
  accept?: string;
}

export function UploadPlaceholder({
  type,
  className,
  onUpload,
  isDragging = false,
}: UploadPlaceholderProps) {
  const typeConfig = {
    image: {
      title: 'Görsel Yükle',
      subtitle: 'PNG, JPG, WEBP - Max 5MB',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
      color: 'gray',
    },
    video: {
      title: 'Video Yükle',
      subtitle: 'MP4, MOV, WEBM - Max 500MB',
      icon: (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </>
      ),
      color: 'indigo',
    },
    audio: {
      title: 'Ses Dosyası Yükle',
      subtitle: 'MP3, WAV, M4A - Max 100MB',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      ),
      color: 'green',
    },
    podcast: {
      title: 'Podcast Yükle',
      subtitle: 'MP3, M4A - Max 200MB',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      ),
      color: 'purple',
    },
  };

  const config = typeConfig[type];
  const colorClasses = {
    gray: {
      bg: isDragging ? 'bg-gray-100' : 'bg-gray-50',
      border: isDragging ? 'border-gray-400' : 'border-gray-300',
      icon: 'text-gray-400',
      title: 'text-gray-600',
      subtitle: 'text-gray-400',
    },
    indigo: {
      bg: isDragging ? 'bg-indigo-100' : 'bg-indigo-50',
      border: isDragging ? 'border-indigo-400' : 'border-indigo-300',
      icon: 'text-indigo-400',
      title: 'text-indigo-600',
      subtitle: 'text-indigo-400',
    },
    green: {
      bg: isDragging ? 'bg-green-100' : 'bg-green-50',
      border: isDragging ? 'border-green-400' : 'border-green-300',
      icon: 'text-green-400',
      title: 'text-green-600',
      subtitle: 'text-green-400',
    },
    purple: {
      bg: isDragging ? 'bg-purple-100' : 'bg-purple-50',
      border: isDragging ? 'border-purple-400' : 'border-purple-300',
      icon: 'text-purple-400',
      title: 'text-purple-600',
      subtitle: 'text-purple-400',
    },
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  return (
    <button
      type="button"
      onClick={onUpload}
      className={cn(
        'w-full border-2 border-dashed rounded-xl p-8 text-center transition-all',
        colors.bg,
        colors.border,
        'hover:opacity-80',
        className
      )}
    >
      <svg
        className={cn('w-12 h-12 mx-auto mb-3', colors.icon)}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {config.icon}
      </svg>
      <p className={cn('font-medium', colors.title)}>{config.title}</p>
      <p className={cn('text-sm mt-1', colors.subtitle)}>{config.subtitle}</p>
      {isDragging && (
        <p className={cn('text-sm mt-2 font-medium', colors.title)}>
          Dosyayı buraya bırakın
        </p>
      )}
    </button>
  );
}

export default MediaPlaceholder;
