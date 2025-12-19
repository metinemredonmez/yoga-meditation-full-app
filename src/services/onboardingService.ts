import { prisma } from '../utils/database';
import type {
  SaveOnboardingAnswerInput,
  CompleteOnboardingInput,
  UpdateOnboardingInput,
} from '../validation/onboardingSchemas';

// ==================== ONBOARDING ====================

export async function getOnboarding(userId: string) {
  return prisma.user_onboarding.findUnique({
    where: { userId },
  });
}

export async function startOnboarding(userId: string) {
  return prisma.user_onboarding.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      currentStep: 1,
      totalSteps: 5,
    },
  });
}

export async function saveAnswer(userId: string, input: SaveOnboardingAnswerInput) {
  const existing = await prisma.user_onboarding.findUnique({
    where: { userId },
  });

  const currentAnswers = (existing?.answers as Record<string, any>) || {};
  const newAnswers = { ...currentAnswers, ...input.answers };

  return prisma.user_onboarding.upsert({
    where: { userId },
    update: {
      currentStep: input.step,
      answers: newAnswers as any,
      experienceLevel: input.experienceLevel ?? existing?.experienceLevel,
      goals: input.goals ?? existing?.goals,
      interests: input.interests ?? existing?.interests,
      practiceFrequency: input.practiceFrequency ?? existing?.practiceFrequency,
      preferredDuration: input.preferredDuration ?? existing?.preferredDuration,
      preferredTime: input.preferredTime ?? existing?.preferredTime,
      healthConditions: input.healthConditions ?? existing?.healthConditions,
    },
    create: {
      userId,
      currentStep: input.step,
      totalSteps: 5,
      answers: (input.answers || {}) as any,
      experienceLevel: input.experienceLevel,
      goals: input.goals || [],
      interests: input.interests || [],
      practiceFrequency: input.practiceFrequency,
      preferredDuration: input.preferredDuration,
      preferredTime: input.preferredTime,
      healthConditions: input.healthConditions || [],
    },
  });
}

export async function updateOnboarding(userId: string, input: UpdateOnboardingInput) {
  const existing = await prisma.user_onboarding.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new Error('Onboarding not found');
  }

  const currentAnswers = (existing.answers as Record<string, any>) || {};
  const newAnswers = { ...currentAnswers, ...input.answers };

  return prisma.user_onboarding.update({
    where: { userId },
    data: {
      answers: newAnswers as any,
      experienceLevel: input.experienceLevel ?? existing.experienceLevel,
      goals: input.goals ?? existing.goals,
      interests: input.interests ?? existing.interests,
      practiceFrequency: input.practiceFrequency ?? existing.practiceFrequency,
      preferredDuration: input.preferredDuration ?? existing.preferredDuration,
      preferredTime: input.preferredTime ?? existing.preferredTime,
      healthConditions: input.healthConditions ?? existing.healthConditions,
    },
  });
}

export async function skipOnboarding(userId: string) {
  return prisma.user_onboarding.upsert({
    where: { userId },
    update: {
      skippedAt: new Date(),
    },
    create: {
      userId,
      currentStep: 1,
      totalSteps: 5,
      skippedAt: new Date(),
    },
  });
}

export async function completeOnboarding(userId: string, input: CompleteOnboardingInput) {
  return prisma.user_onboarding.upsert({
    where: { userId },
    update: {
      isCompleted: true,
      completedAt: new Date(),
      experienceLevel: input.experienceLevel,
      goals: input.goals,
      interests: input.interests,
      practiceFrequency: input.practiceFrequency,
      preferredDuration: input.preferredDuration,
      preferredTime: input.preferredTime,
      healthConditions: input.healthConditions,
      answers: (input.answers || {}) as any,
      currentStep: 5,
    },
    create: {
      userId,
      isCompleted: true,
      completedAt: new Date(),
      experienceLevel: input.experienceLevel,
      goals: input.goals,
      interests: input.interests,
      practiceFrequency: input.practiceFrequency,
      preferredDuration: input.preferredDuration,
      preferredTime: input.preferredTime,
      healthConditions: input.healthConditions,
      answers: (input.answers || {}) as any,
      currentStep: 5,
      totalSteps: 5,
    },
  });
}

export async function resetOnboarding(userId: string) {
  return prisma.user_onboarding.upsert({
    where: { userId },
    update: {
      isCompleted: false,
      completedAt: null,
      skippedAt: null,
      currentStep: 1,
      answers: {},
      experienceLevel: null,
      goals: [],
      interests: [],
      practiceFrequency: null,
      preferredDuration: null,
      preferredTime: null,
      healthConditions: [],
    },
    create: {
      userId,
      currentStep: 1,
      totalSteps: 5,
    },
  });
}

// ==================== RECOMMENDATIONS ====================

export async function getRecommendations(userId: string) {
  const onboarding = await prisma.user_onboarding.findUnique({
    where: { userId },
  });

  if (!onboarding || !onboarding.isCompleted) {
    return { recommendations: [], message: 'Onboarding not completed' };
  }

  const recommendations: any[] = [];

  // Based on goals
  if (onboarding.goals.includes('STRESS_RELIEF')) {
    recommendations.push({
      type: 'meditation',
      category: 'STRESS',
      title: 'Stres azaltıcı meditasyonlar',
    });
  }

  if (onboarding.goals.includes('BETTER_SLEEP')) {
    recommendations.push({
      type: 'sleep_story',
      title: 'Uyku hikayeleri',
    });
    recommendations.push({
      type: 'meditation',
      category: 'SLEEP',
      title: 'Uyku meditasyonları',
    });
  }

  if (onboarding.goals.includes('FOCUS')) {
    recommendations.push({
      type: 'meditation',
      category: 'FOCUS',
      title: 'Odaklanma meditasyonları',
    });
  }

  // Based on interests
  if (onboarding.interests.includes('BREATHWORK')) {
    recommendations.push({
      type: 'breathwork',
      title: 'Nefes egzersizleri',
    });
  }

  if (onboarding.interests.includes('JOURNALING')) {
    recommendations.push({
      type: 'journal',
      title: 'Günlük tutma',
    });
  }

  // Based on preferred duration
  if (onboarding.preferredDuration && onboarding.preferredDuration <= 10) {
    recommendations.push({
      type: 'quick_session',
      duration: onboarding.preferredDuration,
      title: 'Hızlı seanslar',
    });
  }

  return { recommendations };
}
