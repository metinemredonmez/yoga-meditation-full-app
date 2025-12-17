import { z } from 'zod';

export const devicePlatformSchema = z.enum(['IOS', 'ANDROID', 'WEB']);

export const registerDeviceBodySchema = z.object({
  token: z.string().min(1, 'Device token is required'),
  platform: devicePlatformSchema,
  deviceName: z.string().optional(),
});

export const unregisterDeviceBodySchema = z.object({
  token: z.string().min(1, 'Device token is required'),
});

export const sendTestNotificationBodySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  body: z.string().min(1, 'Body is required').max(500),
  data: z.record(z.string(), z.string()).optional(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceBodySchema>;
export type UnregisterDeviceInput = z.infer<typeof unregisterDeviceBodySchema>;
export type SendTestNotificationInput = z.infer<typeof sendTestNotificationBodySchema>;
