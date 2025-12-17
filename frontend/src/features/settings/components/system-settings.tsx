'use client';
import { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSetting } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { IconLoader2, IconCheck } from '@tabler/icons-react';
import { toast } from 'sonner';

interface SystemSetting {
  key: string;
  value: string | boolean | number;
  type: 'string' | 'boolean' | 'number';
  label: string;
  description: string;
  category: string;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSystemSettings();
      setSettings(data);
      const initialValues: Record<string, any> = {};
      data.forEach((s: SystemSetting) => {
        initialValues[s.key] = s.value;
      });
      setEditedValues(initialValues);
    } catch (error) {
      console.error('Failed to load system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await updateSystemSetting(key, editedValues[key]);
      toast.success('Setting updated');
      setSettings(settings.map(s => s.key === key ? { ...s, value: editedValues[key] } : s));
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className='capitalize'>{category.replace(/_/g, ' ')}</CardTitle>
            <CardDescription>Configure {category.toLowerCase().replace(/_/g, ' ')} settings</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {categorySettings.map((setting) => (
              <div key={setting.key} className='flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0'>
                <div className='flex-1'>
                  <Label className='font-medium'>{setting.label}</Label>
                  <p className='text-sm text-muted-foreground mt-1'>{setting.description}</p>
                </div>
                <div className='flex items-center gap-2'>
                  {setting.type === 'boolean' ? (
                    <Switch
                      checked={editedValues[setting.key] as boolean}
                      onCheckedChange={(checked) => {
                        setEditedValues({ ...editedValues, [setting.key]: checked });
                        setTimeout(() => handleSave(setting.key), 0);
                      }}
                      disabled={saving === setting.key}
                    />
                  ) : setting.type === 'number' ? (
                    <>
                      <Input
                        type='number'
                        className='w-32'
                        value={editedValues[setting.key]}
                        onChange={(e) => setEditedValues({ ...editedValues, [setting.key]: Number(e.target.value) })}
                      />
                      <Button
                        size='sm'
                        onClick={() => handleSave(setting.key)}
                        disabled={saving === setting.key || editedValues[setting.key] === setting.value}
                      >
                        {saving === setting.key ? <IconLoader2 className='h-4 w-4 animate-spin' /> : <IconCheck className='h-4 w-4' />}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        className='w-64'
                        value={editedValues[setting.key]}
                        onChange={(e) => setEditedValues({ ...editedValues, [setting.key]: e.target.value })}
                      />
                      <Button
                        size='sm'
                        onClick={() => handleSave(setting.key)}
                        disabled={saving === setting.key || editedValues[setting.key] === setting.value}
                      >
                        {saving === setting.key ? <IconLoader2 className='h-4 w-4 animate-spin' /> : <IconCheck className='h-4 w-4' />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
