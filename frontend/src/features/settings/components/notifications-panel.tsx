'use client';
import { useEffect, useState } from 'react';
import { sendBulkNotification, getNotificationTemplates, getNotificationCampaigns } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { IconLoader2, IconSend, IconTemplate, IconSpeakerphone } from '@tabler/icons-react';
import { toast } from 'sonner';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  type: 'push' | 'email' | 'sms';
}

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  type: 'push' | 'email' | 'sms';
  targetCount: number;
  sentCount: number;
  scheduledAt: string;
  sentAt: string;
}

export function NotificationsPanel() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    title: '',
    body: '',
    type: 'push' as 'push' | 'email' | 'sms',
    targetAudience: 'all' as 'all' | 'subscribers' | 'free' | 'inactive',
    templateId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesResponse, campaignsResponse] = await Promise.all([
        getNotificationTemplates(),
        getNotificationCampaigns(),
      ]);
      // Handle both array and { data: [...] } response formats
      const templatesData = Array.isArray(templatesResponse)
        ? templatesResponse
        : (templatesResponse?.data || templatesResponse?.templates || []);
      const campaignsData = Array.isArray(campaignsResponse)
        ? campaignsResponse
        : (campaignsResponse?.data || campaignsResponse?.campaigns || []);
      setTemplates(templatesData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Failed to load notification data:', error);
      setTemplates([]);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulk = async () => {
    if (!bulkForm.title || !bulkForm.body) {
      toast.error('Title and body are required');
      return;
    }
    setSending(true);
    try {
      await sendBulkNotification(bulkForm);
      toast.success('Notification sent successfully');
      setBulkForm({ title: '', body: '', type: 'push', targetAudience: 'all', templateId: '' });
      loadData();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setBulkForm({
        ...bulkForm,
        templateId,
        title: template.title,
        body: template.body,
        type: template.type,
      });
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'scheduled': return 'secondary';
      case 'failed': return 'destructive';
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
    <Tabs defaultValue='send' className='space-y-4'>
      <TabsList>
        <TabsTrigger value='send'>Send Notification</TabsTrigger>
        <TabsTrigger value='templates'>Templates</TabsTrigger>
        <TabsTrigger value='campaigns'>Campaigns</TabsTrigger>
      </TabsList>

      <TabsContent value='send'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconSend className='h-5 w-5' />
              Send Bulk Notification
            </CardTitle>
            <CardDescription>Send notifications to multiple users at once</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Use Template (Optional)</Label>
              <Select value={bulkForm.templateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a template...' />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Notification Type</Label>
                <Select value={bulkForm.type} onValueChange={(v: any) => setBulkForm({ ...bulkForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='push'>Push Notification</SelectItem>
                    <SelectItem value='email'>Email</SelectItem>
                    <SelectItem value='sms'>SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Target Audience</Label>
                <Select value={bulkForm.targetAudience} onValueChange={(v: any) => setBulkForm({ ...bulkForm, targetAudience: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Users</SelectItem>
                    <SelectItem value='subscribers'>Subscribers Only</SelectItem>
                    <SelectItem value='free'>Free Users</SelectItem>
                    <SelectItem value='inactive'>Inactive Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Title</Label>
              <Input
                value={bulkForm.title}
                onChange={(e) => setBulkForm({ ...bulkForm, title: e.target.value })}
                placeholder='Notification title...'
              />
            </div>

            <div className='space-y-2'>
              <Label>Body</Label>
              <Textarea
                value={bulkForm.body}
                onChange={(e) => setBulkForm({ ...bulkForm, body: e.target.value })}
                placeholder='Notification message...'
                rows={4}
              />
            </div>

            <Button onClick={handleSendBulk} disabled={sending} className='w-full'>
              {sending ? (
                <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <IconSend className='mr-2 h-4 w-4' />
              )}
              Send Notification
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='templates'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconTemplate className='h-5 w-5' />
              Notification Templates
            </CardTitle>
            <CardDescription>Pre-configured notification templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {templates.length === 0 ? (
                <p className='text-center text-muted-foreground py-8'>No templates configured</p>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className='p-4 border rounded-lg'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='font-medium'>{template.name}</span>
                      <Badge variant='outline'>{template.type}</Badge>
                    </div>
                    <p className='text-sm font-medium'>{template.title}</p>
                    <p className='text-sm text-muted-foreground'>{template.body}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='campaigns'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconSpeakerphone className='h-5 w-5' />
              Notification Campaigns
            </CardTitle>
            <CardDescription>Past and scheduled notification campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {campaigns.length === 0 ? (
                <p className='text-center text-muted-foreground py-8'>No campaigns yet</p>
              ) : (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className='flex items-center justify-between p-4 border rounded-lg'>
                    <div>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='font-medium'>{campaign.name}</span>
                        <Badge variant={getCampaignStatusColor(campaign.status) as any}>
                          {campaign.status}
                        </Badge>
                        <Badge variant='outline'>{campaign.type}</Badge>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {campaign.status === 'sent'
                          ? `Sent to ${campaign.sentCount}/${campaign.targetCount} users`
                          : `Target: ${campaign.targetCount} users`
                        }
                      </p>
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleDateString()
                        : campaign.scheduledAt
                          ? `Scheduled: ${new Date(campaign.scheduledAt).toLocaleDateString()}`
                          : 'Draft'
                      }
                    </div>
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
