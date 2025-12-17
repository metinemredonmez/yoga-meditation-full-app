import { Request, Response, NextFunction } from 'express';
import * as userService from '../../services/admin/userManagementService';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getUsers({
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function getUserDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUserDetails(req.params.id!);
    res.json({ success: true, user });
  } catch (error) { next(error); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateUser(req.params.id!, req.body);
    res.json({ success: true, user });
  } catch (error) { next(error); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.deleteUser(req.params.id!);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function banUser(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.banUser(req.params.id!, req.user!.id, req.body.reason, req.body.expiresAt);
    res.json({ success: true, ban: result });
  } catch (error) { next(error); }
}

export async function unbanUser(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.unbanUser(req.params.id!, req.user!.id, req.body.reason);
    res.json({ success: true, ban: result });
  } catch (error) { next(error); }
}

export async function warnUser(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.warnUser(req.params.id!, req.user!.id, req.body.reason, req.body.severity);
    res.json({ success: true, warning: result });
  } catch (error) { next(error); }
}

export async function changeUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.changeUserRole(req.params.id!, req.body.role);
    res.json({ success: true, user: result });
  } catch (error) { next(error); }
}

export async function resetUserPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.resetUserPassword(req.params.id!, req.body.password);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) { next(error); }
}

export async function getBannedUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getBannedUsers(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function getWarnings(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getWarnings(
      req.query.userId as string,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function getUserActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getUserActivityLog(req.params.id!);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function getUserActivityLog(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getUserActivityLog(req.params.id!);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function acknowledgeWarning(req: Request, res: Response, next: NextFunction) {
  try {
    // Stub implementation
    res.json({ success: true, message: 'Warning acknowledged' });
  } catch (error) { next(error); }
}
