import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import crypto from 'crypto';

// ============================================
// Types
// ============================================

interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  description: string;
  cardToken?: string;
  card?: {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
  };
  installment?: number;
  metadata?: Record<string, string>;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  cardAssociation?: string;
  cardFamily?: string;
  binNumber?: string;
  lastFourDigits?: string;
}

interface RefundRequest {
  paymentTransactionId: string;
  amount?: number; // If not provided, full refund
  reason?: string;
}

interface SubscriptionRequest {
  userId: string;
  planId: string;
  cardToken: string;
}

// ============================================
// Iyzico Client
// ============================================

class IyzicoClient {
  private config: IyzicoConfig;

  constructor() {
    this.config = {
      apiKey: config.IYZICO_API_KEY || '',
      secretKey: config.IYZICO_SECRET_KEY || '',
      baseUrl: 'https://sandbox-api.iyzipay.com' // TODO: Add IYZICO_BASE_URL to config
    };
  }

  private generateAuthorizationHeader(request: Record<string, unknown>): string {
    const randomKey = crypto.randomBytes(8).toString('hex');
    const payload = JSON.stringify(request);
    const hashString = this.config.apiKey + randomKey + this.config.secretKey + payload;
    const hash = crypto.createHash('sha1').update(hashString).digest('base64');

    return `IYZWS ${this.config.apiKey}:${hash}`;
  }

  private generatePKIString(request: Record<string, unknown>): string {
    // Convert request object to PKI string format
    const formatValue = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return '[' + value.map(v => formatValue(v)).join(', ') + ']';
        }
        return '[' + Object.entries(value).map(([k, v]) => `${k}=${formatValue(v)}`).join(', ') + ']';
      }
      return String(value);
    };

    return '[' + Object.entries(request).map(([k, v]) => `${k}=${formatValue(v)}`).join(', ') + ']';
  }

  async request<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const randomString = crypto.randomBytes(8).toString('hex');

    const requestData = {
      ...data,
      locale: 'tr',
      conversationId: randomString
    };

    const pkiString = this.generatePKIString(requestData);
    const hashString = this.config.apiKey + randomString + this.config.secretKey + pkiString;
    const hash = crypto.createHash('sha1').update(hashString).digest('base64');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `IYZWS ${this.config.apiKey}:${hash}`,
          'x-iyzi-rnd': randomString
        },
        body: JSON.stringify(requestData)
      });

      const result: any = await response.json();

      if (result.status !== 'success') {
        logger.error({ endpoint, errorCode: result.errorCode, errorMessage: result.errorMessage }, 'Iyzico API error');
      }

      return result as T;
    } catch (error) {
      logger.error({ err: error, endpoint }, 'Iyzico request failed');
      throw error;
    }
  }
}

const iyzicoClient = new IyzicoClient();

// ============================================
// Payment Functions
// ============================================

export async function createPayment(request: PaymentRequest): Promise<PaymentResult> {
  const user = await prisma.users.findUnique({
    where: { id: request.userId },
    select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true }
  });

  if (!user) {
    return { success: false, status: 'error', errorMessage: 'User not found' };
  }

  const basketId = `basket-${Date.now()}`;
  const conversationId = `conv-${Date.now()}`;

  const paymentRequest: Record<string, unknown> = {
    locale: 'tr',
    conversationId,
    price: request.amount.toString(),
    paidPrice: request.amount.toString(),
    currency: request.currency || 'TRY',
    installment: request.installment || 1,
    basketId,
    paymentChannel: 'WEB',
    paymentGroup: 'PRODUCT',
    buyer: {
      id: user.id,
      name: user.firstName || 'User',
      surname: user.lastName || 'User',
      email: user.email,
      identityNumber: '11111111111', // Should be real in production
      registrationAddress: 'Istanbul, Turkey',
      ip: '85.34.78.112', // Should be real user IP
      city: 'Istanbul',
      country: 'Turkey'
    },
    shippingAddress: {
      contactName: `${user.firstName} ${user.lastName}`,
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Istanbul, Turkey'
    },
    billingAddress: {
      contactName: `${user.firstName} ${user.lastName}`,
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Istanbul, Turkey'
    },
    basketItems: [
      {
        id: 'subscription',
        name: request.description,
        category1: 'Subscription',
        itemType: 'VIRTUAL',
        price: request.amount.toString()
      }
    ]
  };

  // Add card info
  if (request.cardToken) {
    paymentRequest.paymentCard = {
      cardToken: request.cardToken
    };
  } else if (request.card) {
    paymentRequest.paymentCard = {
      cardHolderName: request.card.cardHolderName,
      cardNumber: request.card.cardNumber,
      expireMonth: request.card.expireMonth,
      expireYear: request.card.expireYear,
      cvc: request.card.cvc,
      registerCard: 0 // Don't save card by default
    };
  }

  try {
    const response = await iyzicoClient.request<{
      status: string;
      paymentId: string;
      paymentTransactionId: string;
      errorCode?: string;
      errorMessage?: string;
      cardAssociation?: string;
      cardFamily?: string;
      binNumber?: string;
      lastFourDigits?: string;
    }>('/payment/auth', paymentRequest);

    if (response.status === 'success') {
      // Save payment to database
      await prisma.payments.create({
        data: {
          userId: request.userId,
          amount: request.amount,
          currency: request.currency || 'TRY',
          status: 'COMPLETED',
          provider: 'IYZICO',
          transactionId: response.paymentTransactionId,
          metadata: {
            paymentId: response.paymentId,
            transactionId: response.paymentTransactionId,
            ...request.metadata
          }
        }
      });

      return {
        success: true,
        paymentId: response.paymentId,
        transactionId: response.paymentTransactionId,
        status: 'completed',
        cardAssociation: response.cardAssociation,
        cardFamily: response.cardFamily,
        binNumber: response.binNumber,
        lastFourDigits: response.lastFourDigits
      };
    }

    return {
      success: false,
      status: 'failed',
      errorCode: response.errorCode,
      errorMessage: response.errorMessage
    };
  } catch (error) {
    logger.error({ err: error, userId: request.userId }, 'Iyzico payment failed');
    return {
      success: false,
      status: 'error',
      errorMessage: (error as Error).message
    };
  }
}

export async function refundPayment(request: RefundRequest): Promise<{
  success: boolean;
  refundId?: string;
  errorMessage?: string;
}> {
  const refundRequest = {
    locale: 'tr',
    conversationId: `refund-${Date.now()}`,
    paymentTransactionId: request.paymentTransactionId,
    price: request.amount?.toString()
  };

  try {
    const response = await iyzicoClient.request<{
      status: string;
      paymentTransactionId: string;
      errorCode?: string;
      errorMessage?: string;
    }>('/payment/refund', refundRequest);

    if (response.status === 'success') {
      // Update payment status in database
      await prisma.payments.updateMany({
        where: {
          metadata: {
            path: ['transactionId'],
            equals: request.paymentTransactionId
          }
        },
        data: {
          status: request.amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED'
        }
      });

      return {
        success: true,
        refundId: response.paymentTransactionId
      };
    }

    return {
      success: false,
      errorMessage: response.errorMessage
    };
  } catch (error) {
    logger.error({ err: error }, 'Iyzico refund failed');
    return {
      success: false,
      errorMessage: (error as Error).message
    };
  }
}

// ============================================
// Card Management
// ============================================

export async function saveCard(
  userId: string,
  card: {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
  }
): Promise<{ success: boolean; cardToken?: string; errorMessage?: string }> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) {
    return { success: false, errorMessage: 'User not found' };
  }

  const request = {
    locale: 'tr',
    conversationId: `card-${Date.now()}`,
    email: user.email,
    externalId: userId,
    card: {
      cardAlias: `Card-${Date.now()}`,
      cardHolderName: card.cardHolderName,
      cardNumber: card.cardNumber,
      expireMonth: card.expireMonth,
      expireYear: card.expireYear
    }
  };

  try {
    const response = await iyzicoClient.request<{
      status: string;
      cardToken: string;
      cardUserKey: string;
      errorMessage?: string;
    }>('/cardstorage/card', request);

    if (response.status === 'success') {
      // TODO: Save card token to database - userPaymentMethod model needs to be created in schema
      // await prisma.user_payment_methods.create({
      //   data: {
      //     userId,
      //     provider: 'IYZICO',
      //     cardToken: response.cardToken,
      //     cardUserKey: response.cardUserKey,
      //     lastFourDigits: card.cardNumber.slice(-4),
      //     cardHolderName: card.cardHolderName,
      //     isDefault: true
      //   }
      // });

      return {
        success: true,
        cardToken: response.cardToken
      };
    }

    return {
      success: false,
      errorMessage: response.errorMessage
    };
  } catch (error) {
    logger.error({ err: error }, 'Iyzico save card failed');
    return {
      success: false,
      errorMessage: (error as Error).message
    };
  }
}

export async function deleteCard(userId: string, cardToken: string): Promise<boolean> {
  // TODO: userPaymentMethod model needs to be created in schema
  // const card = await prisma.user_payment_methods.findFirst({
  //   where: { userId, cardToken }
  // });

  // if (!card) {
  //   return false;
  // }

  const card: any = null; // Temporary placeholder
  if (!card) {
    return false;
  }

  const request = {
    locale: 'tr',
    conversationId: `delete-${Date.now()}`,
    cardToken,
    cardUserKey: card.cardUserKey
  };

  try {
    const response = await iyzicoClient.request<{ status: string }>('/cardstorage/card/delete', request);

    if (response.status === 'success') {
      // TODO: userPaymentMethod model needs to be created in schema
      // await prisma.user_payment_methods.delete({
      //   where: { id: card.id }
      // });
      return true;
    }

    return false;
  } catch (error) {
    logger.error({ err: error }, 'Iyzico delete card failed');
    return false;
  }
}

export async function getSavedCards(userId: string): Promise<{
  id: string;
  lastFourDigits: string;
  cardHolderName: string;
  isDefault: boolean;
}[]> {
  // TODO: userPaymentMethod model needs to be created in schema
  // const cards = await prisma.user_payment_methods.findMany({
  //   where: { userId, provider: 'IYZICO' },
  //   select: {
  //     id: true,
  //     lastFourDigits: true,
  //     cardHolderName: true,
  //     isDefault: true
  //   }
  // });

  // return cards.map(c => ({
  //   id: c.id,
  //   lastFourDigits: c.lastFourDigits || '',
  //   cardHolderName: c.cardHolderName || '',
  //   isDefault: c.isDefault
  // }));

  return []; // Temporary return empty array
}

// ============================================
// 3D Secure Payment
// ============================================

export async function create3DSecurePayment(
  request: PaymentRequest,
  callbackUrl: string
): Promise<{
  success: boolean;
  htmlContent?: string;
  errorMessage?: string;
}> {
  const user = await prisma.users.findUnique({
    where: { id: request.userId },
    select: { id: true, email: true, firstName: true, lastName: true }
  });

  if (!user) {
    return { success: false, errorMessage: 'User not found' };
  }

  const paymentRequest: Record<string, unknown> = {
    locale: 'tr',
    conversationId: `3d-${Date.now()}`,
    price: request.amount.toString(),
    paidPrice: request.amount.toString(),
    currency: request.currency || 'TRY',
    installment: request.installment || 1,
    callbackUrl,
    paymentCard: request.card ? {
      cardHolderName: request.card.cardHolderName,
      cardNumber: request.card.cardNumber,
      expireMonth: request.card.expireMonth,
      expireYear: request.card.expireYear,
      cvc: request.card.cvc
    } : { cardToken: request.cardToken },
    buyer: {
      id: user.id,
      name: user.firstName || 'User',
      surname: user.lastName || 'User',
      email: user.email,
      identityNumber: '11111111111',
      registrationAddress: 'Istanbul, Turkey',
      ip: '85.34.78.112',
      city: 'Istanbul',
      country: 'Turkey'
    },
    shippingAddress: {
      contactName: `${user.firstName} ${user.lastName}`,
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Istanbul, Turkey'
    },
    billingAddress: {
      contactName: `${user.firstName} ${user.lastName}`,
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Istanbul, Turkey'
    },
    basketItems: [
      {
        id: 'subscription',
        name: request.description,
        category1: 'Subscription',
        itemType: 'VIRTUAL',
        price: request.amount.toString()
      }
    ]
  };

  try {
    const response = await iyzicoClient.request<{
      status: string;
      threeDSHtmlContent: string;
      errorMessage?: string;
    }>('/payment/3dsecure/initialize', paymentRequest);

    if (response.status === 'success') {
      // Decode base64 HTML content
      const htmlContent = Buffer.from(response.threeDSHtmlContent, 'base64').toString('utf-8');

      return {
        success: true,
        htmlContent
      };
    }

    return {
      success: false,
      errorMessage: response.errorMessage
    };
  } catch (error) {
    logger.error({ err: error }, 'Iyzico 3D secure init failed');
    return {
      success: false,
      errorMessage: (error as Error).message
    };
  }
}

// ============================================
// BIN Check
// ============================================

export async function checkBIN(binNumber: string): Promise<{
  cardType: string;
  cardAssociation: string;
  cardFamily: string;
  bankName: string;
  bankCode: number;
  commercial: boolean;
}> {
  const response = await iyzicoClient.request<{
    status: string;
    cardType: string;
    cardAssociation: string;
    cardFamily: string;
    bankName: string;
    bankCode: number;
    commercial: number;
  }>('/payment/bin/check', {
    locale: 'tr',
    conversationId: `bin-${Date.now()}`,
    binNumber
  });

  return {
    cardType: response.cardType,
    cardAssociation: response.cardAssociation,
    cardFamily: response.cardFamily,
    bankName: response.bankName,
    bankCode: response.bankCode,
    commercial: response.commercial === 1
  };
}

export type { PaymentRequest, PaymentResult, RefundRequest };
