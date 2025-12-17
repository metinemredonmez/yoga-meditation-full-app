import { EventEmitter } from 'events';

// Type-safe event names
export type AppEvent =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.expired'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'challenge.created'
  | 'challenge.started'
  | 'challenge.completed'
  | 'challenge.enrollment'
  | 'challenge.checkin'
  | 'progress.updated'
  | 'program.completed';

// Event payload types - using Record<string, unknown> for flexibility with webhooks
export interface UserCreatedPayload {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  createdAt: Date;
}

export interface UserUpdatedPayload {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  updatedAt: Date;
  updatedFields: string[];
}

export interface UserDeletedPayload {
  userId: string;
  email: string;
  deletedAt: Date;
  deletedBy: string;
  selfDeleted?: boolean;
}

export interface SubscriptionCreatedPayload {
  subscriptionId: string;
  userId: string;
  plan: string;
  provider: string;
  status: string;
  currentPeriodEnd: Date;
}

export interface SubscriptionUpdatedPayload {
  subscriptionId: string;
  userId: string;
  plan: string;
  provider: string;
  status: string;
  previousStatus: string;
  currentPeriodEnd: Date;
}

export interface SubscriptionCancelledPayload {
  subscriptionId: string;
  userId: string;
  plan: string;
  provider: string;
  cancelledAt: Date;
  effectiveEndDate: Date;
}

export interface PaymentSucceededPayload {
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  provider: string;
  transactionId?: string | undefined;
}

export interface PaymentFailedPayload {
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  provider: string;
  transactionId?: string | undefined;
  reason: string;
}

export interface ChallengeCreatedPayload {
  challengeId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  targetDays: number;
}

export interface ChallengeEnrollmentPayload {
  enrollmentId: string;
  userId: string;
  challengeId: string;
  challengeTitle: string;
  enrolledAt: Date;
}

export interface ChallengeCheckinPayload {
  checkId: string;
  userId: string;
  challengeId: string;
  challengeTitle: string;
  date: Date;
  programSessionId?: string | null;
}

export interface ChallengeCompletedPayload {
  userId: string;
  challengeId: string;
  challengeTitle: string;
  completedDays: number;
  targetDays: number;
  completedAt: Date;
}

export interface ProgressUpdatedPayload {
  userId: string;
  lessonId: string;
  lessonType: string;
  percentage: number;
  completed: boolean;
}

export interface ProgramCompletedPayload {
  userId: string;
  programId: string;
  programTitle: string;
  completedAt: Date;
}

// Event payload mapping
export interface AppEventPayloads {
  'user.created': UserCreatedPayload;
  'user.updated': UserUpdatedPayload;
  'user.deleted': UserDeletedPayload;
  'subscription.created': SubscriptionCreatedPayload;
  'subscription.updated': SubscriptionUpdatedPayload;
  'subscription.cancelled': SubscriptionCancelledPayload;
  'subscription.expired': SubscriptionCancelledPayload;
  'payment.succeeded': PaymentSucceededPayload;
  'payment.failed': PaymentFailedPayload;
  'payment.refunded': PaymentSucceededPayload;
  'challenge.created': ChallengeCreatedPayload;
  'challenge.started': ChallengeCreatedPayload;
  'challenge.completed': ChallengeCompletedPayload;
  'challenge.enrollment': ChallengeEnrollmentPayload;
  'challenge.checkin': ChallengeCheckinPayload;
  'progress.updated': ProgressUpdatedPayload;
  'program.completed': ProgramCompletedPayload;
}

class TypedEventEmitter extends EventEmitter {
  emit<K extends AppEvent>(event: K, payload: AppEventPayloads[K]): boolean {
    return super.emit(event, payload);
  }

  on<K extends AppEvent>(event: K, listener: (payload: AppEventPayloads[K]) => void): this {
    return super.on(event, listener);
  }

  once<K extends AppEvent>(event: K, listener: (payload: AppEventPayloads[K]) => void): this {
    return super.once(event, listener);
  }

  off<K extends AppEvent>(event: K, listener: (payload: AppEventPayloads[K]) => void): this {
    return super.off(event, listener);
  }
}

export const eventEmitter = new TypedEventEmitter();
eventEmitter.setMaxListeners(50);

// Map internal events to webhook events
export const eventToWebhookMap: Record<AppEvent, string> = {
  'user.created': 'USER_CREATED',
  'user.updated': 'USER_UPDATED',
  'user.deleted': 'USER_DELETED',
  'subscription.created': 'SUBSCRIPTION_CREATED',
  'subscription.updated': 'SUBSCRIPTION_UPDATED',
  'subscription.cancelled': 'SUBSCRIPTION_CANCELLED',
  'subscription.expired': 'SUBSCRIPTION_EXPIRED',
  'payment.succeeded': 'PAYMENT_SUCCEEDED',
  'payment.failed': 'PAYMENT_FAILED',
  'payment.refunded': 'PAYMENT_REFUNDED',
  'challenge.created': 'CHALLENGE_CREATED',
  'challenge.started': 'CHALLENGE_STARTED',
  'challenge.completed': 'CHALLENGE_COMPLETED',
  'challenge.enrollment': 'CHALLENGE_ENROLLMENT',
  'challenge.checkin': 'CHALLENGE_CHECKIN',
  'progress.updated': 'PROGRESS_UPDATED',
  'program.completed': 'PROGRAM_COMPLETED',
};
