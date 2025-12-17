'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createEpisode,
  updateEpisode,
  getAdminEpisodeById,
  getAdminPodcastById,
  getPodcastAudioUploadUrl,
  uploadFileToS3
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  IconLoader2,
  IconUpload,
  IconArrowLeft,
  IconPlayerPlay,
  IconPlayerPause,
  IconMusic,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { toast } from 'sonner';

const episodeSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalı'),
  episodeNumber: z.number().min(1, 'Bölüm numarası gerekli'),
  seasonNumber: z.number().optional(),
  isExplicit: z.boolean().default(false),
  publishAt: z.string().optional()
});

type EpisodeFormData = z.infer<typeof episodeSchema>;

interface EpisodeFormProps {
  podcastId: string;
  episodeId?: string;
}

export function EpisodeForm({ podcastId, episodeId }: EpisodeFormProps) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [podcastTitle, setPodcastTitle] = useState('');

  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [audioFormat, setAudioFormat] = useState<string>('mp3');
  const [audioSize, setAudioSize] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const isEditing = !!episodeId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EpisodeFormData>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      episodeNumber: 1,
      isExplicit: false
    }
  });

  const isExplicit = watch('isExplicit');

  useEffect(() => {
    loadPodcast();
    if (episodeId) {
      loadEpisode();
    }
  }, [podcastId, episodeId]);

  const loadPodcast = async () => {
    try {
      const response = await getAdminPodcastById(podcastId);
      setPodcastTitle(response.podcast?.title || '');
    } catch (error) {
      console.error('Failed to load podcast:', error);
    }
  };

  const loadEpisode = async () => {
    if (!episodeId) return;
    setLoading(true);
    try {
      const response = await getAdminEpisodeById(podcastId, episodeId);
      const episode = response.episode;
      if (episode) {
        setValue('title', episode.title);
        setValue('description', episode.description);
        setValue('episodeNumber', episode.episodeNumber);
        if (episode.seasonNumber) setValue('seasonNumber', episode.seasonNumber);
        setValue('isExplicit', episode.isExplicit);
        if (episode.publishAt) setValue('publishAt', episode.publishAt.split('T')[0]);
        setAudioUrl(episode.audioUrl);
        setDuration(episode.duration);
        setAudioFormat(episode.audioFormat || 'mp3');
        setAudioSize(episode.audioSize);
      }
    } catch (error) {
      console.error('Failed to load episode:', error);
      toast.error('Bölüm yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Desteklenmeyen ses formatı. MP3, WAV, M4A, AAC veya OGG yükleyin.');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('Dosya boyutu 500MB\'dan küçük olmalı');
      return;
    }

    setAudioFile(file);
    setAudioSize(file.size);

    // Determine format
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    setAudioFormat(ext);

    // Get duration
    const audio = new Audio(URL.createObjectURL(file));
    audio.addEventListener('loadedmetadata', () => {
      setDuration(Math.round(audio.duration));
    });
  };

  const uploadAudio = async (): Promise<string | null> => {
    if (!audioFile) return audioUrl;

    setUploading(true);
    setUploadProgress(0);

    try {
      const { uploadUrl, fileUrl } = await getPodcastAudioUploadUrl(
        audioFile.name,
        audioFile.type
      );

      // Upload with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', audioFile.type);
        xhr.send(audioFile);
      });

      setAudioUrl(fileUrl);
      return fileUrl;
    } catch (error) {
      console.error('Audio upload failed:', error);
      toast.error('Ses dosyası yüklenemedi');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: EpisodeFormData) => {
    setSaving(true);
    try {
      // Upload audio if new file selected
      const finalAudioUrl = await uploadAudio();

      if (!finalAudioUrl && !audioUrl) {
        toast.error('Lütfen bir ses dosyası yükleyin');
        setSaving(false);
        return;
      }

      const payload = {
        ...data,
        audioUrl: finalAudioUrl || audioUrl,
        audioFormat,
        audioSize,
        duration,
        publishAt: data.publishAt || undefined,
        seasonNumber: data.seasonNumber || undefined
      };

      if (isEditing && episodeId) {
        await updateEpisode(podcastId, episodeId, payload);
        toast.success('Bölüm güncellendi');
      } else {
        await createEpisode(podcastId, payload);
        toast.success('Bölüm oluşturuldu');
      }
      router.push(`/dashboard/podcasts/${podcastId}/episodes`);
    } catch (error) {
      console.error('Failed to save episode:', error);
      toast.error(isEditing ? 'Bölüm güncellenemedi' : 'Bölüm oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Bölümü Düzenle' : 'Yeni Bölüm'}
          </h2>
          <p className="text-muted-foreground">{podcastTitle}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bölüm Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  placeholder="Bölüm başlığı"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea
                  id="description"
                  placeholder="Bölüm açıklaması"
                  rows={5}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="episodeNumber">Bölüm No *</Label>
                  <Input
                    id="episodeNumber"
                    type="number"
                    min={1}
                    {...register('episodeNumber', { valueAsNumber: true })}
                  />
                  {errors.episodeNumber && (
                    <p className="text-sm text-destructive">{errors.episodeNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seasonNumber">Sezon No</Label>
                  <Input
                    id="seasonNumber"
                    type="number"
                    min={1}
                    placeholder="Opsiyonel"
                    {...register('seasonNumber', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishAt">Yayın Tarihi</Label>
                  <Input
                    id="publishAt"
                    type="date"
                    {...register('publishAt')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Ses Dosyası</CardTitle>
              <CardDescription>
                MP3, WAV, M4A, AAC veya OGG formatında yükleyin (maks. 500MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current/Selected Audio */}
              {(audioUrl || audioFile) && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={togglePlayPause}
                    disabled={!audioUrl && !audioFile}
                  >
                    {isPlaying ? (
                      <IconPlayerPause className="h-5 w-5" />
                    ) : (
                      <IconPlayerPlay className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <p className="font-medium">
                      {audioFile?.name || 'Yüklü ses dosyası'}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{formatDuration(duration)}</span>
                      <span>{formatFileSize(audioSize)}</span>
                      <span className="uppercase">{audioFormat}</span>
                    </div>
                  </div>
                  {audioFile && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setAudioFile(null);
                        if (!isEditing) {
                          setAudioUrl(null);
                          setDuration(null);
                          setAudioSize(null);
                        }
                      }}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  )}
                  {(audioUrl || audioFile) && (
                    <audio
                      ref={audioRef}
                      src={audioFile ? URL.createObjectURL(audioFile) : audioUrl || undefined}
                      onEnded={() => setIsPlaying(false)}
                    />
                  )}
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Yükleniyor...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-center">
                <Label
                  htmlFor="audio-upload"
                  className="cursor-pointer flex items-center gap-2 px-6 py-4 border-2 border-dashed rounded-lg hover:bg-muted transition-colors"
                >
                  <IconUpload className="h-5 w-5" />
                  <span>{audioUrl || audioFile ? 'Değiştir' : 'Ses Dosyası Yükle'}</span>
                </Label>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioSelect}
                  disabled={uploading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ayarlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Explicit İçerik</Label>
                  <p className="text-xs text-muted-foreground">
                    18+ içerik uyarısı
                  </p>
                </div>
                <Switch
                  checked={isExplicit}
                  onCheckedChange={(checked) => setValue('isExplicit', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Süre:</span>
                <span>{formatDuration(duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Boyut:</span>
                <span>{formatFileSize(audioSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="uppercase">{audioFormat}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || uploading}
            >
              {(saving || uploading) && (
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEditing ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
