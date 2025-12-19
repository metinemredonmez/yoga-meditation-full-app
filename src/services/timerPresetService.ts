import { prisma } from '../utils/database';
import type {
  CreateTimerPresetInput,
  UpdateTimerPresetInput,
  TimerPresetFilters,
} from '../validation/timerPresetSchemas';

// ==================== USER SERVICES ====================

export async function getTimerPresets(userId: string, filters: TimerPresetFilters) {
  const { isSystem, page, limit } = filters;

  // Get system presets and user presets
  const where: any = {
    OR: [
      { isSystem: true },
      { userId },
    ],
  };

  if (isSystem !== undefined) {
    where.OR = undefined;
    where.isSystem = isSystem;
    if (!isSystem) {
      where.userId = userId;
    }
  }

  const [presets, total] = await Promise.all([
    prisma.timer_presets.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        backgroundSound: true,
      },
    }),
    prisma.timer_presets.count({ where }),
  ]);

  return {
    presets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTimerPreset(id: string, userId?: string) {
  const preset = await prisma.timer_presets.findUnique({
    where: { id },
    include: {
      backgroundSound: true,
    },
  });

  if (!preset) return null;

  // Check access - system presets are public, user presets require ownership
  if (!preset.isSystem && preset.userId !== userId) {
    return null;
  }

  return preset;
}

export async function createTimerPreset(userId: string, input: CreateTimerPresetInput) {
  return prisma.timer_presets.create({
    data: {
      userId,
      name: input.name,
      nameEn: input.nameEn,
      description: input.description,
      duration: input.duration,
      intervalBell: input.intervalBell,
      startBell: input.startBell,
      endBell: input.endBell,
      intervalBellSound: input.intervalBellSound,
      backgroundSoundId: input.backgroundSoundId,
      backgroundVolume: input.backgroundVolume,
      icon: input.icon,
      color: input.color,
      isSystem: false,
      isDefault: false,
      sortOrder: input.sortOrder,
    },
    include: {
      backgroundSound: true,
    },
  });
}

export async function updateTimerPreset(userId: string, id: string, input: UpdateTimerPresetInput) {
  const preset = await prisma.timer_presets.findFirst({
    where: { id, userId, isSystem: false },
  });

  if (!preset) {
    throw new Error('Preset not found or cannot be modified');
  }

  return prisma.timer_presets.update({
    where: { id },
    data: input,
    include: {
      backgroundSound: true,
    },
  });
}

export async function deleteTimerPreset(userId: string, id: string) {
  const preset = await prisma.timer_presets.findFirst({
    where: { id, userId, isSystem: false },
  });

  if (!preset) {
    throw new Error('Preset not found or cannot be deleted');
  }

  await prisma.timer_presets.delete({
    where: { id },
  });
}

export async function setDefaultPreset(userId: string, id: string) {
  // Verify preset exists and is accessible
  const preset = await prisma.timer_presets.findFirst({
    where: {
      id,
      OR: [{ isSystem: true }, { userId }],
    },
  });

  if (!preset) {
    throw new Error('Preset not found');
  }

  // Remove default from all user presets
  await prisma.timer_presets.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  // If it's a user preset, set it as default
  if (!preset.isSystem) {
    await prisma.timer_presets.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  return preset;
}

// ==================== ADMIN SERVICES ====================

export async function createSystemPreset(input: CreateTimerPresetInput) {
  return prisma.timer_presets.create({
    data: {
      userId: null,
      name: input.name,
      nameEn: input.nameEn,
      description: input.description,
      duration: input.duration,
      intervalBell: input.intervalBell,
      startBell: input.startBell,
      endBell: input.endBell,
      intervalBellSound: input.intervalBellSound,
      backgroundSoundId: input.backgroundSoundId,
      backgroundVolume: input.backgroundVolume,
      icon: input.icon,
      color: input.color,
      isSystem: true,
      isDefault: false,
      sortOrder: input.sortOrder,
    },
    include: {
      backgroundSound: true,
    },
  });
}

export async function updateSystemPreset(id: string, input: UpdateTimerPresetInput) {
  return prisma.timer_presets.update({
    where: { id, isSystem: true },
    data: input,
    include: {
      backgroundSound: true,
    },
  });
}

export async function deleteSystemPreset(id: string) {
  await prisma.timer_presets.delete({
    where: { id, isSystem: true },
  });
}

export async function getAllTimerPresets(page: number = 1, limit: number = 50) {
  const [presets, total] = await Promise.all([
    prisma.timer_presets.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }],
      include: {
        backgroundSound: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.timer_presets.count(),
  ]);

  return {
    presets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
