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
  entry: Prisma.PlannerEntryGetPayload<{
    include: {
      session: {
        select: {
          id: true;
          title: true;
          durationMin: true;
          program: {
            select: {
              id: true;
              title: true;
            };
          };
        };
      };
      class: {
        select: {
          id: true;
          title: true;
          description: true;
          schedule: true;
        };
      };
    };
  }> & { session?: unknown; class?: unknown },
) {
  return {
    id: entry.id,
    itemType: entry.itemType,
    plannedAt: entry.plannedAt,
    programSession: entry.session
      ? {
          id: entry.session.id,
          title: entry.session.title,
          durationMin: entry.session.durationMin,
          program: entry.session.program,
        }
      : undefined,
    class: entry.class
      ? {
          id: entry.class.id,
          title: entry.class.title,
          description: entry.class.description,
          schedule: entry.class.schedule,
        }
      : undefined,
  };
}

export async function getPlannerEntries(userId: string, query: PlannerQueryInput) {
  const { start, end } = getWeekRange(query.weekStart);

  const entries = await prisma.plannerEntry.findMany({
    where: {
      userId,
      plannedAt: {
        gte: start,
        lt: end,
      },
    },
    include: {
      session: {
        select: {
          id: true,
          title: true,
          durationMin: true,
          program: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      class: {
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
    const session = await prisma.programSession.findUnique({
      where: { id: input.itemId },
      select: { id: true },
    });

    if (!session) {
      const error = new Error('Program session not found');
      error.name = 'ProgramSessionNotFound';
      throw error;
    }

    const entry = await prisma.plannerEntry.create({
      data: {
        userId,
        itemType: 'PROGRAM_SESSION',
        programSessionId: session.id,
        classId: null,
        plannedAt,
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            durationMin: true,
            program: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        class: false,
      },
    });

    return formatPlannerEntry({ ...entry, class: null });
  }

  const yogaClass = await prisma.class.findUnique({
    where: { id: input.itemId },
    select: { id: true },
  });

  if (!yogaClass) {
    const error = new Error('Class not found');
    error.name = 'ClassNotFound';
    throw error;
  }

  const entry = await prisma.plannerEntry.create({
    data: {
      userId,
      itemType: 'CLASS',
      programSessionId: null,
      classId: yogaClass.id,
      plannedAt,
    },
    include: {
      session: false,
      class: {
        select: {
          id: true,
          title: true,
          description: true,
          schedule: true,
        },
      },
    },
  });

  return formatPlannerEntry({ ...entry, session: null });
}

export async function deletePlannerEntry(userId: string, entryId: string) {
  const entry = await prisma.plannerEntry.findUnique({
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

  await prisma.plannerEntry.delete({ where: { id: entryId } });
}
