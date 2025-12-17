import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding fitness app database (Yoga, Pilates, Meditation)...');

  // ============================================
  // ADMIN USERS
  // ============================================
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitness.com' },
    update: {},
    create: {
      email: 'admin@fitness.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      bio: 'System administrator',
    },
  });

  // ============================================
  // TEACHER USERS (Yoga, Pilates, Meditation Instructors)
  // ============================================
  const teacherPassword = await hashPassword('teacher123');

  // Teacher 1: Taylor - Yoga specialist
  const teacherTaylor = await prisma.user.upsert({
    where: { email: 'taylor@fitness.com' },
    update: {},
    create: {
      email: 'taylor@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Taylor',
      lastName: 'Johnson',
      role: 'TEACHER',
      bio: 'Experienced Vinyasa and Hatha yoga instructor with 10+ years of teaching experience.',
    },
  });

  // Teacher 2: Maya - Pilates specialist
  const teacherMaya = await prisma.user.upsert({
    where: { email: 'maya@fitness.com' },
    update: {},
    create: {
      email: 'maya@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Maya',
      lastName: 'Chen',
      role: 'TEACHER',
      bio: 'Certified Pilates instructor specializing in Mat Pilates and Reformer. BASI Pilates certified.',
    },
  });

  // Teacher 3: Alex - Meditation & Mindfulness specialist
  const teacherAlex = await prisma.user.upsert({
    where: { email: 'alex@fitness.com' },
    update: {},
    create: {
      email: 'alex@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Alex',
      lastName: 'Rivera',
      role: 'TEACHER',
      bio: 'Meditation and mindfulness coach. Specializes in breathwork, guided meditation, and stress relief.',
    },
  });

  // Teacher 4: Sophia - Pilates & Barre specialist
  const teacherSophia = await prisma.user.upsert({
    where: { email: 'sophia@fitness.com' },
    update: {},
    create: {
      email: 'sophia@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Sophia',
      lastName: 'Kim',
      role: 'TEACHER',
      bio: 'Pilates and Barre instructor with expertise in core strengthening and postural alignment.',
    },
  });

  // Keep backward compatibility reference
  const teacher = teacherTaylor;

  // ============================================
  // STUDENT USERS
  // ============================================
  const studentPassword = await hashPassword('student123');

  // Student 1: Sam - Original student (Yoga focused)
  const studentSam = await prisma.user.upsert({
    where: { email: 'sam@fitness.com' },
    update: {},
    create: {
      email: 'sam@fitness.com',
      passwordHash: studentPassword,
      firstName: 'Sam',
      lastName: 'Wilson',
      role: 'STUDENT',
      bio: 'Yoga enthusiast, intermediate level practitioner.',
    },
  });

  // Student 2: Emma - Pilates focused
  const studentEmma = await prisma.user.upsert({
    where: { email: 'emma@fitness.com' },
    update: {},
    create: {
      email: 'emma@fitness.com',
      passwordHash: studentPassword,
      firstName: 'Emma',
      lastName: 'Thompson',
      role: 'STUDENT',
      bio: 'Pilates lover, focusing on core strength and flexibility.',
    },
  });

  // Student 3: John - Mixed (Yoga + Pilates)
  const studentJohn = await prisma.user.upsert({
    where: { email: 'john@fitness.com' },
    update: {},
    create: {
      email: 'john@fitness.com',
      passwordHash: studentPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'STUDENT',
      bio: 'Enjoys both yoga and pilates for overall fitness.',
    },
  });

  // Student 4: Lisa - Meditation focused
  const studentLisa = await prisma.user.upsert({
    where: { email: 'lisa@fitness.com' },
    update: {},
    create: {
      email: 'lisa@fitness.com',
      passwordHash: studentPassword,
      firstName: 'Lisa',
      lastName: 'Brown',
      role: 'STUDENT',
      bio: 'Beginner exploring meditation and mindfulness practices.',
    },
  });

  // Student 5: Michael - Advanced practitioner
  const studentMichael = await prisma.user.upsert({
    where: { email: 'michael@fitness.com' },
    update: {},
    create: {
      email: 'michael@fitness.com',
      passwordHash: studentPassword,
      firstName: 'Michael',
      lastName: 'Davis',
      role: 'STUDENT',
      bio: 'Advanced level practitioner with 5+ years of yoga and pilates experience.',
    },
  });

  // Student 6: Sarah - Premium member
  const studentSarah = await prisma.user.upsert({
    where: { email: 'sarah@fitness.com' },
    update: {},
    create: {
      email: 'sarah@fitness.com',
      passwordHash: studentPassword,
      firstName: 'Sarah',
      lastName: 'Taylor',
      role: 'STUDENT',
      bio: 'Premium member focusing on Pilates and Barre workouts.',
    },
  });

  // Student 7: Demo user
  const studentDemo = await prisma.user.upsert({
    where: { email: 'demo@fitness.com' },
    update: {},
    create: {
      email: 'demo@fitness.com',
      passwordHash: studentPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'STUDENT',
      bio: 'Demo account for testing purposes.',
    },
  });

  // Keep backward compatibility reference
  const student = studentSam;

  console.log('👤 Users ensured (1 Admin, 4 Teachers, 7 Students)');

  const tagSeeds = [
    // Level tags
    { id: 'tag-level-beginner', kind: 'LEVEL' as const, name: 'Beginner', slug: 'beginner' },
    { id: 'tag-level-intermediate', kind: 'LEVEL' as const, name: 'Intermediate', slug: 'intermediate' },
    { id: 'tag-level-advanced', kind: 'LEVEL' as const, name: 'Advanced', slug: 'advanced' },
    // Discipline/Category tags (using FOCUS as TagKind doesn't have DISCIPLINE)
    { id: 'tag-discipline-yoga', kind: 'FOCUS' as const, name: 'Yoga', slug: 'yoga' },
    { id: 'tag-discipline-pilates', kind: 'FOCUS' as const, name: 'Pilates', slug: 'pilates' },
    { id: 'tag-discipline-meditation', kind: 'FOCUS' as const, name: 'Meditation', slug: 'meditation' },
    { id: 'tag-discipline-barre', kind: 'FOCUS' as const, name: 'Barre', slug: 'barre' },
    { id: 'tag-discipline-stretching', kind: 'FOCUS' as const, name: 'Stretching', slug: 'stretching' },
    { id: 'tag-discipline-breathwork', kind: 'FOCUS' as const, name: 'Breathwork', slug: 'breathwork' },
    // Focus tags
    { id: 'tag-focus-flexibility', kind: 'FOCUS' as const, name: 'Flexibility', slug: 'flexibility' },
    { id: 'tag-focus-strength', kind: 'FOCUS' as const, name: 'Strength', slug: 'strength' },
    { id: 'tag-focus-balance', kind: 'FOCUS' as const, name: 'Balance', slug: 'balance' },
    { id: 'tag-focus-mindfulness', kind: 'FOCUS' as const, name: 'Mindfulness', slug: 'mindfulness' },
    { id: 'tag-focus-energy', kind: 'FOCUS' as const, name: 'Energy', slug: 'energy' },
    { id: 'tag-focus-recovery', kind: 'FOCUS' as const, name: 'Recovery', slug: 'recovery' },
    { id: 'tag-focus-mobility', kind: 'FOCUS' as const, name: 'Mobility', slug: 'mobility' },
    { id: 'tag-focus-core', kind: 'FOCUS' as const, name: 'Core', slug: 'core' },
    { id: 'tag-focus-posture', kind: 'FOCUS' as const, name: 'Posture', slug: 'posture' },
    { id: 'tag-focus-toning', kind: 'FOCUS' as const, name: 'Toning', slug: 'toning' },
    { id: 'tag-focus-relaxation', kind: 'FOCUS' as const, name: 'Relaxation', slug: 'relaxation' },
    { id: 'tag-focus-stress-relief', kind: 'FOCUS' as const, name: 'Stress Relief', slug: 'stress-relief' },
    { id: 'tag-focus-sleep', kind: 'FOCUS' as const, name: 'Sleep', slug: 'sleep' },
    // Body part tags (using FOCUS)
    { id: 'tag-body-full-body', kind: 'FOCUS' as const, name: 'Full Body', slug: 'full-body' },
    { id: 'tag-body-core', kind: 'FOCUS' as const, name: 'Core & Abs', slug: 'core-abs' },
    { id: 'tag-body-legs', kind: 'FOCUS' as const, name: 'Legs & Glutes', slug: 'legs-glutes' },
    { id: 'tag-body-arms', kind: 'FOCUS' as const, name: 'Arms & Shoulders', slug: 'arms-shoulders' },
    { id: 'tag-body-back', kind: 'FOCUS' as const, name: 'Back', slug: 'back' },
    { id: 'tag-body-hips', kind: 'FOCUS' as const, name: 'Hips', slug: 'hips' },
    // Duration tags (using LEVEL)
    { id: 'tag-duration-quick', kind: 'LEVEL' as const, name: '5-15 min', slug: 'quick' },
    { id: 'tag-duration-medium', kind: 'LEVEL' as const, name: '15-30 min', slug: 'medium' },
    { id: 'tag-duration-long', kind: 'LEVEL' as const, name: '30-60 min', slug: 'long' },
    // Equipment tags
    { id: 'tag-equip-mat', kind: 'EQUIPMENT' as const, name: 'Mat', slug: 'mat' },
    { id: 'tag-equip-blocks', kind: 'EQUIPMENT' as const, name: 'Blocks', slug: 'blocks' },
    { id: 'tag-equip-strap', kind: 'EQUIPMENT' as const, name: 'Strap', slug: 'strap' },
    { id: 'tag-equip-bolster', kind: 'EQUIPMENT' as const, name: 'Bolster', slug: 'bolster' },
    { id: 'tag-equip-reformer', kind: 'EQUIPMENT' as const, name: 'Reformer', slug: 'reformer' },
    { id: 'tag-equip-pilates-ring', kind: 'EQUIPMENT' as const, name: 'Pilates Ring', slug: 'pilates-ring' },
    { id: 'tag-equip-resistance-band', kind: 'EQUIPMENT' as const, name: 'Resistance Band', slug: 'resistance-band' },
    { id: 'tag-equip-foam-roller', kind: 'EQUIPMENT' as const, name: 'Foam Roller', slug: 'foam-roller' },
    { id: 'tag-equip-pilates-ball', kind: 'EQUIPMENT' as const, name: 'Pilates Ball', slug: 'pilates-ball' },
    { id: 'tag-equip-no-equipment', kind: 'EQUIPMENT' as const, name: 'No Equipment', slug: 'no-equipment' },
  ];

  for (const tag of tagSeeds) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {
        name: tag.name,
        kind: tag.kind,
      },
      create: tag,
    });
  }

  console.log('🏷️ Tags ensured');

  const programSeeds = [
    {
      id: 'program-gentle-foundations',
      title: 'Gentle Foundations',
      description: 'A four-part journey to build confidence with mindful movement and breath awareness.',
      level: 'BEGINNER' as const,
      durationMin: 45,
      coverUrl: 'https://images.yoga-app.local/programs/gentle-foundations.jpg',
      tagSlugs: ['beginner', 'flexibility', 'mindfulness', 'mat'],
      sessions: [
        {
          id: 'program-gentle-foundations-session-1',
          order: 1,
          title: 'Breath & Body Awareness',
          durationMin: 10,
          videoUrl: 'https://videos.yoga-app.local/programs/gentle-foundations/session-1',
          poseIds: ['pose-cat-cow', 'pose-child'],
        },
        {
          id: 'program-gentle-foundations-session-2',
          order: 2,
          title: 'Gentle Mobility Flow',
          durationMin: 12,
          videoUrl: 'https://videos.yoga-app.local/programs/gentle-foundations/session-2',
          poseIds: ['pose-down-dog', 'pose-forward-fold'],
        },
        {
          id: 'program-gentle-foundations-session-3',
          order: 3,
          title: 'Standing Balance',
          durationMin: 11,
          videoUrl: 'https://videos.yoga-app.local/programs/gentle-foundations/session-3',
          poseIds: ['pose-tree', 'pose-warrior-2'],
        },
        {
          id: 'program-gentle-foundations-session-4',
          order: 4,
          title: 'Restorative Reset',
          durationMin: 12,
          videoUrl: 'https://videos.yoga-app.local/programs/gentle-foundations/session-4',
          poseIds: ['pose-legs-up-wall', 'pose-savasana'],
        },
      ],
    },
    {
      id: 'program-power-flow-series',
      title: 'Power Flow Series',
      description: 'Boost stamina and strength with dynamic vinyasa sequences and focused core work.',
      level: 'INTERMEDIATE' as const,
      durationMin: 55,
      coverUrl: 'https://images.yoga-app.local/programs/power-flow-series.jpg',
      tagSlugs: ['intermediate', 'strength', 'core', 'energy', 'blocks'],
      sessions: [
        {
          id: 'program-power-flow-session-1',
          order: 1,
          title: 'Dynamic Warm-up',
          durationMin: 12,
          videoUrl: 'https://videos.yoga-app.local/programs/power-flow-series/session-1',
          poseIds: ['pose-sun-salutation-a', 'pose-plank'],
        },
        {
          id: 'program-power-flow-session-2',
          order: 2,
          title: 'Strength & Stability Flow',
          durationMin: 15,
          videoUrl: 'https://videos.yoga-app.local/programs/power-flow-series/session-2',
          poseIds: ['pose-warrior-3', 'pose-chair'],
        },
        {
          id: 'program-power-flow-session-3',
          order: 3,
          title: 'Core Conditioning',
          durationMin: 14,
          videoUrl: 'https://videos.yoga-app.local/programs/power-flow-series/session-3',
          poseIds: ['pose-boat', 'pose-side-plank'],
        },
        {
          id: 'program-power-flow-session-4',
          order: 4,
          title: 'Cooling Stretch',
          durationMin: 14,
          videoUrl: 'https://videos.yoga-app.local/programs/power-flow-series/session-4',
          poseIds: ['pose-pigeon', 'pose-seated-forward-fold'],
        },
      ],
    },
    {
      id: 'program-mindful-strength',
      title: 'Mindful Strength Builder',
      description: 'Challenge your body and focus with deliberate sequencing and mindful holds.',
      level: 'ADVANCED' as const,
      durationMin: 60,
      coverUrl: 'https://images.yoga-app.local/programs/mindful-strength.jpg',
      tagSlugs: ['advanced', 'strength', 'balance', 'mobility', 'strap'],
      sessions: [
        {
          id: 'program-mindful-strength-session-1',
          order: 1,
          title: 'Progressive Warm-up',
          durationMin: 15,
          videoUrl: 'https://videos.yoga-app.local/programs/mindful-strength/session-1',
          poseIds: ['pose-sun-salutation-b', 'pose-warrior-1'],
        },
        {
          id: 'program-mindful-strength-session-2',
          order: 2,
          title: 'Balance & Focus',
          durationMin: 15,
          videoUrl: 'https://videos.yoga-app.local/programs/mindful-strength/session-2',
          poseIds: ['pose-half-moon', 'pose-eagle'],
        },
        {
          id: 'program-mindful-strength-session-3',
          order: 3,
          title: 'Strength & Control',
          durationMin: 15,
          videoUrl: 'https://videos.yoga-app.local/programs/mindful-strength/session-3',
          poseIds: ['pose-crow', 'pose-chaturanga'],
        },
        {
          id: 'program-mindful-strength-session-4',
          order: 4,
          title: 'Deep Mobility Reset',
          durationMin: 15,
          videoUrl: 'https://videos.yoga-app.local/programs/mindful-strength/session-4',
          poseIds: ['pose-king-pigeon', 'pose-reclined-twist'],
        },
      ],
    },
    // ============================================
    // PILATES PROGRAMS
    // ============================================
    {
      id: 'program-pilates-fundamentals',
      title: 'Pilates Fundamentals',
      description: 'Learn the essential Pilates principles and foundational exercises to build a strong practice.',
      level: 'BEGINNER' as const,
      durationMin: 40,
      coverUrl: 'https://images.fitness-app.local/programs/pilates-fundamentals.jpg',
      tagSlugs: ['beginner', 'pilates', 'core', 'posture', 'mat'],
      sessions: [
        {
          id: 'program-pilates-fundamentals-session-1',
          order: 1,
          title: 'Introduction to Pilates Breathing',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-fundamentals/session-1',
          poseIds: ['pilates-hundred', 'pilates-spine-stretch'],
        },
        {
          id: 'program-pilates-fundamentals-session-2',
          order: 2,
          title: 'Core Connection',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-fundamentals/session-2',
          poseIds: ['pilates-single-leg-stretch', 'pilates-rolling-like-ball'],
        },
        {
          id: 'program-pilates-fundamentals-session-3',
          order: 3,
          title: 'Spinal Mobility',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-fundamentals/session-3',
          poseIds: ['pilates-roll-up', 'pilates-spine-twist'],
        },
        {
          id: 'program-pilates-fundamentals-session-4',
          order: 4,
          title: 'Lower Body Basics',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-fundamentals/session-4',
          poseIds: ['pilates-single-leg-circles', 'pilates-shoulder-bridge'],
        },
      ],
    },
    {
      id: 'program-pilates-core-strength',
      title: 'Core Strength Pilates',
      description: 'Intensive core-focused Pilates program to build abdominal strength and stability.',
      level: 'INTERMEDIATE' as const,
      durationMin: 50,
      coverUrl: 'https://images.fitness-app.local/programs/pilates-core-strength.jpg',
      tagSlugs: ['intermediate', 'pilates', 'core', 'strength', 'toning', 'mat'],
      sessions: [
        {
          id: 'program-pilates-core-session-1',
          order: 1,
          title: 'Abdominal Series Intro',
          durationMin: 12,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-core-strength/session-1',
          poseIds: ['pilates-hundred', 'pilates-single-leg-stretch', 'pilates-double-leg-stretch'],
        },
        {
          id: 'program-pilates-core-session-2',
          order: 2,
          title: 'Oblique Work',
          durationMin: 13,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-core-strength/session-2',
          poseIds: ['pilates-scissors', 'pilates-bicycle', 'pilates-corkscrew'],
        },
        {
          id: 'program-pilates-core-session-3',
          order: 3,
          title: 'Full Core Challenge',
          durationMin: 13,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-core-strength/session-3',
          poseIds: ['pilates-teaser', 'pilates-roll-up', 'pose-plank'],
        },
        {
          id: 'program-pilates-core-session-4',
          order: 4,
          title: 'Core & Back Balance',
          durationMin: 12,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-core-strength/session-4',
          poseIds: ['pilates-swan', 'pilates-swimming', 'pilates-mermaid'],
        },
      ],
    },
    {
      id: 'program-pilates-full-body',
      title: 'Full Body Pilates Flow',
      description: 'Complete full-body Pilates workout targeting all major muscle groups.',
      level: 'INTERMEDIATE' as const,
      durationMin: 55,
      coverUrl: 'https://images.fitness-app.local/programs/pilates-full-body.jpg',
      tagSlugs: ['intermediate', 'pilates', 'full-body', 'strength', 'flexibility', 'mat'],
      sessions: [
        {
          id: 'program-pilates-fullbody-session-1',
          order: 1,
          title: 'Warm-Up & Core Activation',
          durationMin: 12,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-full-body/session-1',
          poseIds: ['pilates-hundred', 'pilates-roll-up', 'pilates-single-leg-circles'],
        },
        {
          id: 'program-pilates-fullbody-session-2',
          order: 2,
          title: 'Upper Body & Arms',
          durationMin: 14,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-full-body/session-2',
          poseIds: ['pilates-leg-pull-front', 'pose-plank', 'pose-side-plank'],
        },
        {
          id: 'program-pilates-fullbody-session-3',
          order: 3,
          title: 'Lower Body & Glutes',
          durationMin: 15,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-full-body/session-3',
          poseIds: ['pilates-side-kick', 'pilates-shoulder-bridge', 'pilates-leg-pull-back'],
        },
        {
          id: 'program-pilates-fullbody-session-4',
          order: 4,
          title: 'Stretch & Cool Down',
          durationMin: 14,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-full-body/session-4',
          poseIds: ['pilates-mermaid', 'pilates-spine-stretch', 'pilates-saw'],
        },
      ],
    },
    {
      id: 'program-pilates-advanced',
      title: 'Advanced Mat Pilates',
      description: 'Challenge yourself with advanced Pilates exercises requiring strength, control, and precision.',
      level: 'ADVANCED' as const,
      durationMin: 60,
      coverUrl: 'https://images.fitness-app.local/programs/pilates-advanced.jpg',
      tagSlugs: ['advanced', 'pilates', 'core', 'strength', 'balance', 'mat'],
      sessions: [
        {
          id: 'program-pilates-advanced-session-1',
          order: 1,
          title: 'Advanced Warm-Up Flow',
          durationMin: 15,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-advanced/session-1',
          poseIds: ['pilates-hundred', 'pilates-roll-up', 'pilates-rolling-like-ball'],
        },
        {
          id: 'program-pilates-advanced-session-2',
          order: 2,
          title: 'Teaser Variations',
          durationMin: 15,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-advanced/session-2',
          poseIds: ['pilates-teaser', 'pilates-corkscrew', 'pilates-scissors'],
        },
        {
          id: 'program-pilates-advanced-session-3',
          order: 3,
          title: 'Control & Balance',
          durationMin: 15,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-advanced/session-3',
          poseIds: ['pilates-leg-pull-front', 'pilates-leg-pull-back', 'pose-side-plank'],
        },
        {
          id: 'program-pilates-advanced-session-4',
          order: 4,
          title: 'Integration & Recovery',
          durationMin: 15,
          videoUrl: 'https://videos.fitness-app.local/programs/pilates-advanced/session-4',
          poseIds: ['pilates-swimming', 'pilates-swan', 'pilates-mermaid'],
        },
      ],
    },
    // ============================================
    // MEDITATION PROGRAMS
    // ============================================
    {
      id: 'program-meditation-basics',
      title: 'Meditation Basics',
      description: 'Begin your meditation journey with foundational techniques for mindfulness and relaxation.',
      level: 'BEGINNER' as const,
      durationMin: 30,
      coverUrl: 'https://images.fitness-app.local/programs/meditation-basics.jpg',
      tagSlugs: ['beginner', 'meditation', 'mindfulness', 'relaxation', 'stress-relief', 'no-equipment'],
      sessions: [
        {
          id: 'program-meditation-basics-session-1',
          order: 1,
          title: 'Introduction to Breath Awareness',
          durationMin: 7,
          videoUrl: 'https://videos.fitness-app.local/programs/meditation-basics/session-1',
          poseIds: [],
        },
        {
          id: 'program-meditation-basics-session-2',
          order: 2,
          title: 'Body Scan Meditation',
          durationMin: 8,
          videoUrl: 'https://videos.fitness-app.local/programs/meditation-basics/session-2',
          poseIds: [],
        },
        {
          id: 'program-meditation-basics-session-3',
          order: 3,
          title: 'Mindful Awareness',
          durationMin: 8,
          videoUrl: 'https://videos.fitness-app.local/programs/meditation-basics/session-3',
          poseIds: [],
        },
        {
          id: 'program-meditation-basics-session-4',
          order: 4,
          title: 'Loving Kindness Practice',
          durationMin: 7,
          videoUrl: 'https://videos.fitness-app.local/programs/meditation-basics/session-4',
          poseIds: [],
        },
      ],
    },
    {
      id: 'program-sleep-meditation',
      title: 'Sleep & Relaxation',
      description: 'Guided meditations designed to help you unwind and achieve restful sleep.',
      level: 'BEGINNER' as const,
      durationMin: 35,
      coverUrl: 'https://images.fitness-app.local/programs/sleep-meditation.jpg',
      tagSlugs: ['beginner', 'meditation', 'sleep', 'relaxation', 'stress-relief', 'no-equipment'],
      sessions: [
        {
          id: 'program-sleep-session-1',
          order: 1,
          title: 'Evening Wind Down',
          durationMin: 8,
          videoUrl: 'https://videos.fitness-app.local/programs/sleep-meditation/session-1',
          poseIds: [],
        },
        {
          id: 'program-sleep-session-2',
          order: 2,
          title: 'Progressive Relaxation',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/sleep-meditation/session-2',
          poseIds: [],
        },
        {
          id: 'program-sleep-session-3',
          order: 3,
          title: 'Sleep Story Meditation',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/sleep-meditation/session-3',
          poseIds: [],
        },
        {
          id: 'program-sleep-session-4',
          order: 4,
          title: 'Deep Rest Practice',
          durationMin: 7,
          videoUrl: 'https://videos.fitness-app.local/programs/sleep-meditation/session-4',
          poseIds: [],
        },
      ],
    },
    {
      id: 'program-stress-relief',
      title: 'Stress Relief & Calm',
      description: 'Meditation techniques to reduce stress, anxiety, and find inner peace.',
      level: 'BEGINNER' as const,
      durationMin: 40,
      coverUrl: 'https://images.fitness-app.local/programs/stress-relief.jpg',
      tagSlugs: ['beginner', 'meditation', 'stress-relief', 'mindfulness', 'relaxation', 'no-equipment'],
      sessions: [
        {
          id: 'program-stress-relief-session-1',
          order: 1,
          title: 'Calming Breath Techniques',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/stress-relief/session-1',
          poseIds: [],
        },
        {
          id: 'program-stress-relief-session-2',
          order: 2,
          title: 'Releasing Tension',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/stress-relief/session-2',
          poseIds: [],
        },
        {
          id: 'program-stress-relief-session-3',
          order: 3,
          title: 'Grounding Practice',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/stress-relief/session-3',
          poseIds: [],
        },
        {
          id: 'program-stress-relief-session-4',
          order: 4,
          title: 'Finding Inner Peace',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/stress-relief/session-4',
          poseIds: [],
        },
      ],
    },
    // ============================================
    // BARRE PROGRAMS
    // ============================================
    {
      id: 'program-barre-basics',
      title: 'Barre Basics',
      description: 'Introduction to barre-inspired workouts combining ballet, Pilates, and yoga elements.',
      level: 'BEGINNER' as const,
      durationMin: 45,
      coverUrl: 'https://images.fitness-app.local/programs/barre-basics.jpg',
      tagSlugs: ['beginner', 'barre', 'toning', 'legs-glutes', 'core', 'no-equipment'],
      sessions: [
        {
          id: 'program-barre-basics-session-1',
          order: 1,
          title: 'Barre Fundamentals',
          durationMin: 10,
          videoUrl: 'https://videos.fitness-app.local/programs/barre-basics/session-1',
          poseIds: ['pose-plank', 'pilates-shoulder-bridge'],
        },
        {
          id: 'program-barre-basics-session-2',
          order: 2,
          title: 'Lower Body Sculpt',
          durationMin: 12,
          videoUrl: 'https://videos.fitness-app.local/programs/barre-basics/session-2',
          poseIds: ['pilates-side-kick', 'pose-warrior-2'],
        },
        {
          id: 'program-barre-basics-session-3',
          order: 3,
          title: 'Core & Arms',
          durationMin: 12,
          videoUrl: 'https://videos.fitness-app.local/programs/barre-basics/session-3',
          poseIds: ['pose-plank', 'pilates-hundred'],
        },
        {
          id: 'program-barre-basics-session-4',
          order: 4,
          title: 'Full Body Flow',
          durationMin: 11,
          videoUrl: 'https://videos.fitness-app.local/programs/barre-basics/session-4',
          poseIds: ['pilates-mermaid', 'pose-bridge'],
        },
      ],
    },
    // ============================================
    // STRETCHING PROGRAMS
    // ============================================
    {
      id: 'program-morning-stretch',
      title: 'Morning Stretch Routine',
      description: 'Wake up your body with gentle stretches to improve flexibility and start your day energized.',
      level: 'BEGINNER' as const,
      durationMin: 25,
      coverUrl: 'https://images.fitness-app.local/programs/morning-stretch.jpg',
      tagSlugs: ['beginner', 'stretching', 'flexibility', 'energy', 'quick', 'no-equipment'],
      sessions: [
        {
          id: 'program-morning-stretch-session-1',
          order: 1,
          title: 'Gentle Wake Up',
          durationMin: 6,
          videoUrl: 'https://videos.fitness-app.local/programs/morning-stretch/session-1',
          poseIds: ['pose-child', 'pose-cobra'],
        },
        {
          id: 'program-morning-stretch-session-2',
          order: 2,
          title: 'Spine Mobilization',
          durationMin: 6,
          videoUrl: 'https://videos.fitness-app.local/programs/morning-stretch/session-2',
          poseIds: ['pilates-spine-stretch', 'pilates-spine-twist'],
        },
        {
          id: 'program-morning-stretch-session-3',
          order: 3,
          title: 'Hip Opening',
          durationMin: 7,
          videoUrl: 'https://videos.fitness-app.local/programs/morning-stretch/session-3',
          poseIds: ['pose-pigeon', 'pilates-single-leg-circles'],
        },
        {
          id: 'program-morning-stretch-session-4',
          order: 4,
          title: 'Energizing Flow',
          durationMin: 6,
          videoUrl: 'https://videos.fitness-app.local/programs/morning-stretch/session-4',
          poseIds: ['pose-downward-dog', 'pose-warrior-1'],
        },
      ],
    },
  ];

  for (const program of programSeeds) {
    await prisma.program.upsert({
      where: { id: program.id },
      update: {
        title: program.title,
        description: program.description,
        level: program.level,
        durationMin: program.durationMin,
        coverUrl: program.coverUrl,
        tags: {
          set: program.tagSlugs.map((slug) => ({ slug })),
        },
        sessions: {
          deleteMany: {},
          create: program.sessions.map((session) => ({
            id: session.id,
            order: session.order,
            title: session.title,
            durationMin: session.durationMin,
            videoUrl: session.videoUrl,
            poseIds: session.poseIds,
          })),
        },
      },
      create: {
        id: program.id,
        title: program.title,
        description: program.description,
        level: program.level,
        durationMin: program.durationMin,
        coverUrl: program.coverUrl,
        tags: {
          connect: program.tagSlugs.map((slug) => ({ slug })),
        },
        sessions: {
          create: program.sessions.map((session) => ({
            id: session.id,
            order: session.order,
            title: session.title,
            durationMin: session.durationMin,
            videoUrl: session.videoUrl,
            poseIds: session.poseIds,
          })),
        },
      },
    });
  }

  console.log('📚 Programs ensured');

  const challenge = await prisma.challenge.upsert({
    where: { id: 'challenge-30-day-reset' },
    update: {
      title: '30-Day Reset',
      description: 'Commit to daily mindful movement with a curated 30-day schedule.',
      startAt: new Date(new Date().setHours(0, 0, 0, 0)),
      endAt: new Date(new Date().setDate(new Date().getDate() + 30)),
      targetDays: 25,
      coverUrl: 'https://images.yoga-app.local/challenges/reset.jpg',
    },
    create: {
      id: 'challenge-30-day-reset',
      title: '30-Day Reset',
      description: 'Commit to daily mindful movement with a curated 30-day schedule.',
      startAt: new Date(new Date().setHours(0, 0, 0, 0)),
      endAt: new Date(new Date().setDate(new Date().getDate() + 30)),
      targetDays: 25,
      coverUrl: 'https://images.yoga-app.local/challenges/reset.jpg',
    },
  });

  await prisma.challengeEnrollment.upsert({
    where: {
      userId_challengeId: {
        userId: student.id,
        challengeId: challenge.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      challengeId: challenge.id,
      joinedAt: new Date(),
    },
  });

  const firstProgram = await prisma.program.findUnique({
    where: { id: 'program-gentle-foundations' },
    include: { sessions: true },
  });

  if (firstProgram) {
    const sessionIds = firstProgram.sessions
      .sort((a, b) => a.order - b.order)
      .map((session) => session.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastThreeDays = [2, 1, 0].map((offset) => {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      return date;
    });

    await prisma.dailyCheck.createMany({
      data: lastThreeDays.map((date, index) => ({
        userId: student.id,
        challengeId: challenge.id,
        programSessionId: sessionIds[index % sessionIds.length] ?? null,
        date,
      })),
      skipDuplicates: true,
    });

    await prisma.plannerEntry.createMany({
      data: sessionIds.slice(0, 3).map((sessionId, index) => ({
        userId: student.id,
        itemType: 'PROGRAM_SESSION',
        programSessionId: sessionId,
        classId: null,
        plannedAt: new Date(today.getTime() + (index + 1) * 24 * 60 * 60 * 1000),
      })),
      skipDuplicates: true,
    });
  }

  console.log('🏆 Challenges, daily checks, and planner entries ensured');

  // Create subscription plan first
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-monthly-basic' },
    update: {},
    create: {
      id: 'plan-monthly-basic',
      name: 'Basic Monthly',
      description: 'Basic monthly subscription',
      tier: 'BASIC',
      priceMonthly: 19.99,
      priceYearly: 199.99,
      currency: 'USD',
      features: ['Access to all classes', 'Basic progress tracking'],
      stripePriceIdMonthly: 'price_monthly_basic',
      isActive: true,
    },
  });

  const subscription = await prisma.subscription.upsert({
    where: { id: 'subscription-student-monthly' },
    update: {
      userId: student.id,
      planId: basicPlan.id,
      provider: 'STRIPE',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
    create: {
      id: 'subscription-student-monthly',
      userId: student.id,
      planId: basicPlan.id,
      provider: 'STRIPE',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.payment.upsert({
    where: { transactionId: 'sub-demo-transaction' },
    update: {},
    create: {
      userId: student.id,
      provider: 'STRIPE',
      amount: 19.99,
      currency: 'USD',
      status: 'COMPLETED',
      transactionId: 'sub-demo-transaction',
      subscriptionId: subscription.id,
    },
  });

  console.log('💳 Subscriptions and payments ensured');

  const poseSeeds = [
    {
      id: 'pose-mountain',
      sanskritName: 'Tadasana',
      englishName: 'Mountain Pose',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Standing Alignment',
      description: 'A foundational standing pose that promotes posture and balance.',
      imageUrl: 'https://images.yoga-app.local/poses/mountain.jpg',
    },
    {
      id: 'pose-downward-dog',
      sanskritName: 'Adho Mukha Svanasana',
      englishName: 'Downward Facing Dog',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Shoulders & Hamstrings',
      description: 'An energising inversion that lengthens the spine and hamstrings.',
      imageUrl: 'https://images.yoga-app.local/poses/downward-dog.jpg',
    },
    {
      id: 'pose-plank',
      sanskritName: 'Phalakasana',
      englishName: 'Plank Pose',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Core & Shoulders',
      description: 'A strengthening pose that builds core and upper-body stability.',
      imageUrl: 'https://images.yoga-app.local/poses/plank.jpg',
    },
    {
      id: 'pose-warrior-1',
      sanskritName: 'Virabhadrasana I',
      englishName: 'Warrior I',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Legs & Hips',
      description: 'A dynamic standing pose that strengthens legs and opens the chest.',
      imageUrl: 'https://images.yoga-app.local/poses/warrior-1.jpg',
    },
    {
      id: 'pose-warrior-2',
      sanskritName: 'Virabhadrasana II',
      englishName: 'Warrior II',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Legs & Hips',
      description: 'Builds endurance and stability while opening the hips.',
      imageUrl: 'https://images.yoga-app.local/poses/warrior-2.jpg',
    },
    {
      id: 'pose-triangle',
      sanskritName: 'Trikonasana',
      englishName: 'Triangle Pose',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Hamstrings & Torso',
      description: 'Lengthens the side body and strengthens the legs.',
      imageUrl: 'https://images.yoga-app.local/poses/triangle.jpg',
    },
    {
      id: 'pose-tree',
      sanskritName: 'Vrikshasana',
      englishName: 'Tree Pose',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Balance & Core',
      description: 'Improves balance and focus while strengthening the standing leg.',
      imageUrl: 'https://images.yoga-app.local/poses/tree.jpg',
    },
    {
      id: 'pose-bridge',
      sanskritName: 'Setu Bandhasana',
      englishName: 'Bridge Pose',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Back & Glutes',
      description: 'Opens the chest and strengthens the posterior chain.',
      imageUrl: 'https://images.yoga-app.local/poses/bridge.jpg',
    },
    {
      id: 'pose-cobra',
      sanskritName: 'Bhujangasana',
      englishName: 'Cobra Pose',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Spine & Chest',
      description: 'Gently strengthens the spine while opening the heart.',
      imageUrl: 'https://images.yoga-app.local/poses/cobra.jpg',
    },
    {
      id: 'pose-bow',
      sanskritName: 'Dhanurasana',
      englishName: 'Bow Pose',
      difficulty: 'ADVANCED' as const,
      bodyArea: 'Back & Shoulders',
      description: 'A deep backbend that opens the shoulders and hip flexors.',
      imageUrl: 'https://images.yoga-app.local/poses/bow.jpg',
    },
    {
      id: 'pose-crow',
      sanskritName: 'Bakasana',
      englishName: 'Crow Pose',
      difficulty: 'ADVANCED' as const,
      bodyArea: 'Arms & Core',
      description: 'An arm balance requiring focus, strength, and balance.',
      imageUrl: 'https://images.yoga-app.local/poses/crow.jpg',
    },
    {
      id: 'pose-pigeon',
      sanskritName: 'Eka Pada Rajakapotasana',
      englishName: 'Pigeon Pose',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Hips & Glutes',
      description: 'Deep hip opener that releases tension in the glutes and lower back.',
      imageUrl: 'https://images.yoga-app.local/poses/pigeon.jpg',
    },
    {
      id: 'pose-sun-salutation-a',
      sanskritName: 'Surya Namaskar A',
      englishName: 'Sun Salutation A',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Full Body',
      description: 'A flowing sequence that warms the body and connects breath and movement.',
      imageUrl: 'https://images.yoga-app.local/poses/sun-salutation-a.jpg',
    },
    {
      id: 'pose-sun-salutation-b',
      sanskritName: 'Surya Namaskar B',
      englishName: 'Sun Salutation B',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Full Body',
      description: 'An energising variation with added strength components.',
      imageUrl: 'https://images.yoga-app.local/poses/sun-salutation-b.jpg',
    },
    {
      id: 'pose-boat',
      sanskritName: 'Navasana',
      englishName: 'Boat Pose',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Core',
      description: 'Strengthens the abdominals and hip flexors while improving balance.',
      imageUrl: 'https://images.yoga-app.local/poses/boat.jpg',
    },
    {
      id: 'pose-child',
      sanskritName: 'Balasana',
      englishName: "Child's Pose",
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Back & Hips',
      description: 'A restorative pose that gently stretches the back and hips.',
      imageUrl: 'https://images.yoga-app.local/poses/child.jpg',
    },
    {
      id: 'pose-seated-forward-fold',
      sanskritName: 'Paschimottanasana',
      englishName: 'Seated Forward Fold',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Hamstrings & Spine',
      description: 'Calms the mind while lengthening the spine and hamstrings.',
      imageUrl: 'https://images.yoga-app.local/poses/seated-forward-fold.jpg',
    },
    {
      id: 'pose-side-plank',
      sanskritName: 'Vasisthasana',
      englishName: 'Side Plank',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Core & Shoulders',
      description: 'A balancing pose that builds oblique strength and shoulder stability.',
      imageUrl: 'https://images.yoga-app.local/poses/side-plank.jpg',
    },
    {
      id: 'pose-wheel',
      sanskritName: 'Urdhva Dhanurasana',
      englishName: 'Wheel Pose',
      difficulty: 'ADVANCED' as const,
      bodyArea: 'Spine & Shoulders',
      description: 'A powerful backbend invigorating the whole body.',
      imageUrl: 'https://images.yoga-app.local/poses/wheel.jpg',
    },
    {
      id: 'pose-lotus',
      sanskritName: 'Padmasana',
      englishName: 'Lotus Pose',
      difficulty: 'ADVANCED' as const,
      bodyArea: 'Hips & Knees',
      description: 'A classic meditation seat requiring deep hip mobility.',
      imageUrl: 'https://images.yoga-app.local/poses/lotus.jpg',
    },
    // ============================================
    // PILATES EXERCISES
    // ============================================
    {
      id: 'pilates-hundred',
      englishName: 'The Hundred',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Core',
      description: 'Classic Pilates warm-up exercise that builds core endurance and promotes breath control.',
      imageUrl: 'https://images.fitness-app.local/pilates/hundred.jpg',
    },
    {
      id: 'pilates-roll-up',
      englishName: 'Roll Up',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Core & Spine',
      description: 'Strengthens abdominals while articulating the spine one vertebra at a time.',
      imageUrl: 'https://images.fitness-app.local/pilates/roll-up.jpg',
    },
    {
      id: 'pilates-single-leg-circles',
      englishName: 'Single Leg Circles',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Hips & Core',
      description: 'Improves hip mobility and core stability while maintaining pelvic control.',
      imageUrl: 'https://images.fitness-app.local/pilates/single-leg-circles.jpg',
    },
    {
      id: 'pilates-rolling-like-ball',
      englishName: 'Rolling Like a Ball',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Core & Spine',
      description: 'Massages the spine while developing balance and abdominal control.',
      imageUrl: 'https://images.fitness-app.local/pilates/rolling-like-ball.jpg',
    },
    {
      id: 'pilates-single-leg-stretch',
      englishName: 'Single Leg Stretch',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Core',
      description: 'Part of the abdominal series, strengthens core while coordinating movement.',
      imageUrl: 'https://images.fitness-app.local/pilates/single-leg-stretch.jpg',
    },
    {
      id: 'pilates-double-leg-stretch',
      englishName: 'Double Leg Stretch',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Core',
      description: 'Challenges core stability with simultaneous arm and leg extension.',
      imageUrl: 'https://images.fitness-app.local/pilates/double-leg-stretch.jpg',
    },
    {
      id: 'pilates-spine-stretch',
      englishName: 'Spine Stretch Forward',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Spine & Hamstrings',
      description: 'Stretches the spine and hamstrings while promoting proper posture.',
      imageUrl: 'https://images.fitness-app.local/pilates/spine-stretch.jpg',
    },
    {
      id: 'pilates-saw',
      englishName: 'The Saw',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Spine & Hamstrings',
      description: 'Rotational exercise that stretches the waist and hamstrings.',
      imageUrl: 'https://images.fitness-app.local/pilates/saw.jpg',
    },
    {
      id: 'pilates-swan',
      englishName: 'Swan',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Back & Core',
      description: 'Back extension exercise that strengthens the posterior chain.',
      imageUrl: 'https://images.fitness-app.local/pilates/swan.jpg',
    },
    {
      id: 'pilates-swimming',
      englishName: 'Swimming',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Back & Core',
      description: 'Prone exercise that builds back strength and coordination.',
      imageUrl: 'https://images.fitness-app.local/pilates/swimming.jpg',
    },
    {
      id: 'pilates-side-kick',
      englishName: 'Side Kick Series',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Legs & Hips',
      description: 'Series of lateral leg exercises that tone hips and thighs.',
      imageUrl: 'https://images.fitness-app.local/pilates/side-kick.jpg',
    },
    {
      id: 'pilates-teaser',
      englishName: 'Teaser',
      difficulty: 'ADVANCED' as const,
      bodyArea: 'Core',
      description: 'Signature Pilates exercise requiring full-body strength and control.',
      imageUrl: 'https://images.fitness-app.local/pilates/teaser.jpg',
    },
    {
      id: 'pilates-corkscrew',
      englishName: 'Corkscrew',
      difficulty: 'ADVANCED' as const,
      bodyArea: 'Core & Hips',
      description: 'Advanced exercise that challenges obliques and hip flexibility.',
      imageUrl: 'https://images.fitness-app.local/pilates/corkscrew.jpg',
    },
    {
      id: 'pilates-scissors',
      englishName: 'Scissors',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Core & Hamstrings',
      description: 'Dynamic leg exercise that builds core strength and hamstring flexibility.',
      imageUrl: 'https://images.fitness-app.local/pilates/scissors.jpg',
    },
    {
      id: 'pilates-bicycle',
      englishName: 'Bicycle',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Core & Hips',
      description: 'Lying exercise that mimics cycling motion for core and hip mobility.',
      imageUrl: 'https://images.fitness-app.local/pilates/bicycle.jpg',
    },
    {
      id: 'pilates-shoulder-bridge',
      englishName: 'Shoulder Bridge',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Glutes & Core',
      description: 'Strengthens glutes and hamstrings while stabilizing the pelvis.',
      imageUrl: 'https://images.fitness-app.local/pilates/shoulder-bridge.jpg',
    },
    {
      id: 'pilates-spine-twist',
      englishName: 'Spine Twist',
      difficulty: 'INTERMEDIATE' as const,
      bodyArea: 'Spine & Core',
      description: 'Seated rotation that improves spinal mobility and posture.',
      imageUrl: 'https://images.fitness-app.local/pilates/spine-twist.jpg',
    },
    {
      id: 'pilates-mermaid',
      englishName: 'Mermaid Stretch',
      difficulty: 'BEGINNER' as const,
      bodyArea: 'Side Body & Spine',
      description: 'Beautiful side stretch that lengthens the waist and improves lateral flexibility.',
      imageUrl: 'https://images.fitness-app.local/pilates/mermaid.jpg',
    },
    {
      id: 'pilates-leg-pull-front',
      englishName: 'Leg Pull Front',
      difficulty: 'ADVANCED' as const,
      bodyArea: 'Core & Shoulders',
      description: 'Plank variation that challenges shoulder stability and core control.',
      imageUrl: 'https://images.fitness-app.local/pilates/leg-pull-front.jpg',
    },
    {
      id: 'pilates-leg-pull-back',
      englishName: 'Leg Pull Back',
      difficulty: 'ADVANCED' as const,
      bodyArea: 'Core & Glutes',
      description: 'Reverse plank with leg lift for posterior chain strength.',
      imageUrl: 'https://images.fitness-app.local/pilates/leg-pull-back.jpg',
    },
  ];

  for (const pose of poseSeeds) {
    await prisma.pose.upsert({
      where: { id: pose.id },
      update: {
        sanskritName: pose.sanskritName,
        englishName: pose.englishName,
        difficulty: pose.difficulty,
        bodyArea: pose.bodyArea,
        description: pose.description,
        imageUrl: pose.imageUrl,
      },
      create: pose,
    });
  }

  console.log('🧘‍♂️ Poses ensured');

  const morningFlow = await prisma.class.upsert({
    where: { id: 'class-morning-flow' },
    update: {},
    create: {
      id: 'class-morning-flow',
      title: 'Morning Flow',
      description: 'Start your day with an energizing all-level flow.',
      schedule: new Date(Date.now() + 24 * 60 * 60 * 1000),
      instructorId: teacher.id,
    },
  });

  const yinYoga = await prisma.class.upsert({
    where: { id: 'class-yin-yoga' },
    update: {},
    create: {
      id: 'class-yin-yoga',
      title: 'Yin Yoga',
      description: 'Slow-paced class that targets deep connective tissues.',
      schedule: new Date(Date.now() + 48 * 60 * 60 * 1000),
      instructorId: teacher.id,
    },
  });

  console.log('🧘 Classes ensured');

  const booking = await prisma.booking.create({
    data: {
      userId: student.id,
      classId: morningFlow.id,
      status: 'CONFIRMED',
    },
  });

  await prisma.payment.create({
    data: {
      userId: student.id,
      bookingId: booking.id,
      subscriptionId: null,
      amount: 25,
      currency: 'USD',
      status: 'COMPLETED',
      provider: 'STRIPE',
      transactionId: `demo-${booking.id}`,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        actorRole: 'ADMIN',
        action: 'seed.initialize',
        metadata: { message: 'Database seeded with baseline data' },
      },
      {
        userId: student.id,
        actorRole: 'STUDENT',
        action: 'booking.create',
        metadata: { bookingId: booking.id, classId: morningFlow.id },
      },
    ],
  });

  console.log('📝 Audit logs ensured');

  // ============================================
  // Sprint 21: Gamification Seed Data
  // ============================================

  // Create UserLevel for existing users
  for (const user of [admin, teacher, student]) {
    await prisma.userLevel.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        level: 1,
        currentXP: 0,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        streakFreezeCount: 2,
        lastActivityDate: new Date(),
      },
    });
  }

  // Give student some XP
  await prisma.userLevel.update({
    where: { userId: student.id },
    data: {
      totalXP: 500,
      currentXP: 500,
      level: 3,
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: new Date(),
    },
  });

  console.log('📊 User levels ensured');

  // Create Achievements
  const achievementSeeds = [
    {
      id: 'achievement-first-class',
      slug: 'first-class',
      name: 'First Steps',
      description: 'Complete your first yoga class',
      icon: 'trophy-first',
      category: 'PRACTICE' as const,
      difficulty: 'EASY' as const,
      xpReward: 50,
      requirementType: 'CLASSES_COMPLETED' as const,
      requirementValue: 1,
    },
    {
      id: 'achievement-10-classes',
      slug: '10-classes',
      name: 'Dedicated Practitioner',
      description: 'Complete 10 yoga classes',
      icon: 'trophy-silver',
      category: 'PRACTICE' as const,
      difficulty: 'MEDIUM' as const,
      xpReward: 150,
      requirementType: 'CLASSES_COMPLETED' as const,
      requirementValue: 10,
    },
    {
      id: 'achievement-50-classes',
      slug: '50-classes',
      name: 'Yoga Enthusiast',
      description: 'Complete 50 yoga classes',
      icon: 'trophy-gold',
      category: 'PRACTICE' as const,
      difficulty: 'HARD' as const,
      xpReward: 500,
      requirementType: 'CLASSES_COMPLETED' as const,
      requirementValue: 50,
    },
    {
      id: 'achievement-7-day-streak',
      slug: '7-day-streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day practice streak',
      icon: 'flame-bronze',
      category: 'CONSISTENCY' as const,
      difficulty: 'EASY' as const,
      xpReward: 100,
      requirementType: 'STREAK_DAYS' as const,
      requirementValue: 7,
    },
    {
      id: 'achievement-30-day-streak',
      slug: '30-day-streak',
      name: 'Monthly Master',
      description: 'Maintain a 30-day practice streak',
      icon: 'flame-gold',
      category: 'CONSISTENCY' as const,
      difficulty: 'HARD' as const,
      xpReward: 500,
      requirementType: 'STREAK_DAYS' as const,
      requirementValue: 30,
    },
    {
      id: 'achievement-first-program',
      slug: 'first-program',
      name: 'Program Graduate',
      description: 'Complete your first program',
      icon: 'book-silver',
      category: 'EXPLORATION' as const,
      difficulty: 'MEDIUM' as const,
      xpReward: 200,
      requirementType: 'PROGRAMS_COMPLETED' as const,
      requirementValue: 1,
    },
    {
      id: 'achievement-first-challenge',
      slug: 'first-challenge',
      name: 'Challenge Accepted',
      description: 'Complete your first challenge',
      icon: 'flag-silver',
      category: 'EXPLORATION' as const,
      difficulty: 'MEDIUM' as const,
      xpReward: 300,
      requirementType: 'CHALLENGES_COMPLETED' as const,
      requirementValue: 1,
    },
    {
      id: 'achievement-level-10',
      slug: 'level-10',
      name: 'Rising Star',
      description: 'Reach level 10',
      icon: 'star-silver',
      category: 'MASTERY' as const,
      difficulty: 'MEDIUM' as const,
      xpReward: 250,
      requirementType: 'TOTAL_MINUTES' as const,
      requirementValue: 600,
    },
    {
      id: 'achievement-referral-master',
      slug: 'referral-master',
      name: 'Community Builder',
      description: 'Refer 5 friends to the app',
      icon: 'users-gold',
      category: 'SOCIAL' as const,
      difficulty: 'HARD' as const,
      xpReward: 500,
      requirementType: 'FRIENDS_REFERRED' as const,
      requirementValue: 5,
    },
  ];

  for (const achievement of achievementSeeds) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }

  console.log('🏆 Achievements ensured');

  // Create Daily Quests
  const questSeeds = [
    {
      id: 'quest-daily-practice',
      name: 'Daily Practice',
      description: 'Complete at least one yoga session today',
      icon: 'lotus',
      type: 'DAILY' as const,
      requirementType: 'COMPLETE_CLASSES' as const,
      requirementValue: 1,
      xpReward: 25,
      resetPeriod: 'DAILY' as const,
      isActive: true,
    },
    {
      id: 'quest-daily-30min',
      name: 'Mindful Minutes',
      description: 'Practice for at least 30 minutes today',
      icon: 'clock',
      type: 'DAILY' as const,
      requirementType: 'COMPLETE_MINUTES' as const,
      requirementValue: 30,
      xpReward: 50,
      resetPeriod: 'DAILY' as const,
      isActive: true,
    },
    {
      id: 'quest-weekly-5sessions',
      name: 'Weekly Warrior',
      description: 'Complete 5 sessions this week',
      icon: 'calendar',
      type: 'WEEKLY' as const,
      requirementType: 'COMPLETE_CLASSES' as const,
      requirementValue: 5,
      xpReward: 150,
      resetPeriod: 'WEEKLY' as const,
      isActive: true,
    },
    {
      id: 'quest-weekly-program',
      name: 'Program Progress',
      description: 'Complete 3 program sessions this week',
      icon: 'book',
      type: 'WEEKLY' as const,
      requirementType: 'COMPLETE_PROGRAM_DAY' as const,
      requirementValue: 3,
      xpReward: 100,
      resetPeriod: 'WEEKLY' as const,
      isActive: true,
    },
    {
      id: 'quest-monthly-streak',
      name: 'Streak Champion',
      description: 'Maintain a streak for 20 days this month',
      icon: 'flame',
      type: 'MONTHLY' as const,
      requirementType: 'MAINTAIN_STREAK' as const,
      requirementValue: 20,
      xpReward: 500,
      resetPeriod: 'MONTHLY' as const,
      isActive: true,
    },
  ];

  for (const quest of questSeeds) {
    await prisma.quest.upsert({
      where: { id: quest.id },
      update: quest,
      create: quest,
    });
  }

  console.log('📋 Quests ensured');

  // Create Daily Rewards (30-day cycle)
  const dailyRewardSeeds = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    let xpReward = 10 + Math.floor(day / 7) * 5; // Base 10, +5 every week
    let bonusType = null as any;
    let bonusValue = null as any;

    // Special rewards on certain days
    if (day === 7) {
      xpReward = 50;
      bonusType = 'STREAK_FREEZE';
      bonusValue = '1';
    } else if (day === 14) {
      xpReward = 75;
      bonusType = 'BADGE';
      bonusValue = 'week-2-badge';
    } else if (day === 21) {
      xpReward = 100;
      bonusType = 'STREAK_FREEZE';
      bonusValue = '2';
    } else if (day === 30) {
      xpReward = 200;
      bonusType = 'TITLE';
      bonusValue = 'monthly-champion';
    }

    return {
      id: `daily-reward-day-${day}`,
      day,
      xpReward,
      bonusType,
      bonusValue,
      isSpecial: day % 7 === 0 || day === 30,
    };
  });

  for (const reward of dailyRewardSeeds) {
    await prisma.dailyReward.upsert({
      where: { day: reward.day },
      update: {
        xpReward: reward.xpReward,
        bonusType: reward.bonusType,
        bonusValue: reward.bonusValue,
        isSpecial: reward.isSpecial,
      },
      create: reward,
    });
  }

  console.log('🎁 Daily rewards ensured');

  // Create Titles
  const titleSeeds = [
    {
      id: 'title-newcomer',
      slug: 'newcomer',
      name: 'Newcomer',
      description: 'Just starting the yoga journey',
      rarity: 'COMMON' as const,
      unlockType: 'LEVEL' as const,
      unlockValue: '1',
      isActive: true,
    },
    {
      id: 'title-practitioner',
      slug: 'practitioner',
      name: 'Practitioner',
      description: 'Building a regular practice',
      rarity: 'UNCOMMON' as const,
      unlockType: 'LEVEL' as const,
      unlockValue: '5',
      isActive: true,
    },
    {
      id: 'title-dedicated',
      slug: 'dedicated-yogi',
      name: 'Dedicated Yogi',
      description: 'Committed to the practice',
      rarity: 'RARE' as const,
      unlockType: 'LEVEL' as const,
      unlockValue: '10',
      isActive: true,
    },
    {
      id: 'title-streak-master',
      slug: 'streak-master',
      name: 'Streak Master',
      description: 'Maintained a 30-day streak',
      rarity: 'EPIC' as const,
      unlockType: 'STREAK' as const,
      unlockValue: '30',
      isActive: true,
    },
    {
      id: 'title-enlightened',
      slug: 'enlightened',
      name: 'Enlightened One',
      description: 'Reached the highest levels of practice',
      rarity: 'LEGENDARY' as const,
      unlockType: 'LEVEL' as const,
      unlockValue: '50',
      isActive: true,
    },
  ];

  for (const title of titleSeeds) {
    await prisma.title.upsert({
      where: { id: title.id },
      update: title,
      create: title,
    });
  }

  console.log('🏷️ Titles ensured');

  // Create Avatar Frames
  const frameSeeds = [
    {
      id: 'frame-basic',
      name: 'Basic Frame',
      imageUrl: 'https://images.yoga-app.local/frames/basic.png',
      rarity: 'COMMON' as const,
      unlockType: 'LEVEL' as const,
      unlockValue: '1',
      isActive: true,
    },
    {
      id: 'frame-lotus',
      name: 'Lotus Frame',
      imageUrl: 'https://images.yoga-app.local/frames/lotus.png',
      rarity: 'UNCOMMON' as const,
      unlockType: 'LEVEL' as const,
      unlockValue: '5',
      isActive: true,
    },
    {
      id: 'frame-golden',
      name: 'Golden Frame',
      imageUrl: 'https://images.yoga-app.local/frames/golden.png',
      rarity: 'RARE' as const,
      unlockType: 'LEVEL' as const,
      unlockValue: '15',
      isActive: true,
    },
    {
      id: 'frame-champion',
      name: 'Champion Frame',
      imageUrl: 'https://images.yoga-app.local/frames/champion.png',
      rarity: 'EPIC' as const,
      unlockType: 'ACHIEVEMENT' as const,
      unlockValue: 'achievement-first-challenge',
      isActive: true,
    },
  ];

  for (const frame of frameSeeds) {
    await prisma.avatarFrame.upsert({
      where: { id: frame.id },
      update: frame,
      create: frame,
    });
  }

  console.log('🖼️ Avatar frames ensured');

  // Create Shop Items
  const shopItemSeeds = [
    {
      id: 'shop-streak-freeze',
      name: 'Streak Freeze',
      description: 'Protect your streak for one day',
      type: 'STREAK_FREEZE' as const,
      value: '1',
      priceXP: 100,
      isActive: true,
    },
    {
      id: 'shop-streak-freeze-pack',
      name: 'Streak Freeze Pack',
      description: 'A pack of 3 streak freezes',
      type: 'STREAK_FREEZE' as const,
      value: '3',
      priceXP: 250,
      isActive: true,
    },
    {
      id: 'shop-free-class',
      name: 'Free Premium Class',
      description: 'Unlock any premium class for free',
      type: 'FREE_CLASS' as const,
      value: '1',
      priceXP: 200,
      isActive: true,
    },
    {
      id: 'shop-exclusive-content',
      name: 'Exclusive Meditation Pack',
      description: 'Access to exclusive meditation content',
      type: 'EXCLUSIVE_CONTENT' as const,
      value: 'meditation-pack-1',
      priceXP: 500,
      minLevel: 5,
      isActive: true,
    },
    {
      id: 'shop-special-title',
      name: 'Zen Master Title',
      description: 'A special title available in the shop',
      type: 'TITLE' as const,
      value: 'zen-master',
      priceXP: 1000,
      minLevel: 10,
      stock: 100,
      isActive: true,
    },
  ];

  for (const item of shopItemSeeds) {
    await prisma.shopItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  console.log('🛒 Shop items ensured');

  // Create a sample Seasonal Event
  const now = new Date();
  const eventStart = new Date(now);
  eventStart.setHours(0, 0, 0, 0);
  const eventEnd = new Date(eventStart);
  eventEnd.setDate(eventEnd.getDate() + 14);

  await prisma.seasonalEvent.upsert({
    where: { id: 'event-winter-wellness' },
    update: {},
    create: {
      id: 'event-winter-wellness',
      slug: 'winter-wellness',
      name: 'Winter Wellness Challenge',
      description: 'Stay active during the winter season with daily yoga practice',
      bannerImage: 'https://images.yoga-app.local/events/winter-wellness.jpg',
      themeColor: '#4A90D9',
      startDate: eventStart,
      endDate: eventEnd,
      rewards: {
        bronze: { xp: 100, threshold: 5 },
        silver: { xp: 250, threshold: 7 },
        gold: { xp: 500, threshold: 10 },
      },
      isActive: true,
    },
  });

  console.log('🎄 Seasonal events ensured');

  // Grant starting title to student
  await prisma.userTitle.upsert({
    where: {
      userId_titleId: {
        userId: student.id,
        titleId: 'title-newcomer',
      },
    },
    update: {},
    create: {
      userId: student.id,
      titleId: 'title-newcomer',
      earnedAt: new Date(),
      isEquipped: true,
    },
  });

  // Grant starting frame to student
  await prisma.userAvatarFrame.upsert({
    where: {
      userId_frameId: {
        userId: student.id,
        frameId: 'frame-basic',
      },
    },
    update: {},
    create: {
      userId: student.id,
      frameId: 'frame-basic',
      earnedAt: new Date(),
      isEquipped: true,
    },
  });

  console.log('🎮 Gamification seed data completed');

  // ============================================
  // Sprint 18: Instructor System Seed Data
  // ============================================

  // Create Instructor Profile for teacher
  const instructorProfile = await prisma.instructorProfile.upsert({
    where: { slug: 'taylor-yoga' },
    update: { userId: teacher.id },
    create: {
      userId: teacher.id,
      displayName: 'Taylor Yoga',
      slug: 'taylor-yoga',
      bio: 'Certified yoga instructor with over 10 years of experience in Vinyasa and Hatha yoga. Passionate about helping students find balance and mindfulness through movement.',
      shortBio: 'Vinyasa & Hatha specialist with 10+ years experience',
      profileImageUrl: 'https://images.yoga-app.local/instructors/taylor-profile.jpg',
      coverImageUrl: 'https://images.yoga-app.local/instructors/taylor-cover.jpg',
      introVideoUrl: 'https://videos.yoga-app.local/instructors/taylor-intro.mp4',
      specializations: ['Vinyasa', 'Hatha', 'Restorative', 'Prenatal'],
      certifications: [
        { name: 'RYT-500', issuer: 'Yoga Alliance', year: 2015, verified: true },
        { name: 'Prenatal Yoga', issuer: 'RPYT', year: 2018, verified: true },
      ],
      yearsOfExperience: 10,
      languages: ['English', 'Turkish'],
      socialLinks: {
        instagram: '@taylor_yoga',
        youtube: 'TaylorYogaChannel',
        website: 'https://tayloryoga.com',
      },
      location: 'Istanbul, Turkey',
      timezone: 'Europe/Istanbul',
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      verifiedAt: new Date(),
      isFeatured: true,
      totalStudents: 1250,
      totalClasses: 320,
      totalPrograms: 8,
      averageRating: 4.85,
      totalReviews: 156,
      commissionRate: 0.25,
    },
  });

  // Create Instructor Payout Settings
  await prisma.instructorPayoutSettings.upsert({
    where: { instructorId: instructorProfile.id },
    update: {},
    create: {
      instructorId: instructorProfile.id,
      preferredMethod: 'BANK_TRANSFER',
      bankDetails: {
        bankName: 'Garanti BBVA',
        accountHolder: 'Taylor Instructor',
        iban: 'TR00 0000 0000 0000 0000 0000 00',
      },
      autoPayoutEnabled: true,
      autoPayoutDay: 15,
    },
  });

  // Create Instructor Review
  await prisma.instructorReview.upsert({
    where: { id: 'review-student-taylor' },
    update: {},
    create: {
      id: 'review-student-taylor',
      instructorId: instructorProfile.id,
      studentId: student.id,
      rating: 5,
      title: 'Amazing instructor!',
      content: 'Taylor is an incredible instructor. Her classes are well-structured and she provides clear instructions. Highly recommend!',
      status: 'APPROVED',
      helpfulCount: 12,
      isVerifiedPurchase: true,
    },
  });

  // Create Instructor Follower
  await prisma.instructorFollower.upsert({
    where: {
      instructorId_userId: {
        instructorId: instructorProfile.id,
        userId: student.id,
      },
    },
    update: {},
    create: {
      instructorId: instructorProfile.id,
      userId: student.id,
      notificationsEnabled: true,
    },
  });

  console.log('👩‍🏫 Instructor profile ensured');

  // ============================================
  // Sprint 19: Live Streaming Seed Data
  // ============================================

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 60);

  const liveStream = await prisma.liveStream.upsert({
    where: { id: 'stream-morning-vinyasa' },
    update: {},
    create: {
      id: 'stream-morning-vinyasa',
      title: 'Morning Vinyasa Flow',
      description: 'Start your day with an energizing vinyasa flow. All levels welcome!',
      thumbnailUrl: 'https://images.yoga-app.local/streams/morning-vinyasa.jpg',
      instructorId: instructorProfile.id,
      type: 'YOGA_CLASS',
      status: 'SCHEDULED',
      scheduledStartAt: tomorrow,
      scheduledEndAt: tomorrowEnd,
      maxParticipants: 100,
      isRecorded: true,
      requiresSubscription: true,
      minimumTier: 'BASIC',
      tags: ['vinyasa', 'morning', 'energizing'],
      level: 'BEGINNER',
      equipment: ['Mat'],
      agoraChannelName: 'yoga-stream-morning-vinyasa',
      chatEnabled: true,
      handRaiseEnabled: true,
    },
  });

  // Create Live Stream Registration
  await prisma.liveStreamRegistration.upsert({
    where: {
      streamId_userId: {
        streamId: liveStream.id,
        userId: student.id,
      },
    },
    update: {},
    create: {
      streamId: liveStream.id,
      userId: student.id,
      reminderSent: false,
      attended: false,
    },
  });

  // Create Live Stream Schedule
  await prisma.liveStreamSchedule.upsert({
    where: { id: 'schedule-weekly-vinyasa' },
    update: {},
    create: {
      id: 'schedule-weekly-vinyasa',
      instructorId: instructorProfile.id,
      title: 'Weekly Morning Vinyasa',
      description: 'Regular weekly vinyasa class',
      type: 'YOGA_CLASS',
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
      dayOfWeek: [1, 3, 5],
      startTime: '10:00',
      duration: 60,
      timezone: 'Europe/Istanbul',
      isActive: true,
      nextStreamAt: tomorrow,
    },
  });

  console.log('📺 Live streaming data ensured');

  // ============================================
  // Sprint 20: Community & Social Seed Data
  // ============================================

  // Create Forum Categories
  const forumCategories = [
    {
      id: 'forum-cat-general',
      name: 'General Discussion',
      slug: 'general-discussion',
      description: 'General yoga discussions and conversations',
      icon: '💬',
      color: '#3B82F6',
      sortOrder: 1,
    },
    {
      id: 'forum-cat-beginners',
      name: 'Beginners Corner',
      slug: 'beginners-corner',
      description: 'Questions and tips for yoga beginners',
      icon: '🌱',
      color: '#10B981',
      sortOrder: 2,
    },
    {
      id: 'forum-cat-poses',
      name: 'Pose Discussion',
      slug: 'pose-discussion',
      description: 'Discuss specific poses and techniques',
      icon: '🧘',
      color: '#8B5CF6',
      sortOrder: 3,
    },
    {
      id: 'forum-cat-equipment',
      name: 'Equipment & Gear',
      slug: 'equipment-gear',
      description: 'Discuss yoga equipment, mats, props, and more',
      icon: '🎒',
      color: '#F59E0B',
      sortOrder: 4,
    },
  ];

  for (const category of forumCategories) {
    await prisma.forumCategory.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  // Create Forum Topic
  const forumTopic = await prisma.forumTopic.upsert({
    where: { id: 'topic-morning-routine' },
    update: {},
    create: {
      id: 'topic-morning-routine',
      title: 'Best Morning Yoga Routines?',
      slug: 'best-morning-yoga-routines',
      content: 'Hey everyone! I\'m trying to build a consistent morning yoga routine. What poses or sequences do you recommend for starting the day with energy?',
      categoryId: 'forum-cat-general',
      authorId: student.id,
      isPinned: false,
      isLocked: false,
      viewCount: 45,
      replyCount: 3,
    },
  });

  // Create Forum Post (reply)
  await prisma.forumPost.upsert({
    where: { id: 'post-morning-reply' },
    update: {},
    create: {
      id: 'post-morning-reply',
      topicId: forumTopic.id,
      authorId: teacher.id,
      content: 'I always recommend starting with Sun Salutations (Surya Namaskar A)! It warms up the entire body and connects breath with movement. 5-10 rounds is a great way to start the day.',
      isAccepted: true,
    },
  });

  // Create Community Group
  const communityGroup = await prisma.communityGroup.upsert({
    where: { id: 'group-30-day-challenge' },
    update: {},
    create: {
      id: 'group-30-day-challenge',
      name: '30-Day Challenge Support',
      slug: '30-day-challenge-support',
      description: 'Support group for everyone participating in the 30-Day Challenge. Share your progress and motivate each other!',
      coverImage: 'https://images.yoga-app.local/groups/30-day-challenge.jpg',
      isPrivate: false,
      createdById: admin.id,
      isOfficial: true,
    },
  });

  // Add student as group member
  await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: communityGroup.id,
        userId: student.id,
      },
    },
    update: {},
    create: {
      groupId: communityGroup.id,
      userId: student.id,
      role: 'MEMBER',
    },
  });

  // Create Badge
  const badges = [
    {
      id: 'badge-early-bird',
      slug: 'early-bird',
      name: 'Early Bird',
      description: 'Complete a session before 7 AM',
      icon: '🌅',
      category: 'PRACTICE' as const,
      requirement: { type: 'early_session', time: '07:00' },
      points: 25,
    },
    {
      id: 'badge-social-butterfly',
      slug: 'social-butterfly',
      name: 'Social Butterfly',
      description: 'Make 10 friends in the community',
      icon: '🦋',
      category: 'SOCIAL' as const,
      requirement: { type: 'friends_count', count: 10 },
      points: 50,
    },
    {
      id: 'badge-helpful',
      slug: 'helpful-yogi',
      name: 'Helpful Yogi',
      description: 'Have an answer marked as accepted in the forum',
      icon: '🤝',
      category: 'SOCIAL' as const,
      requirement: { type: 'accepted_answer', count: 1 },
      points: 30,
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      update: badge,
      create: badge,
    });
  }

  // Award badge to teacher
  await prisma.userBadge.upsert({
    where: {
      userId_badgeId: {
        userId: teacher.id,
        badgeId: 'badge-helpful',
      },
    },
    update: {},
    create: {
      userId: teacher.id,
      badgeId: 'badge-helpful',
      earnedAt: new Date(),
    },
  });

  console.log('🌐 Community & Social data ensured');

  // ============================================
  // Sprint 22: i18n (Multi-language) Seed Data
  // ============================================

  // Create Languages
  const languages = [
    {
      id: 'lang-en',
      code: 'en',
      name: 'English',
      nativeName: 'English',
      direction: 'LTR' as const,
      isDefault: true,
      isActive: true,
      flagEmoji: '🇺🇸',
    },
    {
      id: 'lang-tr',
      code: 'tr',
      name: 'Turkish',
      nativeName: 'Türkçe',
      direction: 'LTR' as const,
      isDefault: false,
      isActive: true,
      flagEmoji: '🇹🇷',
    },
    {
      id: 'lang-de',
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      direction: 'LTR' as const,
      isDefault: false,
      isActive: true,
      flagEmoji: '🇩🇪',
    },
    {
      id: 'lang-es',
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      direction: 'LTR' as const,
      isDefault: false,
      isActive: true,
      flagEmoji: '🇪🇸',
    },
    {
      id: 'lang-fr',
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      direction: 'LTR' as const,
      isDefault: false,
      isActive: true,
      flagEmoji: '🇫🇷',
    },
    {
      id: 'lang-ar',
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      direction: 'RTL' as const,
      isDefault: false,
      isActive: true,
      flagEmoji: '🇸🇦',
    },
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
  }

  // Create Translation Keys
  const translationKeys = [
    { id: 'key-welcome', key: 'common.welcome', namespace: 'common', description: 'Welcome message' },
    { id: 'key-login', key: 'auth.login', namespace: 'auth', description: 'Login button text' },
    { id: 'key-signup', key: 'auth.signup', namespace: 'auth', description: 'Sign up button text' },
    { id: 'key-start-practice', key: 'practice.start', namespace: 'practice', description: 'Start practice button' },
    { id: 'key-daily-streak', key: 'gamification.daily_streak', namespace: 'gamification', description: 'Daily streak label' },
  ];

  for (const key of translationKeys) {
    await prisma.translationKey.upsert({
      where: { key: key.key },
      update: key,
      create: key,
    });
  }

  // Create Translations
  const translations = [
    { keyId: 'key-welcome', languageId: 'lang-en', value: 'Welcome to Yoga App' },
    { keyId: 'key-welcome', languageId: 'lang-tr', value: 'Yoga Uygulamasına Hoş Geldiniz' },
    { keyId: 'key-welcome', languageId: 'lang-de', value: 'Willkommen bei Yoga App' },
    { keyId: 'key-login', languageId: 'lang-en', value: 'Login' },
    { keyId: 'key-login', languageId: 'lang-tr', value: 'Giriş Yap' },
    { keyId: 'key-login', languageId: 'lang-de', value: 'Anmelden' },
    { keyId: 'key-signup', languageId: 'lang-en', value: 'Sign Up' },
    { keyId: 'key-signup', languageId: 'lang-tr', value: 'Kayıt Ol' },
    { keyId: 'key-signup', languageId: 'lang-de', value: 'Registrieren' },
    { keyId: 'key-start-practice', languageId: 'lang-en', value: 'Start Practice' },
    { keyId: 'key-start-practice', languageId: 'lang-tr', value: 'Pratiğe Başla' },
    { keyId: 'key-daily-streak', languageId: 'lang-en', value: 'Daily Streak' },
    { keyId: 'key-daily-streak', languageId: 'lang-tr', value: 'Günlük Seri' },
  ];

  for (const translation of translations) {
    await prisma.translation.upsert({
      where: {
        keyId_languageId: {
          keyId: translation.keyId,
          languageId: translation.languageId,
        },
      },
      update: { value: translation.value, status: 'PUBLISHED' },
      create: { ...translation, status: 'PUBLISHED' },
    });
  }

  // Create Glossary Terms
  const glossaryTerms = [
    { sourceLanguageId: 'lang-en', targetLanguageId: 'lang-tr', sourceTerm: 'Yoga', targetTerm: 'Yoga', category: 'yoga_terms' },
    { sourceLanguageId: 'lang-en', targetLanguageId: 'lang-tr', sourceTerm: 'Pose', targetTerm: 'Poz', category: 'yoga_terms' },
    { sourceLanguageId: 'lang-en', targetLanguageId: 'lang-tr', sourceTerm: 'Meditation', targetTerm: 'Meditasyon', category: 'yoga_terms' },
    { sourceLanguageId: 'lang-en', targetLanguageId: 'lang-tr', sourceTerm: 'Breath', targetTerm: 'Nefes', category: 'yoga_terms' },
    { sourceLanguageId: 'lang-en', targetLanguageId: 'lang-tr', sourceTerm: 'Mindfulness', targetTerm: 'Farkındalık', category: 'yoga_terms' },
  ];

  for (const term of glossaryTerms) {
    await prisma.glossary.upsert({
      where: {
        sourceLanguageId_targetLanguageId_sourceTerm: {
          sourceLanguageId: term.sourceLanguageId,
          targetLanguageId: term.targetLanguageId,
          sourceTerm: term.sourceTerm,
        },
      },
      update: term,
      create: term,
    });
  }

  // Set user language preference
  await prisma.userLanguagePreference.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      preferredLanguageId: 'lang-en',
      autoDetect: true,
    },
  });

  console.log('🌍 i18n (Multi-language) data ensured');

  // ============================================
  // Sprint 23: Admin Dashboard Seed Data
  // ============================================

  // Create System Settings
  const systemSettings = [
    { key: 'site_name', value: 'Yoga App', type: 'STRING' as const, category: 'GENERAL' as const, description: 'Application name' },
    { key: 'maintenance_mode', value: 'false', type: 'BOOLEAN' as const, category: 'MAINTENANCE' as const, description: 'Enable maintenance mode' },
    { key: 'max_upload_size', value: '50', type: 'NUMBER' as const, category: 'LIMITS' as const, description: 'Max upload size in MB' },
    { key: 'free_trial_days', value: '7', type: 'NUMBER' as const, category: 'PAYMENTS' as const, description: 'Free trial period in days' },
    { key: 'require_email_verification', value: 'true', type: 'BOOLEAN' as const, category: 'SECURITY' as const, description: 'Require email verification' },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: { ...setting, updatedById: admin.id },
    });
  }

  // Create Feature Flags
  const featureFlags = [
    { key: 'live_streaming', name: 'Live Streaming', isEnabled: true, description: 'Enable live streaming feature', rolloutPercentage: 100 },
    { key: 'ai_recommendations', name: 'AI Recommendations', isEnabled: true, description: 'Enable AI-powered recommendations', rolloutPercentage: 100 },
    { key: 'social_features', name: 'Social Features', isEnabled: true, description: 'Enable community and social features', rolloutPercentage: 100 },
    { key: 'voice_commands', name: 'Voice Commands', isEnabled: false, description: 'Enable voice command support', rolloutPercentage: 0 },
    { key: 'ar_pose_detection', name: 'AR Pose Detection', isEnabled: false, description: 'Enable AR pose detection', rolloutPercentage: 0 },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: flag,
      create: { ...flag, updatedById: admin.id },
    });
  }

  // Create Admin Dashboard Preference
  await prisma.adminDashboardPreference.upsert({
    where: { adminId: admin.id },
    update: {},
    create: {
      adminId: admin.id,
      widgets: [
        { id: 'users_chart', type: 'chart', position: { x: 0, y: 0, w: 6, h: 4 } },
        { id: 'revenue_chart', type: 'chart', position: { x: 6, y: 0, w: 6, h: 4 } },
        { id: 'active_subscriptions', type: 'stat', position: { x: 0, y: 4, w: 3, h: 2 } },
        { id: 'recent_activity', type: 'list', position: { x: 3, y: 4, w: 9, h: 2 } },
      ],
      defaultDateRange: '7d',
      timezone: 'Europe/Istanbul',
    },
  });

  // Create Coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME2024' },
    update: {},
    create: {
      code: 'WELCOME2024',
      type: 'PERCENTAGE',
      value: 20,
      minPurchaseAmount: 0,
      maxUses: 1000,
      currentUses: 45,
      maxUsesPerUser: 1,
      isActive: true,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      applicablePlans: ['BASIC', 'PREMIUM'],
      createdById: admin.id,
    },
  });

  console.log('🎛️ Admin Dashboard data ensured');

  // ============================================
  // Sprint 24: CMS (Content Management) Seed Data
  // ============================================

  // Create Content Categories
  const contentCategories = [
    { id: 'content-cat-blog', name: 'Blog', slug: 'blog', description: 'Blog posts and articles' },
    { id: 'content-cat-guides', name: 'Guides', slug: 'guides', description: 'How-to guides and tutorials' },
    { id: 'content-cat-news', name: 'News', slug: 'news', description: 'News and announcements' },
  ];

  for (const category of contentCategories) {
    await prisma.contentCategory.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  // Create Content Tags
  const contentTags = [
    { id: 'content-tag-beginners', name: 'Beginners', slug: 'beginners' },
    { id: 'content-tag-wellness', name: 'Wellness', slug: 'wellness' },
    { id: 'content-tag-tips', name: 'Tips', slug: 'tips' },
  ];

  for (const tag of contentTags) {
    await prisma.contentTag.upsert({
      where: { id: tag.id },
      update: tag,
      create: tag,
    });
  }

  // Create FAQ Category
  await prisma.faqCategory.upsert({
    where: { id: 'faq-cat-general' },
    update: {},
    create: {
      id: 'faq-cat-general',
      name: 'General Questions',
      slug: 'general-questions',
      sortOrder: 1,
    },
  });

  // Create FAQ Items
  const faqItems = [
    {
      id: 'faq-what-is-yoga',
      categoryId: 'faq-cat-general',
      question: 'What is yoga and who can practice it?',
      answer: 'Yoga is an ancient practice that combines physical postures, breathing techniques, and meditation. Anyone can practice yoga regardless of age, fitness level, or flexibility. Our app offers classes for all levels.',
      sortOrder: 1,
    },
    {
      id: 'faq-subscription',
      categoryId: 'faq-cat-general',
      question: 'How do subscriptions work?',
      answer: 'We offer monthly and yearly subscription plans. With a subscription, you get unlimited access to all classes, programs, and live streams. You can cancel anytime from your account settings.',
      sortOrder: 2,
    },
    {
      id: 'faq-offline',
      categoryId: 'faq-cat-general',
      question: 'Can I practice offline?',
      answer: 'Yes! Premium subscribers can download classes for offline viewing. Simply tap the download icon on any class to save it to your device.',
      sortOrder: 3,
    },
  ];

  for (const faq of faqItems) {
    await prisma.faqItem.upsert({
      where: { id: faq.id },
      update: faq,
      create: { ...faq, isPublished: true },
    });
  }

  // Create Banner
  await prisma.banner.upsert({
    where: { id: 'banner-welcome' },
    update: {},
    create: {
      id: 'banner-welcome',
      name: 'Welcome Banner',
      title: 'Start Your Yoga Journey',
      subtitle: 'Get 20% off your first month with code WELCOME2024',
      imageUrl: 'https://images.yoga-app.local/banners/welcome.jpg',
      linkUrl: '/subscription',
      buttonText: 'Subscribe Now',
      position: 'hero',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  });

  // Create Announcement
  await prisma.announcement.upsert({
    where: { id: 'announcement-new-feature' },
    update: {},
    create: {
      id: 'announcement-new-feature',
      title: 'New Feature: Live Streaming!',
      message: 'We\'re excited to announce live streaming classes! Join real-time sessions with your favorite instructors.',
      type: 'success',
      position: 'top',
      dismissible: true,
      isActive: true,
      startsAt: new Date(),
      targetAudience: { audience: 'ALL' },
      createdById: admin.id,
    },
  });

  console.log('📝 CMS data ensured');

  // ============================================
  // Sprint 25: Reporting & Export Seed Data
  // ============================================

  // Create Report Definitions
  const reportDefinitions = [
    {
      id: 'report-def-user-growth',
      slug: 'user-growth',
      name: 'User Growth Report',
      description: 'Track user registration and growth over time',
      type: 'TIME_SERIES' as const,
      category: 'USERS' as const,
      dataSource: 'users',
      availableFilters: [
        { name: 'startDate', type: 'DATE', required: true },
        { name: 'endDate', type: 'DATE', required: true },
      ],
      availableColumns: [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'count', label: 'User Count', sortable: true },
      ],
      defaultFilters: { period: 'last_30_days' },
      defaultColumns: ['date', 'count'],
      chartTypes: ['line', 'bar'],
      isActive: true,
    },
    {
      id: 'report-def-revenue',
      slug: 'revenue',
      name: 'Revenue Report',
      description: 'Track revenue and payment metrics',
      type: 'TIME_SERIES' as const,
      category: 'REVENUE' as const,
      dataSource: 'payments',
      availableFilters: [
        { name: 'startDate', type: 'DATE', required: true },
        { name: 'endDate', type: 'DATE', required: true },
      ],
      availableColumns: [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'total', label: 'Total Revenue', sortable: true },
      ],
      defaultFilters: { period: 'last_30_days' },
      defaultColumns: ['date', 'total'],
      chartTypes: ['line', 'bar'],
      isActive: true,
    },
  ];

  for (const report of reportDefinitions) {
    await prisma.reportDefinition.upsert({
      where: { id: report.id },
      update: report,
      create: report,
    });
  }

  // Create Dashboard Widgets
  const dashboardWidgets = [
    {
      id: 'widget-active-users',
      name: 'Active Users',
      description: 'Number of active users',
      type: 'NUMBER' as const,
      dataSource: 'users',
      query: { sql: 'SELECT COUNT(*) FROM users WHERE last_activity_at > NOW() - INTERVAL 7 days' },
      refreshInterval: 300,
      isActive: true,
    },
    {
      id: 'widget-revenue-chart',
      name: 'Revenue Chart',
      description: 'Daily revenue chart',
      type: 'CHART' as const,
      dataSource: 'payments',
      query: { sql: 'SELECT DATE(created_at) as date, SUM(amount) as total FROM payments GROUP BY DATE(created_at)' },
      chartType: 'line',
      chartConfig: { xAxis: 'date', yAxis: 'total' },
      refreshInterval: 3600,
      isActive: true,
    },
  ];

  for (const widget of dashboardWidgets) {
    await prisma.dashboardWidget.upsert({
      where: { id: widget.id },
      update: widget,
      create: widget,
    });
  }

  // Create Alert Rule
  await prisma.alertRule.upsert({
    where: { id: 'alert-high-error-rate' },
    update: {},
    create: {
      id: 'alert-high-error-rate',
      name: 'High Error Rate',
      description: 'Alert when error rate exceeds threshold',
      metricType: 'error_rate',
      condition: 'GREATER_THAN',
      threshold: 5,
      timeWindow: 5,
      aggregation: 'AVG',
      severity: 'CRITICAL',
      channels: ['email', 'slack'],
      recipients: ['admin@yoga.com'],
      isActive: true,
      createdById: admin.id,
    },
  });

  console.log('📊 Reporting & Export data ensured');

  // ============================================
  // Sprint 26: AI Services Seed Data
  // ============================================

  // Create AI Configurations
  const aiConfigurations = [
    {
      id: 'ai-config-gpt4',
      provider: 'OPENAI' as const,
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      requestsPerMinute: 60,
      tokensPerMinute: 90000,
      costPerToken: 0.00003,
      isActive: true,
      isDefault: true,
    },
    {
      id: 'ai-config-gpt35',
      provider: 'OPENAI' as const,
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 4000,
      requestsPerMinute: 100,
      tokensPerMinute: 180000,
      costPerToken: 0.000002,
      isActive: true,
      isDefault: false,
    },
    {
      id: 'ai-config-whisper',
      provider: 'OPENAI' as const,
      model: 'whisper-1',
      requestsPerMinute: 50,
      costPerMinute: 0.006,
      isActive: true,
      isDefault: false,
    },
    {
      id: 'ai-config-tts',
      provider: 'OPENAI' as const,
      model: 'tts-1',
      requestsPerMinute: 50,
      costPer1000Chars: 0.015,
      isActive: true,
      isDefault: false,
    },
    {
      id: 'ai-config-elevenlabs',
      provider: 'ELEVEN_LABS' as const,
      model: 'eleven_multilingual_v2',
      requestsPerMinute: 30,
      costPer1000Chars: 0.30,
      isActive: true,
      isDefault: false,
    },
  ];

  for (const config of aiConfigurations) {
    await prisma.aIConfiguration.upsert({
      where: { id: config.id },
      update: config,
      create: config,
    });
  }

  // Create User AI Preference
  await prisma.userAIPreference.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      enableRecommendations: true,
      recommendationDiversity: 0.3,
      preferredVoice: 'nova',
      voiceSpeed: 1.0,
      preferredLanguage: 'en',
      enableAICoach: true,
      coachPersonality: 'encouraging',
      allowDataForTraining: false,
    },
  });

  // Create Sample Recommendation
  await prisma.recommendation.create({
    data: {
      userId: student.id,
      type: 'FOR_YOU',
      entityType: 'program',
      entityId: 'program-gentle-foundations',
      score: 0.92,
      confidence: 0.85,
      reasons: ['Matches your beginner level', 'Focus on flexibility you prefer', 'Popular with similar users'],
      context: 'HOME_FEED',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Create AI Conversation
  const aiConversation = await prisma.aIConversation.create({
    data: {
      userId: student.id,
      type: 'YOGA_COACH',
      contextType: 'general',
      title: 'Getting started with yoga',
      isActive: true,
    },
  });

  // Create AI Messages
  await prisma.aIMessage.createMany({
    data: [
      {
        conversationId: aiConversation.id,
        role: 'USER',
        content: 'I\'m new to yoga. Where should I start?',
      },
      {
        conversationId: aiConversation.id,
        role: 'ASSISTANT',
        content: 'Welcome to your yoga journey! I recommend starting with our "Gentle Foundations" program. It\'s designed specifically for beginners and focuses on building confidence with mindful movement. The program includes 4 sessions that cover breath awareness, gentle mobility, standing balance, and restorative poses. Would you like me to tell you more about it?',
        tokens: 85,
      },
    ],
  });

  // Create ElevenLabs Voices
  const elevenLabsVoices = [
    {
      id: 'voice-rachel',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      name: 'Rachel',
      description: 'Calm and soothing female voice, perfect for meditation',
      category: 'MEDITATION',
      previewUrl: 'https://api.elevenlabs.io/v1/voices/21m00Tcm4TlvDq8ikWAM/preview',
      labels: ['calm', 'female', 'meditation'],
      stability: 0.75,
      similarityBoost: 0.75,
      isActive: true,
    },
    {
      id: 'voice-adam',
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      name: 'Adam',
      description: 'Deep male voice for guided sessions',
      category: 'INSTRUCTION',
      previewUrl: 'https://api.elevenlabs.io/v1/voices/pNInz6obpgDQGcFmaJgB/preview',
      labels: ['deep', 'male', 'instruction'],
      stability: 0.80,
      similarityBoost: 0.70,
      isActive: true,
    },
  ];

  for (const voice of elevenLabsVoices) {
    await prisma.elevenLabsVoice.upsert({
      where: { id: voice.id },
      update: voice,
      create: voice,
    });
  }

  console.log('🤖 AI Services data ensured');

  // ============================================
  // Sprint 16: Subscription Plans Seed Data
  // ============================================

  const subscriptionPlans = [
    {
      id: 'plan-free',
      name: 'Free',
      description: 'Basic access to fitness content',
      tier: 'FREE' as const,
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'TRY',
      features: ['Access to 5 free classes', 'Basic pose library', 'Community forum access'],
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'plan-basic',
      name: 'Basic',
      description: 'Full access to all content',
      tier: 'BASIC' as const,
      priceMonthly: 99.99,
      priceYearly: 959.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_basic_monthly',
      stripePriceIdYearly: 'price_basic_yearly',
      features: ['Unlimited classes', 'Full pose library', 'Progress tracking', 'Community features'],
      trialDays: 7,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'plan-premium',
      name: 'Premium',
      description: 'Premium experience with exclusive content',
      tier: 'PREMIUM' as const,
      priceMonthly: 199.99,
      priceYearly: 1799.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_premium_monthly',
      stripePriceIdYearly: 'price_premium_yearly',
      features: ['Everything in Basic', 'Exclusive programs', 'Unlimited offline downloads', 'Priority live stream access', '1-on-1 coaching sessions', 'Ad-free experience'],
      trialDays: 7,
      offlineDownloads: true,
      maxDevices: 3,
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }

  console.log('💎 Subscription plans ensured');

  console.log('✅ Seed data created successfully');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
