import { Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import type {
  ProgramFilters,
  CreateProgramInput,
  UpdateProgramInput,
  CreateProgramSessionInput,
  UpdateProgramSessionInput,
} from '../validation/programSchemas';

const baseInclude = {
  tags: true,
  _count: {
    select: {
      sessions: true,
    },
  },
} satisfies Prisma.programsInclude;

function mapProgramSummary(program: Prisma.programsGetPayload<{ include: typeof baseInclude }>) {
  return {
    id: program.id,
    title: program.title,
    description: program.description,
    level: program.level,
    durationMin: program.durationMin,
    coverUrl: program.coverUrl,
    sessionCount: program._count.sessions,
    tags: program.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      kind: tag.kind,
    })),
  };
}

function mapProgramDetail(
  program: Prisma.programsGetPayload<{
    include: {
      tags: true;
      sessions: true;
      _count: {
        select: { sessions: true };
      };
    };
  }>,
) {
  return {
    ...mapProgramSummary(program),
    sessions: program.sessions
      .sort((a, b) => a.order - b.order)
      .map((session) => ({
        id: session.id,
        order: session.order,
        title: session.title,
        durationMin: session.durationMin,
        videoUrl: session.videoUrl,
        poseIds: session.poseIds,
      })),
  };
}

function buildProgramWhere(filters: ProgramFilters): Prisma.programsWhereInput {
  const where: Prisma.programsWhereInput = {};
  const andConditions: Prisma.programsWhereInput[] = [];

  if (filters.level) {
    where.level = filters.level;
  }

  if (typeof filters.durationMax === 'number') {
    where.durationMin = { lte: filters.durationMax };
  }

  if (filters.tag) {
    where.tags = {
      some: {
        slug: filters.tag,
      },
    };
  }

  if (filters.q) {
    const search = filters.q.trim();
    if (search.length > 0) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

export async function listPrograms(filters: ProgramFilters) {
  const programs = await prisma.programs.findMany({
    where: buildProgramWhere(filters),
    include: baseInclude,
    orderBy: [{ title: 'asc' }],
  });

  return programs.map(mapProgramSummary);
}

export async function searchPrograms(filters: ProgramFilters) {
  return listPrograms(filters);
}

export async function getProgramById(id: string) {
  const program = await prisma.programs.findUnique({
    where: { id },
    include: {
      tags: true,
      sessions: true,
      _count: {
        select: {
          sessions: true,
        },
      },
    },
  });

  if (!program) {
    return null;
  }

  return mapProgramDetail(program);
}

function buildTagConnections(tagSlugs?: string[]) {
  if (!tagSlugs || tagSlugs.length === 0) {
    return undefined;
  }

  return tagSlugs.map((slug) => ({ slug }));
}

export async function createProgram(data: CreateProgramInput) {
  const tagConnections = buildTagConnections(data.tags);
  const program = await prisma.programs.create({
    data: {
      title: data.title,
      description: data.description,
      level: data.level,
      durationMin: data.durationMin,
      coverUrl: data.coverUrl ?? null,
      ...(tagConnections ? { tags: { connect: tagConnections } } : {}),
    },
    include: baseInclude,
  });

  return mapProgramSummary(program);
}

export async function updateProgram(id: string, data: UpdateProgramInput) {
  const updateData: Prisma.programsUpdateInput = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.level !== undefined) {
    updateData.level = data.level;
  }

  if (typeof data.durationMin === 'number') {
    updateData.durationMin = data.durationMin;
  }

  if (data.coverUrl !== undefined) {
    updateData.coverUrl = data.coverUrl;
  }

  if (data.tags !== undefined) {
    const tagConnections = buildTagConnections(data.tags) ?? [];
    updateData.tags = {
      set: tagConnections,
    };
  }

  const program = await prisma.programs.update({
    where: { id },
    data: updateData,
    include: baseInclude,
  });

  return mapProgramSummary(program);
}

export async function deleteProgram(id: string) {
  await prisma.programs.delete({ where: { id } });
}

export async function listTagsByKind() {
  const tags = await prisma.tags.findMany({
    orderBy: [{ kind: 'asc' }, { name: 'asc' }],
  });

  const grouped: Record<'LEVEL' | 'FOCUS' | 'EQUIPMENT', Array<{ id: string; name: string; slug: string }>> = {
    LEVEL: [],
    FOCUS: [],
    EQUIPMENT: [],
  };

  for (const tag of tags) {
    grouped[tag.kind as keyof typeof grouped].push({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    });
  }

  return grouped;
}

export async function listProgramSessions(programId: string) {
  const sessions = await prisma.program_sessions.findMany({
    where: { programId },
    orderBy: { order: 'asc' },
  });

  return sessions.map((session) => ({
    id: session.id,
    order: session.order,
    title: session.title,
    durationMin: session.durationMin,
    videoUrl: session.videoUrl,
    poseIds: session.poseIds,
  }));
}

export async function createProgramSession(programId: string, data: CreateProgramSessionInput) {
  const session = await prisma.program_sessions.create({
    data: {
      programId,
      order: data.order,
      title: data.title,
      durationMin: data.durationMin,
      videoUrl: data.videoUrl ?? null,
      poseIds: data.poseIds ?? [],
    },
  });

  return {
    id: session.id,
    order: session.order,
    title: session.title,
    durationMin: session.durationMin,
    videoUrl: session.videoUrl,
    poseIds: session.poseIds,
  };
}

export async function updateProgramSession(sessionId: string, data: UpdateProgramSessionInput) {
  const session = await prisma.program_sessions.update({
    where: { id: sessionId },
    data: {
      ...(typeof data.order === 'number' ? { order: data.order } : {}),
      ...(data.title ? { title: data.title } : {}),
      ...(typeof data.durationMin === 'number' ? { durationMin: data.durationMin } : {}),
      ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
      ...(data.poseIds ? { poseIds: data.poseIds } : {}),
    },
  });

  return {
    id: session.id,
    order: session.order,
    title: session.title,
    durationMin: session.durationMin,
    videoUrl: session.videoUrl,
    poseIds: session.poseIds,
  };
}

export async function deleteProgramSession(sessionId: string) {
  await prisma.program_sessions.delete({ where: { id: sessionId } });
}
