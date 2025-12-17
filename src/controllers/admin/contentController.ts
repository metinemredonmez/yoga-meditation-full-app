import { Request, Response, NextFunction } from 'express';
import * as contentService from '../../services/admin/contentManagementService';
import * as programService from '../../services/programService';
import * as auditService from '../../services/admin/auditService';
import { AdminAction, ProgramLevel } from '@prisma/client';

// ============================================
// Programs
// ============================================

export async function getPrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      search: req.query.search as string,
      level: req.query.level as ProgramLevel,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await contentService.getPrograms(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getProgramDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const program = await contentService.getProgram(req.params.id!);
    res.json({ success: true, program });
  } catch (error) {
    next(error);
  }
}

export async function createProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { title, description, level, durationWeeks, thumbnailUrl, coverImageUrl } = req.body;

    const program = await programService.createProgram({
      title,
      description,
      level: level || 'BEGINNER',
      durationMin: (durationWeeks || 4) * 7 * 60, // Convert weeks to minutes (approximate)
      coverUrl: coverImageUrl || thumbnailUrl,
    });

    await auditService.logAdminAction(
      adminId,
      AdminAction.PROGRAM_CREATE,
      'program',
      program.id,
      { newData: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.status(201).json({ success: true, program });
  } catch (error) {
    next(error);
  }
}

export async function updateProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const programId = req.params.id!;

    // Map frontend field names to database field names
    const { coverImageUrl, ...rest } = req.body;
    const updateData = {
      ...rest,
      ...(coverImageUrl !== undefined && { coverUrl: coverImageUrl }),
    };

    const program = await contentService.updateProgram(programId, updateData);

    await auditService.logAdminAction(
      adminId,
      AdminAction.PROGRAM_UPDATE,
      'program',
      programId,
      { newData: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, program });
  } catch (error) {
    next(error);
  }
}

export async function publishProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const programId = req.params.id!;
    const program = await contentService.updateProgram(programId, { isPublished: true });

    await auditService.logAdminAction(
      adminId,
      AdminAction.PROGRAM_UPDATE,
      'program',
      programId,
      { action: 'publish', ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, program });
  } catch (error) {
    next(error);
  }
}

export async function unpublishProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const programId = req.params.id!;
    const program = await contentService.updateProgram(programId, { isPublished: false });

    await auditService.logAdminAction(
      adminId,
      AdminAction.PROGRAM_UPDATE,
      'program',
      programId,
      { action: 'unpublish', ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, program });
  } catch (error) {
    next(error);
  }
}

export async function deleteProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const programId = req.params.id!;
    const result = await contentService.deleteProgram(programId);

    await auditService.logAdminAction(
      adminId,
      AdminAction.PROGRAM_DELETE,
      'program',
      programId,
      { ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Classes
// ============================================

export async function getClasses(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await contentService.getClasses(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getClassDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const classItem = await contentService.getClass(req.params.id!);
    res.json({ success: true, class: classItem });
  } catch (error) {
    next(error);
  }
}

export async function createClass(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(501).json({ success: false, message: 'Create class not implemented yet' });
  } catch (error) {
    next(error);
  }
}

export async function updateClass(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const classId = req.params.id!;
    const classItem = await contentService.updateClass(classId, req.body);

    await auditService.logAdminAction(
      adminId,
      AdminAction.CLASS_UPDATE,
      'class',
      classId,
      { newData: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, class: classItem });
  } catch (error) {
    next(error);
  }
}

export async function deleteClass(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const classId = req.params.id!;
    const result = await contentService.deleteClass(classId);

    await auditService.logAdminAction(
      adminId,
      AdminAction.CLASS_DELETE,
      'class',
      classId,
      { ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Poses
// ============================================

export async function getPoses(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await contentService.getPoses(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getPoseDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const pose = await contentService.getPose(req.params.id!);
    res.json({ success: true, pose });
  } catch (error) {
    next(error);
  }
}

export async function createPose(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(501).json({ success: false, message: 'Create pose not implemented yet' });
  } catch (error) {
    next(error);
  }
}

export async function updatePose(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const poseId = req.params.id!;
    const pose = await contentService.updatePose(poseId, req.body);

    await auditService.logAdminAction(
      adminId,
      AdminAction.POSE_UPDATE,
      'pose',
      poseId,
      { newData: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, pose });
  } catch (error) {
    next(error);
  }
}

export async function deletePose(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const poseId = req.params.id!;
    const result = await contentService.deletePose(poseId);

    await auditService.logAdminAction(
      adminId,
      AdminAction.POSE_DELETE,
      'pose',
      poseId,
      { ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Challenges
// ============================================

export async function getChallenges(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await contentService.getChallenges(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getChallengeDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const challenge = await contentService.getChallenge(req.params.id!);
    res.json({ success: true, challenge });
  } catch (error) {
    next(error);
  }
}

export async function createChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(501).json({ success: false, message: 'Create challenge not implemented yet' });
  } catch (error) {
    next(error);
  }
}

export async function updateChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const challengeId = req.params.id!;
    const challenge = await contentService.updateChallenge(challengeId, req.body);

    await auditService.logAdminAction(
      adminId,
      AdminAction.CHALLENGE_UPDATE,
      'challenge',
      challengeId,
      { newData: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, challenge });
  } catch (error) {
    next(error);
  }
}

export async function deleteChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const challengeId = req.params.id!;
    const result = await contentService.deleteChallenge(challengeId);

    await auditService.logAdminAction(
      adminId,
      AdminAction.CHALLENGE_DELETE,
      'challenge',
      challengeId,
      { ipAddress: req.ip, userAgent: req.get('user-agent') },
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// Content Stats
export async function getContentStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await contentService.getContentStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}
