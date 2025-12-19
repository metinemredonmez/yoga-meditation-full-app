import { Request, Response, NextFunction } from 'express';
import * as contentService from '../../services/admin/contentManagementService';
import * as auditService from '../../services/admin/auditService';
import { AdminAction, ProgramLevel } from '@prisma/client';
import { prisma } from '../../utils/database';

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
    const {
      title,
      description,
      level,
      durationWeeks,
      thumbnailUrl,
      coverUrl,
      coverImageUrl,
      instructorId,
      status,
      accessType,
      price,
      currency,
      categories,
      promoVideoUrl,
      promoVideoSource,
      promoVideoId,
      isPublished,
    } = req.body;

    const program = await prisma.programs.create({
      data: {
        title,
        description,
        level: level || 'BEGINNER',
        durationMin: (durationWeeks || 4) * 7 * 60, // Convert weeks to minutes (approximate)
        durationWeeks: durationWeeks || 4,
        coverUrl: coverUrl || coverImageUrl || thumbnailUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        instructorId: instructorId || null,
        status: status || 'DRAFT',
        accessType: accessType || 'FREE',
        price: price ?? null,
        currency: currency || 'TRY',
        categories: categories || [],
        promoVideoUrl: promoVideoUrl || null,
        promoVideoSource: promoVideoSource || null,
        promoVideoId: promoVideoId || null,
        isPublished: isPublished ?? false,
      },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        tags: true,
        _count: { select: { sessions: true, comments: true } },
      },
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

    const {
      title,
      description,
      level,
      durationWeeks,
      thumbnailUrl,
      coverUrl,
      coverImageUrl,
      instructorId,
      status,
      accessType,
      price,
      currency,
      categories,
      promoVideoUrl,
      promoVideoSource,
      promoVideoId,
      isPublished,
    } = req.body;

    // Build update data - only include defined fields
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = level;
    if (durationWeeks !== undefined) {
      updateData.durationWeeks = durationWeeks;
      updateData.durationMin = durationWeeks * 7 * 60;
    }
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl || null;
    if (coverUrl !== undefined || coverImageUrl !== undefined) {
      updateData.coverUrl = coverUrl || coverImageUrl || null;
    }
    if (instructorId !== undefined) updateData.instructorId = instructorId || null;
    if (status !== undefined) updateData.status = status;
    if (accessType !== undefined) updateData.accessType = accessType;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (categories !== undefined) updateData.categories = categories || [];
    if (promoVideoUrl !== undefined) updateData.promoVideoUrl = promoVideoUrl || null;
    if (promoVideoSource !== undefined) updateData.promoVideoSource = promoVideoSource || null;
    if (promoVideoId !== undefined) updateData.promoVideoId = promoVideoId || null;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const program = await prisma.programs.update({
      where: { id: programId },
      data: updateData,
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        tags: true,
        _count: { select: { sessions: true, comments: true } },
      },
    });

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
    const program = await prisma.programs.update({
      where: { id: programId },
      data: { isPublished: true, status: 'PUBLISHED' },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        tags: true,
        _count: { select: { sessions: true, comments: true } },
      },
    });

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
    const program = await prisma.programs.update({
      where: { id: programId },
      data: { isPublished: false, status: 'DRAFT' },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        tags: true,
        _count: { select: { sessions: true, comments: true } },
      },
    });

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
