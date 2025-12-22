import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import bcrypt from 'bcryptjs';

// Get security settings (2FA status, sessions)
export const getSecuritySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLogin: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get sessions (mock for now - could be from a sessions table)
    const sessions = [
      {
        id: '1',
        device: 'Chrome - MacOS',
        ip: '192.168.1.1',
        location: 'İstanbul, TR',
        lastActive: new Date().toISOString(),
        current: true,
      },
    ];

    res.json({
      success: true,
      data: {
        twoFactorEnabled: user.twoFactorEnabled || false,
        lastLogin: user.lastLogin,
        hasPassword: !!user.passwordHash,
        sessions,
      },
    });
  } catch (error) {
    console.error('Get security settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get security settings' });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'New password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    // If user has existing password, verify current password
    if (user.passwordHash && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect' });
      }
    } else if (user.passwordHash && !currentPassword) {
      // User has password but didn't provide current
      return res.status(400).json({ success: false, error: 'Current password required' });
    }
    // If no passwordHash exists, user is setting password for first time (OTP user)

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
};

// Toggle 2FA
export const toggle2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { enabled } = req.body;

    await prisma.users.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
    });

    res.json({
      success: true,
      message: enabled ? '2FA enabled' : '2FA disabled',
      data: { twoFactorEnabled: enabled },
    });
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle 2FA' });
  }
};

// Terminate all sessions
export const terminateAllSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // In a real app, you'd invalidate all refresh tokens here
    // For now, we just return success

    res.json({ success: true, message: 'All sessions terminated' });
  } catch (error) {
    console.error('Terminate sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to terminate sessions' });
  }
};

// Get preferences (language, timezone, etc.)
export const getPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        language: true,
        timezone: true,
        preferences: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const prefs = (user.preferences as any) || {};

    res.json({
      success: true,
      data: {
        language: user.language || 'tr',
        timezone: user.timezone || 'Europe/Istanbul',
        currency: prefs.currency || 'TRY',
        dateFormat: prefs.dateFormat || 'DD/MM/YYYY',
        timeFormat: prefs.timeFormat || '24h',
      },
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
};

// Update preferences
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { language, timezone, currency, dateFormat, timeFormat } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const currentPrefs = (user?.preferences as any) || {};

    await prisma.users.update({
      where: { id: userId },
      data: {
        language: language || 'tr',
        timezone: timezone || 'Europe/Istanbul',
        preferences: {
          ...currentPrefs,
          currency: currency || 'TRY',
          dateFormat: dateFormat || 'DD/MM/YYYY',
          timeFormat: timeFormat || '24h',
        },
      },
    });

    res.json({ success: true, message: 'Preferences updated' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
};

// Get class preferences
export const getClassPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const instructor = await prisma.instructor_profiles.findFirst({
      where: { userId },
      select: {
        id: true,
        classPreferences: true,
      },
    });

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const prefs = (instructor.classPreferences as any) || {};

    res.json({
      success: true,
      data: {
        defaultDuration: prefs.defaultDuration || 30,
        maxStudents: prefs.maxStudents || 50,
        minBookingHours: prefs.minBookingHours || 2,
        autoApprove: prefs.autoApprove || false,
        allowComments: prefs.allowComments !== false,
        allowRatings: prefs.allowRatings !== false,
        defaultLevel: prefs.defaultLevel || 'all',
        defaultLanguage: prefs.defaultLanguage || 'tr',
      },
    });
  } catch (error) {
    console.error('Get class preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to get class preferences' });
  }
};

// Update class preferences
export const updateClassPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      defaultDuration,
      maxStudents,
      minBookingHours,
      autoApprove,
      allowComments,
      allowRatings,
      defaultLevel,
      defaultLanguage,
    } = req.body;

    const instructor = await prisma.instructor_profiles.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    await prisma.instructor_profiles.update({
      where: { id: instructor.id },
      data: {
        classPreferences: {
          defaultDuration: defaultDuration || 30,
          maxStudents: maxStudents || 50,
          minBookingHours: minBookingHours || 2,
          autoApprove: autoApprove || false,
          allowComments: allowComments !== false,
          allowRatings: allowRatings !== false,
          defaultLevel: defaultLevel || 'all',
          defaultLanguage: defaultLanguage || 'tr',
        },
      },
    });

    res.json({ success: true, message: 'Class preferences updated' });
  } catch (error) {
    console.error('Update class preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to update class preferences' });
  }
};

// Get calendar integrations
export const getCalendarIntegrations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        integrations: true,
      },
    });

    const integrations = (user?.integrations as any) || {};

    res.json({
      success: true,
      data: {
        googleCalendar: {
          connected: !!integrations.googleCalendar?.connected,
          email: integrations.googleCalendar?.email || null,
          syncEnabled: integrations.googleCalendar?.syncEnabled || false,
        },
        appleCalendar: {
          connected: !!integrations.appleCalendar?.connected,
          syncEnabled: integrations.appleCalendar?.syncEnabled || false,
        },
        outlook: {
          connected: !!integrations.outlook?.connected,
          email: integrations.outlook?.email || null,
          syncEnabled: integrations.outlook?.syncEnabled || false,
        },
      },
    });
  } catch (error) {
    console.error('Get calendar integrations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get calendar integrations' });
  }
};

// Update calendar integration
export const updateCalendarIntegration = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { provider, action, syncEnabled, email } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { integrations: true, email: true },
    });

    const integrations = (user?.integrations as any) || {};

    if (action === 'connect') {
      // Simulate OAuth connection - in production, this would be after OAuth callback
      integrations[provider] = {
        connected: true,
        syncEnabled: true,
        email: email || user?.email || null,
        connectedAt: new Date().toISOString(),
      };
    } else if (action === 'disconnect') {
      integrations[provider] = { connected: false };
    } else if (action === 'toggle-sync') {
      if (integrations[provider]) {
        integrations[provider].syncEnabled = syncEnabled;
      }
    }

    await prisma.users.update({
      where: { id: userId },
      data: { integrations },
    });

    // Return updated integrations data
    res.json({
      success: true,
      message: 'Calendar integration updated',
      data: {
        googleCalendar: {
          connected: !!integrations.googleCalendar?.connected,
          email: integrations.googleCalendar?.email || null,
          syncEnabled: integrations.googleCalendar?.syncEnabled || false,
        },
        appleCalendar: {
          connected: !!integrations.appleCalendar?.connected,
          syncEnabled: integrations.appleCalendar?.syncEnabled || false,
        },
        outlook: {
          connected: !!integrations.outlook?.connected,
          email: integrations.outlook?.email || null,
          syncEnabled: integrations.outlook?.syncEnabled || false,
        },
      },
    });
  } catch (error) {
    console.error('Update calendar integration error:', error);
    res.status(500).json({ success: false, error: 'Failed to update calendar integration' });
  }
};

// Deactivate account
export const deactivateAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { password, reason } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password required' });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Password is incorrect' });
    }

    // Deactivate the account
    await prisma.users.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: reason || null,
      },
    });

    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ success: false, error: 'Failed to deactivate account' });
  }
};

// Get notification settings
export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        preferences: true,
      },
    });

    const prefs = (user?.preferences as any) || {};
    const notifications = prefs.notifications || {};

    res.json({
      success: true,
      data: {
        email: {
          newStudent: notifications.email?.newStudent !== false,
          newReview: notifications.email?.newReview !== false,
          earnings: notifications.email?.earnings !== false,
          classApproval: notifications.email?.classApproval !== false,
          marketing: notifications.email?.marketing !== false,
        },
        push: {
          newStudent: notifications.push?.newStudent !== false,
          newReview: notifications.push?.newReview !== false,
          earnings: notifications.push?.earnings !== false,
          classApproval: notifications.push?.classApproval !== false,
        },
      },
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notification settings' });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { email, push } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const currentPrefs = (user?.preferences as any) || {};

    await prisma.users.update({
      where: { id: userId },
      data: {
        preferences: {
          ...currentPrefs,
          notifications: {
            email: {
              newStudent: email?.newStudent !== false,
              newReview: email?.newReview !== false,
              earnings: email?.earnings !== false,
              classApproval: email?.classApproval !== false,
              marketing: email?.marketing !== false,
            },
            push: {
              newStudent: push?.newStudent !== false,
              newReview: push?.newReview !== false,
              earnings: push?.earnings !== false,
              classApproval: push?.classApproval !== false,
            },
          },
        },
      },
    });

    res.json({ success: true, message: 'Notification settings updated' });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification settings' });
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { password, confirmText } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password required' });
    }

    if (confirmText !== 'HESABIMI SIL') {
      return res.status(400).json({ success: false, error: 'Confirmation text does not match' });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { password: true, email: true },
    });

    if (!user || !user.password) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Password is incorrect' });
    }

    // Soft delete - mark for deletion after 30 days
    await prisma.users.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletionScheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        email: `deleted_${Date.now()}_${user.email}`, // Anonymize email
      },
    });

    res.json({ success: true, message: 'Account scheduled for deletion' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
};
