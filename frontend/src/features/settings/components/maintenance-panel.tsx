'use client';
import { useEffect, useState } from 'react';
import {
  getMaintenanceWindows,
  createMaintenanceWindow,
  clearCache,
  optimizeDatabase,
  getHealthCheck,
  getBackups,
  createBackup,
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  IconLoader2,
  IconTrash,
  IconDatabase,
  IconHeartbeat,
  IconDeviceFloppy,
  IconPlus,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconClock,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'completed';
}

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    lastCheck: string;
  }[];
  uptime: number;
  version: string;
}

interface Backup {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  status: 'completed' | 'in_progress' | 'failed';
}

export function MaintenancePanel() {
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newWindow, setNewWindow] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [windowsResponse, healthResponse, backupsResponse] = await Promise.all([
        getMaintenanceWindows().catch(() => []),
        getHealthCheck().catch(() => null),
        getBackups().catch(() => []),
      ]);
      // Handle both array and { data: [...] } response formats
      const windowsData = Array.isArray(windowsResponse)
        ? windowsResponse
        : (windowsResponse?.data || windowsResponse?.windows || []);
      const backupsData = Array.isArray(backupsResponse)
        ? backupsResponse
        : (backupsResponse?.data || backupsResponse?.backups || []);
      // Health is an object, not an array
      const healthData = healthResponse?.overall ? healthResponse : ((healthResponse as any)?.data || null);
      setMaintenanceWindows(windowsData);
      setHealthStatus(healthData);
      setBackups(backupsData);
    } catch (error) {
      console.error('Failed to load maintenance data:', error);
      setMaintenanceWindows([]);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWindow = async () => {
    if (!newWindow.title || !newWindow.startTime || !newWindow.endTime) {
      toast.error('Title, start time, and end time are required');
      return;
    }
    setActionLoading('createWindow');
    try {
      await createMaintenanceWindow(newWindow);
      toast.success('Maintenance window scheduled');
      setDialogOpen(false);
      setNewWindow({ title: '', description: '', startTime: '', endTime: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create maintenance window:', error);
      toast.error('Failed to create maintenance window');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the cache?')) return;
    setActionLoading('cache');
    try {
      await clearCache();
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOptimizeDb = async () => {
    if (!confirm('Are you sure you want to optimize the database? This may take a few minutes.')) return;
    setActionLoading('optimize');
    try {
      await optimizeDatabase();
      toast.success('Database optimization completed');
    } catch (error) {
      console.error('Failed to optimize database:', error);
      toast.error('Failed to optimize database');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateBackup = async () => {
    setActionLoading('backup');
    try {
      await createBackup();
      toast.success('Backup started');
      loadData();
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <IconCheck className='h-4 w-4 text-green-500' />;
      case 'degraded': return <IconAlertTriangle className='h-4 w-4 text-yellow-500' />;
      case 'unhealthy': return <IconX className='h-4 w-4 text-red-500' />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed': return 'default';
      case 'degraded':
      case 'scheduled': return 'secondary';
      case 'unhealthy':
      case 'failed': return 'destructive';
      case 'active':
      case 'in_progress': return 'outline';
      default: return 'outline';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <Tabs defaultValue='health' className='space-y-4'>
      <TabsList>
        <TabsTrigger value='health'>Health</TabsTrigger>
        <TabsTrigger value='maintenance'>Maintenance</TabsTrigger>
        <TabsTrigger value='actions'>Actions</TabsTrigger>
        <TabsTrigger value='backups'>Backups</TabsTrigger>
      </TabsList>

      <TabsContent value='health'>
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <IconHeartbeat className='h-5 w-5' />
                    System Health
                  </CardTitle>
                  <CardDescription>Overall system status and service health</CardDescription>
                </div>
                <Badge variant={getStatusColor(healthStatus?.overall || 'healthy') as any} className='text-lg px-4 py-1'>
                  {healthStatus?.overall || 'Unknown'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-3 mb-6'>
                <div className='text-center p-4 bg-muted rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Uptime</p>
                  <p className='text-2xl font-bold'>{healthStatus?.uptime || 0}%</p>
                </div>
                <div className='text-center p-4 bg-muted rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Version</p>
                  <p className='text-2xl font-bold'>{healthStatus?.version || 'N/A'}</p>
                </div>
                <div className='text-center p-4 bg-muted rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Services</p>
                  <p className='text-2xl font-bold'>{healthStatus?.services?.length || 0}</p>
                </div>
              </div>

              <div className='space-y-3'>
                {healthStatus?.services?.map((service) => (
                  <div key={service.name} className='flex items-center justify-between p-3 border rounded-lg'>
                    <div className='flex items-center gap-3'>
                      {getStatusIcon(service.status)}
                      <span className='font-medium'>{service.name}</span>
                    </div>
                    <div className='flex items-center gap-4'>
                      <span className='text-sm text-muted-foreground'>{service.latency}ms</span>
                      <Badge variant={getStatusColor(service.status) as any}>{service.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value='maintenance'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <IconClock className='h-5 w-5' />
                Maintenance Windows
              </CardTitle>
              <CardDescription>Schedule downtime for updates and maintenance</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <IconPlus className='mr-2 h-4 w-4' />
                  Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Maintenance</DialogTitle>
                  <DialogDescription>Plan a maintenance window</DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Title</Label>
                    <Input
                      value={newWindow.title}
                      onChange={(e) => setNewWindow({ ...newWindow, title: e.target.value })}
                      placeholder='e.g. Database upgrade'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Description</Label>
                    <Textarea
                      value={newWindow.description}
                      onChange={(e) => setNewWindow({ ...newWindow, description: e.target.value })}
                      placeholder='Describe the maintenance...'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Start Time</Label>
                      <Input
                        type='datetime-local'
                        value={newWindow.startTime}
                        onChange={(e) => setNewWindow({ ...newWindow, startTime: e.target.value })}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>End Time</Label>
                      <Input
                        type='datetime-local'
                        value={newWindow.endTime}
                        onChange={(e) => setNewWindow({ ...newWindow, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateWindow} disabled={actionLoading === 'createWindow'}>
                    {actionLoading === 'createWindow' && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
                    Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {maintenanceWindows.length === 0 ? (
                <p className='text-center text-muted-foreground py-8'>No maintenance windows scheduled</p>
              ) : (
                maintenanceWindows.map((window) => (
                  <div key={window.id} className='flex items-center justify-between p-4 border rounded-lg'>
                    <div>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='font-medium'>{window.title}</span>
                        <Badge variant={getStatusColor(window.status) as any}>{window.status}</Badge>
                      </div>
                      <p className='text-sm text-muted-foreground'>{window.description}</p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {new Date(window.startTime).toLocaleString()} - {new Date(window.endTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='actions'>
        <div className='grid gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <IconTrash className='h-5 w-5' />
                Clear Cache
              </CardTitle>
              <CardDescription>Clear application cache to free up memory</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleClearCache}
                disabled={actionLoading === 'cache'}
                variant='destructive'
                className='w-full'
              >
                {actionLoading === 'cache' && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
                Clear Cache
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <IconDatabase className='h-5 w-5' />
                Optimize Database
              </CardTitle>
              <CardDescription>Run database optimization and cleanup</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleOptimizeDb}
                disabled={actionLoading === 'optimize'}
                variant='secondary'
                className='w-full'
              >
                {actionLoading === 'optimize' && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
                Optimize Database
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value='backups'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <IconDeviceFloppy className='h-5 w-5' />
                Backups
              </CardTitle>
              <CardDescription>Database backups and restore points</CardDescription>
            </div>
            <Button onClick={handleCreateBackup} disabled={actionLoading === 'backup'}>
              {actionLoading === 'backup' && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
              <IconPlus className='mr-2 h-4 w-4' />
              Create Backup
            </Button>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {backups.length === 0 ? (
                <p className='text-center text-muted-foreground py-8'>No backups available</p>
              ) : (
                backups.map((backup) => (
                  <div key={backup.id} className='flex items-center justify-between p-4 border rounded-lg'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{backup.name}</span>
                        <Badge variant={getStatusColor(backup.status) as any}>{backup.status}</Badge>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {formatBytes(backup.size)} • {new Date(backup.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {backup.status === 'in_progress' && (
                      <IconLoader2 className='h-5 w-5 animate-spin' />
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
