import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * Middleware to require instructor profile
 */
export async function requireInstructor(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId: req.user.id },
    });

    if (!instructor) {
      return res.status(403).json({
        success: false,
        error: 'Instructor profile required',
      });
    }

    // Add instructor to request
    (req as any).instructor = instructor;

    next();
  } catch (error) {
    logger.error({ error }, 'Instructor middleware error');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Middleware to require approved instructor
 */
export async function requireApprovedInstructor(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId: req.user.id },
    });

    if (!instructor) {
      return res.status(403).json({
        success: false,
        error: 'Instructor profile required',
      });
    }

    if (instructor.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: 'Instructor profile must be approved',
        currentStatus: instructor.status,
      });
    }

    // Add instructor to request
    (req as any).instructor = instructor;

    next();
  } catch (error) {
    logger.error({ error }, 'Approved instructor middleware error');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Middleware to check if user owns the instructor content
 */
export function requireContentOwnership(contentType: 'program' | 'class') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const instructor = await prisma.instructor_profiles.findUnique({
        where: { userId: req.user.id },
      });

      if (!instructor) {
        return res.status(403).json({
          success: false,
          error: 'Instructor profile required',
        });
      }

      const contentId = req.params.id || req.params.programId || req.params.classId;

      if (!contentId) {
        return res.status(400).json({
          success: false,
          error: 'Content ID required',
        });
      }

      let isOwner = false;

      if (contentType === 'program') {
        const program = await prisma.programs.findUnique({
          where: { id: contentId },
        });

        if (!program) {
          return res.status(404).json({
            success: false,
            error: 'Program not found',
          });
        }

        isOwner =
          program.instructorId === req.user.id ||
          program.coInstructorIds.includes(req.user.id);
      } else if (contentType === 'class') {
        const classItem = await prisma.classes.findUnique({
          where: { id: contentId },
        });

        if (!classItem) {
          return res.status(404).json({
            success: false,
            error: 'Class not found',
          });
        }

        isOwner = classItem.instructorId === req.user.id;
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to access this content',
        });
      }

      // Add instructor to request
      (req as any).instructor = instructor;

      next();
    } catch (error) {
      logger.error({ error }, 'Content ownership middleware error');
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Middleware to check if user has free access to content (as instructor/owner)
 */
export async function checkInstructorFreeAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return next();
    }

    const contentId = req.params.id || req.params.programId || req.params.classId;
    const contentType = req.path.includes('program') ? 'program' : 'class';

    if (!contentId) {
      return next();
    }

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId: req.user.id },
    });

    if (!instructor || instructor.status !== 'APPROVED') {
      return next();
    }

    let hasAccess = false;

    if (contentType === 'program') {
      const program = await prisma.programs.findUnique({
        where: { id: contentId },
      });

      if (program) {
        hasAccess =
          program.instructorId === req.user.id ||
          program.coInstructorIds.includes(req.user.id);
      }
    } else {
      const classItem = await prisma.classes.findUnique({
        where: { id: contentId },
      });

      if (classItem) {
        hasAccess = classItem.instructorId === req.user.id;
      }
    }

    // Set free access flag on request
    (req as any).hasInstructorFreeAccess = hasAccess;

    next();
  } catch (error) {
    logger.error({ error }, 'Instructor free access check error');
    next();
  }
}

/**
 * Middleware to require specific instructor tier
 */
export function requireInstructorTier(...allowedTiers: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const instructor = await prisma.instructor_profiles.findUnique({
        where: { userId: req.user.id },
      });

      if (!instructor) {
        return res.status(403).json({
          success: false,
          error: 'Instructor profile required',
        });
      }

      if (!allowedTiers.includes(instructor.tier)) {
        return res.status(403).json({
          success: false,
          error: `This feature requires ${allowedTiers.join(' or ')} tier`,
          currentTier: instructor.tier,
        });
      }

      // Add instructor to request
      (req as any).instructor = instructor;

      next();
    } catch (error) {
      logger.error({ error }, 'Instructor tier middleware error');
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}
