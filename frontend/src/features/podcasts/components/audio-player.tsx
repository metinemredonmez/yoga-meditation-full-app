'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconVolume,
  IconVolume3,
  IconRewindBackward10,
  IconRewindForward30,
  IconMicrophone,
  IconX,
  IconPlaylist
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface Episode {
  id: string;
  title: string;
  description?: string;
  audioUrl: string;
  duration: number | null;
  podcast?: {
    title: string;
    coverImage: string | null;
  };
}

interface AudioPlayerProps {
  episode: Episode | null;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showMiniPlayer?: boolean;
  className?: string;
}

export function AudioPlayer({
  episode,
  onClose,
  onNext,
  onPrevious,
  showMiniPlayer = false,
  className
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (audioRef.current && episode) {
      audioRef.current.load();
      setIsLoading(true);
    }
  }, [episode?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (onNext) onNext();
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [onNext]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const skipBackward = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  }, []);

  const skipForward = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      duration,
      audioRef.current.currentTime + 30
    );
  }, [duration]);

  const changePlaybackRate = useCallback(() => {
    if (!audioRef.current) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    audioRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  }, [playbackRate]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!episode) return null;

  // Mini player for bottom bar
  if (showMiniPlayer) {
    return (
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-background border-t z-50 px-4 py-2',
          className
        )}
      >
        <audio ref={audioRef} src={episode.audioUrl} preload="metadata" />
        <div className="flex items-center gap-4 max-w-screen-xl mx-auto">
          {/* Cover & Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 rounded-lg flex-shrink-0">
              <AvatarImage src={episode.podcast?.coverImage || undefined} />
              <AvatarFallback className="rounded-lg bg-primary/10">
                <IconMicrophone className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{episode.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {episode.podcast?.title}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={skipBackward}>
              <IconRewindBackward10 className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={togglePlay}
              disabled={isLoading}
            >
              {isPlaying ? (
                <IconPlayerPause className="h-5 w-5" />
              ) : (
                <IconPlayerPlay className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={skipForward}>
              <IconRewindForward30 className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress & Time */}
          <div className="hidden sm:flex items-center gap-2 w-64">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? (
                <IconVolume3 className="h-5 w-5" />
              ) : (
                <IconVolume className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          {/* Close */}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <IconX className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Full player
  return (
    <div className={cn('space-y-4', className)}>
      <audio ref={audioRef} src={episode.audioUrl} preload="metadata" />

      {/* Cover & Info */}
      <div className="flex flex-col items-center text-center gap-4">
        <Avatar className="h-48 w-48 rounded-lg">
          <AvatarImage src={episode.podcast?.coverImage || undefined} />
          <AvatarFallback className="rounded-lg bg-primary/10">
            <IconMicrophone className="h-16 w-16" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-bold">{episode.title}</h3>
          <p className="text-muted-foreground">{episode.podcast?.title}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4">
        {onPrevious && (
          <Button variant="ghost" size="icon" onClick={onPrevious}>
            <IconPlayerSkipBack className="h-6 w-6" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={skipBackward}>
          <IconRewindBackward10 className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isPlaying ? (
            <IconPlayerPause className="h-7 w-7" />
          ) : (
            <IconPlayerPlay className="h-7 w-7 ml-1" />
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={skipForward}>
          <IconRewindForward30 className="h-6 w-6" />
        </Button>
        {onNext && (
          <Button variant="ghost" size="icon" onClick={onNext}>
            <IconPlayerSkipForward className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={changePlaybackRate}
          className="w-16"
        >
          {playbackRate}x
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleMute}>
            {isMuted ? (
              <IconVolume3 className="h-5 w-5" />
            ) : (
              <IconVolume className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
