import { z } from 'zod';

export const reminderSchema = z.object({
  classId: z.string().cuid().optional(),
  programSessionId: z.string().optional(),
  sendAt: z.string().datetime().optional(),
  channel: z.enum(['email', 'sms', 'push']).default('email'),
}).refine((value) => value.classId || value.programSessionId, {
  message: 'classId or programSessionId is required',
  path: ['classId'],
});

export type ReminderInput = z.infer<typeof reminderSchema>;
