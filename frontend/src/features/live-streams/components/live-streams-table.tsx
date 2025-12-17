'use client';
import { useEffect, useState, useCallback } from 'react';
import { getLiveStreams, endLiveStream } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconLoader2, IconSearch, IconPlayerStop, IconEye, IconUsers, IconVideo, IconWifi } from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/context/socket-context';
import { getSocket, SOCKET_EVENTS, LiveStreamEvent } from '@/lib/socket';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar: string;
  viewerCount: number;
  startedAt: string;
  scheduledAt: string;
  thumbnailUrl: string;
}

export function LiveStreamsTable() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { isConnected } = useSocket();

  // Handle real-time stream updates
  const handleStreamStarted = useCallback((data: LiveStreamEvent) => {
    setStreams((prev) => {
      const exists = prev.find((s) => s.id === data.streamId);
      if (exists) {
        return prev.map((s) =>
          s.id === data.streamId ? { ...s, status: 'LIVE', viewerCount: data.viewerCount } : s
        );
      }
      return prev;
    });
    toast.info('A new stream has started!');
  }, []);

  const handleStreamEnded = useCallback((data: LiveStreamEvent) => {
    setStreams((prev) =>
      prev.map((s) =>
        s.id === data.streamId ? { ...s, status: 'ENDED', viewerCount: 0 } : s
      )
    );
  }, []);

  const handleViewerCount = useCallback((data: LiveStreamEvent) => {
    setStreams((prev) =>
      prev.map((s) =>
        s.id === data.streamId ? { ...s, viewerCount: data.viewerCount } : s
      )
    );
  }, []);

  useEffect(() => {
    loadStreams();
  }, []);

  // Subscribe to real-time stream events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(SOCKET_EVENTS.STREAM_STARTED, handleStreamStarted);
    socket.on(SOCKET_EVENTS.STREAM_ENDED, handleStreamEnded);
    socket.on(SOCKET_EVENTS.STREAM_VIEWER_COUNT, handleViewerCount);

    return () => {
      socket.off(SOCKET_EVENTS.STREAM_STARTED, handleStreamStarted);
      socket.off(SOCKET_EVENTS.STREAM_ENDED, handleStreamEnded);
      socket.off(SOCKET_EVENTS.STREAM_VIEWER_COUNT, handleViewerCount);
    };
  }, [handleStreamStarted, handleStreamEnded, handleViewerCount]);

  const loadStreams = async () => {
    setLoading(true);
    try {
      const data = await getLiveStreams();
      const streamsList = Array.isArray(data) ? data : (data?.streams || data?.data || []);
      setStreams(Array.isArray(streamsList) ? streamsList : []);
    } catch (error) {
      console.error('Failed to load live streams:', error);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndStream = async (id: string) => {
    if (!confirm('Are you sure you want to end this stream?')) return;
    try {
      await endLiveStream(id);
      toast.success('Stream ended');
      loadStreams();
    } catch (error) {
      console.error('Failed to end stream:', error);
      toast.error('Failed to end stream');
    }
  };

  const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-500/10 text-gray-500';
    switch (status.toUpperCase()) {
      case 'LIVE': return 'bg-red-500/10 text-red-500';
      case 'SCHEDULED': return 'bg-blue-500/10 text-blue-500';
      case 'ENDED': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const filteredStreams = (streams || []).filter((stream) => {
    const matchesSearch = stream.title?.toLowerCase().includes(search.toLowerCase()) ||
      stream.instructorName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || stream.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search streams...'
            className='pl-9'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='LIVE'>Live</SelectItem>
            <SelectItem value='SCHEDULED'>Scheduled</SelectItem>
            <SelectItem value='ENDED'>Ended</SelectItem>
          </SelectContent>
        </Select>
        <Badge
          variant='outline'
          className={`flex items-center gap-1.5 px-2 py-1 h-9 ${
            isConnected
              ? 'border-green-500/50 text-green-600'
              : 'border-red-500/50 text-red-600'
          }`}
        >
          <IconWifi className='h-3.5 w-3.5' />
          {isConnected ? 'Real-time' : 'Offline'}
        </Badge>
      </div>

      {filteredStreams.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <IconVideo className='h-12 w-12 text-muted-foreground mb-4' />
            <p className='text-muted-foreground'>No live streams found</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredStreams.map((stream) => (
            <Card key={stream.id} className='overflow-hidden'>
              <div className='aspect-video bg-muted relative'>
                {stream.thumbnailUrl ? (
                  <img src={stream.thumbnailUrl} alt={stream.title} className='w-full h-full object-cover' />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <IconVideo className='h-12 w-12 text-muted-foreground' />
                  </div>
                )}
                <Badge className={`absolute top-2 left-2 ${getStatusBadgeColor(stream.status)}`}>
                  {stream.status || 'Unknown'}
                </Badge>
                {stream.status?.toUpperCase() === 'LIVE' && (
                  <div className='absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded text-xs'>
                    <IconEye className='h-3 w-3' />
                    {stream.viewerCount || 0}
                  </div>
                )}
              </div>
              <CardHeader className='pb-2'>
                <CardTitle className='text-lg line-clamp-1'>{stream.title}</CardTitle>
                <CardDescription className='line-clamp-2'>{stream.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={stream.instructorAvatar} />
                      <AvatarFallback>
                        {stream.instructorName?.substring(0, 2).toUpperCase() || 'IN'}
                      </AvatarFallback>
                    </Avatar>
                    <span className='text-sm'>{stream.instructorName || 'Unknown'}</span>
                  </div>
                  {stream.status?.toUpperCase() === 'LIVE' && (
                    <Button size='sm' variant='destructive' onClick={() => handleEndStream(stream.id)}>
                      <IconPlayerStop className='h-4 w-4 mr-1' />
                      End
                    </Button>
                  )}
                </div>
                <p className='text-xs text-muted-foreground mt-2'>
                  {stream.startedAt
                    ? `Started ${formatDistanceToNow(new Date(stream.startedAt))} ago`
                    : stream.scheduledAt
                      ? `Scheduled for ${new Date(stream.scheduledAt).toLocaleDateString()}`
                      : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
