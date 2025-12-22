'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageContainer from '@/components/layout/page-container';
import {
  IconCash,
  IconCreditCard,
  IconLoader2,
  IconPlus,
  IconWallet,
  IconBuildingBank,
  IconReceipt,
  IconTrendingUp,
  IconClock,
  IconCheck,
  IconX,
  IconCrown,
  IconStar,
  IconBell,
  IconMail,
  IconChartBar,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PayoutSettings {
  method: 'bank_transfer' | 'stripe';
  bankName?: string;
  iban?: string;
  accountHolder?: string;
  stripeConnected?: boolean;
}

interface Earning {
  id: string;
  date: string;
  type: 'subscription' | 'purchase' | 'tip';
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
}

interface Payout {
  id: string;
  requestedAt: string;
  processedAt?: string;
  amount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  availableBalance: number;
  minimumPayout: number;
  commissionRate: number;
}

interface TierPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  popular?: boolean;
  features: string[];
  limits: {
    maxClasses: number;
    maxPrograms: number;
    maxStudents: number;
    canSendNotifications: boolean;
    canSendEmails: boolean;
    canCreateCampaigns?: boolean;
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

const statusLabels: Record<string, string> = {
  pending: 'Bekliyor',
  processing: 'Isleniyor',
  completed: 'Tamamlandi',
  paid: 'Odendi',
  failed: 'Basarisiz',
  cancelled: 'Iptal',
};

const typeLabels: Record<string, string> = {
  subscription: 'Abonelik',
  purchase: 'Satis',
  tip: 'Bahsis',
};

export default function InstructorBillingPage() {
  const [currentTier, setCurrentTier] = useState<string>('STARTER');
  const [tierPlans, setTierPlans] = useState<TierPlan[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    availableBalance: 0,
    minimumPayout: 100,
    commissionRate: 0.3,
  });
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>({
    method: 'bank_transfer',
    bankName: '',
    iban: '',
    accountHolder: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock tier data - replace with actual API call
      setCurrentTier('STARTER');
      setTierPlans([
        {
          id: 'STARTER',
          name: 'Baslangic',
          price: 0,
          currency: 'TRY',
          interval: 'month',
          features: [
            '10 ders olusturma',
            '2 program olusturma',
            '50 ogrenci',
            'Temel analitik',
          ],
          limits: {
            maxClasses: 10,
            maxPrograms: 2,
            maxStudents: 50,
            canSendNotifications: false,
            canSendEmails: false,
          },
        },
        {
          id: 'PRO',
          name: 'Profesyonel',
          price: 299,
          currency: 'TRY',
          interval: 'month',
          popular: true,
          features: [
            '50 ders olusturma',
            '10 program olusturma',
            '500 ogrenci',
            'Gelismis analitik',
            'Push bildirimi gonderme',
            'E-posta gonderme',
            'Oncelikli destek',
          ],
          limits: {
            maxClasses: 50,
            maxPrograms: 10,
            maxStudents: 500,
            canSendNotifications: true,
            canSendEmails: true,
          },
        },
        {
          id: 'ELITE',
          name: 'Elit',
          price: 599,
          currency: 'TRY',
          interval: 'month',
          features: [
            'Sinirsiz ders',
            'Sinirsiz program',
            'Sinirsiz ogrenci',
            'Tam analitik erisimi',
            'Sinirsiz bildirim',
            'Kampanya olusturma',
            'API erisimi',
            '7/24 VIP destek',
          ],
          limits: {
            maxClasses: -1,
            maxPrograms: -1,
            maxStudents: -1,
            canSendNotifications: true,
            canSendEmails: true,
            canCreateCampaigns: true,
          },
        },
      ]);

      // Mock data - replace with actual API calls
      setSummary({
        totalEarnings: 5250,
        pendingEarnings: 750,
        paidEarnings: 4500,
        availableBalance: 750,
        minimumPayout: 100,
        commissionRate: 0.3,
      });

      setEarnings([
        {
          id: '1',
          date: new Date().toISOString(),
          type: 'subscription',
          description: 'Aylik abonelik payi',
          amount: 250,
          status: 'pending',
        },
        {
          id: '2',
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
          type: 'purchase',
          description: '30 Gunde Yoga programi satisi',
          amount: 350,
          status: 'paid',
        },
        {
          id: '3',
          date: new Date(Date.now() - 86400000 * 10).toISOString(),
          type: 'tip',
          description: 'Ogrenci bahsisi',
          amount: 50,
          status: 'paid',
        },
        {
          id: '4',
          date: new Date(Date.now() - 86400000 * 15).toISOString(),
          type: 'subscription',
          description: 'Aylik abonelik payi',
          amount: 250,
          status: 'paid',
        },
      ]);

      setPayouts([
        {
          id: '1',
          requestedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          processedAt: new Date(Date.now() - 86400000 * 28).toISOString(),
          amount: 1000,
          method: 'Banka Havalesi',
          status: 'completed',
        },
        {
          id: '2',
          requestedAt: new Date(Date.now() - 86400000 * 60).toISOString(),
          processedAt: new Date(Date.now() - 86400000 * 58).toISOString(),
          amount: 750,
          method: 'Banka Havalesi',
          status: 'completed',
        },
      ]);

      setPayoutSettings({
        method: 'bank_transfer',
        bankName: 'Ziraat Bankasi',
        iban: 'TR12 0001 0002 0003 0004 0005 00',
        accountHolder: 'Suat Demir',
      });
    } catch (error) {
      toast.error('Veriler yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const savePayoutSettings = async () => {
    setSaving(true);
    try {
      // API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Odeme bilgileri kaydedildi');
    } catch (error) {
      toast.error('Bilgiler kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < summary.minimumPayout) {
      toast.error(`Minimum odeme tutari ${summary.minimumPayout} TL`);
      return;
    }
    if (amount > summary.availableBalance) {
      toast.error('Yetersiz bakiye');
      return;
    }

    setSaving(true);
    try {
      // API call to request payout
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Odeme talebi olusturuldu');
      setPayoutDialog(false);
      setPayoutAmount('');
      loadData();
    } catch (error) {
      toast.error('Odeme talebi olusturulamadi');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (tierId: string) => {
    if (tierId === currentTier) return;

    setUpgrading(true);
    try {
      // TODO: API call to initiate upgrade
      // const response = await api.post('/api/instructor/tier/upgrade', { targetTier: tierId });
      // window.location.href = response.data.checkoutUrl;

      // Mock upgrade for demo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentTier(tierId);
      toast.success(`${tierId} kademesine yukseltildiniz!`);
    } catch (error) {
      toast.error('Yukseltme islemi basarisiz oldu');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Kazanclar ve Odemeler</h2>
            <p className="text-muted-foreground">
              Kazanclarinizi takip edin ve odeme taleplerini yonetin
            </p>
          </div>
          <Button onClick={() => setPayoutDialog(true)} disabled={summary.availableBalance < summary.minimumPayout}>
            <IconCash className="mr-2 h-4 w-4" />
            Odeme Talep Et
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kazanc</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEarnings.toLocaleString()} TL</div>
              <p className="text-xs text-muted-foreground">Tum zamanlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Kazanc</CardTitle>
              <IconClock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingEarnings.toLocaleString()} TL</div>
              <p className="text-xs text-muted-foreground">Islem bekliyor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Odenen Toplam</CardTitle>
              <IconCheck className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.paidEarnings.toLocaleString()} TL</div>
              <p className="text-xs text-muted-foreground">Tamamlanan odemeler</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cekilebilir Bakiye</CardTitle>
              <IconWallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.availableBalance.toLocaleString()} TL</div>
              <p className="text-xs text-muted-foreground">Min. {summary.minimumPayout} TL</p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Info */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconReceipt className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Platform komisyon orani: <strong className="text-foreground">%{(summary.commissionRate * 100).toFixed(0)}</strong>
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Sizin payiniz: <strong className="text-foreground">%{((1 - summary.commissionRate) * 100).toFixed(0)}</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="subscription">
          <TabsList>
            <TabsTrigger value="subscription">
              <IconCrown className="mr-2 h-4 w-4" />
              Abonelik
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <IconCash className="mr-2 h-4 w-4" />
              Kazanclar
            </TabsTrigger>
            <TabsTrigger value="payouts">
              <IconWallet className="mr-2 h-4 w-4" />
              Odeme Gecmisi
            </TabsTrigger>
            <TabsTrigger value="settings">
              <IconBuildingBank className="mr-2 h-4 w-4" />
              Odeme Bilgileri
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="mt-4">
            <div className="space-y-6">
              {/* Current Tier */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <IconCrown className="h-5 w-5 text-primary" />
                        Mevcut Kademeniz
                      </CardTitle>
                      <CardDescription>
                        {currentTier === 'STARTER' ? 'Ucretsiz plan kullaniyorsunuz' :
                         currentTier === 'PRO' ? 'Profesyonel ozelliklerin keyfini cikarin' :
                         'Elit ozelliklerle sinirsiz erisim'}
                      </CardDescription>
                    </div>
                    <Badge className="text-lg px-4 py-2" variant={currentTier === 'STARTER' ? 'secondary' : 'default'}>
                      {currentTier === 'STARTER' ? 'Baslangic' : currentTier === 'PRO' ? 'Profesyonel' : 'Elit'}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Tier Plans */}
              <div className="grid gap-6 md:grid-cols-3">
                {tierPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative ${plan.popular ? 'border-2 border-primary shadow-lg' : ''} ${plan.id === currentTier ? 'ring-2 ring-primary' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          <IconStar className="mr-1 h-3 w-3" />
                          En Populer
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{plan.price === 0 ? 'Ucretsiz' : `${plan.price} TL`}</span>
                        {plan.price > 0 && <span className="text-muted-foreground">/ay</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <IconCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Feature Highlights */}
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <IconBell className={`h-4 w-4 ${plan.limits.canSendNotifications ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <span className={!plan.limits.canSendNotifications ? 'text-muted-foreground line-through' : ''}>
                            Push Bildirimi
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <IconMail className={`h-4 w-4 ${plan.limits.canSendEmails ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <span className={!plan.limits.canSendEmails ? 'text-muted-foreground line-through' : ''}>
                            E-posta Gonderme
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <IconChartBar className={`h-4 w-4 ${plan.limits.maxStudents === -1 ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <span>
                            {plan.limits.maxStudents === -1 ? 'Sinirsiz Ogrenci' : `${plan.limits.maxStudents} Ogrenci`}
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full mt-4"
                        variant={plan.id === currentTier ? 'outline' : plan.popular ? 'default' : 'secondary'}
                        disabled={plan.id === currentTier || upgrading}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {upgrading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {plan.id === currentTier ? 'Mevcut Plan' :
                         tierPlans.findIndex(p => p.id === plan.id) < tierPlans.findIndex(p => p.id === currentTier) ? 'Dusur' :
                         'Yukselt'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Info */}
              <Card className="bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <IconReceipt className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Abonelik Bilgileri:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Abonelikler aylik olarak faturalanir</li>
                        <li>Istediginiz zaman iptal edebilirsiniz</li>
                        <li>Yukseltme aninda gecerli olur</li>
                        <li>Dusurme bir sonraki donemde gecerli olur</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="earnings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Kazanc Gecmisi</CardTitle>
                <CardDescription>Son kazanclarinizin listesi</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tur</TableHead>
                      <TableHead>Aciklama</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.map((earning) => (
                      <TableRow key={earning.id}>
                        <TableCell>
                          {format(new Date(earning.date), 'dd MMM yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{typeLabels[earning.type]}</Badge>
                        </TableCell>
                        <TableCell>{earning.description}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[earning.status]}>
                            {statusLabels[earning.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {earning.amount.toLocaleString()} TL
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Odeme Gecmisi</CardTitle>
                <CardDescription>Gecmis odeme talepleriniz</CardDescription>
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henuz odeme talebiniz yok
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Talep Tarihi</TableHead>
                        <TableHead>Islem Tarihi</TableHead>
                        <TableHead>Yontem</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">Tutar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>
                            {format(new Date(payout.requestedAt), 'dd MMM yyyy', { locale: tr })}
                          </TableCell>
                          <TableCell>
                            {payout.processedAt
                              ? format(new Date(payout.processedAt), 'dd MMM yyyy', { locale: tr })
                              : '-'}
                          </TableCell>
                          <TableCell>{payout.method}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[payout.status]}>
                              {statusLabels[payout.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {payout.amount.toLocaleString()} TL
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBuildingBank className="h-5 w-5" />
                  Banka Bilgileri
                </CardTitle>
                <CardDescription>
                  Odeme almak icin banka bilgilerinizi girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="payoutMethod">Odeme Yontemi</Label>
                  <Select
                    value={payoutSettings.method}
                    onValueChange={(value: 'bank_transfer' | 'stripe') =>
                      setPayoutSettings({ ...payoutSettings, method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Banka Havalesi</SelectItem>
                      <SelectItem value="stripe">Stripe Connect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payoutSettings.method === 'bank_transfer' && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="accountHolder">Hesap Sahibi</Label>
                      <Input
                        id="accountHolder"
                        value={payoutSettings.accountHolder}
                        onChange={(e) =>
                          setPayoutSettings({ ...payoutSettings, accountHolder: e.target.value })
                        }
                        placeholder="Ad Soyad"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bankName">Banka Adi</Label>
                      <Input
                        id="bankName"
                        value={payoutSettings.bankName}
                        onChange={(e) =>
                          setPayoutSettings({ ...payoutSettings, bankName: e.target.value })
                        }
                        placeholder="Ornegin: Ziraat Bankasi"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="iban">IBAN</Label>
                      <Input
                        id="iban"
                        value={payoutSettings.iban}
                        onChange={(e) =>
                          setPayoutSettings({ ...payoutSettings, iban: e.target.value })
                        }
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                      />
                    </div>
                  </>
                )}

                {payoutSettings.method === 'stripe' && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Stripe Connect</p>
                      <p className="text-sm text-muted-foreground">
                        {payoutSettings.stripeConnected
                          ? 'Hesabiniz baglandi'
                          : 'Stripe hesabinizi baglayarak hizli odeme alin'}
                      </p>
                    </div>
                    <Button variant={payoutSettings.stripeConnected ? 'outline' : 'default'}>
                      <IconCreditCard className="mr-2 h-4 w-4" />
                      {payoutSettings.stripeConnected ? 'Baglandi' : 'Stripe Bagla'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={savePayoutSettings} disabled={saving}>
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bilgileri Kaydet
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payout Request Dialog */}
      <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odeme Talep Et</DialogTitle>
            <DialogDescription>
              Cekilebilir bakiyenizden odeme talebinde bulunun
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-sm">Cekilebilir Bakiye</span>
              <span className="font-bold">{summary.availableBalance.toLocaleString()} TL</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payoutAmount">Tutar (TL)</Label>
              <Input
                id="payoutAmount"
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder={`Min. ${summary.minimumPayout} TL`}
                min={summary.minimumPayout}
                max={summary.availableBalance}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum odeme tutari: {summary.minimumPayout} TL. Odemeler 2-5 is gunu icerisinde islenir.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialog(false)}>
              Iptal
            </Button>
            <Button onClick={requestPayout} disabled={saving}>
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Talep Olustur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
