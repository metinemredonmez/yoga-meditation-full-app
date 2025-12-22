'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IconCreditCard, IconReceipt, IconShield, IconUsers, IconServer, IconCloudComputing } from '@tabler/icons-react';
import api from '@/lib/api';
import PageContainer from '@/components/layout/page-container';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
}

interface Subscription {
  id: string;
  status: string;
  plan: SubscriptionPlan | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  interval: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface BillingOverview {
  subscription: Subscription | null;
  invoices: Invoice[];
  nextBillingDate: string | null;
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingData, setBillingData] = useState<BillingOverview | null>(null);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/admin/dashboard/billing/overview');
        setBillingData(response.data);
      } catch (err: any) {
        console.error('Failed to fetch billing data:', err);
        setError(err.message || 'Faturalama bilgileri yuklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      ACTIVE: { variant: 'default', label: 'Aktif' },
      TRIALING: { variant: 'secondary', label: 'Deneme' },
      PAST_DUE: { variant: 'destructive', label: 'Gecikti' },
      CANCELLED: { variant: 'outline', label: 'Iptal' },
      EXPIRED: { variant: 'outline', label: 'Suresi Doldu' },
      PAID: { variant: 'default', label: 'Odendi' },
      PENDING: { variant: 'secondary', label: 'Beklemede' },
      DRAFT: { variant: 'outline', label: 'Taslak' },
      FAILED: { variant: 'destructive', label: 'Basarisiz' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col space-y-6 w-full">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col space-y-6 w-full">
          <div>
            <h1 className="text-2xl font-bold">Faturalama ve Abonelik</h1>
            <p className="text-muted-foreground">Sistem abonelik ve fatura yonetimi</p>
          </div>
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p>{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Tekrar Dene
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const subscription = billingData?.subscription;
  const invoices = billingData?.invoices || [];
  const plan = subscription?.plan;

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-6 w-full">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Faturalama ve Abonelik</h1>
          <p className="text-muted-foreground">Sistem abonelik ve fatura yonetimi</p>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <IconShield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan?.name || 'Plan Yok'}
                    {subscription && getStatusBadge(subscription.status)}
                  </CardTitle>
                  <CardDescription>
                    {plan?.tier === 'ENTERPRISE' ? 'Tam erisim - Tum ozellikler dahil' :
                     plan?.tier === 'PREMIUM' ? 'Premium erisim' :
                     plan?.tier === 'FREE' ? 'Ucretsiz plan' : 'Standart plan'}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                {plan ? (
                  <>
                    <p className="text-2xl font-bold">
                      {subscription?.interval === 'YEARLY'
                        ? formatCurrency(plan.priceYearly, plan.currency)
                        : formatCurrency(plan.priceMonthly, plan.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.interval === 'YEARLY' ? 'yillik' : 'aylik'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">Abonelik Yok</p>
                    <p className="text-sm text-muted-foreground">Plan seciniz</p>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <IconUsers className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-medium">Sinirsiz Kullanici</p>
                  <p className="text-sm text-muted-foreground">Admin, Instructor, User</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <IconServer className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-medium">Sinirsiz Depolama</p>
                  <p className="text-sm text-muted-foreground">Video, Audio, Gorsel</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <IconCloudComputing className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-medium">7/24 Destek</p>
                  <p className="text-sm text-muted-foreground">Oncelikli destek</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Features & Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconReceipt className="h-5 w-5" />
                Plan Ozellikleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(plan?.features as string[] || [
                  'Sinirsiz yoga dersi ve program',
                  'Canli yayin ozelligi',
                  'Podcast yayinlama',
                  'Gamification sistemi',
                  'Gelismis analitik',
                  'API erisimi',
                  'Ozel entegrasyonlar',
                  'Beyaz etiket secenegi'
                ]).map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCreditCard className="h-5 w-5" />
                Fatura Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground mb-1">Fatura Adresi</p>
                <p className="font-medium">Yoga Admin Ltd.</p>
                <p className="text-sm text-muted-foreground">Istanbul, Turkiye</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground mb-1">Odeme Yontemi</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-12 rounded bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <span className="font-medium">**** 4242</span>
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground mb-1">Sonraki Fatura</p>
                <p className="font-medium">
                  {billingData?.nextBillingDate
                    ? formatDate(billingData.nextBillingDate)
                    : 'Belirlenmemis'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        {invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Son Faturalar</CardTitle>
              <CardDescription>Son 5 faturaniz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <IconReceipt className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(invoice.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(Number(invoice.amountDue), invoice.currency)}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Islemler</CardTitle>
            <CardDescription>Abonelik ve fatura islemleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <IconReceipt className="h-4 w-4 mr-2" />
                Faturalari Gor
              </Button>
              <Button variant="outline">
                <IconCreditCard className="h-4 w-4 mr-2" />
                Odeme Yontemini Guncelle
              </Button>
              <Button variant="outline">
                Fatura Adresini Duzenle
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="border-dashed">
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                Faturalama ile ilgili sorulariniz mi var?
              </p>
              <Button variant="link" className="text-indigo-500">
                Destek ekibiyle iletisime gecin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
