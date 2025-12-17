import { Request, Response, NextFunction } from 'express';
import * as settingsService from '../../services/admin/settingsService';
import * as auditService from '../../services/admin/auditService';
import { SettingCategory, AdminAction } from '@prisma/client';

// ============================================
// System Settings
// ============================================

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const category = req.query.category as SettingCategory | undefined;
    const settings = await settingsService.getSettings(category);
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

export async function getSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.params.key!;
    const setting = await settingsService.getSetting(key);
    res.json({ success: true, setting });
  } catch (error) {
    next(error);
  }
}

export async function setSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const key = req.params.key!;
    const { value, type, category, description, isPublic } = req.body;

    const setting = await settingsService.setSetting(key, value, adminId, {
      type,
      category,
      description,
      isPublic,
    });

    await auditService.logAdminAction(
      adminId,
      AdminAction.SETTINGS_UPDATE,
      'setting',
      key,
      { value }
    );

    res.json({ success: true, setting });
  } catch (error) {
    next(error);
  }
}

export async function deleteSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const key = req.params.key!;

    await settingsService.deleteSetting(key);

    await auditService.logAdminAction(
      adminId,
      AdminAction.SETTINGS_UPDATE,
      'setting',
      key
    );

    res.json({ success: true, message: 'Setting deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getPublicSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getPublicSettings();
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Feature Flags
// ============================================

export async function getFeatureFlags(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const flags = await settingsService.getFeatureFlags(includeInactive);
    res.json({ success: true, flags });
  } catch (error) {
    next(error);
  }
}

export async function getFeatureFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.params.key!;
    const flag = await settingsService.getFeatureFlag(key);
    res.json({ success: true, flag });
  } catch (error) {
    next(error);
  }
}

export async function checkFeatureFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.params.key!;
    const userId = req.query.userId as string | undefined;
    const isEnabled = await settingsService.isFeatureEnabled(key, userId);
    res.json({ success: true, key, isEnabled });
  } catch (error) {
    next(error);
  }
}

export async function createFeatureFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const flag = await settingsService.createFeatureFlag(adminId, req.body);

    await auditService.logAdminAction(
      adminId,
      AdminAction.FEATURE_FLAG_UPDATE,
      'feature_flag',
      flag.key,
      req.body
    );

    res.status(201).json({ success: true, flag });
  } catch (error) {
    next(error);
  }
}

export async function updateFeatureFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const key = req.params.key!;

    const flag = await settingsService.updateFeatureFlag(key, adminId, req.body);

    await auditService.logAdminAction(
      adminId,
      AdminAction.FEATURE_FLAG_UPDATE,
      'feature_flag',
      key,
      req.body
    );

    res.json({ success: true, flag });
  } catch (error) {
    next(error);
  }
}

export async function toggleFeatureFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const key = req.params.key!;

    const flag = await settingsService.toggleFeatureFlag(key, adminId);

    await auditService.logAdminAction(
      adminId,
      AdminAction.FEATURE_FLAG_UPDATE,
      'feature_flag',
      key,
      { isEnabled: flag.isEnabled }
    );

    res.json({ success: true, flag });
  } catch (error) {
    next(error);
  }
}

export async function deleteFeatureFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const key = req.params.key!;

    await settingsService.deleteFeatureFlag(key);

    await auditService.logAdminAction(
      adminId,
      AdminAction.FEATURE_FLAG_UPDATE,
      'feature_flag',
      key
    );

    res.json({ success: true, message: 'Feature flag deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Seed
// ============================================

export async function seedDefaultSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const results = await settingsService.seedDefaultSettings(adminId);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
}

export async function seedDefaultFeatureFlags(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const results = await settingsService.seedDefaultFeatureFlags(adminId);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
}
