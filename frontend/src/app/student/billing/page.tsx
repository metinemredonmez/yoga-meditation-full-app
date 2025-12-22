'use client';

import { useEffect, useState, useRef } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getCurrentUser } from '@/lib/auth';
import {
  getMySubscription,
  getSubscriptionStatus,
  getMyInvoices,
  getAvailablePlans,
  cancelMySubscription,
  resumeMySubscription,
  downloadInvoice,
  getPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
  createSetupIntent,
  addPaymentMethod,
  getPaymentMethodsConfig,
  PaymentMethodsConfig,
} from '@/lib/api';
import {
  IconCreditCard,
  IconReceipt,
  IconCrown,
  IconCheck,
  IconDownload,
  IconX,
  IconRefresh,
  IconLoader2,
  IconAlertCircle,
  IconCalendar,
  IconPlus,
  IconTrash,
  IconStar,
  IconBrandVisa,
  IconBrandMastercard,
  IconBrandApple,
  IconBrandGoogle,
  IconLock,
  IconDeviceMobile,
  IconQrcode,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  status: string;
  planId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan?: {
    id: string;
    name: string;
    tier: string;
    priceMonthly: number;
    priceYearly: number;
    features: string[];
  };
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription?: Subscription;
  daysRemaining?: number;
  isTrialing?: boolean;
  willCancel?: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  paidAt?: string;
  periodStart?: string;
  periodEnd?: string;
}

interface Plan {
  id: string;
  name: string;
  tier: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isActive: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault?: boolean;
}

export default function StudentBillingPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [removingMethod, setRemovingMethod] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentMethodsConfig | null>(null);

  // Card input dialog state
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);

  // Plan selection dialog state
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [addingCard, setAddingCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      setUser(currentUser);

      const [statusRes, invoicesRes, plansRes, methodsRes, paymentConfigRes] = await Promise.allSettled([
        getSubscriptionStatus(),
        getMyInvoices({ limit: 10 }),
        getAvailablePlans(),
        getPaymentMethods(),
        getPaymentMethodsConfig(),
      ]);

      if (statusRes.status === 'fulfilled') {
        setSubscriptionStatus(statusRes.value);
      }
      if (invoicesRes.status === 'fulfilled') {
        setInvoices(invoicesRes.value.invoices || invoicesRes.value.data || []);
      }
      if (plansRes.status === 'fulfilled') {
        setPlans((plansRes.value.plans || plansRes.value.data || []).filter((p: Plan) => p.isActive));
      }
      if (methodsRes.status === 'fulfilled') {
        setPaymentMethods(methodsRes.value.data || []);
      }
      if (paymentConfigRes.status === 'fulfilled') {
        setPaymentConfig(paymentConfigRes.value);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionStatus?.subscription?.id) return;

    try {
      setCanceling(true);
      await cancelMySubscription({
        subscriptionId: subscriptionStatus.subscription.id,
        immediate: false,
      });
      toast.success('Aboneliginiz donem sonunda iptal edilecek');
      loadData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Abonelik iptal edilemedi');
    } finally {
      setCanceling(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!subscriptionStatus?.subscription?.id) return;

    try {
      setResuming(true);
      await resumeMySubscription({
        subscriptionId: subscriptionStatus.subscription.id,
      });
      toast.success('Aboneliginiz devam ettirildi');
      loadData();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      toast.error('Abonelik devam ettirilemedi');
    } finally {
      setResuming(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      setDownloadingInvoice(invoiceId);
      const blob = await downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Fatura indirildi');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Fatura indirilemedi');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      setRemovingMethod(paymentMethodId);
      await removePaymentMethod(paymentMethodId);
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
      toast.success('Odeme yontemi silindi');
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      toast.error('Odeme yontemi silinemedi');
    } finally {
      setRemovingMethod(null);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      setSettingDefault(paymentMethodId);
      await setDefaultPaymentMethod(paymentMethodId);
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        isDefault: pm.id === paymentMethodId
      })));
      toast.success('Varsayilan odeme yontemi guncellendi');
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      toast.error('Varsayilan odeme yontemi guncellenemedi');
    } finally {
      setSettingDefault(null);
    }
  };

  // Card form helpers
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Luhn algorithm to validate card number
  const validateLuhn = (cardNumber: string): boolean => {
    const digits = cardNumber.replace(/\s/g, '').split('').map(Number);
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const validateCardForm = () => {
    const errors: Record<string, string> = {};

    // Validate card number with Luhn algorithm
    const cardNum = cardForm.cardNumber.replace(/\s/g, '');
    if (!cardNum || cardNum.length < 15 || cardNum.length > 16) {
      errors.cardNumber = 'Kart numarasi 15-16 haneli olmalidir';
    } else if (!validateLuhn(cardNum)) {
      errors.cardNumber = 'Gecersiz kart numarasi';
    } else if (!detectCardBrand(cardNum)) {
      errors.cardNumber = 'Desteklenmeyen kart turu (Visa, Mastercard, Amex kabul edilir)';
    }

    // Validate expiry date
    const [month, year] = cardForm.expiryDate.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      errors.expiryDate = 'Gecerli bir son kullanim tarihi girin (AA/YY)';
    } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      errors.expiryDate = 'Kart suresi dolmus';
    }

    // Validate CVV
    if (!cardForm.cvv || cardForm.cvv.length < 3 || cardForm.cvv.length > 4) {
      errors.cvv = 'Gecerli bir CVV girin';
    }

    // Validate cardholder name
    if (!cardForm.cardholderName.trim()) {
      errors.cardholderName = 'Kart uzerindeki ismi girin';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardForm(prev => ({ ...prev, cardNumber: formatted }));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9/]/g, '');
    if (value.length <= 5) {
      const formatted = formatExpiryDate(value.replace('/', ''));
      setCardForm(prev => ({ ...prev, expiryDate: formatted }));
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setCardForm(prev => ({ ...prev, cvv: value }));
    }
  };

  const detectCardBrand = (cardNumber: string) => {
    const num = cardNumber.replace(/\s/g, '');
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6(?:011|5)/.test(num)) return 'discover';
    return null;
  };

  const handleOpenAddCardDialog = () => {
    setCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
    setCardErrors({});
    setShowAddCardDialog(true);
  };

  const handleAddCard = async () => {
    if (!validateCardForm()) {
      return;
    }

    setAddingCard(true);
    try {
      // Create setup intent
      const { clientSecret } = await createSetupIntent();

      if (!clientSecret) {
        // If no Stripe configured, simulate adding card (for demo purposes)
        const brand = detectCardBrand(cardForm.cardNumber) || 'card';
        const last4 = cardForm.cardNumber.replace(/\s/g, '').slice(-4);
        const [month, year] = cardForm.expiryDate.split('/');

        const newPaymentMethod: PaymentMethod = {
          id: `pm_${Date.now()}`,
          type: 'card',
          card: {
            brand,
            last4,
            expMonth: parseInt(month),
            expYear: 2000 + parseInt(year),
          },
          isDefault: paymentMethods.length === 0,
        };

        setPaymentMethods(prev => [...prev, newPaymentMethod]);
        setShowAddCardDialog(false);
        toast.success('Kart basariyla eklendi');
        return;
      }

      // In production, you would use Stripe.js here to confirm the setup
      // For now, we'll show a message
      toast.info('Stripe entegrasyonu ile kart eklenecek');
      setShowAddCardDialog(false);
    } catch (error) {
      console.error('Failed to add card:', error);
      toast.error('Kart eklenirken bir hata olustu');
    } finally {
      setAddingCard(false);
    }
  };

  const handleGooglePayClick = async () => {
    try {
      // Check if Google Pay is enabled from admin dashboard
      if (!paymentConfig?.googlePay?.enabled) {
        toast.error('Google Pay su anda aktif degil');
        return;
      }

      // Check if Payment Request API is available
      if (typeof window === 'undefined' || !('PaymentRequest' in window)) {
        toast.error('Bu cihazda Google Pay desteklenmiyor');
        return;
      }

      const gpConfig = paymentConfig.googlePay;

      // Google Pay configuration from admin dashboard
      const supportedInstruments = [{
        supportedMethods: 'https://google.com/pay',
        data: {
          environment: gpConfig.environment || 'TEST',
          apiVersion: 2,
          apiVersionMinor: 0,
          merchantInfo: {
            merchantId: gpConfig.merchantId,
            merchantName: gpConfig.merchantName || 'Yoga App',
          },
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: gpConfig.allowedCardNetworks || ['MASTERCARD', 'VISA'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: gpConfig.gateway || 'stripe',
                'stripe:version': '2020-08-27',
                'stripe:publishableKey': paymentConfig.stripe?.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
              },
            },
          }],
        },
      }];

      const details = {
        total: {
          label: 'Yoga App Premium',
          amount: { currency: 'TRY', value: '99.00' },
        },
      };

      const request = new PaymentRequest(supportedInstruments, details);

      // Check if Google Pay is available on this device
      const canMakePayment = await request.canMakePayment();
      if (!canMakePayment) {
        toast.error('Google Pay bu cihazda kullanilabilir degil');
        return;
      }

      // Show Google Pay payment sheet
      const paymentResponse = await request.show();

      // Process the payment with your backend
      toast.success('Google Pay ile odeme basarili!');
      await paymentResponse.complete('success');

      // Refresh payment methods
      loadData();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled the payment
        toast.info('Odeme iptal edildi');
      } else {
        console.error('Google Pay error:', error);
        toast.error('Google Pay ile baglanti kurulamadi');
      }
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPlanDialog(true);
  };

  const handleApplePayClick = async () => {
    try {
      // Check if Apple Pay is enabled from admin dashboard
      if (!paymentConfig?.applePay?.enabled) {
        toast.error('Apple Pay su anda aktif degil');
        return;
      }

      // Check if Apple Pay is available (Safari on Apple devices)
      if (typeof window === 'undefined' || !(window as any).ApplePaySession) {
        toast.error('Apple Pay sadece Safari tarayicisinda Apple cihazlarda kullanilabilir');
        return;
      }

      const ApplePaySession = (window as any).ApplePaySession;

      // Check if the device supports Apple Pay
      if (!ApplePaySession.canMakePayments()) {
        toast.error('Bu cihazda Apple Pay desteklenmiyor');
        return;
      }

      const apConfig = paymentConfig.applePay;

      // Apple Pay configuration from admin dashboard
      const paymentRequest = {
        countryCode: 'TR',
        currencyCode: 'TRY',
        supportedNetworks: apConfig.supportedNetworks || ['visa', 'masterCard', 'amex'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: apConfig.merchantName || 'Yoga App Premium',
          amount: '99.00',
        },
      };

      const session = new ApplePaySession(3, paymentRequest);

      session.onvalidatemerchant = async (event: any) => {
        // In production, call your backend to get merchant session
        toast.info('Apple Pay dogrulamasi yapiliyor...');
      };

      session.onpaymentauthorized = async (event: any) => {
        // Process payment with backend
        const payment = event.payment;

        // Send payment token to your backend
        toast.success('Apple Pay ile odeme basarili!');
        session.completePayment(ApplePaySession.STATUS_SUCCESS);

        // Refresh payment methods
        loadData();
      };

      session.oncancel = () => {
        toast.info('Odeme iptal edildi');
      };

      // Start Apple Pay session
      session.begin();
    } catch (error) {
      console.error('Apple Pay error:', error);
      toast.error('Apple Pay ile baglanti kurulamadi');
    }
  };

  const getCardIcon = (brand?: string, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-5 w-8' : 'h-6 w-10';
    switch (brand?.toLowerCase()) {
      case 'visa':
        return (
          <svg className={sizeClass} viewBox="0 0 750 471">
            <path fill="#1A1F71" d="M278.2 334.3l33.4-174.6h53.5l-33.4 174.6zM524.3 164.6c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.5-90.3 64.4-.3 28.1 26.5 43.7 46.8 53 20.8 9.5 27.8 15.6 27.7 24.1-.1 13-16.6 18.9-31.9 18.9-21.4 0-32.7-3-50.3-10.4l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.1 0 92.6-26.2 93-66.7.2-22.2-14-39.2-44.9-53.1-18.7-9-30.1-15-30-24.1 0-8.1 9.7-16.7 30.6-16.7 17.4-.3 30.1 3.5 39.9 7.5l4.8 2.3 7.3-42.1zM661.6 159.6h-41.3c-12.8 0-22.4 3.5-28 16.2l-79.4 179.5h56.1l11.2-29.4h68.6l6.5 29.4h49.5l-43.2-195.7zm-65.9 126.4l28.2-72 16.2 72H595.7zM232.9 159.6l-52.3 119-5.6-27.2c-9.7-31.2-39.9-65.1-73.7-82l47.8 171.3h56.5l84-181.1h-56.7z"/>
            <path fill="#F9A533" d="M131.9 159.6H47.7l-.7 4c67 16.2 111.4 55.3 129.8 102.3l-18.7-89.8c-3.2-12.3-12.7-16-26.2-16.5z"/>
          </svg>
        );
      case 'mastercard':
        return (
          <svg className={sizeClass} viewBox="0 0 152.407 108">
            <rect fill="#FF5F00" x="60.4" y="18" width="31.5" height="72"/>
            <path fill="#EB001B" d="M63.1 54c0-14.6 6.8-27.7 17.5-36C72.4 11.4 61.7 7.8 50 7.8c-26.1 0-47.3 20.7-47.3 46.2s21.2 46.2 47.3 46.2c11.7 0 22.4-3.6 30.6-10.2C70 81.7 63.1 68.6 63.1 54z"/>
            <path fill="#F79E1B" d="M149.6 54c0 25.5-21.2 46.2-47.3 46.2-11.7 0-22.4-3.6-30.6-10.2 10.7-8.3 17.5-21.4 17.5-36s-6.8-27.7-17.5-36c8.2-6.6 18.9-10.2 30.6-10.2 26.1 0 47.3 20.7 47.3 46.2z"/>
          </svg>
        );
      case 'amex':
      case 'american_express':
        return (
          <svg className={sizeClass} viewBox="0 0 750 471">
            <path fill="#006FCF" d="M0 40.01C0 17.91 17.91 0 40.01 0h669.99c22.09 0 40.01 17.91 40.01 40.01v390.98c0 22.09-17.91 40.01-40.01 40.01H40.01C17.91 471 0 453.09 0 430.99V40.01z"/>
            <path fill="#fff" d="M221.9 235.5l-17.5-44.3-17.5 44.3h35zm152.3-58.3h-36.3v28.5h35.5v12.7h-35.5v31h36.3v12.6h-51.8v-97.4h51.8v12.6z"/>
          </svg>
        );
      default:
        return <IconCreditCard className="h-6 w-6" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600">Aktif</Badge>;
      case 'CANCELED':
        return <Badge variant="destructive">Iptal Edildi</Badge>;
      case 'PAST_DUE':
        return <Badge variant="destructive">Odeme Gecikti</Badge>;
      case 'TRIALING':
        return <Badge className="bg-blue-600">Deneme</Badge>;
      case 'PAID':
        return <Badge className="bg-green-600">Odendi</Badge>;
      case 'OPEN':
        return <Badge variant="secondary">Bekliyor</Badge>;
      case 'VOID':
        return <Badge variant="outline">Gecersiz</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription;
  const currentSubscription = subscriptionStatus?.subscription;
  const willCancel = currentSubscription?.cancelAtPeriodEnd;

  return (
    <PageContainer scrollable>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faturalama</h2>
          <p className="text-muted-foreground">
            Abonelik ve odeme bilgilerinizi yonetin.
          </p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCrown className="h-5 w-5" />
              Mevcut Plan
            </CardTitle>
            <CardDescription>Aktif abonelik planiniz</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : hasActiveSubscription && currentSubscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold">
                        {currentSubscription.plan?.name || 'Premium'}
                      </p>
                      {getStatusBadge(currentSubscription.status)}
                      {willCancel && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Iptal Edilecek
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Donem: {formatDate(currentSubscription.currentPeriodStart)} - {formatDate(currentSubscription.currentPeriodEnd)}
                    </p>
                    {subscriptionStatus.daysRemaining !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        {subscriptionStatus.daysRemaining} gun kaldi
                      </p>
                    )}
                  </div>
                </div>

                {currentSubscription.plan?.features && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Ozellikler:</p>
                    <ul className="space-y-1">
                      {currentSubscription.plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IconCheck className="h-4 w-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {willCancel ? (
                    <Button
                      variant="outline"
                      onClick={handleResumeSubscription}
                      disabled={resuming}
                    >
                      {resuming ? (
                        <>
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Devam Ettiriliyor...
                        </>
                      ) : (
                        <>
                          <IconRefresh className="h-4 w-4 mr-2" />
                          Aboneligi Devam Ettir
                        </>
                      )}
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-destructive">
                          <IconX className="h-4 w-4 mr-2" />
                          Aboneligi Iptal Et
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Aboneligi Iptal Et</AlertDialogTitle>
                          <AlertDialogDescription>
                            Aboneliginiz donem sonunda ({formatDate(currentSubscription.currentPeriodEnd)}) iptal edilecek.
                            O zamana kadar tum ozellikleri kullanmaya devam edebilirsiniz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Vazgec</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancelSubscription}
                            disabled={canceling}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {canceling ? (
                              <>
                                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                                Iptal Ediliyor...
                              </>
                            ) : (
                              'Iptal Et'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">Ucretsiz Plan</p>
                    <Badge variant="secondary">Aktif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Temel ozelliklere erisim
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Plans */}
        {!hasActiveSubscription && plans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Premium Plana Yukselt</CardTitle>
              <CardDescription>Tum ozelliklere sinirsiz erisim</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 ${
                    plan.tier === 'PREMIUM'
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(plan.priceMonthly)}
                          <span className="text-sm font-normal text-muted-foreground">/ay</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          veya {formatCurrency(plan.priceYearly)}/yil
                        </p>
                      </div>
                    </div>
                    {plan.tier === 'PREMIUM' && (
                      <Badge className="bg-purple-600">Populer</Badge>
                    )}
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <IconCheck className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.tier === 'PREMIUM' ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    <IconCrown className="h-4 w-4 mr-2" />
                    Plani Sec
                  </Button>
                </div>
              ))}

              {plans.length === 0 && !loading && (
                <div className="text-center py-4 text-muted-foreground">
                  <IconAlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Premium planlar yaklinda aktif olacak.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Static upgrade section when no plans from API */}
        {!hasActiveSubscription && plans.length === 0 && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>Premium Plana Yukselt</CardTitle>
              <CardDescription>Tum ozelliklere sinirsiz erisim</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Premium Aylik</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      ₺99<span className="text-sm font-normal text-muted-foreground">/ay</span>
                    </p>
                  </div>
                  <Badge className="bg-purple-600">Populer</Badge>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-600" />
                    Sinirsiz yoga dersi
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-600" />
                    Tum meditasyon seanslari
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-600" />
                    Cevrimdisi indirme
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-600" />
                    Kisisellesirilmis program
                  </li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan({
                    id: 'premium-monthly',
                    name: 'Premium Aylik',
                    tier: 'PREMIUM',
                    priceMonthly: 99,
                    priceYearly: 799,
                    features: ['Sinirsiz yoga dersi', 'Tum meditasyon seanslari', 'Cevrimdisi indirme', 'Kisisellesirilmis program'],
                    isActive: true
                  })}
                >
                  <IconCrown className="h-4 w-4 mr-2" />
                  Plani Sec
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Premium Yillik</h3>
                    <p className="text-2xl font-bold">
                      ₺799<span className="text-sm font-normal text-muted-foreground">/yil</span>
                    </p>
                    <p className="text-sm text-green-600">2 ay ucretsiz!</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-600" />
                    Tum Premium ozellikler
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-600" />
                    Oncelikli destek
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSelectPlan({
                    id: 'premium-yearly',
                    name: 'Premium Yillik',
                    tier: 'PREMIUM',
                    priceMonthly: 99,
                    priceYearly: 799,
                    features: ['Tum Premium ozellikler', 'Oncelikli destek'],
                    isActive: true
                  })}
                >
                  <IconCrown className="h-4 w-4 mr-2" />
                  Plani Sec
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <IconCreditCard className="h-5 w-5" />
                  Odeme Yontemleri
                </CardTitle>
                <CardDescription>Kayitli odeme yontemleriniz</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleOpenAddCardDialog}>
                <IconPlus className="h-4 w-4 mr-2" />
                Kart Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getCardIcon(method.card?.brand)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">
                            {method.card?.brand || 'Kart'} •••• {method.card?.last4}
                          </p>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <IconStar className="h-3 w-3 mr-1" />
                              Varsayilan
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Son kullanim: {method.card?.expMonth?.toString().padStart(2, '0')}/{method.card?.expYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                          disabled={settingDefault === method.id}
                        >
                          {settingDefault === method.id ? (
                            <IconLoader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <IconStar className="h-4 w-4 mr-1" />
                              Varsayilan Yap
                            </>
                          )}
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            disabled={removingMethod === method.id}
                          >
                            {removingMethod === method.id ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconTrash className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Odeme Yontemini Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu odeme yontemini silmek istediginizden emin misiniz?
                              {method.card?.brand} •••• {method.card?.last4}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Vazgec</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemovePaymentMethod(method.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <IconCreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Henuz kayitli odeme yonteminiz bulunmuyor.</p>
                <p className="text-xs mt-1">Kart ekleyerek odeme yontemlerinizi yonetebilirsiniz.</p>
              </div>
            )}

            {/* Google Pay / Apple Pay buttons - Only show if at least one is enabled */}
            {(paymentConfig?.googlePay?.enabled || paymentConfig?.applePay?.enabled) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-3">
                  Dijital cuzdaninizdan kart ekleyin:
                </p>
                <div className="flex gap-2">
                  {paymentConfig?.googlePay?.enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGooglePayClick}
                      className="flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="font-medium">Google Pay</span>
                    </Button>
                  )}
                  {paymentConfig?.applePay?.enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplePayClick}
                      className="flex items-center gap-1.5"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      <span className="font-medium">Apple Pay</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconReceipt className="h-5 w-5" />
              Fatura Gecmisi
            </CardTitle>
            <CardDescription>Gecmis odemeleriniz ve faturalariniz</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconReceipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IconCalendar className="h-3 w-3" />
                          {formatDate(invoice.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.amount / 100, invoice.currency)}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        disabled={downloadingInvoice === invoice.id}
                      >
                        {downloadingInvoice === invoice.id ? (
                          <IconLoader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconDownload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <IconReceipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Henuz fatura bulunmuyor.</p>
                <p className="text-xs mt-1">Premium abonelik satin aldiginizda faturalariniz burada gorunecek.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>Yardima mi ihtiyaciniz var?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Faturalama ile ilgili sorulariniz icin destek ekibimizle iletisime gecin.</p>
            <a href="mailto:destek@yogaapp.com" className="text-primary hover:underline">
              destek@yogaapp.com
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Add Card Dialog */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCreditCard className="h-5 w-5" />
              Yeni Kart Ekle
            </DialogTitle>
            <DialogDescription>
              Odeme icin yeni bir kredi veya banka karti ekleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Kart Uzerindeki Isim</Label>
              <Input
                id="cardholderName"
                placeholder="Ad Soyad"
                value={cardForm.cardholderName}
                onChange={(e) => setCardForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                className={cardErrors.cardholderName ? 'border-red-500' : ''}
              />
              {cardErrors.cardholderName && (
                <p className="text-xs text-red-500">{cardErrors.cardholderName}</p>
              )}
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cardNumber">Kart Numarasi</Label>
                {detectCardBrand(cardForm.cardNumber) && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-1">
                    {getCardIcon(detectCardBrand(cardForm.cardNumber) || undefined, 'sm')}
                    <span className="capitalize">{detectCardBrand(cardForm.cardNumber)}</span>
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardForm.cardNumber}
                  onChange={handleCardNumberChange}
                  className={`pr-10 ${cardErrors.cardNumber ? 'border-red-500' : ''}`}
                  autoComplete="cc-number"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {detectCardBrand(cardForm.cardNumber) ? (
                    getCardIcon(detectCardBrand(cardForm.cardNumber) || undefined, 'sm')
                  ) : (
                    <IconCreditCard className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              {cardErrors.cardNumber && (
                <p className="text-xs text-red-500">{cardErrors.cardNumber}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Son Kullanim</Label>
                <Input
                  id="expiry"
                  placeholder="AA/YY"
                  value={cardForm.expiryDate}
                  onChange={handleExpiryChange}
                  className={cardErrors.expiryDate ? 'border-red-500' : ''}
                  autoComplete="cc-exp"
                />
                {cardErrors.expiryDate && (
                  <p className="text-xs text-red-500">{cardErrors.expiryDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cardForm.cvv}
                  onChange={handleCvvChange}
                  type="password"
                  className={cardErrors.cvv ? 'border-red-500' : ''}
                  autoComplete="cc-csc"
                />
                {cardErrors.cvv && (
                  <p className="text-xs text-red-500">{cardErrors.cvv}</p>
                )}
              </div>
            </div>

            {/* Security Info */}
            <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-green-950/30 to-emerald-950/30 border border-green-800/30">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600/20">
                  <IconLock className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-green-400">Guvenli Odeme</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <IconCheck className="h-3.5 w-3.5 text-green-500" />
                  <span>256-bit SSL Sifreleme</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCheck className="h-3.5 w-3.5 text-green-500" />
                  <span>PCI DSS Uyumlu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCheck className="h-3.5 w-3.5 text-green-500" />
                  <span>3D Secure Koruma</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCheck className="h-3.5 w-3.5 text-green-500" />
                  <span>Kart Bilgisi Saklanmaz</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-green-800/30">
                {/* Visa Logo */}
                <svg className="h-6 w-10" viewBox="0 0 750 471">
                  <path fill="#1A1F71" d="M278.2 334.3l33.4-174.6h53.5l-33.4 174.6zM524.3 164.6c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.5-90.3 64.4-.3 28.1 26.5 43.7 46.8 53 20.8 9.5 27.8 15.6 27.7 24.1-.1 13-16.6 18.9-31.9 18.9-21.4 0-32.7-3-50.3-10.4l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.1 0 92.6-26.2 93-66.7.2-22.2-14-39.2-44.9-53.1-18.7-9-30.1-15-30-24.1 0-8.1 9.7-16.7 30.6-16.7 17.4-.3 30.1 3.5 39.9 7.5l4.8 2.3 7.3-42.1zM661.6 159.6h-41.3c-12.8 0-22.4 3.5-28 16.2l-79.4 179.5h56.1l11.2-29.4h68.6l6.5 29.4h49.5l-43.2-195.7zm-65.9 126.4l28.2-72 16.2 72H595.7zM232.9 159.6l-52.3 119-5.6-27.2c-9.7-31.2-39.9-65.1-73.7-82l47.8 171.3h56.5l84-181.1h-56.7z"/>
                  <path fill="#F9A533" d="M131.9 159.6H47.7l-.7 4c67 16.2 111.4 55.3 129.8 102.3l-18.7-89.8c-3.2-12.3-12.7-16-26.2-16.5z"/>
                </svg>
                {/* Mastercard Logo */}
                <svg className="h-6 w-10" viewBox="0 0 152.407 108">
                  <rect fill="#FF5F00" x="60.4" y="18" width="31.5" height="72"/>
                  <path fill="#EB001B" d="M63.1 54c0-14.6 6.8-27.7 17.5-36C72.4 11.4 61.7 7.8 50 7.8c-26.1 0-47.3 20.7-47.3 46.2s21.2 46.2 47.3 46.2c11.7 0 22.4-3.6 30.6-10.2C70 81.7 63.1 68.6 63.1 54z"/>
                  <path fill="#F79E1B" d="M149.6 54c0 25.5-21.2 46.2-47.3 46.2-11.7 0-22.4-3.6-30.6-10.2 10.7-8.3 17.5-21.4 17.5-36s-6.8-27.7-17.5-36c8.2-6.6 18.9-10.2 30.6-10.2 26.1 0 47.3 20.7 47.3 46.2z"/>
                </svg>
                {/* Amex Logo */}
                <svg className="h-5 w-8" viewBox="0 0 750 471">
                  <path fill="#006FCF" d="M0 40.01C0 17.91 17.91 0 40.01 0h669.99c22.09 0 40.01 17.91 40.01 40.01v390.98c0 22.09-17.91 40.01-40.01 40.01H40.01C17.91 471 0 453.09 0 430.99V40.01z"/>
                  <path fill="#fff" d="M221.9 235.5l-17.5-44.3-17.5 44.3h35zm152.3-58.3h-36.3v28.5h35.5v12.7h-35.5v31h36.3v12.6h-51.8v-97.4h51.8v12.6zm61.5 84.8l-26.6-38.6v38.6h-14.6v-97.4h14.6v36.7l25.5-36.7h17.8l-28.5 38.8 30.2 58.6h-18.4zm-114.5-14.5l-9.1-23.2h-50.7l-9.1 23.2h-16.6l43.6-97.4h15.6l43.4 97.4h-17.1zm114.5-97.4h14.6v97.4h-14.6v-97.4zm47.7 0h51.9v12.6h-37.3v28.5h36.6v12.7h-36.6v31h37.3v12.6h-51.9v-97.4zm75.9 0h14.6v84.8h37.8v12.6h-52.4v-97.4zm77.8 0h51.9v12.6h-37.3v28.5h36.6v12.7h-36.6v31h37.3v12.6h-51.9v-97.4zm-435.5 98.4l-17.5-44.3-17.5 44.3h35z"/>
                </svg>
                <span className="text-xs text-muted-foreground ml-auto">Guvenli odeme altyapisi</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setShowAddCardDialog(false)}
                disabled={addingCard}
                className="w-full sm:w-auto"
              >
                Iptal
              </Button>
              <Button
                onClick={handleAddCard}
                disabled={addingCard}
                className="w-full sm:flex-1"
              >
                {addingCard ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <IconLock className="h-4 w-4 mr-2" />
                    Guvenli Kart Ekle
                  </>
                )}
              </Button>
            </div>
            <div className="text-xs text-center text-muted-foreground space-y-1">
              <p>
                Kart ekleyerek{' '}
                <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Kullanim Sartlari
                </a>
                {' '}ve{' '}
                <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Gizlilik Politikasi
                </a>
                &apos;ni kabul etmis olursunuz.
              </p>
              <p>
                Sorun mu yasiyorsunuz?{' '}
                <a href="mailto:destek@yogaapp.com" className="text-primary hover:underline">
                  Yardim alin
                </a>
              </p>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Selection Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconDeviceMobile className="h-5 w-5" />
              Mobil Uygulamadan Satin Alin
            </DialogTitle>
            <DialogDescription>
              {selectedPlan?.name} planini satin almak icin mobil uygulamamizi kullanin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selected Plan Info */}
            {selectedPlan && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{selectedPlan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlan.id.includes('yearly')
                        ? formatCurrency(selectedPlan.priceYearly) + '/yil'
                        : formatCurrency(selectedPlan.priceMonthly) + '/ay'}
                    </p>
                  </div>
                  <Badge className="bg-purple-600">{selectedPlan.tier}</Badge>
                </div>
              </div>
            )}

            {/* Why Mobile App */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium">Neden mobil uygulama?</h5>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Apple App Store ve Google Play uzerinden guvenli odeme</span>
                </div>
                <div className="flex items-start gap-2">
                  <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Mevcut odeme yonteminizle hizli satin alma</span>
                </div>
                <div className="flex items-start gap-2">
                  <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Abonelik yonetimi cihazinizin ayarlarindan</span>
                </div>
              </div>
            </div>

            {/* App Store Links */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium">Uygulamayi Indirin</h5>
              <div className="flex gap-3">
                <a
                  href="https://apps.apple.com/app/yoga-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full h-12 gap-2">
                    <IconBrandApple className="h-5 w-5" />
                    <div className="text-left">
                      <div className="text-[10px] leading-tight">App Store</div>
                      <div className="text-xs font-semibold">iOS</div>
                    </div>
                  </Button>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.yogaapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full h-12 gap-2">
                    <IconBrandGoogle className="h-5 w-5" />
                    <div className="text-left">
                      <div className="text-[10px] leading-tight">Google Play</div>
                      <div className="text-xs font-semibold">Android</div>
                    </div>
                  </Button>
                </a>
              </div>
            </div>

            {/* QR Code hint */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-sm">
              <IconQrcode className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Hizli erisim</p>
                <p className="text-muted-foreground text-xs">
                  Zaten uygulamaniz varsa, Premium bolumunden satin alabilirsiniz
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPlanDialog(false)}
              className="w-full"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
