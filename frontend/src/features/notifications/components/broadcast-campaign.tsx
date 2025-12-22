'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  IconLoader2,
  IconPlus,
  IconDots,
  IconSend,
  IconUsers,
  IconMail,
  IconBell,
  IconDeviceMobile,
  IconPlayerPlay,
  IconPlayerPause,
  IconX,
  IconChartBar,
} from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { getBroadcastCampaigns, createBroadcastCampaign, updateBroadcastCampaign } from '@/lib/api';

interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED' | 'CANCELLED';
  channels: ('push' | 'email' | 'inApp')[];
  targetAudience: {
    type: 'ALL' | 'ROLES' | 'SEGMENTS' | 'CUSTOM';
    roles?: string[];
    segmentId?: string;
    userIds?: string[];
  };
  content: {
    title: string;
    body: string;
    subject?: string;
  };
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  createdAt: string;
}

export function BroadcastCampaign() {
  const [mounted, setMounted] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    channels: [] as string[],
    audienceType: 'ALL',
    roles: [] as string[],
    title: '',
    body: '',
    subject: '',
    scheduleType: 'NOW',
    scheduledAt: '',
  });

  useEffect(() => {
    setMounted(true);
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getBroadcastCampaigns();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      toast.error('Kampanyalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // SSR hydration fix - render nothing until mounted
  if (!mounted) {
    return null;
  }

  const handleChannelToggle = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.title || formData.channels.length === 0) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setSending(true);
    try {
      const newCampaign = {
        name: formData.name,
        status: formData.scheduleType === 'NOW' ? 'SENDING' : 'SCHEDULED',
        channels: formData.channels,
        targetAudience: {
          type: formData.audienceType,
          roles: formData.audienceType === 'ROLES' ? formData.roles : undefined,
        },
        content: {
          title: formData.title,
          body: formData.body,
          subject: formData.channels.includes('email') ? formData.subject : undefined,
        },
        scheduledAt: formData.scheduleType === 'SCHEDULED' ? formData.scheduledAt : undefined,
        stats: {
          total: 0,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          failed: 0,
        },
      };

      await createBroadcastCampaign(newCampaign);
      await loadCampaigns();
      toast.success(
        formData.scheduleType === 'NOW'
          ? 'Kampanya gönderiliyor...'
          : 'Kampanya planlandı'
      );
      setCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error('Kampanya oluşturulamadı');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      channels: [],
      audienceType: 'ALL',
      roles: [],
      title: '',
      body: '',
      subject: '',
      scheduleType: 'NOW',
      scheduledAt: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline">Taslak</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-blue-500/10 text-blue-600">Planlandı</Badge>;
      case 'SENDING':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Gönderiliyor</Badge>;
      case 'SENT':
        return <Badge className="bg-green-500/10 text-green-600">Gönderildi</Badge>;
      case 'PAUSED':
        return <Badge className="bg-orange-500/10 text-orange-600">Duraklatıldı</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-500/10 text-red-600">İptal Edildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChannelIcons = (channels: string[]) => (
    <div className="flex gap-1">
      {channels.includes('push') && <IconDeviceMobile className="h-4 w-4 text-green-500" />}
      {channels.includes('email') && <IconMail className="h-4 w-4 text-blue-500" />}
      {channels.includes('inApp') && <IconBell className="h-4 w-4 text-orange-500" />}
    </div>
  );

  const getAudienceLabel = (audience: Campaign['targetAudience']) => {
    switch (audience.type) {
      case 'ALL':
        return 'Tüm Kullanıcılar';
      case 'ROLES':
        return `Roller: ${audience.roles?.join(', ')}`;
      case 'SEGMENTS':
        return 'Segment';
      case 'CUSTOM':
        return `${audience.userIds?.length || 0} Kullanıcı`;
      default:
        return audience.type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Toplu Bildirim</h2>
          <p className="text-muted-foreground">Kullanıcılara toplu bildirim gönderin</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Kampanya
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kampanya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gönderilen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaigns.filter(c => c.status === 'SENT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Planlanmış</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {campaigns.filter(c => c.status === 'SCHEDULED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Teslim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.stats.delivered, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconSend className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Henüz kampanya yok</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kampanya</TableHead>
                  <TableHead>Kanallar</TableHead>
                  <TableHead>Hedef Kitle</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İstatistikler</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.sentAt
                            ? `Gönderildi: ${formatDistanceToNow(new Date(campaign.sentAt), { addSuffix: true, locale: tr })}`
                            : campaign.scheduledAt
                              ? `Planlanan: ${format(new Date(campaign.scheduledAt), 'dd MMM yyyy HH:mm', { locale: tr })}`
                              : `Oluşturuldu: ${formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true, locale: tr })}`
                          }
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getChannelIcons(campaign.channels)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getAudienceLabel(campaign.targetAudience)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      {campaign.status === 'SENDING' ? (
                        <div className="w-32">
                          <Progress
                            value={(campaign.stats.sent / campaign.stats.total) * 100}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {campaign.stats.sent} / {campaign.stats.total}
                          </p>
                        </div>
                      ) : campaign.stats.total > 0 ? (
                        <div className="text-sm">
                          <span className="text-green-600">{campaign.stats.delivered}</span>
                          <span className="text-muted-foreground"> / {campaign.stats.total}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedCampaign(campaign);
                            setDetailDialog(true);
                          }}>
                            <IconChartBar className="mr-2 h-4 w-4" />
                            Detaylar
                          </DropdownMenuItem>
                          {campaign.status === 'SENDING' && (
                            <DropdownMenuItem>
                              <IconPlayerPause className="mr-2 h-4 w-4" />
                              Duraklat
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'PAUSED' && (
                            <DropdownMenuItem>
                              <IconPlayerPlay className="mr-2 h-4 w-4" />
                              Devam Et
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'SCHEDULED' && (
                            <DropdownMenuItem className="text-destructive">
                              <IconX className="mr-2 h-4 w-4" />
                              İptal Et
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Kampanya Oluştur</DialogTitle>
            <DialogDescription>
              Kullanıcılara toplu bildirim gönderin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Campaign Name */}
            <div>
              <Label>Kampanya Adı</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Yeni Yıl Kampanyası"
              />
            </div>

            {/* Channels */}
            <div>
              <Label className="mb-3 block">Bildirim Kanalları</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="push"
                    checked={formData.channels.includes('push')}
                    onCheckedChange={() => handleChannelToggle('push')}
                  />
                  <label htmlFor="push" className="flex items-center gap-2 text-sm cursor-pointer">
                    <IconDeviceMobile className="h-4 w-4 text-green-500" />
                    Push
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={formData.channels.includes('email')}
                    onCheckedChange={() => handleChannelToggle('email')}
                  />
                  <label htmlFor="email" className="flex items-center gap-2 text-sm cursor-pointer">
                    <IconMail className="h-4 w-4 text-blue-500" />
                    E-posta
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inApp"
                    checked={formData.channels.includes('inApp')}
                    onCheckedChange={() => handleChannelToggle('inApp')}
                  />
                  <label htmlFor="inApp" className="flex items-center gap-2 text-sm cursor-pointer">
                    <IconBell className="h-4 w-4 text-orange-500" />
                    Uygulama İçi
                  </label>
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <Label className="mb-3 block">Hedef Kitle</Label>
              <RadioGroup
                value={formData.audienceType}
                onValueChange={(v) => setFormData(prev => ({ ...prev, audienceType: v }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ALL" id="all" />
                  <label htmlFor="all" className="text-sm cursor-pointer">Tüm Kullanıcılar</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ROLES" id="roles" />
                  <label htmlFor="roles" className="text-sm cursor-pointer">Belirli Roller</label>
                </div>
              </RadioGroup>

              {formData.audienceType === 'ROLES' && (
                <div className="mt-3 pl-6 space-y-2">
                  {['ADMIN', 'TEACHER', 'STUDENT'].map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={role}
                        checked={formData.roles.includes(role)}
                        onCheckedChange={() => handleRoleToggle(role)}
                      />
                      <label htmlFor={role} className="text-sm cursor-pointer">
                        {role === 'ADMIN' ? 'Adminler' : role === 'TEACHER' ? 'Eğitmenler' : 'Öğrenciler'}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <Label>Başlık</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Bildirim başlığı"
                />
              </div>

              {formData.channels.includes('email') && (
                <div>
                  <Label>E-posta Konusu</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="E-posta konu satırı"
                  />
                </div>
              )}

              <div>
                <Label>İçerik</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Bildirim içeriği..."
                  rows={4}
                />
              </div>
            </div>

            {/* Schedule */}
            <div>
              <Label className="mb-3 block">Gönderim Zamanı</Label>
              <RadioGroup
                value={formData.scheduleType}
                onValueChange={(v) => setFormData(prev => ({ ...prev, scheduleType: v }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NOW" id="now" />
                  <label htmlFor="now" className="text-sm cursor-pointer">Hemen Gönder</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SCHEDULED" id="scheduled" />
                  <label htmlFor="scheduled" className="text-sm cursor-pointer">Planla</label>
                </div>
              </RadioGroup>

              {formData.scheduleType === 'SCHEDULED' && (
                <div className="mt-3 pl-6">
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleCreate} disabled={sending}>
              {sending && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              <IconSend className="h-4 w-4 mr-2" />
              {formData.scheduleType === 'NOW' ? 'Gönder' : 'Planla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kampanya Detayları</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{selectedCampaign.name}</h3>
                {getStatusBadge(selectedCampaign.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Kanallar</Label>
                  <div className="flex gap-2 mt-1">{getChannelIcons(selectedCampaign.channels)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hedef Kitle</Label>
                  <p>{getAudienceLabel(selectedCampaign.targetAudience)}</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-muted-foreground">İçerik</Label>
                <p className="font-medium mt-1">{selectedCampaign.content.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.content.body}</p>
              </div>

              {selectedCampaign.stats.total > 0 && (
                <div className="space-y-3">
                  <Label>İstatistikler</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{selectedCampaign.stats.total}</p>
                      <p className="text-xs text-muted-foreground">Toplam</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedCampaign.stats.delivered}</p>
                      <p className="text-xs text-muted-foreground">Teslim</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedCampaign.stats.opened}</p>
                      <p className="text-xs text-muted-foreground">Açılan</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Teslim Oranı</span>
                        <span className="font-medium">
                          {((selectedCampaign.stats.delivered / selectedCampaign.stats.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={(selectedCampaign.stats.delivered / selectedCampaign.stats.total) * 100}
                        className="h-2 mt-2"
                      />
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Açılma Oranı</span>
                        <span className="font-medium">
                          {selectedCampaign.stats.delivered > 0
                            ? ((selectedCampaign.stats.opened / selectedCampaign.stats.delivered) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <Progress
                        value={selectedCampaign.stats.delivered > 0
                          ? (selectedCampaign.stats.opened / selectedCampaign.stats.delivered) * 100
                          : 0}
                        className="h-2 mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
