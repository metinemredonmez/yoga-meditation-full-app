import { prisma } from '../utils/database';
import type { PoseFilters, CreatePoseInput, UpdatePoseInput } from '../validation/poseSchemas';
import { Prisma, type poses } from '@prisma/client';

function buildPoseWhere(filters: PoseFilters): Prisma.posesWhereInput {
  const where: Prisma.posesWhereInput = {};

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters.bodyArea) {
    where.bodyArea = { contains: filters.bodyArea, mode: 'insensitive' };
  }

  if (filters.q) {
    const q = filters.q.trim();
    if (q.length > 0) {
      where.OR = [
        { englishName: { contains: q, mode: 'insensitive' } },
        { sanskritName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
  }

  return where;
}

function mapPose(pose: poses) {
  return {
    id: pose.id,
    sanskritName: pose.sanskritName,
    englishName: pose.englishName,
    difficulty: pose.difficulty,
    bodyArea: pose.bodyArea,
    description: pose.description,
    imageUrl: pose.imageUrl,
  };
}

export async function listPoses(filters: PoseFilters) {
  const poses = await prisma.poses.findMany({
    where: buildPoseWhere(filters),
    orderBy: [{ difficulty: 'asc' }, { englishName: 'asc' }],
  });

  return poses.map(mapPose);
}

export async function getPoseById(poseId: string) {
  const pose = await prisma.poses.findUnique({ where: { id: poseId } });
  return pose ? mapPose(pose) : null;
}

export async function createPose(data: CreatePoseInput) {
  const pose = await prisma.poses.create({
    data: {
      sanskritName: data.sanskritName ?? null,
      englishName: data.englishName,
      difficulty: data.difficulty,
      bodyArea: data.bodyArea,
      description: data.description,
      imageUrl: data.imageUrl ?? null,
    },
  });

  return mapPose(pose);
}

export async function updatePose(poseId: string, data: UpdatePoseInput) {
  const pose = await prisma.poses.update({
    where: { id: poseId },
    data: {
      ...(data.sanskritName !== undefined ? { sanskritName: data.sanskritName } : {}),
      ...(data.englishName ? { englishName: data.englishName } : {}),
      ...(data.difficulty ? { difficulty: data.difficulty } : {}),
      ...(data.bodyArea ? { bodyArea: data.bodyArea } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
    },
  });

  return mapPose(pose);
}

export async function deletePose(poseId: string) {
  await prisma.poses.delete({ where: { id: poseId } });
}
