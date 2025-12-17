import { Router } from 'express';
import express from 'express';

// Webhook handlers
import { handleIyzicoWebhook, handle3DSecureCallback } from './iyzicoWebhook';
import { handleSMSStatusCallback, handleVoiceStatusCallback, handleIncomingSMS } from './twilioWebhook';
import { handleSendGridWebhook, handleInboundEmail } from './sendgridWebhook';

const router = Router();

// ============================================
// Iyzico Webhooks
// ============================================

// Main webhook endpoint for Iyzico events
router.post('/iyzico', express.json(), handleIyzicoWebhook);

// 3D Secure callback - receives URL-encoded form data
router.post('/iyzico/3dsecure', express.urlencoded({ extended: true }), handle3DSecureCallback);

// ============================================
// Twilio Webhooks
// ============================================

// SMS status callback - Twilio sends form-urlencoded data
router.post('/twilio/sms/status', express.urlencoded({ extended: true }), handleSMSStatusCallback);

// Voice status callback
router.post('/twilio/voice/status', express.urlencoded({ extended: true }), handleVoiceStatusCallback);

// Incoming SMS
router.post('/twilio/sms/incoming', express.urlencoded({ extended: true }), handleIncomingSMS);

// ============================================
// SendGrid Webhooks
// ============================================

// Event webhook (delivered, open, click, bounce, etc.)
router.post('/sendgrid/events', express.json(), handleSendGridWebhook);

// Inbound email parsing
router.post('/sendgrid/inbound', express.urlencoded({ extended: true }), handleInboundEmail);

export default router;
