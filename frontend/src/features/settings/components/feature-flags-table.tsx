'use client';
import { useEffect, useState } from 'react';
import { getFeatureFlags, createFeatureFlag, toggleFeatureFlag, deleteFeatureFlag } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { IconLoader2, IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  createdAt: string;
}

export function FeatureFlagsTable() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFlag, setNewFlag] = useState({
    key: '',
    name: '',
    description: '',
    environment: 'development' as const,
  });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const data = await getFeatureFlags();
      const flagsList = Array.isArray(data) ? data : (data?.flags || data?.data || []);
      setFlags(Array.isArray(flagsList) ? flagsList : []);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      setFlags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newFlag.key || !newFlag.name) {
      toast.error('Key and name are required');
      return;
    }
    setCreating(true);
    try {
      await createFeatureFlag(newFlag);
      toast.success('Feature flag created');
      setDialogOpen(false);
      setNewFlag({ key: '', name: '', description: '', environment: 'development' });
      loadFlags();
    } catch (error) {
      console.error('Failed to create feature flag:', error);
      toast.error('Failed to create feature flag');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, currentValue: boolean) => {
    try {
      await toggleFeatureFlag(id);
      setFlags(flags.map(f => f.id === id ? { ...f, enabled: !currentValue } : f));
      toast.success(`Feature flag ${!currentValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
      toast.error('Failed to toggle feature flag');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;
    try {
      await deleteFeatureFlag(id);
      toast.success('Feature flag deleted');
      loadFlags();
    } catch (error) {
      console.error('Failed to delete feature flag:', error);
      toast.error('Failed to delete feature flag');
    }
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'production': return 'destructive';
      case 'staging': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Manage feature toggles for your application</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className='mr-2 h-4 w-4' />
              Add Flag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Feature Flag</DialogTitle>
              <DialogDescription>Add a new feature flag to control functionality</DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label>Key</Label>
                <Input
                  placeholder='e.g. enable_dark_mode'
                  value={newFlag.key}
                  onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label>Name</Label>
                <Input
                  placeholder='e.g. Dark Mode'
                  value={newFlag.name}
                  onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label>Description</Label>
                <Textarea
                  placeholder='Describe what this flag controls...'
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label>Environment</Label>
                <Select value={newFlag.environment} onValueChange={(v: any) => setNewFlag({ ...newFlag, environment: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='development'>Development</SelectItem>
                    <SelectItem value='staging'>Staging</SelectItem>
                    <SelectItem value='production'>Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {(!flags || flags.length === 0) ? (
            <p className='text-center text-muted-foreground py-8'>No feature flags configured</p>
          ) : (
            (flags || []).map((flag) => (
              <div key={flag.id} className='flex items-center justify-between p-4 border rounded-lg'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{flag.name}</span>
                    <Badge variant={getEnvColor(flag.environment) as any}>{flag.environment}</Badge>
                    <code className='text-xs bg-muted px-1 py-0.5 rounded'>{flag.key}</code>
                  </div>
                  {flag.description && (
                    <p className='text-sm text-muted-foreground mt-1'>{flag.description}</p>
                  )}
                </div>
                <div className='flex items-center gap-4'>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => handleToggle(flag.id, flag.enabled)}
                  />
                  <Button variant='ghost' size='icon' onClick={() => handleDelete(flag.id)}>
                    <IconTrash className='h-4 w-4 text-destructive' />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
