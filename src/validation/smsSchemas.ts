import { z } from 'zod';

// E.164 phone number format regex
// Accepts: +905551234567, +15551234567, etc.
const e164Regex = /^\+[1-9]\d{1,14}$/;

// More lenient phone regex that allows common formats
// Will be normalized to E.164 by the service
const phoneRegex = /^(\+?[1-9]\d{0,2})?[0-9]{10,12}$/;

export const phoneNumberSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(16, 'Phone number is too long')
  .refine(
    (val) => phoneRegex.test(val.replace(/[\s\-\(\)]/g, '')),
    { message: 'Invalid phone number format' },
  );

export const otpPurposeSchema = z.enum(['PHONE_VERIFY', 'LOGIN', 'PASSWORD_RESET']);

export const otpCodeSchema = z.string()
  .length(6, 'OTP code must be 6 digits')
  .regex(/^\d{6}$/, 'OTP code must contain only digits');

export const sendOtpBodySchema = z.object({
  phoneNumber: phoneNumberSchema,
  purpose: otpPurposeSchema,
});

export const verifyOtpBodySchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: otpCodeSchema,
  purpose: otpPurposeSchema,
});

export const resendOtpBodySchema = z.object({
  phoneNumber: phoneNumberSchema,
  purpose: otpPurposeSchema,
});

export const updatePhoneBodySchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const verifyPhoneBodySchema = z.object({
  code: otpCodeSchema,
});

export const smsStatusQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Twilio webhook status callback
export const twilioWebhookBodySchema = z.object({
  MessageSid: z.string(),
  MessageStatus: z.enum(['queued', 'sent', 'delivered', 'undelivered', 'failed']),
  ErrorCode: z.string().optional(),
  ErrorMessage: z.string().optional(),
});

export type SendOtpInput = z.infer<typeof sendOtpBodySchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpBodySchema>;
export type ResendOtpInput = z.infer<typeof resendOtpBodySchema>;
export type UpdatePhoneInput = z.infer<typeof updatePhoneBodySchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneBodySchema>;
export type SmsStatusQuery = z.infer<typeof smsStatusQuerySchema>;
export type TwilioWebhookInput = z.infer<typeof twilioWebhookBodySchema>;
