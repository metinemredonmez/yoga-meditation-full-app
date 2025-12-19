import { Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import type { CreatePlannerEntryInput, PlannerQueryInput } from '../validation/plannerSchemas';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWeekRange(weekStart?: string) {
  const start = weekStart ? startOfDay(new Date(weekStart)) : startOfDay(new Date());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function formatPlannerEntry(
  entry: Prisma.planner_entriesGetPayload<{
    include: {
      program_sessions: {
        select: {
          id: true;
          title: true;
          durationMin: true;
          programs: {
            select: {
              id: true;
              title: true;
            };
          };
        };
      };
      classes: {
        select: {
          id: true;
          title: true;
          description: true;
          schedule: true;
        };
      };
    };
  }> & { program_sessions?: unknown; classes?: unknown },
) {
  return {
    id: entry.id,
    itemType: entry.itemType,
    plannedAt: entry.plannedAt,
    programSession: entry.program_sessions
      ? {
          id: entry.program_sessions.id,
          title: entry.program_sessions.title,
          durationMin: entry.program_sessions.durationMin,
          program: entry.program_sessions.programs,
        }
      : undefined,
    class: entry.classes
      ? {
          id: entry.classes.id,
          title: entry.classes.title,
          description: entry.classes.description,
          schedule: entry.classes.schedule,
        }
      : undefined,
  };
}

export async function getPlannerEntries(userId: string, query: PlannerQueryInput) {
  const { start, end } = getWeekRange(query.weekStart);

  const entries = await prisma.planner_entries.findMany({
    where: {
      userId,
      plannedAt: {
        gte: start,
        lt: end,
      },
    },
    include: {
      program_sessions: {
        select: {
          id: true,
          title: true,
          durationMin: true,
          programs: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      classes: {
        select: {
          id: true,
          title: true,
          description: true,
          schedule: true,
        },
      },
    },
    orderBy: {
      plannedAt: 'asc',
    },
  });

  return entries.map((entry) => formatPlannerEntry(entry));
}

export async function createPlannerEntry(userId: string, input: CreatePlannerEntryInput) {
  const plannedAt = new Date(input.plannedAt);

  if (input.itemType === 'PROGRAM_SESSION') {
    const session = await prisma.program_sessions.findUnique({
      where: { id: input.itemId },
      select: { id: true },
    });

    if (!session) {
      const error = new Error('Program session not found');
      error.name = 'ProgramSessionNotFound';
      throw error;
    }

    const entry = await prisma.planner_entries.create({
      data: {
        userId,
        itemType: 'PROGRAM_SESSION',
        programSessionId: session.id,
        classId: null,
        plannedAt,
      },
      include: {
        program_sessions: {
          select: {
            id: true,
            title: true,
            durationMin: true,
            programs: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        classes: false,
      },
    });

    return formatPlannerEntry({ ...entry, classes: null });
  }

  const yogaClass = await prisma.classes.findUnique({
    where: { id: input.itemId },
    select: { id: true },
  });

  if (!yogaClass) {
    const error = new Error('Class not found');
    error.name = 'ClassNotFound';
    throw error;
  }

  const entry = await prisma.planner_entries.create({
    data: {
      userId,
      itemType: 'CLASS',
      programSessionId: null,
      classId: yogaClass.id,
      plannedAt,
    },
    include: {
      program_sessions: false,
      classes: {
        select: {
          id: true,
          title: true,
          description: true,
          schedule: true,
        },
      },
    },
  });

  return formatPlannerEntry({ ...entry, program_sessions: null });
}

export async function deletePlannerEntry(userId: string, entryId: string) {
  const entry = await prisma.planner_entries.findUnique({
    where: { id: entryId },
    select: { userId: true },
  });

  if (!entry) {
    const error = new Error('Planner entry not found');
    error.name = 'NotFoundError';
    throw error;
  }

  if (entry.userId !== userId) {
    const error = new Error('Forbidden');
    error.name = 'Forbidden';
    throw error;
  }

  await prisma.planner_entries.delete({ where: { id: entryId } });
}
