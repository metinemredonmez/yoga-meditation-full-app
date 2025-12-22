import { hashPassword } from '../src/utils/password';
import { prisma } from '../src/utils/database';

async function main() {
  console.log('🌱 Seeding fitness app database (Yoga, Pilates, Meditation, Wellness)...');

  // ============================================
  // ADMIN USERS
  // ============================================
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.users.upsert({
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
  // TEACHER USERS
  // ============================================
  const teacherPassword = await hashPassword('teacher123');

  const teacherTaylor = await prisma.users.upsert({
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

  const teacherMaya = await prisma.users.upsert({
    where: { email: 'maya@fitness.com' },
    update: {},
    create: {
      email: 'maya@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Maya',
      lastName: 'Chen',
      role: 'TEACHER',
      bio: 'Certified Pilates instructor specializing in Mat Pilates and Reformer.',
    },
  });

  const teacherAlex = await prisma.users.upsert({
    where: { email: 'alex@fitness.com' },
    update: {},
    create: {
      email: 'alex@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Alex',
      lastName: 'Rivera',
      role: 'TEACHER',
      bio: 'Meditation and mindfulness coach. Specializes in breathwork and guided meditation.',
    },
  });

  const teacher = teacherTaylor;

  // More instructor users for comprehensive seed data
  const teacherZeynep = await prisma.users.upsert({
    where: { email: 'zeynep@fitness.com' },
    update: {},
    create: {
      email: 'zeynep@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Zeynep',
      lastName: 'Demir',
      role: 'TEACHER',
      bio: 'Yin Yoga ve Restorative uzmanı. Stres yönetimi koçu.',
    },
  });

  const teacherCan = await prisma.users.upsert({
    where: { email: 'can@fitness.com' },
    update: {},
    create: {
      email: 'can@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Can',
      lastName: 'Özkan',
      role: 'TEACHER',
      bio: 'Mindfulness eğitmeni. Vipassana meditasyonu uzmanı.',
    },
  });

  const teacherElif = await prisma.users.upsert({
    where: { email: 'elif@fitness.com' },
    update: {},
    create: {
      email: 'elif@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Elif',
      lastName: 'Arslan',
      role: 'TEACHER',
      bio: 'Uyku meditasyonu ve Yoga Nidra uzmanı.',
    },
  });

  const teacherBurak = await prisma.users.upsert({
    where: { email: 'burak@fitness.com' },
    update: {},
    create: {
      email: 'burak@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Burak',
      lastName: 'Şahin',
      role: 'TEACHER',
      bio: 'Pranayama ve breathwork uzmanı. Wim Hof sertifikalı.',
    },
  });

  const teacherSeda = await prisma.users.upsert({
    where: { email: 'seda@fitness.com' },
    update: {},
    create: {
      email: 'seda@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Seda',
      lastName: 'Yıldız',
      role: 'TEACHER',
      bio: 'Hamile yogası ve doğum sonrası uzmanı.',
    },
  });

  const teacherDeniz = await prisma.users.upsert({
    where: { email: 'deniz@fitness.com' },
    update: {},
    create: {
      email: 'deniz@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Deniz',
      lastName: 'Aydın',
      role: 'TEACHER',
      bio: 'Çocuk yogası uzmanı. Eğlenceli ve eğitici dersler.',
    },
  });

  const teacherAhmet = await prisma.users.upsert({
    where: { email: 'ahmet@fitness.com' },
    update: {},
    create: {
      email: 'ahmet@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Ahmet',
      lastName: 'Çelik',
      role: 'TEACHER',
      bio: 'Ofis yogası ve sandalye yogası uzmanı.',
    },
  });

  // Pending instructors (for testing approval flow)
  const teacherMerve = await prisma.users.upsert({
    where: { email: 'merve@fitness.com' },
    update: {},
    create: {
      email: 'merve@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Merve',
      lastName: 'Koç',
      role: 'TEACHER',
      bio: 'Yeni mezun yoga öğretmeni.',
    },
  });

  const teacherEmre = await prisma.users.upsert({
    where: { email: 'emre@fitness.com' },
    update: {},
    create: {
      email: 'emre@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Emre',
      lastName: 'Güneş',
      role: 'TEACHER',
      bio: 'Fitness ve yoga kombinasyonu uzmanı.',
    },
  });

  // ============================================
  // STUDENT USERS
  // ============================================
  const studentPassword = await hashPassword('student123');

  const studentSam = await prisma.users.upsert({
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

  const studentEmma = await prisma.users.upsert({
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

  const student = studentSam;

  console.log('👤 Users ensured (1 Admin, 3 Teachers, 2 Students)');

  // ============================================
  // TAGS
  // ============================================
  const tagSeeds = [
    { id: 'tag-level-beginner', kind: 'LEVEL' as const, name: 'Beginner', slug: 'beginner' },
    { id: 'tag-level-intermediate', kind: 'LEVEL' as const, name: 'Intermediate', slug: 'intermediate' },
    { id: 'tag-level-advanced', kind: 'LEVEL' as const, name: 'Advanced', slug: 'advanced' },
    { id: 'tag-discipline-yoga', kind: 'FOCUS' as const, name: 'Yoga', slug: 'yoga' },
    { id: 'tag-discipline-pilates', kind: 'FOCUS' as const, name: 'Pilates', slug: 'pilates' },
    { id: 'tag-discipline-meditation', kind: 'FOCUS' as const, name: 'Meditation', slug: 'meditation' },
    { id: 'tag-focus-flexibility', kind: 'FOCUS' as const, name: 'Flexibility', slug: 'flexibility' },
    { id: 'tag-focus-strength', kind: 'FOCUS' as const, name: 'Strength', slug: 'strength' },
    { id: 'tag-focus-mindfulness', kind: 'FOCUS' as const, name: 'Mindfulness', slug: 'mindfulness' },
    { id: 'tag-focus-relaxation', kind: 'FOCUS' as const, name: 'Relaxation', slug: 'relaxation' },
    { id: 'tag-focus-stress-relief', kind: 'FOCUS' as const, name: 'Stress Relief', slug: 'stress-relief' },
    { id: 'tag-focus-sleep', kind: 'FOCUS' as const, name: 'Sleep', slug: 'sleep' },
    { id: 'tag-equip-mat', kind: 'EQUIPMENT' as const, name: 'Mat', slug: 'mat' },
    { id: 'tag-equip-no-equipment', kind: 'EQUIPMENT' as const, name: 'No Equipment', slug: 'no-equipment' },
  ];

  for (const tag of tagSeeds) {
    await prisma.tags.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, kind: tag.kind },
      create: tag,
    });
  }
  console.log('🏷️ Tags ensured');

  // ============================================
  // SUBSCRIPTION PLANS
  // ============================================
  const subscriptionPlans = [
    {
      id: 'plan-free',
      name: 'Free',
      description: 'Temel içeriklere erişim',
      tier: 'FREE' as const,
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'TRY',
      features: ['Günde 1 meditasyon', 'Temel nefes egzersizleri', 'Sınırlı yoga dersleri'],
      includedCategories: ['meditation_basic', 'breathwork_basic'],
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'plan-meditation',
      name: 'Meditation',
      description: 'Tüm meditasyon ve uyku içerikleri',
      tier: 'MEDITATION' as const,
      priceMonthly: 79.99,
      priceYearly: 699.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_meditation_monthly',
      features: ['Sınırsız meditasyon', 'Uyku hikayeleri', 'Nefes egzersizleri', 'Doğa sesleri', 'Reklamsız'],
      includedCategories: ['meditation', 'sleep', 'breathwork', 'soundscapes'],
      trialDays: 7,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'plan-yoga',
      name: 'Yoga',
      description: 'Tüm yoga ve pilates içerikleri',
      tier: 'YOGA' as const,
      priceMonthly: 99.99,
      priceYearly: 899.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_yoga_monthly',
      features: ['Sınırsız yoga dersleri', 'Pilates dersleri', 'Canlı dersler', 'Eğitmen programları', 'Reklamsız'],
      includedCategories: ['yoga', 'pilates', 'live_classes'],
      hasLiveClasses: true,
      trialDays: 7,
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'plan-premium',
      name: 'Premium',
      description: 'Tüm içerikler + AI koç + offline',
      tier: 'PREMIUM' as const,
      priceMonthly: 149.99,
      priceYearly: 1299.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_premium_monthly',
      features: ['Tüm içerikler', 'AI kişisel koç', 'Offline indirme', 'Canlı dersler', 'Öncelikli destek'],
      includedCategories: ['all'],
      trialDays: 7,
      hasOfflineDownload: true,
      hasAICoach: true,
      hasLiveClasses: true,
      maxDevices: 3,
      isActive: true,
      sortOrder: 4,
    },
    {
      id: 'plan-family',
      name: 'Family',
      description: '6 kişiye kadar aile paylaşımı',
      tier: 'FAMILY' as const,
      priceMonthly: 249.99,
      priceYearly: 2199.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_family_monthly',
      features: ['6 kişiye kadar paylaşım', 'Tüm Premium özellikler', 'Aile aktivite takibi'],
      includedCategories: ['all'],
      trialDays: 7,
      hasOfflineDownload: true,
      hasAICoach: true,
      hasLiveClasses: true,
      hasFamilySharing: true,
      maxFamilyMembers: 6,
      maxDevices: 6,
      isActive: true,
      sortOrder: 5,
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscription_plans.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }
  console.log('💎 Subscription plans ensured');

  // ============================================
  // INSTRUCTOR PROFILES
  // ============================================
  const instructorProfile = await prisma.instructor_profiles.upsert({
    where: { slug: 'taylor-yoga' },
    update: { userId: teacher.id },
    create: {
      userId: teacher.id,
      displayName: 'Taylor Yoga',
      slug: 'taylor-yoga',
      bio: 'Certified yoga instructor with over 10 years of experience.',
      shortBio: 'Vinyasa & Hatha specialist',
      specializations: ['Vinyasa', 'Hatha', 'Restorative'],
      yearsOfExperience: 10,
      languages: ['English', 'Turkish'],
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      isFeatured: true,
      totalStudents: 1250,
      averageRating: 4.85,
      commissionRate: 0.25,
      profileImageUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200',
    },
  });

  const instructorProfileMaya = await prisma.instructor_profiles.upsert({
    where: { slug: 'maya-pilates' },
    update: { userId: teacherMaya.id },
    create: {
      userId: teacherMaya.id,
      displayName: 'Maya Pilates',
      slug: 'maya-pilates',
      bio: 'Certified Pilates instructor specializing in Mat Pilates and Reformer.',
      shortBio: 'Pilates & Core Uzmanı',
      specializations: ['Pilates', 'Core', 'Reformer'],
      yearsOfExperience: 8,
      languages: ['Turkish', 'English'],
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      isFeatured: true,
      totalStudents: 980,
      averageRating: 4.88,
      commissionRate: 0.25,
      profileImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
    },
  });

  const instructorProfileAlex = await prisma.instructor_profiles.upsert({
    where: { slug: 'alex-meditation' },
    update: { userId: teacherAlex.id },
    create: {
      userId: teacherAlex.id,
      displayName: 'Alex Meditasyon',
      slug: 'alex-meditation',
      bio: 'Meditasyon ve farkındalık koçu.',
      shortBio: 'Meditasyon & Nefes Uzmanı',
      specializations: ['Meditasyon', 'Nefes Çalışmaları', 'Farkındalık'],
      yearsOfExperience: 6,
      languages: ['Turkish', 'English'],
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      isFeatured: true,
      totalStudents: 850,
      averageRating: 4.9,
      commissionRate: 0.25,
      profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=1200',
    },
  });

  // Zeynep - Yin/Restorative Yoga Expert
  await prisma.instructor_profiles.upsert({
    where: { slug: 'zeynep-yin' },
    update: { userId: teacherZeynep.id },
    create: {
      userId: teacherZeynep.id,
      displayName: 'Zeynep Yin Yoga',
      slug: 'zeynep-yin',
      bio: 'Yin Yoga ve Restorative uzmanı. Stres yönetimi koçu. 7 yıllık deneyim.',
      shortBio: 'Yin & Restorative Yoga Uzmanı',
      specializations: ['Yin Yoga', 'Restorative Yoga', 'Stress Relief'],
      yearsOfExperience: 7,
      languages: ['Turkish', 'English'],
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      isFeatured: false,
      totalStudents: 1800,
      averageRating: 4.7,
      commissionRate: 0.25,
      profileImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
    },
  });

  // Can - Mindfulness Expert
  await prisma.instructor_profiles.upsert({
    where: { slug: 'can-mindfulness' },
    update: { userId: teacherCan.id },
    create: {
      userId: teacherCan.id,
      displayName: 'Can Mindfulness',
      slug: 'can-mindfulness',
      bio: 'Mindfulness eğitmeni. Vipassana meditasyonu uzmanı. 12 yıllık deneyim.',
      shortBio: 'Mindfulness & Vipassana Uzmanı',
      specializations: ['Mindfulness', 'Vipassana', 'Guided Meditation'],
      yearsOfExperience: 12,
      languages: ['Turkish', 'English', 'German'],
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      isFeatured: true,
      totalStudents: 4200,
      averageRating: 4.95,
      commissionRate: 0.20,
      profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=1200',
    },
  });

  // Elif - Sleep & Yoga Nidra Expert
  await prisma.instructor_profiles.upsert({
    where: { slug: 'elif-sleep' },
    update: { userId: teacherElif.id },
    create: {
      userId: teacherElif.id,
      displayName: 'Elif Uyku Yogası',
      slug: 'elif-sleep',
      bio: 'Uyku meditasyonu ve Yoga Nidra uzmanı. Kaliteli uyku için rehberlik.',
      shortBio: 'Uyku & Yoga Nidra Uzmanı',
      specializations: ['Sleep Meditation', 'Yoga Nidra', 'Relaxation'],
      yearsOfExperience: 5,
      languages: ['Turkish'],
      status: 'APPROVED',
      tier: 'STARTER',
      isVerified: true,
      isFeatured: false,
      totalStudents: 2800,
      averageRating: 4.6,
      commissionRate: 0.30,
      profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=1200',
    },
  });

  // Burak - Breathwork Expert
  await prisma.instructor_profiles.upsert({
    where: { slug: 'burak-breathwork' },
    update: { userId: teacherBurak.id },
    create: {
      userId: teacherBurak.id,
      displayName: 'Burak Nefes Ustası',
      slug: 'burak-breathwork',
      bio: 'Pranayama ve breathwork uzmanı. Wim Hof sertifikalı. Enerji ve odaklanma.',
      shortBio: 'Pranayama & Wim Hof Uzmanı',
      specializations: ['Pranayama', 'Wim Hof Method', 'Holotropic Breathwork'],
      yearsOfExperience: 8,
      languages: ['Turkish', 'English'],
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      isFeatured: true,
      totalStudents: 1500,
      averageRating: 4.8,
      commissionRate: 0.25,
      profileImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    },
  });

  // Seda - Prenatal Yoga Expert
  await prisma.instructor_profiles.upsert({
    where: { slug: 'seda-prenatal' },
    update: { userId: teacherSeda.id },
    create: {
      userId: teacherSeda.id,
      displayName: 'Seda Anne Yogası',
      slug: 'seda-prenatal',
      bio: 'Hamile yogası ve doğum sonrası uzmanı. Anne adayları için güvenli yoga.',
      shortBio: 'Hamile & Doğum Sonrası Yoga',
      specializations: ['Prenatal Yoga', 'Postnatal Yoga', 'Gentle Yoga'],
      yearsOfExperience: 9,
      languages: ['Turkish'],
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      isFeatured: false,
      totalStudents: 950,
      averageRating: 4.9,
      commissionRate: 0.25,
      profileImageUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
    },
  });

  // Deniz - Kids Yoga Expert
  await prisma.instructor_profiles.upsert({
    where: { slug: 'deniz-kids' },
    update: { userId: teacherDeniz.id },
    create: {
      userId: teacherDeniz.id,
      displayName: 'Deniz Çocuk Yogası',
      slug: 'deniz-kids',
      bio: 'Çocuk yogası uzmanı. Eğlenceli ve eğitici dersler. 3-12 yaş grubu.',
      shortBio: 'Çocuk & Aile Yogası',
      specializations: ['Kids Yoga', 'Family Yoga', 'Playful Movement'],
      yearsOfExperience: 6,
      languages: ['Turkish', 'English'],
      status: 'APPROVED',
      tier: 'STARTER',
      isVerified: true,
      isFeatured: false,
      totalStudents: 1200,
      averageRating: 4.7,
      commissionRate: 0.30,
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200',
    },
  });

  // Ahmet - Office/Chair Yoga Expert
  await prisma.instructor_profiles.upsert({
    where: { slug: 'ahmet-office' },
    update: { userId: teacherAhmet.id },
    create: {
      userId: teacherAhmet.id,
      displayName: 'Ahmet Ofis Yogası',
      slug: 'ahmet-office',
      bio: 'Ofis yogası ve sandalye yogası uzmanı. Masa başı çalışanlar için pratik yoga.',
      shortBio: 'Ofis & Sandalye Yogası',
      specializations: ['Chair Yoga', 'Office Yoga', 'Corporate Wellness'],
      yearsOfExperience: 4,
      languages: ['Turkish'],
      status: 'APPROVED',
      tier: 'STARTER',
      isVerified: false,
      isFeatured: false,
      totalStudents: 800,
      averageRating: 4.5,
      commissionRate: 0.30,
      profileImageUrl: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
    },
  });

  // Merve - PENDING instructor (for testing approval flow)
  await prisma.instructor_profiles.upsert({
    where: { slug: 'merve-yoga' },
    update: { userId: teacherMerve.id },
    create: {
      userId: teacherMerve.id,
      displayName: 'Merve Yoga',
      slug: 'merve-yoga',
      bio: 'Yeni mezun yoga öğretmeni. RYT-200 sertifikalı.',
      shortBio: 'Yeni Başlayan Eğitmen',
      specializations: ['Hatha Yoga', 'Beginner Yoga'],
      yearsOfExperience: 1,
      languages: ['Turkish'],
      status: 'PENDING',
      tier: 'STARTER',
      isVerified: false,
      isFeatured: false,
      totalStudents: 0,
      averageRating: 0,
      commissionRate: 0.30,
      profileImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200',
    },
  });

  // Emre - PENDING instructor (for testing approval flow)
  await prisma.instructor_profiles.upsert({
    where: { slug: 'emre-power' },
    update: { userId: teacherEmre.id },
    create: {
      userId: teacherEmre.id,
      displayName: 'Emre Power Yoga',
      slug: 'emre-power',
      bio: 'Fitness ve yoga kombinasyonu. Power yoga ve güç antrenmanı.',
      shortBio: 'Power Yoga & Fitness',
      specializations: ['Power Yoga', 'Fitness Yoga', 'Strength Training'],
      yearsOfExperience: 3,
      languages: ['Turkish', 'English'],
      status: 'PENDING',
      tier: 'STARTER',
      isVerified: false,
      isFeatured: false,
      totalStudents: 0,
      averageRating: 0,
      commissionRate: 0.30,
      profileImageUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
    },
  });

  console.log('👩‍🏫 Instructor profiles ensured (12 instructors)');

  // ============================================
  // GAMIFICATION: USER LEVELS (removed - model deleted)
  // ============================================
  console.log('📊 User levels skipped (model removed)');

  // ============================================
  // ACHIEVEMENTS
  // ============================================
  const achievementSeeds = [
    { id: 'achievement-first-class', slug: 'first-class', name: 'First Steps', description: 'Complete your first class', icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176298.png', category: 'PRACTICE' as const, difficulty: 'EASY' as const, xpReward: 50, requirementType: 'CLASSES_COMPLETED' as const, requirementValue: 1 },
    { id: 'achievement-10-classes', slug: '10-classes', name: 'Dedicated Practitioner', description: 'Complete 10 classes', icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176363.png', category: 'PRACTICE' as const, difficulty: 'MEDIUM' as const, xpReward: 150, requirementType: 'CLASSES_COMPLETED' as const, requirementValue: 10 },
    { id: 'achievement-7-day-streak', slug: '7-day-streak', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'https://cdn-icons-png.flaticon.com/512/785/785116.png', category: 'CONSISTENCY' as const, difficulty: 'EASY' as const, xpReward: 100, requirementType: 'STREAK_DAYS' as const, requirementValue: 7 },
    { id: 'achievement-first-meditation', slug: 'first-meditation', name: 'İlk Meditasyon', description: 'İlk meditasyonunu tamamla', icon: 'https://cdn-icons-png.flaticon.com/512/2647/2647625.png', category: 'PRACTICE' as const, difficulty: 'EASY' as const, xpReward: 50, requirementType: 'CUSTOM' as const, requirementValue: 1 },
    { id: 'achievement-breath-master', slug: 'breath-master', name: 'Nefes Ustası', description: '50 nefes egzersizi tamamla', icon: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png', category: 'PRACTICE' as const, difficulty: 'HARD' as const, xpReward: 400, requirementType: 'CUSTOM' as const, requirementValue: 50 },
    { id: 'achievement-mood-tracker', slug: 'mood-tracker', name: 'Duygu Takipçisi', description: '30 gün mood kaydet', icon: 'https://cdn-icons-png.flaticon.com/512/3688/3688601.png', category: 'CONSISTENCY' as const, difficulty: 'HARD' as const, xpReward: 350, requirementType: 'CUSTOM' as const, requirementValue: 30 },
    { id: 'achievement-50-classes', slug: '50-classes', name: 'Yoga Master', description: '50 ders tamamla', icon: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png', category: 'PRACTICE' as const, difficulty: 'HARD' as const, xpReward: 500, requirementType: 'CLASSES_COMPLETED' as const, requirementValue: 50 },
    { id: 'achievement-30-day-streak', slug: '30-day-streak', name: 'Month Champion', description: '30 günlük seri yap', icon: 'https://cdn-icons-png.flaticon.com/512/2583/2583281.png', category: 'CONSISTENCY' as const, difficulty: 'HARD' as const, xpReward: 600, requirementType: 'STREAK_DAYS' as const, requirementValue: 30 },
    { id: 'achievement-early-bird', slug: 'early-bird', name: 'Early Bird', description: 'Sabah 7 den önce 10 pratik yap', icon: 'https://cdn-icons-png.flaticon.com/512/869/869869.png', category: 'PRACTICE' as const, difficulty: 'MEDIUM' as const, xpReward: 200, requirementType: 'CUSTOM' as const, requirementValue: 10 },
    { id: 'achievement-night-owl', slug: 'night-owl', name: 'Night Owl', description: 'Akşam 10 dan sonra 10 pratik yap', icon: 'https://cdn-icons-png.flaticon.com/512/3236/3236952.png', category: 'PRACTICE' as const, difficulty: 'MEDIUM' as const, xpReward: 200, requirementType: 'CUSTOM' as const, requirementValue: 10 },
    { id: 'achievement-social-yogi', slug: 'social-yogi', name: 'Social Yogi', description: '5 arkadaş davet et', icon: 'https://cdn-icons-png.flaticon.com/512/681/681494.png', category: 'SOCIAL' as const, difficulty: 'MEDIUM' as const, xpReward: 250, requirementType: 'CUSTOM' as const, requirementValue: 5 },
    { id: 'achievement-challenge-winner', slug: 'challenge-winner', name: 'Challenge Winner', description: 'Bir challenge tamamla', icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176395.png', category: 'MASTERY' as const, difficulty: 'MEDIUM' as const, xpReward: 300, requirementType: 'CHALLENGES_COMPLETED' as const, requirementValue: 1 },
  ];

  for (const achievement of achievementSeeds) {
    await prisma.achievements.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }
  console.log('🏆 Achievements ensured');

  // ============================================
  // QUESTS (removed - model deleted)
  // ============================================
  console.log('📋 Quests skipped (model removed)');

  // ============================================
  // LANGUAGES (i18n)
  // ============================================
  const languages = [
    { id: 'lang-en', code: 'en', name: 'English', nativeName: 'English', direction: 'LTR' as const, isDefault: true, isActive: true, flagEmoji: '🇺🇸' },
    { id: 'lang-tr', code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'LTR' as const, isDefault: false, isActive: true, flagEmoji: '🇹🇷' },
  ];

  for (const lang of languages) {
    await prisma.languages.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
  }
  console.log('🌍 Languages ensured');

  // ============================================
  // MEDITATION CATEGORIES
  // ============================================
  const meditationCategories = [
    { id: 'med-cat-stress', slug: 'stress-relief', name: 'Stres Giderme', nameEn: 'Stress Relief', description: 'Günlük stresinizi azaltın', icon: '😌', color: '#4CAF50', sortOrder: 1 },
    { id: 'med-cat-anxiety', slug: 'anxiety-relief', name: 'Kaygı Azaltma', nameEn: 'Anxiety Relief', description: 'Kaygı ve endişeyi azaltın', icon: '🌿', color: '#66BB6A', sortOrder: 2 },
    { id: 'med-cat-sleep', slug: 'sleep', name: 'Uyku', nameEn: 'Sleep', description: 'Derin ve huzurlu uyku için', icon: '🌙', color: '#5C6BC0', sortOrder: 3 },
    { id: 'med-cat-focus', slug: 'focus', name: 'Odaklanma', nameEn: 'Focus', description: 'Konsantrasyonunuzu artırın', icon: '🎯', color: '#FF7043', sortOrder: 4 },
    { id: 'med-cat-morning', slug: 'morning', name: 'Sabah', nameEn: 'Morning', description: 'Güne enerjik başlayın', icon: '🌅', color: '#FFCA28', sortOrder: 5 },
    { id: 'med-cat-evening', slug: 'evening', name: 'Akşam', nameEn: 'Evening', description: 'Günü huzurla kapatın', icon: '🌆', color: '#7E57C2', sortOrder: 6 },
    { id: 'med-cat-mindfulness', slug: 'mindfulness', name: 'Farkındalık', nameEn: 'Mindfulness', description: 'Şimdiki ana odaklanın', icon: '🍃', color: '#81C784', sortOrder: 7 },
    { id: 'med-cat-beginner', slug: 'beginner', name: 'Başlangıç', nameEn: 'Beginner', description: 'Yeni başlayanlar için', icon: '🌱', color: '#A5D6A7', sortOrder: 8 },
  ];

  for (const category of meditationCategories) {
    await prisma.meditation_categories.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }
  console.log('📂 Meditation categories ensured');

  // ============================================
  // MEDITATIONS
  // ============================================
  const meditations = [
    { id: 'med-beginner-intro', title: 'Meditasyona Giriş', titleEn: 'Introduction to Meditation', slug: 'meditasyona-giris', description: 'Meditasyona yeni başlayanlar için temel eğitim.', audioUrl: 'https://cdn.pixabay.com/audio/2024/02/14/audio_0e0c3f5db2.mp3', coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', duration: 600, categoryId: 'med-cat-beginner', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 28450, averageRating: 4.8, tags: ['başlangıç', 'giriş'], benefits: ['Temelleri öğretir'], isPublished: true, publishedAt: new Date('2024-01-01') },
    { id: 'med-beginner-3min', title: '3 Dakikalık İlk Meditasyon', titleEn: '3-Minute First Meditation', slug: '3-dakikalik-ilk-meditasyon', description: 'En kısa ve basit meditasyon.', audioUrl: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946b0939c5.mp3', coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800', duration: 180, categoryId: 'med-cat-beginner', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 35620, averageRating: 4.85, tags: ['başlangıç', 'kısa'], benefits: ['Kolay başlangıç'], isPublished: true, publishedAt: new Date('2024-01-02') },
    { id: 'med-stress-relief-5min', title: '5 Dakikada Stres Giderme', titleEn: '5-Minute Stress Relief', slug: '5-dakikada-stres-giderme', description: 'Yoğun bir günün ortasında hızlıca rahatlayın.', audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_0c2b46c1bb.mp3', coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', duration: 300, categoryId: 'med-cat-stress', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 15420, averageRating: 4.7, tags: ['stres', 'hızlı'], benefits: ['Stresi azaltır'], isPublished: true, publishedAt: new Date('2024-01-15') },
    { id: 'med-sleep-relaxation', title: 'Uyku Öncesi Gevşeme', titleEn: 'Pre-Sleep Relaxation', slug: 'uyku-oncesi-gevseme', description: 'Uyumadan önce zihninizi hazırlayın.', audioUrl: 'https://cdn.pixabay.com/audio/2022/08/02/audio_2dae70d4f5.mp3', coverImage: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=800', duration: 900, categoryId: 'med-cat-sleep', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 25680, averageRating: 4.9, tags: ['uyku', 'gece'], benefits: ['Uyku kalitesini artırır'], isPublished: true, publishedAt: new Date('2024-01-10') },
    { id: 'med-morning-energy', title: 'Sabah Enerji Meditasyonu', titleEn: 'Morning Energy', slug: 'sabah-enerji', description: 'Güne enerji dolu başlamak için.', audioUrl: 'https://cdn.pixabay.com/audio/2023/09/04/audio_9f9aa6dec5.mp3', coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', duration: 420, categoryId: 'med-cat-morning', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 18650, averageRating: 4.75, tags: ['sabah', 'enerji'], benefits: ['Enerji verir'], isPublished: true, publishedAt: new Date('2024-01-12') },
    { id: 'med-mindfulness-present', title: 'Şimdiye Dönüş', titleEn: 'Return to Present', slug: 'simdiye-donus', description: 'Şimdiki ana dönün.', audioUrl: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', coverImage: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800', duration: 480, categoryId: 'med-cat-mindfulness', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 16780, averageRating: 4.75, tags: ['farkındalık', 'şimdi'], benefits: ['Zihinsel netlik'], isPublished: true, publishedAt: new Date('2024-01-08') },
    { id: 'med-yoga-nidra', title: 'Yoga Nidra - Uyku Yogası', titleEn: 'Yoga Nidra', slug: 'yoga-nidra', description: 'Derin bilinçaltı gevşeme.', audioUrl: 'https://cdn.pixabay.com/audio/2024/01/08/audio_ed0b7e45a5.mp3', coverImage: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800', duration: 2700, categoryId: 'med-cat-sleep', difficulty: 'INTERMEDIATE' as const, instructorId: instructorProfileAlex.id, isPremium: true, playCount: 9450, averageRating: 4.95, tags: ['yoga nidra', 'uyku'], benefits: ['45 dakika = 3 saat uyku'], isPublished: true, publishedAt: new Date('2024-02-15') },
    { id: 'med-anxiety-calm', title: 'Kaygı Yatıştırma', titleEn: 'Anxiety Calming', slug: 'kaygi-yatistirma', description: 'Kaygı ve endişeyi sakinleştiren meditasyon.', audioUrl: 'https://cdn.pixabay.com/audio/2023/05/16/audio_166b9c9e42.mp3', coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800', duration: 600, categoryId: 'med-cat-anxiety', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 21340, averageRating: 4.82, tags: ['kaygı', 'sakinlik'], benefits: ['Kaygıyı azaltır'], isPublished: true, publishedAt: new Date('2024-01-20') },
    { id: 'med-focus-deep', title: 'Derin Odaklanma', titleEn: 'Deep Focus', slug: 'derin-odaklanma', description: 'Çalışma ve öğrenme için konsantrasyon.', audioUrl: 'https://cdn.pixabay.com/audio/2022/10/18/audio_5eb0bf8f61.mp3', coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', duration: 720, categoryId: 'med-cat-focus', difficulty: 'INTERMEDIATE' as const, instructorId: instructorProfileAlex.id, isPremium: true, playCount: 14560, averageRating: 4.78, tags: ['odak', 'çalışma'], benefits: ['Konsantrasyonu artırır'], isPublished: true, publishedAt: new Date('2024-02-01') },
    { id: 'med-body-scan', title: 'Vücut Taraması', titleEn: 'Body Scan', slug: 'vucut-taramasi', description: 'Tüm vücudu farkındalıkla tarayın.', audioUrl: 'https://cdn.pixabay.com/audio/2023/10/30/audio_5ec52ddd53.mp3', coverImage: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800', duration: 900, categoryId: 'med-cat-mindfulness', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 19870, averageRating: 4.88, tags: ['vücut', 'farkındalık'], benefits: ['Gerginliği fark eder'], isPublished: true, publishedAt: new Date('2024-01-25') },
    // Demo meditation with local audio file
    { id: 'med-super-deep-demo', title: '15 Dakika Süper Derin Meditasyon', titleEn: '15 Minute Super Deep Meditation', slug: 'super-derin-meditasyon', description: 'Zihin ve bedeni dinlendiren, iç huzur sağlayan 15 dakikalık derin meditasyon seansı. Rahatlatıcı müzik eşliğinde.', audioUrl: '/uploads/demo/meditation-demo.mp3', coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', duration: 900, categoryId: 'med-cat-mindfulness', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 0, averageRating: 5.0, tags: ['derin meditasyon', 'huzur', 'rahatlama'], benefits: ['Zihinsel dinginlik', 'Stres azaltma', 'İç huzur'], isPublished: true, publishedAt: new Date('2024-12-22') },
  ];

  for (const meditation of meditations) {
    await prisma.meditations.upsert({
      where: { id: meditation.id },
      update: meditation,
      create: meditation,
    });
  }
  console.log('🧘‍♀️ Meditations ensured');

  // ============================================
  // BREATHWORK PATTERNS
  // ============================================
  const breathworks = [
    { id: 'breath-box', title: 'Kutu Nefesi', titleEn: 'Box Breathing', slug: 'kutu-nefesi', description: 'Navy SEAL\'ların kullandığı teknik.', pattern: 'BOX_BREATHING' as const, inhale: 4, hold1: 4, exhale: 4, hold2: 4, cycles: 4, audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_8c2be3451f.mp3', coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', totalDuration: 256, category: 'CALM' as const, difficulty: 'BEGINNER' as const, benefits: ['Stresi azaltır', 'Odaklanmayı artırır'], isPremium: false, animationType: 'CIRCLE' as const, playCount: 24580, isPublished: true },
    { id: 'breath-478', title: '4-7-8 Nefesi', titleEn: '4-7-8 Breathing', slug: '4-7-8-nefesi', description: 'Dr. Andrew Weil tarafından geliştirilen teknik.', pattern: 'FOUR_SEVEN_EIGHT' as const, inhale: 4, hold1: 7, exhale: 8, hold2: 0, cycles: 4, audioUrl: 'https://cdn.pixabay.com/audio/2022/08/02/audio_2dae70d4f5.mp3', coverImage: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=400', totalDuration: 304, category: 'SLEEP' as const, difficulty: 'BEGINNER' as const, benefits: ['Uykuya dalmayı kolaylaştırır'], isPremium: false, animationType: 'CIRCLE' as const, playCount: 31240, isPublished: true },
    { id: 'breath-relaxing', title: 'Gevşeme Nefesi', titleEn: 'Relaxing Breath', slug: 'gevseme-nefesi', description: 'Uzun nefes verme ile gevşeme.', pattern: 'RELAXING_BREATH' as const, inhale: 4, hold1: 2, exhale: 6, hold2: 0, cycles: 6, audioUrl: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', totalDuration: 288, category: 'CALM' as const, difficulty: 'BEGINNER' as const, benefits: ['Anında sakinlik'], isPremium: false, animationType: 'WAVE' as const, playCount: 18920, isPublished: true },
    { id: 'breath-energizing', title: 'Enerji Nefesi', titleEn: 'Energizing Breath', slug: 'enerji-nefesi', description: 'Enerji seviyenizi yükseltin.', pattern: 'ENERGIZING_BREATH' as const, inhale: 2, hold1: 0, exhale: 2, hold2: 0, cycles: 20, audioUrl: 'https://cdn.pixabay.com/audio/2023/09/04/audio_9f9aa6dec5.mp3', coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', totalDuration: 160, category: 'ENERGY' as const, difficulty: 'INTERMEDIATE' as const, benefits: ['Enerji verir'], isPremium: true, animationType: 'PULSE' as const, playCount: 12340, isPublished: true },
    { id: 'breath-quick-calm', title: 'Hızlı Sakinleşme', titleEn: 'Quick Calm', slug: 'hizli-sakinlesme', description: '1 dakikada sakinleşin.', pattern: 'RELAXING_BREATH' as const, inhale: 3, hold1: 0, exhale: 6, hold2: 0, cycles: 6, audioUrl: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946b0939c5.mp3', coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400', totalDuration: 54, category: 'QUICK' as const, difficulty: 'BEGINNER' as const, benefits: ['Anında sakinlik'], isPremium: false, animationType: 'WAVE' as const, playCount: 28650, isPublished: true },
    { id: 'breath-morning-wake', title: 'Sabah Uyanış Nefesi', titleEn: 'Morning Wake-Up', slug: 'sabah-uyanis', description: 'Güne hazırlanın.', pattern: 'ENERGIZING_BREATH' as const, inhale: 3, hold1: 3, exhale: 3, hold2: 0, cycles: 8, audioUrl: 'https://cdn.pixabay.com/audio/2024/02/14/audio_0e0c3f5db2.mp3', coverImage: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400', totalDuration: 144, category: 'MORNING' as const, difficulty: 'BEGINNER' as const, benefits: ['Güne enerjik başlatır'], isPremium: false, animationType: 'PULSE' as const, playCount: 15230, isPublished: true },
    { id: 'breath-bedtime', title: 'Yatağa Hazırlık Nefesi', titleEn: 'Bedtime Breath', slug: 'yataga-hazirlik', description: 'Uyumadan önce zihninizi uyku moduna alın.', pattern: 'FOUR_SEVEN_EIGHT' as const, inhale: 4, hold1: 7, exhale: 8, hold2: 2, cycles: 3, audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_0c2b46c1bb.mp3', coverImage: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400', totalDuration: 126, category: 'EVENING' as const, difficulty: 'BEGINNER' as const, benefits: ['Uyku hazırlığı'], isPremium: false, animationType: 'WAVE' as const, playCount: 22180, isPublished: true },
    { id: 'breath-anxiety-relief', title: 'Kaygı Giderici Nefes', titleEn: 'Anxiety Relief', slug: 'kaygi-giderici', description: 'Kaygı anında uygulayın.', pattern: 'RELAXING_BREATH' as const, inhale: 4, hold1: 4, exhale: 8, hold2: 0, cycles: 5, audioUrl: 'https://cdn.pixabay.com/audio/2023/05/16/audio_166b9c9e42.mp3', coverImage: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400', totalDuration: 160, category: 'ANXIETY' as const, difficulty: 'BEGINNER' as const, benefits: ['Kaygıyı azaltır'], isPremium: false, animationType: 'WAVE' as const, playCount: 19870, isPublished: true },
  ];

  for (const breathwork of breathworks) {
    await prisma.breathworks.upsert({
      where: { id: breathwork.id },
      update: breathwork,
      create: breathwork,
    });
  }
  console.log('🌬️ Breathwork patterns ensured');

  // ============================================
  // SOUNDSCAPES
  // ============================================
  const soundscapes = [
    { id: 'sound-rain-soft', title: 'Yumuşak Yağmur', titleEn: 'Soft Rain', slug: 'yumusak-yagmur', audioUrl: 'https://cdn.pixabay.com/audio/2022/05/16/audio_f2d0a5d8a5.mp3', coverImage: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400', isLoop: true, category: 'RAIN' as const, isPremium: false, isMixable: true, defaultVolume: 50, playCount: 45620, tags: ['yağmur', 'doğa'], isPublished: true },
    { id: 'sound-rain-heavy', title: 'Şiddetli Yağmur', titleEn: 'Heavy Rain', slug: 'siddetli-yagmur', audioUrl: 'https://cdn.pixabay.com/audio/2022/03/24/audio_ebacd6e2ad.mp3', coverImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400', isLoop: true, category: 'RAIN' as const, isPremium: false, isMixable: true, defaultVolume: 40, playCount: 32450, tags: ['yağmur'], isPublished: true },
    { id: 'sound-thunder', title: 'Gök Gürültüsü', titleEn: 'Thunder', slug: 'gok-gurultusu', audioUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_3271b4d440.mp3', coverImage: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=400', isLoop: true, category: 'THUNDER' as const, isPremium: false, isMixable: true, defaultVolume: 30, playCount: 25890, tags: ['gök gürültüsü'], isPublished: true },
    { id: 'sound-ocean-waves', title: 'Okyanus Dalgaları', titleEn: 'Ocean Waves', slug: 'okyanus-dalgalari', audioUrl: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3', coverImage: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400', isLoop: true, category: 'OCEAN' as const, isPremium: false, isMixable: true, defaultVolume: 50, playCount: 52340, tags: ['okyanus', 'dalga'], isPublished: true },
    { id: 'sound-forest', title: 'Orman Sesleri', titleEn: 'Forest Sounds', slug: 'orman-sesleri', audioUrl: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff38c2.mp3', coverImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400', isLoop: true, category: 'FOREST' as const, isPremium: false, isMixable: true, defaultVolume: 50, playCount: 41230, tags: ['orman', 'doğa'], isPublished: true },
    { id: 'sound-birds', title: 'Kuş Cıvıltıları', titleEn: 'Bird Songs', slug: 'kus-civiltilari', audioUrl: 'https://cdn.pixabay.com/audio/2022/03/12/audio_b11a1f9c59.mp3', coverImage: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400', isLoop: true, category: 'BIRDS' as const, isPremium: false, isMixable: true, defaultVolume: 40, playCount: 35670, tags: ['kuş', 'sabah'], isPublished: true },
    { id: 'sound-fire', title: 'Şömine Ateşi', titleEn: 'Fireplace', slug: 'somine-atesi', audioUrl: 'https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bea8c6.mp3', coverImage: 'https://images.unsplash.com/photo-1543285198-3af15c4592ce?w=400', isLoop: true, category: 'FIRE' as const, isPremium: false, isMixable: true, defaultVolume: 45, playCount: 48920, tags: ['ateş', 'şömine'], isPublished: true },
    { id: 'sound-white-noise', title: 'Beyaz Gürültü', titleEn: 'White Noise', slug: 'beyaz-gurultu', audioUrl: 'https://cdn.pixabay.com/audio/2022/04/27/audio_67bcb98b1b.mp3', coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400', isLoop: true, category: 'WHITE_NOISE' as const, isPremium: false, isMixable: true, defaultVolume: 40, playCount: 56780, tags: ['beyaz gürültü', 'uyku'], isPublished: true },
    { id: 'sound-cafe', title: 'Kafe Ortamı', titleEn: 'Coffee Shop', slug: 'kafe-ortami', audioUrl: 'https://cdn.pixabay.com/audio/2022/11/22/audio_c914eb2fd5.mp3', coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', isLoop: true, category: 'CAFE' as const, isPremium: false, isMixable: true, defaultVolume: 35, playCount: 38920, tags: ['kafe', 'çalışma'], isPublished: true },
    { id: 'sound-tibetan-bowls', title: 'Tibet Çanakları', titleEn: 'Tibetan Singing Bowls', slug: 'tibet-canaklari', audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_8c2be3451f.mp3', coverImage: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400', isLoop: true, category: 'TIBETAN_BOWLS' as const, isPremium: true, isMixable: true, defaultVolume: 40, playCount: 35670, tags: ['tibet', 'meditasyon'], isPublished: true },
    { id: 'sound-wind', title: 'Rüzgar Sesi', titleEn: 'Wind', slug: 'ruzgar-sesi', audioUrl: 'https://cdn.pixabay.com/audio/2022/11/17/audio_fae2dde9cc.mp3', coverImage: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=400', isLoop: true, category: 'WIND' as const, isPremium: false, isMixable: true, defaultVolume: 35, playCount: 28540, tags: ['rüzgar', 'doğa'], isPublished: true },
    { id: 'sound-creek', title: 'Dere Suyu', titleEn: 'Creek Water', slug: 'dere-suyu', audioUrl: 'https://cdn.pixabay.com/audio/2022/08/31/audio_419263a638.mp3', coverImage: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=400', isLoop: true, category: 'WATER' as const, isPremium: false, isMixable: true, defaultVolume: 45, playCount: 31250, tags: ['dere', 'su'], isPublished: true },
  ];

  for (const sound of soundscapes) {
    await prisma.soundscapes.upsert({
      where: { id: sound.id },
      update: sound,
      create: sound,
    });
  }
  console.log('🔊 Soundscapes ensured');

  // ============================================
  // SLEEP STORIES
  // ============================================
  const sleepStories = [
    { id: 'sleep-story-forest', title: 'Gizemli Orman Yolculuğu', titleEn: 'Mysterious Forest Journey', slug: 'gizemli-orman', description: 'Huzurlu bir orman yolculuğuna çıkın.', audioUrl: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff38c2.mp3', duration: 1800, category: 'NATURE' as const, narratorName: 'Elif Yıldız', coverImageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', isPremium: false, playCount: 15620, averageRating: 4.85, tags: ['orman', 'doğa'], isPublished: true },
    { id: 'sleep-story-sea', title: 'Ege Kıyılarında', titleEn: 'On the Aegean Coast', slug: 'ege-kiyilari', description: 'Ege\'nin masmavi sularında sakin bir gece.', audioUrl: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3', duration: 2100, category: 'NATURE' as const, narratorName: 'Ahmet Kaya', coverImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', isPremium: true, playCount: 12340, averageRating: 4.9, tags: ['deniz', 'ege'], isPublished: true },
    { id: 'sleep-story-kapadokya', title: 'Kapadokya Gecesi', titleEn: 'Cappadocia Night', slug: 'kapadokya-gecesi', description: 'Peri bacaları arasında yıldızların altında.', audioUrl: 'https://cdn.pixabay.com/audio/2024/02/14/audio_0e0c3f5db2.mp3', duration: 2400, category: 'FANTASY' as const, narratorName: 'Merve Demir', coverImageUrl: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800', isPremium: true, playCount: 9870, averageRating: 4.95, tags: ['kapadokya', 'gece'], isPublished: true },
    { id: 'sleep-story-istanbul', title: 'İstanbul Akşamı', titleEn: 'Istanbul Evening', slug: 'istanbul-aksami', description: 'Boğaz\'ın ışıltılı sularında sakin bir akşam.', audioUrl: 'https://cdn.pixabay.com/audio/2022/08/02/audio_2dae70d4f5.mp3', duration: 1800, category: 'CITY' as const, narratorName: 'Can Öz', coverImageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800', isPremium: false, playCount: 18450, averageRating: 4.8, tags: ['istanbul', 'boğaz'], isPublished: true },
    { id: 'sleep-story-rain', title: 'Yağmurlu Gece', titleEn: 'Rainy Night', slug: 'yagmurlu-gece', description: 'Pencereye vuran yağmur sesi eşliğinde.', audioUrl: 'https://cdn.pixabay.com/audio/2022/05/16/audio_f2d0a5d8a5.mp3', duration: 2700, category: 'AMBIENT' as const, narratorName: 'Zeynep Arslan', coverImageUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800', isPremium: true, playCount: 21560, averageRating: 4.9, tags: ['yağmur', 'gece'], isPublished: true },
    { id: 'sleep-story-mountain', title: 'Dağ Kulübesi', titleEn: 'Mountain Cabin', slug: 'dag-kulubesi', description: 'Karlı dağlarda sıcak bir kulübede gece.', audioUrl: 'https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bea8c6.mp3', duration: 2100, category: 'NATURE' as const, narratorName: 'Ali Koç', coverImageUrl: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800', isPremium: false, playCount: 14230, averageRating: 4.87, tags: ['dağ', 'kış'], isPublished: true },
    { id: 'sleep-story-train', title: 'Gece Treni', titleEn: 'Night Train', slug: 'gece-treni', description: 'Ritmik tren seslerinde uyku yolculuğu.', audioUrl: 'https://cdn.pixabay.com/audio/2023/09/04/audio_9f9aa6dec5.mp3', duration: 2400, category: 'TRAVEL' as const, narratorName: 'Deniz Ak', coverImageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800', isPremium: true, playCount: 11890, averageRating: 4.92, tags: ['tren', 'yolculuk'], isPublished: true },
  ];

  for (const story of sleepStories) {
    await prisma.sleep_stories.upsert({
      where: { id: story.id },
      update: story,
      create: story,
    });
  }
  console.log('📖 Sleep stories ensured');

  // ============================================
  // DAILY QUOTES
  // ============================================
  const dailyQuotes = [
    { id: 'quote-1', text: 'Her gün yeni bir başlangıçtır.', author: 'Anonim', category: 'MOTIVATION' as const, language: 'tr', isActive: true },
    { id: 'quote-2', text: 'Bugün aldığın her nefes, yeni bir şans.', author: 'Thich Nhat Hanh', category: 'MINDFULNESS' as const, language: 'tr', isActive: true },
    { id: 'quote-3', text: 'Mutluluk içeride başlar.', author: 'Dalai Lama', category: 'HAPPINESS' as const, language: 'tr', isActive: true },
    { id: 'quote-4', text: 'Şimdi ve burada ol.', author: 'Ram Dass', category: 'MINDFULNESS' as const, language: 'tr', isActive: true },
    { id: 'quote-5', text: 'Nefes al, bırak gitsin.', author: 'Anonim', category: 'PEACE' as const, language: 'tr', isActive: true },
    { id: 'quote-6', text: 'Huzur, dışarıda değil içeridedir.', author: 'Marcus Aurelius', category: 'PEACE' as const, language: 'tr', isActive: true },
    { id: 'quote-7', text: 'Kendine nazik ol.', author: 'Buddha', category: 'SELF_LOVE' as const, language: 'tr', isActive: true },
    { id: 'quote-8', text: 'Bu an, sahip olduğun tek an.', author: 'Eckhart Tolle', category: 'MINDFULNESS' as const, language: 'tr', isActive: true },
    { id: 'quote-9', text: 'Yoga zihnin dalgalanmalarını durdurmaktır.', author: 'Patanjali', category: 'YOGA' as const, language: 'tr', isActive: true },
    { id: 'quote-10', text: 'Sevgi tüm yaraları iyileştirir.', author: 'Rumi', category: 'SUFI' as const, language: 'tr', isActive: true },
  ];

  for (const quote of dailyQuotes) {
    await prisma.daily_quotes.upsert({
      where: { id: quote.id },
      update: quote,
      create: quote,
    });
  }
  console.log('💬 Daily quotes ensured');

  // ============================================
  // MOOD TAGS
  // ============================================
  const moodTags = [
    // EMOTION - Duygular
    { id: 'mood-tag-happy', name: 'Mutlu', nameEn: 'Happy', category: 'EMOTION' as const, icon: '😊', color: '#FFD700' },
    { id: 'mood-tag-sad', name: 'Üzgün', nameEn: 'Sad', category: 'EMOTION' as const, icon: '😢', color: '#6B7280' },
    { id: 'mood-tag-anxious', name: 'Endişeli', nameEn: 'Anxious', category: 'EMOTION' as const, icon: '😰', color: '#F59E0B' },
    { id: 'mood-tag-calm', name: 'Sakin', nameEn: 'Calm', category: 'EMOTION' as const, icon: '😌', color: '#10B981' },
    { id: 'mood-tag-stressed', name: 'Stresli', nameEn: 'Stressed', category: 'EMOTION' as const, icon: '😤', color: '#EF4444' },
    { id: 'mood-tag-excited', name: 'Heyecanlı', nameEn: 'Excited', category: 'EMOTION' as const, icon: '🤩', color: '#EC4899' },
    // ACTIVITY - Aktiviteler
    { id: 'mood-tag-work', name: 'İş', nameEn: 'Work', category: 'ACTIVITY' as const, icon: '💼', color: '#607D8B' },
    { id: 'mood-tag-exercise', name: 'Egzersiz', nameEn: 'Exercise', category: 'ACTIVITY' as const, icon: '🏃', color: '#4CAF50' },
    { id: 'mood-tag-meditation', name: 'Meditasyon', nameEn: 'Meditation', category: 'ACTIVITY' as const, icon: '🧘', color: '#9C27B0' },
    { id: 'mood-tag-reading', name: 'Okuma', nameEn: 'Reading', category: 'ACTIVITY' as const, icon: '📚', color: '#8B5CF6' },
    { id: 'mood-tag-cooking', name: 'Yemek Yapma', nameEn: 'Cooking', category: 'ACTIVITY' as const, icon: '🍳', color: '#F97316' },
    // LOCATION - Konumlar
    { id: 'mood-tag-home', name: 'Ev', nameEn: 'Home', category: 'LOCATION' as const, icon: '🏠', color: '#14B8A6' },
    { id: 'mood-tag-office', name: 'Ofis', nameEn: 'Office', category: 'LOCATION' as const, icon: '🏢', color: '#6366F1' },
    { id: 'mood-tag-outdoor', name: 'Dışarıda', nameEn: 'Outdoor', category: 'LOCATION' as const, icon: '🌳', color: '#22C55E' },
    { id: 'mood-tag-travel', name: 'Seyahat', nameEn: 'Travel', category: 'LOCATION' as const, icon: '✈️', color: '#0EA5E9' },
    // SOCIAL - Sosyal
    { id: 'mood-tag-family', name: 'Aile', nameEn: 'Family', category: 'SOCIAL' as const, icon: '👨‍👩‍👧', color: '#E91E63' },
    { id: 'mood-tag-friends', name: 'Arkadaşlar', nameEn: 'Friends', category: 'SOCIAL' as const, icon: '👫', color: '#2196F3' },
    { id: 'mood-tag-alone', name: 'Yalnız', nameEn: 'Alone', category: 'SOCIAL' as const, icon: '🧑', color: '#A78BFA' },
    // HEALTH - Sağlık
    { id: 'mood-tag-tired', name: 'Yorgun', nameEn: 'Tired', category: 'HEALTH' as const, icon: '😫', color: '#78909C' },
    { id: 'mood-tag-energetic', name: 'Enerjik', nameEn: 'Energetic', category: 'HEALTH' as const, icon: '⚡', color: '#FFEB3B' },
    { id: 'mood-tag-sleepy', name: 'Uykulu', nameEn: 'Sleepy', category: 'HEALTH' as const, icon: '😴', color: '#818CF8' },
    { id: 'mood-tag-sick', name: 'Hasta', nameEn: 'Sick', category: 'HEALTH' as const, icon: '🤒', color: '#DC2626' },
    // WEATHER - Hava
    { id: 'mood-tag-sunny', name: 'Güneşli', nameEn: 'Sunny', category: 'WEATHER' as const, icon: '☀️', color: '#FCD34D' },
    { id: 'mood-tag-rainy', name: 'Yağmurlu', nameEn: 'Rainy', category: 'WEATHER' as const, icon: '🌧️', color: '#60A5FA' },
    { id: 'mood-tag-cloudy', name: 'Bulutlu', nameEn: 'Cloudy', category: 'WEATHER' as const, icon: '☁️', color: '#9CA3AF' },
    // OTHER - Diğer
    { id: 'mood-tag-grateful', name: 'Minnettar', nameEn: 'Grateful', category: 'OTHER' as const, icon: '🙏', color: '#8BC34A' },
    { id: 'mood-tag-creative', name: 'Yaratıcı', nameEn: 'Creative', category: 'OTHER' as const, icon: '🎨', color: '#F472B6' },
    { id: 'mood-tag-focused', name: 'Odaklanmış', nameEn: 'Focused', category: 'OTHER' as const, icon: '🎯', color: '#06B6D4' },
  ];

  for (const tag of moodTags) {
    await prisma.mood_tags.upsert({
      where: { id: tag.id },
      update: tag,
      create: tag,
    });
  }
  console.log('🏷️ Mood tags ensured');

  // ============================================
  // JOURNAL PROMPTS (Sprint 4 - Expanded)
  // ============================================
  const journalPrompts = [
    // Gratitude
    { id: 'prompt-gratitude-1', type: 'GRATITUDE' as const, prompt: 'Bugün için minnettar olduğun 3 şey nedir?', promptEn: 'What are 3 things you are grateful for today?', category: 'daily', isActive: true, sortOrder: 1 },
    { id: 'prompt-gratitude-2', type: 'GRATITUDE' as const, prompt: 'Bugün seni gülümseten ne oldu?', promptEn: 'What made you smile today?', category: 'daily', isActive: true, sortOrder: 2 },
    { id: 'prompt-gratitude-3', type: 'GRATITUDE' as const, prompt: 'Hayatındaki hangi kişiye minnettarsın ve neden?', promptEn: 'Which person in your life are you grateful for and why?', category: 'weekly', isActive: true, sortOrder: 3 },
    // Reflection
    { id: 'prompt-reflection-1', type: 'REFLECTION' as const, prompt: 'Bugün kendini nasıl hissettin?', promptEn: 'How did you feel today?', category: 'daily', isActive: true, sortOrder: 4 },
    { id: 'prompt-reflection-2', type: 'REFLECTION' as const, prompt: 'Bu hafta öğrendiğin en önemli ders neydi?', promptEn: 'What was the most important lesson you learned this week?', category: 'weekly', isActive: true, sortOrder: 5 },
    { id: 'prompt-reflection-3', type: 'REFLECTION' as const, prompt: 'Şu anki en büyük zorluğun ne? Bu zorluktan ne öğrenebilirsin?', promptEn: 'What is your biggest challenge right now? What can you learn from it?', category: 'weekly', isActive: true, sortOrder: 6 },
    // Practice Notes
    { id: 'prompt-practice-1', type: 'PRACTICE_NOTES' as const, prompt: 'Bugünkü pratiğinde ne hissettin?', promptEn: 'What did you feel during today\'s practice?', category: 'daily', isActive: true, sortOrder: 7 },
    { id: 'prompt-practice-2', type: 'PRACTICE_NOTES' as const, prompt: 'Meditasyon sırasında hangi düşünceler aklına geldi?', promptEn: 'What thoughts came to mind during meditation?', category: 'daily', isActive: true, sortOrder: 8 },
    // Free Write
    { id: 'prompt-free-1', type: 'FREE_WRITE' as const, prompt: 'Şu an aklında ne var?', promptEn: 'What is on your mind right now?', category: 'daily', isActive: true, sortOrder: 9 },
    { id: 'prompt-free-2', type: 'FREE_WRITE' as const, prompt: '5 dakika boyunca filtresiz yaz. Akla gelen her şeyi kağıda dök.', promptEn: 'Write without filter for 5 minutes. Pour everything that comes to mind.', category: 'daily', isActive: true, sortOrder: 10 },
    // Intention
    { id: 'prompt-intention-1', type: 'INTENTION' as const, prompt: 'Bugün için niyetin ne?', promptEn: 'What is your intention for today?', category: 'morning', isActive: true, sortOrder: 11 },
    { id: 'prompt-intention-2', type: 'INTENTION' as const, prompt: 'Bu hafta odaklanmak istediğin 3 şey nedir?', promptEn: 'What are 3 things you want to focus on this week?', category: 'weekly', isActive: true, sortOrder: 12 },
    // Dream Journal
    { id: 'prompt-dream-1', type: 'DREAM' as const, prompt: 'Bu gece ne rüya gördün? Detaylarını yaz.', promptEn: 'What did you dream about last night? Write the details.', category: 'morning', isActive: true, sortOrder: 13 },
  ];

  for (const prompt of journalPrompts) {
    await prisma.journal_prompts.upsert({
      where: { id: prompt.id },
      update: prompt,
      create: prompt,
    });
  }
  console.log('📝 Journal prompts ensured (Sprint 4 expanded)');

  // ============================================
  // GOAL TEMPLATES (Sprint 4)
  // ============================================
  const goalTemplates = [
    { id: 'goal-tpl-practice-days-3', type: 'PRACTICE_DAYS' as const, title: 'Haftada 3 Gün Pratik', description: 'Haftada en az 3 gün yoga veya meditasyon yap', targetValue: 3, unit: 'gün', period: 'WEEKLY' as const, icon: '🧘', sortOrder: 1, isActive: true },
    { id: 'goal-tpl-practice-days-5', type: 'PRACTICE_DAYS' as const, title: 'Haftada 5 Gün Pratik', description: 'Haftada en az 5 gün pratik yap', targetValue: 5, unit: 'gün', period: 'WEEKLY' as const, icon: '🧘', sortOrder: 2, isActive: true },
    { id: 'goal-tpl-practice-days-7', type: 'PRACTICE_DAYS' as const, title: 'Her Gün Pratik', description: 'Her gün pratik yaparak tutarlılık kazan', targetValue: 7, unit: 'gün', period: 'WEEKLY' as const, icon: '⭐', sortOrder: 3, isActive: true },
    { id: 'goal-tpl-minutes-15', type: 'PRACTICE_MINUTES' as const, title: 'Günde 15 Dakika', description: 'Her gün en az 15 dakika meditasyon yap', targetValue: 15, unit: 'dakika', period: 'DAILY' as const, icon: '⏱️', sortOrder: 4, isActive: true },
    { id: 'goal-tpl-minutes-30', type: 'PRACTICE_MINUTES' as const, title: 'Günde 30 Dakika', description: 'Her gün en az 30 dakika pratik yap', targetValue: 30, unit: 'dakika', period: 'DAILY' as const, icon: '⏱️', sortOrder: 5, isActive: true },
    { id: 'goal-tpl-weekly-minutes', type: 'PRACTICE_MINUTES' as const, title: 'Haftada 2 Saat', description: 'Haftada toplam 2 saat pratik yap', targetValue: 120, unit: 'dakika', period: 'WEEKLY' as const, icon: '📊', sortOrder: 6, isActive: true },
    { id: 'goal-tpl-streak-7', type: 'STREAK' as const, title: '7 Günlük Seri', description: '7 gün üst üste pratik yap', targetValue: 7, unit: 'gün', period: 'MONTHLY' as const, icon: '🔥', sortOrder: 7, isActive: true },
    { id: 'goal-tpl-streak-30', type: 'STREAK' as const, title: '30 Günlük Seri', description: '30 gün üst üste pratik yap', targetValue: 30, unit: 'gün', period: 'MONTHLY' as const, icon: '🏆', sortOrder: 8, isActive: true },
    { id: 'goal-tpl-meditation-weekly', type: 'MEDITATION_COUNT' as const, title: 'Haftada 5 Meditasyon', description: 'Haftada en az 5 meditasyon tamamla', targetValue: 5, unit: 'meditasyon', period: 'WEEKLY' as const, icon: '🧘‍♀️', sortOrder: 9, isActive: true },
    { id: 'goal-tpl-breathwork-weekly', type: 'BREATHWORK_COUNT' as const, title: 'Haftada 3 Nefes Egzersizi', description: 'Haftada en az 3 nefes egzersizi yap', targetValue: 3, unit: 'egzersiz', period: 'WEEKLY' as const, icon: '🌬️', sortOrder: 10, isActive: true },
  ];

  for (const template of goalTemplates) {
    await prisma.goal_templates.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }
  console.log('🎯 Goal templates ensured (Sprint 4)');

  // ============================================
  // REMINDER TEMPLATES (Sprint 4)
  // ============================================
  const reminderTemplates = [
    { id: 'reminder-tpl-morning', type: 'MORNING' as const, title: 'Sabah Meditasyonu', message: 'Güne huzurlu bir başlangıç yap 🌅', time: '07:00', icon: '🌅', sortOrder: 1, isActive: true },
    { id: 'reminder-tpl-breathing', type: 'PRACTICE' as const, title: 'Nefes Molası', message: 'Derin bir nefes al 🌬️', time: '12:00', icon: '🌬️', sortOrder: 2, isActive: true },
    { id: 'reminder-tpl-afternoon', type: 'BREAK' as const, title: 'Öğleden Sonra Molası', message: 'Kısa bir mola ver, kendine zaman ayır ☀️', time: '15:00', icon: '☀️', sortOrder: 3, isActive: true },
    { id: 'reminder-tpl-evening', type: 'EVENING' as const, title: 'Akşam Gevşemesi', message: 'Günün stresini bırak 🌆', time: '19:00', icon: '🌆', sortOrder: 4, isActive: true },
    { id: 'reminder-tpl-sleep', type: 'BEDTIME' as const, title: 'Uyku Zamanı', message: 'Yatmadan önce rahatlama zamanı 🌙', time: '22:00', icon: '🌙', sortOrder: 5, isActive: true },
    { id: 'reminder-tpl-mindful', type: 'CUSTOM' as const, title: 'Farkındalık Anı', message: 'Bir an dur ve şimdiye odaklan 🍃', time: '14:00', icon: '🍃', sortOrder: 6, isActive: true },
  ];

  for (const template of reminderTemplates) {
    await prisma.reminder_templates.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }
  console.log('⏰ Reminder templates ensured (Sprint 4)');

  // ============================================
  // USER ONBOARDING
  // ============================================
  await prisma.user_onboarding.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      isCompleted: true,
      completedAt: new Date(),
      experienceLevel: 'INTERMEDIATE',
      goals: ['STRESS_RELIEF', 'FLEXIBILITY', 'BETTER_SLEEP'],
      interests: ['YOGA', 'MEDITATION', 'BREATHWORK'],
      practiceFrequency: 'DAILY',
      preferredDuration: 15,
      preferredTime: 'MORNING',
      currentStep: 5,
      totalSteps: 5,
    },
  });
  console.log('📋 User onboarding ensured');

  // ============================================
  // USER GOALS
  // ============================================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userGoals = [
    { id: `goal-${student.id}-practice`, userId: student.id, type: 'PRACTICE_DAYS' as const, title: 'Haftada 5 Gün Pratik', targetValue: 5, currentValue: 3, unit: 'gün', period: 'WEEKLY' as const, isActive: true, startDate: today },
    { id: `goal-${student.id}-minutes`, userId: student.id, type: 'PRACTICE_MINUTES' as const, title: 'Günde 20 Dakika', targetValue: 20, currentValue: 15, unit: 'dakika', period: 'DAILY' as const, isActive: true, startDate: today },
  ];

  for (const goal of userGoals) {
    await prisma.user_goals.upsert({
      where: { id: goal.id },
      update: goal,
      create: goal,
    });
  }
  console.log('🎯 User goals ensured');

  // ============================================
  // USER REMINDERS
  // ============================================
  const userReminders = [
    { id: `reminder-${student.id}-morning`, userId: student.id, type: 'MORNING' as const, title: 'Sabah Meditasyonu', message: 'Güne huzurlu başla 🧘', time: '07:00', days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'], isEnabled: true, timezone: 'Europe/Istanbul' },
    { id: `reminder-${student.id}-evening`, userId: student.id, type: 'EVENING' as const, title: 'Akşam Gevşeme', message: 'Günün stresini bırak 🌙', time: '21:00', days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'], isEnabled: true, timezone: 'Europe/Istanbul' },
  ];

  for (const reminder of userReminders) {
    await prisma.user_reminders.upsert({
      where: { id: reminder.id },
      update: reminder,
      create: reminder,
    });
  }
  console.log('⏰ User reminders ensured');

  // ============================================
  // MEDITATION FAVORITES
  // ============================================
  await prisma.meditation_favorites.upsert({
    where: { meditationId_userId: { meditationId: 'med-sleep-relaxation', userId: student.id } },
    update: {},
    create: { meditationId: 'med-sleep-relaxation', userId: student.id },
  });

  await prisma.meditation_favorites.upsert({
    where: { meditationId_userId: { meditationId: 'med-morning-energy', userId: student.id } },
    update: {},
    create: { meditationId: 'med-morning-energy', userId: student.id },
  });
  console.log('❤️ Meditation favorites ensured');

  // ============================================
  // SAMPLE MOOD ENTRIES
  // ============================================
  const moods = ['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD'] as const;
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const moodIndex = Math.floor(Math.random() * 3);

    await prisma.mood_entries.upsert({
      where: { id: `mood-entry-${student.id}-${i}` },
      update: {},
      create: {
        id: `mood-entry-${student.id}-${i}`,
        userId: student.id,
        mood: moods[moodIndex],
        moodScore: 5 - moodIndex,
        energy: Math.floor(Math.random() * 3) + 3,
        stress: Math.floor(Math.random() * 3) + 1,
        tags: ['mood-tag-meditation'],
        date: date,
      },
    });
  }
  console.log('😊 Mood entries ensured');

  // ============================================
  // SPRINT 3: TIMER PRESETS (System Presets)
  // ============================================
  const timerPresets = [
    {
      id: 'preset-quick-5',
      name: 'Hızlı Mola',
      nameEn: 'Quick Break',
      description: '5 dakikalık hızlı meditasyon molası',
      duration: 300, // 5 minutes
      startBell: 'bell_tibetan',
      endBell: 'bell_singing',
      icon: '⚡',
      color: '#FF6B6B',
      isSystem: true,
      sortOrder: 1,
    },
    {
      id: 'preset-morning-10',
      name: 'Sabah Meditasyonu',
      nameEn: 'Morning Meditation',
      description: '10 dakikalık güne enerjik başlama',
      duration: 600, // 10 minutes
      startBell: 'bell_chime',
      endBell: 'bell_gong',
      intervalBell: 300, // 5 minutes
      intervalBellSound: 'bell_soft',
      icon: '🌅',
      color: '#FFB347',
      isSystem: true,
      sortOrder: 2,
    },
    {
      id: 'preset-focus-15',
      name: 'Odaklanma',
      nameEn: 'Focus Session',
      description: '15 dakikalık derin odaklanma',
      duration: 900, // 15 minutes
      startBell: 'bell_tibetan',
      endBell: 'bell_tibetan',
      icon: '🎯',
      color: '#4ECDC4',
      isSystem: true,
      sortOrder: 3,
    },
    {
      id: 'preset-deep-20',
      name: 'Derin Meditasyon',
      nameEn: 'Deep Meditation',
      description: '20 dakikalık derin meditasyon',
      duration: 1200, // 20 minutes
      startBell: 'bell_singing',
      endBell: 'bell_singing',
      intervalBell: 600, // 10 minutes
      intervalBellSound: 'bell_soft',
      icon: '🧘',
      color: '#9B59B6',
      isSystem: true,
      sortOrder: 4,
    },
    {
      id: 'preset-extended-30',
      name: 'Uzun Seans',
      nameEn: 'Extended Session',
      description: '30 dakikalık kapsamlı meditasyon',
      duration: 1800, // 30 minutes
      startBell: 'bell_gong',
      endBell: 'bell_gong',
      intervalBell: 900, // 15 minutes
      intervalBellSound: 'bell_chime',
      icon: '🌟',
      color: '#3498DB',
      isSystem: true,
      sortOrder: 5,
    },
    {
      id: 'preset-sleep-45',
      name: 'Uyku Hazırlığı',
      nameEn: 'Sleep Preparation',
      description: '45 dakikalık uyku öncesi rahatlama',
      duration: 2700, // 45 minutes
      startBell: 'bell_soft',
      endBell: 'bell_soft',
      icon: '🌙',
      color: '#34495E',
      isSystem: true,
      sortOrder: 6,
    },
    {
      id: 'preset-open',
      name: 'Açık Uçlu',
      nameEn: 'Open-Ended',
      description: 'Süre sınırı olmadan meditasyon',
      duration: 0, // Open ended
      startBell: 'bell_tibetan',
      endBell: 'bell_tibetan',
      icon: '♾️',
      color: '#1ABC9C',
      isSystem: true,
      sortOrder: 7,
    },
  ];

  for (const preset of timerPresets) {
    await prisma.timer_presets.upsert({
      where: { id: preset.id },
      update: preset,
      create: preset,
    });
  }
  console.log('⏱️ Timer presets ensured');

  // ============================================
  // FEATURE FLAGS
  // ============================================
  const featureFlags = [
    { key: 'meditation_feature', name: 'Meditation', isEnabled: true, description: 'Enable meditation feature', rolloutPercentage: 100 },
    { key: 'breathwork_feature', name: 'Breathwork', isEnabled: true, description: 'Enable breathwork feature', rolloutPercentage: 100 },
    { key: 'sleep_stories_feature', name: 'Sleep Stories', isEnabled: true, description: 'Enable sleep stories feature', rolloutPercentage: 100 },
    { key: 'mood_tracking_feature', name: 'Mood Tracking', isEnabled: true, description: 'Enable mood tracking feature', rolloutPercentage: 100 },
    { key: 'journal_feature', name: 'Journal', isEnabled: true, description: 'Enable journal feature', rolloutPercentage: 100 },
    { key: 'sound_mixer_feature', name: 'Sound Mixer', isEnabled: true, description: 'Enable sound mixer feature', rolloutPercentage: 100 },
  ];

  for (const flag of featureFlags) {
    await prisma.feature_flags.upsert({
      where: { key: flag.key },
      update: flag,
      create: { ...flag, updatedById: admin.id },
    });
  }
  console.log('🚩 Feature flags ensured');

  // ============================================
  // SPRINT 5: SYSTEM PLAYLISTS
  // ============================================
  const systemPlaylists = [
    {
      id: 'playlist-morning-calm',
      name: 'Sabah Sakinliği',
      nameEn: 'Morning Calm',
      description: 'Güne huzurlu başlamak için seçilmiş içerikler',
      descriptionEn: 'Curated content to start your day peacefully',
      coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      color: '#FFE4B5',
      type: 'SYSTEM',
      contentType: 'MIXED',
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
    },
    {
      id: 'playlist-stress-relief',
      name: 'Stres Giderici',
      nameEn: 'Stress Relief',
      description: 'Stresi azaltmak için meditasyon ve nefes egzersizleri',
      descriptionEn: 'Meditation and breathing exercises to reduce stress',
      coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      color: '#98D8C8',
      type: 'SYSTEM',
      contentType: 'MIXED',
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
    },
    {
      id: 'playlist-better-sleep',
      name: 'Derin Uyku',
      nameEn: 'Better Sleep',
      description: 'Kaliteli uyku için uyku hikayeleri ve gevşeme içerikleri',
      descriptionEn: 'Sleep stories and relaxation content for quality sleep',
      coverImage: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=800',
      color: '#5D4E8C',
      type: 'SYSTEM',
      contentType: 'SLEEP',
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 3,
    },
    {
      id: 'playlist-focus',
      name: 'Odaklanma',
      nameEn: 'Focus & Concentration',
      description: 'Konsantrasyon ve üretkenlik için içerikler',
      descriptionEn: 'Content for concentration and productivity',
      coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
      color: '#4A90D9',
      type: 'SYSTEM',
      contentType: 'MEDITATION',
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 4,
    },
    {
      id: 'playlist-breathwork-basics',
      name: 'Nefes Temelleri',
      nameEn: 'Breathwork Basics',
      description: 'Temel nefes egzersizleri koleksiyonu',
      descriptionEn: 'Collection of basic breathing exercises',
      coverImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800',
      color: '#7ED6A0',
      type: 'CURATED',
      contentType: 'BREATHWORK',
      isSystem: true,
      isPublic: true,
      isFeatured: false,
      isPublished: true,
      sortOrder: 5,
    },
    {
      id: 'playlist-nature-sounds',
      name: 'Doğa Sesleri',
      nameEn: 'Nature Sounds',
      description: 'Doğadan rahatlatıcı ses manzaraları',
      descriptionEn: 'Relaxing soundscapes from nature',
      coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      color: '#2D5F2E',
      type: 'SYSTEM',
      contentType: 'SOUNDSCAPE',
      isSystem: true,
      isPublic: true,
      isFeatured: false,
      isPublished: true,
      sortOrder: 6,
    },
  ];

  for (const playlist of systemPlaylists) {
    await prisma.playlists.upsert({
      where: { id: playlist.id },
      update: playlist,
      create: playlist as any,
    });
  }
  console.log('📋 System playlists ensured');

  // ============================================
  // DAILY CONTENT (Bugün için)
  // ============================================
  const dailyContentToday = new Date();
  dailyContentToday.setHours(0, 0, 0, 0);

  await prisma.daily_content.upsert({
    where: { date: dailyContentToday },
    update: {},
    create: {
      date: dailyContentToday,
      quoteId: 'quote-1',
      meditationId: 'med-morning-energy',
      breathworkId: 'breath-morning-wake',
      tip: 'Günün ilk saatinde 5 dakikalık meditasyon, tüm günün kalitesini artırır.',
      isPublished: true,
    },
  });
  console.log('📅 Daily content ensured');

  // ============================================
  // USER WELLNESS STATS
  // ============================================
  await prisma.user_wellness_stats.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      totalMeditationMinutes: 450,
      totalMeditationCount: 28,
      totalBreathworkMinutes: 120,
      totalBreathworkCount: 15,
      totalSessionMinutes: 200,
      totalSessionCount: 12,
      totalSleepStoryCount: 5,
      totalJournalEntries: 14,
      totalMoodEntries: 21,
      currentStreak: 5,
      longestStreak: 12,
      lastActivityDate: new Date(),
      weeklyMinutes: 85,
      weeklySessionCount: 8,
      monthlyMinutes: 320,
      monthlySessionCount: 35,
      achievementCount: 3,
      badgeCount: 2,
    },
  });
  console.log('📊 User wellness stats ensured');

  // ============================================
  // PLAYLIST ITEMS (System playlist'lerine içerik ekle)
  // ============================================
  const playlistItemsData = [
    // Morning Calm playlist
    { id: 'pl-item-morning-1', playlistId: 'playlist-morning-calm', contentType: 'MEDITATION' as const, meditationId: 'med-morning-energy', sortOrder: 1 },
    { id: 'pl-item-morning-2', playlistId: 'playlist-morning-calm', contentType: 'BREATHWORK' as const, breathworkId: 'breath-morning-wake', sortOrder: 2 },
    { id: 'pl-item-morning-3', playlistId: 'playlist-morning-calm', contentType: 'MEDITATION' as const, meditationId: 'med-mindfulness-present', sortOrder: 3 },

    // Stress Relief playlist
    { id: 'pl-item-stress-1', playlistId: 'playlist-stress-relief', contentType: 'BREATHWORK' as const, breathworkId: 'breath-box', sortOrder: 1 },
    { id: 'pl-item-stress-2', playlistId: 'playlist-stress-relief', contentType: 'MEDITATION' as const, meditationId: 'med-stress-relief-5min', sortOrder: 2 },
    { id: 'pl-item-stress-3', playlistId: 'playlist-stress-relief', contentType: 'BREATHWORK' as const, breathworkId: 'breath-anxiety-relief', sortOrder: 3 },

    // Better Sleep playlist
    { id: 'pl-item-sleep-1', playlistId: 'playlist-better-sleep', contentType: 'MEDITATION' as const, meditationId: 'med-sleep-relaxation', sortOrder: 1 },
    { id: 'pl-item-sleep-2', playlistId: 'playlist-better-sleep', contentType: 'SLEEP_STORY' as const, sleepStoryId: 'sleep-story-forest', sortOrder: 2 },
    { id: 'pl-item-sleep-3', playlistId: 'playlist-better-sleep', contentType: 'SLEEP_STORY' as const, sleepStoryId: 'sleep-story-rain', sortOrder: 3 },

    // Focus playlist
    { id: 'pl-item-focus-1', playlistId: 'playlist-focus', contentType: 'MEDITATION' as const, meditationId: 'med-mindfulness-present', sortOrder: 1 },
    { id: 'pl-item-focus-2', playlistId: 'playlist-focus', contentType: 'BREATHWORK' as const, breathworkId: 'breath-box', sortOrder: 2 },

    // Breathwork Basics playlist
    { id: 'pl-item-breath-1', playlistId: 'playlist-breathwork-basics', contentType: 'BREATHWORK' as const, breathworkId: 'breath-box', sortOrder: 1 },
    { id: 'pl-item-breath-2', playlistId: 'playlist-breathwork-basics', contentType: 'BREATHWORK' as const, breathworkId: 'breath-478', sortOrder: 2 },
    { id: 'pl-item-breath-3', playlistId: 'playlist-breathwork-basics', contentType: 'BREATHWORK' as const, breathworkId: 'breath-relaxing', sortOrder: 3 },
    { id: 'pl-item-breath-4', playlistId: 'playlist-breathwork-basics', contentType: 'BREATHWORK' as const, breathworkId: 'breath-quick-calm', sortOrder: 4 },

    // Nature Sounds playlist
    { id: 'pl-item-nature-1', playlistId: 'playlist-nature-sounds', contentType: 'SOUNDSCAPE' as const, soundscapeId: 'sound-rain-soft', sortOrder: 1 },
    { id: 'pl-item-nature-2', playlistId: 'playlist-nature-sounds', contentType: 'SOUNDSCAPE' as const, soundscapeId: 'sound-ocean-waves', sortOrder: 2 },
    { id: 'pl-item-nature-3', playlistId: 'playlist-nature-sounds', contentType: 'SOUNDSCAPE' as const, soundscapeId: 'sound-forest', sortOrder: 3 },
    { id: 'pl-item-nature-4', playlistId: 'playlist-nature-sounds', contentType: 'SOUNDSCAPE' as const, soundscapeId: 'sound-birds', sortOrder: 4 },
  ];

  for (const item of playlistItemsData) {
    await prisma.playlist_items.upsert({
      where: { id: item.id },
      update: item,
      create: item as any,
    });
  }
  console.log('📋 Playlist items ensured');

  // Update playlist item counts
  await prisma.playlists.update({ where: { id: 'playlist-morning-calm' }, data: { itemCount: 3, totalDuration: 1044 } });
  await prisma.playlists.update({ where: { id: 'playlist-stress-relief' }, data: { itemCount: 3, totalDuration: 716 } });
  await prisma.playlists.update({ where: { id: 'playlist-better-sleep' }, data: { itemCount: 3, totalDuration: 5400 } });
  await prisma.playlists.update({ where: { id: 'playlist-focus' }, data: { itemCount: 2, totalDuration: 736 } });
  await prisma.playlists.update({ where: { id: 'playlist-breathwork-basics' }, data: { itemCount: 4, totalDuration: 902 } });
  await prisma.playlists.update({ where: { id: 'playlist-nature-sounds' }, data: { itemCount: 4, totalDuration: 0 } });

  // ============================================
  // MEDITATION PROGRESS
  // ============================================
  await prisma.meditation_progress.upsert({
    where: { meditationId_userId: { meditationId: 'med-sleep-relaxation', userId: student.id } },
    update: {},
    create: {
      meditationId: 'med-sleep-relaxation',
      userId: student.id,
      currentTime: 540,
      duration: 900,
      percentage: 60,
      completed: false,
      playCount: 3,
      totalListened: 1800,
    },
  });

  await prisma.meditation_progress.upsert({
    where: { meditationId_userId: { meditationId: 'med-morning-energy', userId: student.id } },
    update: {},
    create: {
      meditationId: 'med-morning-energy',
      userId: student.id,
      currentTime: 420,
      duration: 420,
      percentage: 100,
      completed: true,
      playCount: 5,
      totalListened: 2100,
      completedAt: new Date(),
    },
  });
  console.log('📈 Meditation progress ensured');

  // ============================================
  // BREATHWORK PROGRESS
  // ============================================
  await prisma.breathwork_progress.upsert({
    where: { breathworkId_userId: { breathworkId: 'breath-box', userId: student.id } },
    update: {},
    create: {
      breathworkId: 'breath-box',
      userId: student.id,
      totalSessions: 8,
      totalCycles: 32,
      totalSeconds: 2048,
    },
  });
  console.log('🌬️ Breathwork progress ensured');

  // ============================================
  // SLEEP TIMER SETTINGS
  // ============================================
  await prisma.sleep_timer_settings.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      defaultDuration: 1800,
      fadeOutEnabled: true,
      fadeOutDuration: 60,
      defaultSoundId: 'sound-rain-soft',
      defaultVolume: 40,
      autoPlayNextStory: false,
      bedtimeReminder: true,
      bedtimeReminderTime: '22:30',
    },
  });
  console.log('😴 Sleep timer settings ensured');

  // ============================================
  // SLEEP TRACKING (Son 3 gün)
  // ============================================
  for (let i = 0; i < 3; i++) {
    const sleepDate = new Date(today);
    sleepDate.setDate(sleepDate.getDate() - i);

    const bedTime = new Date(sleepDate);
    bedTime.setHours(23, 30, 0, 0);

    const wakeTime = new Date(sleepDate);
    wakeTime.setDate(wakeTime.getDate() + 1);
    wakeTime.setHours(7, 0, 0, 0);

    await prisma.sleep_tracking.upsert({
      where: { userId_date: { userId: student.id, date: sleepDate } },
      update: {},
      create: {
        userId: student.id,
        date: sleepDate,
        bedTime: bedTime,
        wakeTime: wakeTime,
        totalMinutes: 450,
        quality: 4,
        fellAsleepWith: 'story',
        contentId: 'sleep-story-rain',
        tags: ['derin uyku'],
      },
    });
  }
  console.log('🛏️ Sleep tracking ensured');

  // ============================================
  // SLEEP STORY PROGRESS
  // ============================================
  await prisma.sleep_story_progress.upsert({
    where: { storyId_userId: { storyId: 'sleep-story-forest', userId: student.id } },
    update: {},
    create: {
      storyId: 'sleep-story-forest',
      userId: student.id,
      currentTime: 1200,
      duration: 1800,
      completed: false,
      playCount: 2,
    },
  });

  await prisma.sleep_story_progress.upsert({
    where: { storyId_userId: { storyId: 'sleep-story-rain', userId: student.id } },
    update: {},
    create: {
      storyId: 'sleep-story-rain',
      userId: student.id,
      currentTime: 2700,
      duration: 2700,
      completed: true,
      playCount: 3,
      completedAt: new Date(),
    },
  });
  console.log('📖 Sleep story progress ensured');

  // ============================================
  // SOUNDSCAPE FAVORITES
  // ============================================
  await prisma.soundscape_favorites.upsert({
    where: { soundscapeId_userId: { soundscapeId: 'sound-rain-soft', userId: student.id } },
    update: {},
    create: { soundscapeId: 'sound-rain-soft', userId: student.id },
  });

  await prisma.soundscape_favorites.upsert({
    where: { soundscapeId_userId: { soundscapeId: 'sound-ocean-waves', userId: student.id } },
    update: {},
    create: { soundscapeId: 'sound-ocean-waves', userId: student.id },
  });
  console.log('🔊 Soundscape favorites ensured');

  // ============================================
  // USER SOUND MIX
  // ============================================
  const userMix = await prisma.user_sound_mixes.upsert({
    where: { id: `mix-${student.id}-rainy-forest` },
    update: {},
    create: {
      id: `mix-${student.id}-rainy-forest`,
      userId: student.id,
      name: 'Yağmurlu Orman',
      description: 'Yağmur ve orman seslerinin karışımı',
      isPublic: false,
      playCount: 12,
    },
  });

  await prisma.sound_mix_items.upsert({
    where: { mixId_soundscapeId: { mixId: userMix.id, soundscapeId: 'sound-rain-soft' } },
    update: {},
    create: { mixId: userMix.id, soundscapeId: 'sound-rain-soft', volume: 60 },
  });

  await prisma.sound_mix_items.upsert({
    where: { mixId_soundscapeId: { mixId: userMix.id, soundscapeId: 'sound-forest' } },
    update: {},
    create: { mixId: userMix.id, soundscapeId: 'sound-forest', volume: 40 },
  });
  console.log('🎵 User sound mix ensured');

  // ============================================
  // JOURNAL ENTRY
  // ============================================
  await prisma.journal_entries.upsert({
    where: { id: `journal-${student.id}-sample` },
    update: {},
    create: {
      id: `journal-${student.id}-sample`,
      userId: student.id,
      title: 'Bugünkü Pratik Notları',
      content: 'Sabah meditasyonu çok iyi geçti. Zihin daha sakin, nefes daha derin. Akşam da bir uyku meditasyonu deneyeceğim.',
      type: 'PRACTICE_NOTES',
      mood: 'GOOD',
      tags: ['meditasyon', 'sabah'],
      wordCount: 25,
      isPrivate: true,
      isFavorite: false,
      date: today,
    },
  });
  console.log('📓 Journal entry ensured');

  // ============================================
  // MEDITATION RATING
  // ============================================
  await prisma.meditation_ratings.upsert({
    where: { meditationId_userId: { meditationId: 'med-morning-energy', userId: student.id } },
    update: {},
    create: {
      meditationId: 'med-morning-energy',
      userId: student.id,
      rating: 5,
      review: 'Güne harika bir başlangıç yapıyorum, çok sevdim!',
    },
  });
  console.log('⭐ Meditation rating ensured');

  // ============================================
  // GOAL PROGRESS
  // ============================================
  const studentGoals = await prisma.user_goals.findMany({
    where: { userId: student.id },
    take: 1,
  });

  if (studentGoals.length > 0) {
    const goalId = studentGoals[0]!.id;
    for (let i = 0; i < 5; i++) {
      const progressDate = new Date(today);
      progressDate.setDate(progressDate.getDate() - i);

      await prisma.goal_progress.create({
        data: {
          goalId: goalId,
          value: 1,
          date: progressDate,
          source: i % 2 === 0 ? 'meditation' : 'breathwork',
          sourceId: i % 2 === 0 ? 'med-morning-energy' : 'breath-box',
        },
      });
    }
    console.log('📊 Goal progress ensured');
  }

  // ============================================
  // USER WELLNESS STATS
  // ============================================
  await prisma.user_wellness_stats.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      totalMeditationMinutes: 450,
      totalMeditationCount: 28,
      totalBreathworkMinutes: 120,
      totalBreathworkCount: 15,
      totalSleepStoryCount: 5,
      totalJournalEntries: 14,
      totalMoodEntries: 21,
      currentStreak: 5,
      longestStreak: 12,
      lastActivityDate: new Date(),
    },
  });
  console.log('📊 User wellness stats ensured');

  // ============================================
  // SLEEP TIMER SETTINGS
  // ============================================
  await prisma.sleep_timer_settings.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      defaultDuration: 1800,
      fadeOutEnabled: true,
      fadeOutDuration: 60,
      defaultSoundId: 'sound-rain-soft',
      defaultVolume: 40,
    },
  });
  console.log('😴 Sleep timer settings ensured');

  // ============================================
  // SOUNDSCAPE FAVORITES
  // ============================================
  await prisma.soundscape_favorites.createMany({
    data: [
      { soundscapeId: 'sound-rain-soft', userId: student.id },
      { soundscapeId: 'sound-ocean-waves', userId: student.id },
    ],
    skipDuplicates: true,
  });
  console.log('🔊 Soundscape favorites ensured');

  // ============================================
  // MEDITATION PROGRESS
  // ============================================
  await prisma.meditation_progress.upsert({
    where: { meditationId_userId: { meditationId: 'med-morning-energy', userId: student.id } },
    update: {},
    create: {
      meditationId: 'med-morning-energy',
      userId: student.id,
      currentTime: 420,
      duration: 420,
      percentage: 100,
      completed: true,
      playCount: 5,
      completedAt: new Date(),
    },
  });
  console.log('📈 Meditation progress ensured');

  // ============================================
  // BREATHWORK PROGRESS
  // ============================================
  await prisma.breathwork_progress.upsert({
    where: { breathworkId_userId: { breathworkId: 'breath-box', userId: student.id } },
    update: {},
    create: {
      breathworkId: 'breath-box',
      userId: student.id,
      totalSessions: 8,
      totalCycles: 32,
      totalSeconds: 2048,
    },
  });
  console.log('🌬️ Breathwork progress ensured');

  // ============================================
  // ADDITIONAL GOAL TEMPLATES
  // ============================================
  const additionalGoalTemplates = [
    { type: 'PRACTICE_DAYS' as const, title: 'Günlük Pratik', description: 'Her gün pratik yap', targetValue: 1, unit: 'gün', period: 'DAILY' as const, icon: '🧘', sortOrder: 11, isActive: true },
    { type: 'MEDITATION_COUNT' as const, title: 'Haftalık Meditasyon', description: 'Haftada 5 gün meditasyon', targetValue: 5, unit: 'seans', period: 'WEEKLY' as const, icon: '🧠', sortOrder: 12, isActive: true },
    { type: 'BREATHWORK_COUNT' as const, title: 'Nefes Egzersizi', description: 'Günde 10 dakika nefes egzersizi', targetValue: 10, unit: 'dakika', period: 'DAILY' as const, icon: '💨', sortOrder: 13, isActive: true },
    { type: 'SLEEP_TRACKING' as const, title: 'Uyku Kalitesi', description: 'Haftada 5 gece uyku takibi', targetValue: 5, unit: 'gece', period: 'WEEKLY' as const, icon: '😴', sortOrder: 14, isActive: true },
    { type: 'MOOD_LOG' as const, title: 'Farkındalık', description: 'Günde 3 farkındalık anı', targetValue: 3, unit: 'an', period: 'DAILY' as const, icon: '🎯', sortOrder: 15, isActive: true },
  ];

  for (const template of additionalGoalTemplates) {
    await prisma.goal_templates.upsert({
      where: { id: `goal-template-${template.type.toLowerCase()}` },
      update: {},
      create: {
        id: `goal-template-${template.type.toLowerCase()}`,
        ...template,
      },
    });
  }
  console.log('🎯 Additional goal templates ensured');

  // ============================================
  // ADDITIONAL REMINDER TEMPLATES
  // ============================================
  const additionalReminderTemplates = [
    { type: 'MORNING', title: 'Sabah Hatırlatıcısı', message: 'Güne meditasyonla başla!', time: '07:00', icon: '🌅', sortOrder: 1, isActive: true },
    { type: 'EVENING', title: 'Akşam Hatırlatıcısı', message: 'Günü değerlendir, yarına hazırlan.', time: '21:00', icon: '🌙', sortOrder: 2, isActive: true },
    { type: 'PRACTICE', title: 'Pratik Zamanı', message: 'Yoga pratiği zamanı geldi!', time: '18:00', icon: '🧘', sortOrder: 3, isActive: true },
    { type: 'MOOD', title: 'Mood Kaydı', message: 'Bugün nasıl hissediyorsun?', time: '12:00', icon: '😊', sortOrder: 4, isActive: true },
    { type: 'JOURNAL', title: 'Günlük Yazımı', message: 'Günlüğüne yazmayı unutma!', time: '22:00', icon: '📝', sortOrder: 5, isActive: true },
    { type: 'HYDRATION', title: 'Su İç', message: 'Su içmeyi unutma!', time: '10:00', icon: '💧', sortOrder: 6, isActive: true },
    { type: 'BREAK', title: 'Mola Ver', message: 'Biraz mola ver, nefes al.', time: '15:00', icon: '☕', sortOrder: 7, isActive: true },
    { type: 'BEDTIME', title: 'Yatma Vakti', message: 'Yatma vakti yaklaşıyor.', time: '23:00', icon: '😴', sortOrder: 8, isActive: true },
  ];

  for (const template of additionalReminderTemplates) {
    await prisma.reminder_templates.upsert({
      where: { id: `reminder-template-${template.type.toLowerCase()}` },
      update: {},
      create: {
        id: `reminder-template-${template.type.toLowerCase()}`,
        ...template,
      },
    });
  }
  console.log('⏰ Additional reminder templates ensured');

  // ============================================
  // ADDITIONAL MOOD TAGS
  // ============================================
  const additionalMoodTags = [
    { name: 'Mutlu', nameEn: 'Happy', category: 'HEALTH' as const, icon: '😊', color: '#22C55E', isActive: true },
    { name: 'Huzurlu', nameEn: 'Peaceful', category: 'HEALTH' as const, icon: '😌', color: '#06B6D4', isActive: true },
    { name: 'Enerjik', nameEn: 'Energetic', category: 'HEALTH' as const, icon: '⚡', color: '#F59E0B', isActive: true },
    { name: 'Yorgun', nameEn: 'Tired', category: 'HEALTH' as const, icon: '😴', color: '#6366F1', isActive: true },
    { name: 'Stresli', nameEn: 'Stressed', category: 'HEALTH' as const, icon: '😰', color: '#EF4444', isActive: true },
    { name: 'Kaygılı', nameEn: 'Anxious', category: 'HEALTH' as const, icon: '😟', color: '#F97316', isActive: true },
    { name: 'Yoga', nameEn: 'Yoga', category: 'ACTIVITY' as const, icon: '🧘', color: '#8B5CF6', isActive: true },
    { name: 'Meditasyon', nameEn: 'Meditation', category: 'ACTIVITY' as const, icon: '🧠', color: '#EC4899', isActive: true },
    { name: 'Egzersiz', nameEn: 'Exercise', category: 'ACTIVITY' as const, icon: '🏃', color: '#10B981', isActive: true },
    { name: 'Ev', nameEn: 'Home', category: 'OTHER' as const, icon: '🏠', color: '#14B8A6', isActive: true },
    { name: 'İş', nameEn: 'Work', category: 'OTHER' as const, icon: '💼', color: '#64748B', isActive: true },
    { name: 'Güneşli', nameEn: 'Sunny', category: 'WEATHER' as const, icon: '☀️', color: '#FBBF24', isActive: true },
    { name: 'Yağmurlu', nameEn: 'Rainy', category: 'WEATHER' as const, icon: '🌧️', color: '#3B82F6', isActive: true },
    { name: 'Aile', nameEn: 'Family', category: 'SOCIAL' as const, icon: '👨‍👩‍👧', color: '#F472B6', isActive: true },
    { name: 'Yalnız', nameEn: 'Alone', category: 'SOCIAL' as const, icon: '🧑', color: '#A78BFA', isActive: true },
  ];

  for (const tag of additionalMoodTags) {
    await prisma.mood_tags.upsert({
      where: { id: `mood-tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `mood-tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...tag,
      },
    });
  }
  console.log('🏷️ Additional mood tags ensured');

  // ============================================
  // USER ONBOARDING (sample completed)
  // ============================================
  await prisma.user_onboarding.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      currentStep: 5,
      isCompleted: true,
      experienceLevel: 'SOME',
      goals: ['STRESS_RELIEF', 'BETTER_SLEEP', 'FOCUS'],
      interests: ['MEDITATION', 'BREATHWORK', 'SLEEP'],
      preferredDuration: 15,
      preferredTime: 'MORNING',
      completedAt: new Date(),
    },
  });
  console.log('🎓 User onboarding ensured');

  // ============================================
  // YOGA POSES
  // ============================================
  const poses = [
    { englishName: 'Mountain Pose', sanskritName: 'Tadasana', difficulty: 'BEGINNER' as const, bodyArea: 'Full Body', description: 'A foundational standing pose that improves posture and balance.', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600' },
    { englishName: 'Downward Dog', sanskritName: 'Adho Mukha Svanasana', difficulty: 'BEGINNER' as const, bodyArea: 'Full Body', description: 'A classic yoga pose that stretches the entire body.', imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600' },
    { englishName: 'Warrior I', sanskritName: 'Virabhadrasana I', difficulty: 'BEGINNER' as const, bodyArea: 'Legs', description: 'A powerful standing pose that builds strength and stability.', imageUrl: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600' },
    { englishName: 'Warrior II', sanskritName: 'Virabhadrasana II', difficulty: 'BEGINNER' as const, bodyArea: 'Legs', description: 'Opens the hips and strengthens the legs.', imageUrl: 'https://images.unsplash.com/photo-1573590330099-d6c7355ec595?w=600' },
    { englishName: 'Tree Pose', sanskritName: 'Vrksasana', difficulty: 'BEGINNER' as const, bodyArea: 'Legs', description: 'A balancing pose that builds focus and leg strength.', imageUrl: 'https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?w=600' },
    { englishName: 'Child\'s Pose', sanskritName: 'Balasana', difficulty: 'BEGINNER' as const, bodyArea: 'Back', description: 'A restful pose that gently stretches the back.', imageUrl: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600' },
    { englishName: 'Cobra Pose', sanskritName: 'Bhujangasana', difficulty: 'BEGINNER' as const, bodyArea: 'Back', description: 'A backbend that strengthens the spine.', imageUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600' },
    { englishName: 'Triangle Pose', sanskritName: 'Trikonasana', difficulty: 'INTERMEDIATE' as const, bodyArea: 'Legs', description: 'Stretches the legs, hips, and spine.', imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600' },
    { englishName: 'Crow Pose', sanskritName: 'Bakasana', difficulty: 'ADVANCED' as const, bodyArea: 'Arms', description: 'An arm balance that builds upper body strength.', imageUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=600' },
    { englishName: 'Headstand', sanskritName: 'Sirsasana', difficulty: 'ADVANCED' as const, bodyArea: 'Full Body', description: 'An inversion that builds core strength and balance.', imageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600' },
    { englishName: 'Plank Pose', sanskritName: 'Phalakasana', difficulty: 'BEGINNER' as const, bodyArea: 'Core', description: 'A core strengthening pose.', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600' },
    { englishName: 'Bridge Pose', sanskritName: 'Setu Bandhasana', difficulty: 'BEGINNER' as const, bodyArea: 'Back', description: 'A gentle backbend that opens the chest.', imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600' },
    { englishName: 'Lotus Pose', sanskritName: 'Padmasana', difficulty: 'ADVANCED' as const, bodyArea: 'Hips', description: 'A seated meditation pose that opens the hips.', imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600' },
    { englishName: 'Cat-Cow Pose', sanskritName: 'Marjaryasana-Bitilasana', difficulty: 'BEGINNER' as const, bodyArea: 'Spine', description: 'A flowing movement that warms up the spine.', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600' },
    { englishName: 'Corpse Pose', sanskritName: 'Savasana', difficulty: 'BEGINNER' as const, bodyArea: 'Full Body', description: 'A relaxation pose that concludes every yoga session.', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600' },
  ];

  for (const pose of poses) {
    await prisma.poses.upsert({
      where: { id: `pose-${pose.englishName.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `pose-${pose.englishName.toLowerCase().replace(/\s+/g, '-')}`,
        ...pose,
      },
    });
  }
  console.log('🧘 Yoga poses ensured');

  // ============================================
  // PROGRAMS
  // ============================================
  const programsData = [
    {
      id: 'program-yoga-fundamentals',
      title: '30 Günlük Yoga Temelleri',
      description: 'Yoga\'ya yeni başlayanlar için kapsamlı bir program. Temel pozları, nefes tekniklerini ve meditasyonu öğrenin.',
      level: 'BEGINNER' as const,
      durationMin: 30,
      durationWeeks: 4,
      status: 'PUBLISHED' as const,
      accessType: 'FREE' as const,
      isPublished: true,
      categories: ['yoga', 'beginner'],
      promoVideoUrl: 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
      promoVideoSource: 'YOUTUBE' as const,
      promoVideoId: 'v7AYKMP6rOE',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
      coverUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200',
    },
    {
      id: 'program-vinyasa-flow',
      title: 'Vinyasa Flow Serisi',
      description: 'Dinamik ve akışkan bir yoga deneyimi. Nefes ve hareket senkronizasyonu ile güçlenin.',
      level: 'INTERMEDIATE' as const,
      durationMin: 45,
      durationWeeks: 6,
      status: 'PUBLISHED' as const,
      accessType: 'PREMIUM' as const,
      isPublished: true,
      categories: ['yoga', 'vinyasa'],
      promoVideoUrl: 'https://www.youtube.com/watch?v=Eml2xnoLpYE',
      promoVideoSource: 'YOUTUBE' as const,
      promoVideoId: 'Eml2xnoLpYE',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
      coverUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
    },
    {
      id: 'program-pilates-core',
      title: 'Pilates Core Güçlendirme',
      description: '8 haftalık core güçlendirme programı. Karın kaslarınızı ve duruşunuzu geliştirin.',
      level: 'INTERMEDIATE' as const,
      durationMin: 40,
      durationWeeks: 8,
      status: 'PUBLISHED' as const,
      accessType: 'PREMIUM' as const,
      isPublished: true,
      categories: ['pilates', 'core'],
      promoVideoUrl: 'https://www.youtube.com/watch?v=2MoGxae-zyo',
      promoVideoSource: 'YOUTUBE' as const,
      promoVideoId: '2MoGxae-zyo',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
      coverUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
    },
    {
      id: 'program-meditation-basics',
      title: 'Meditasyon Başlangıç',
      description: 'Meditasyona giriş programı. Zihinsel berraklık ve iç huzur için rehberli seanslar.',
      level: 'BEGINNER' as const,
      durationMin: 15,
      durationWeeks: 3,
      status: 'PUBLISHED' as const,
      accessType: 'FREE' as const,
      isPublished: true,
      categories: ['meditation', 'mindfulness'],
      promoVideoUrl: 'https://www.youtube.com/watch?v=inpok4MKVLM',
      promoVideoSource: 'YOUTUBE' as const,
      promoVideoId: 'inpok4MKVLM',
      thumbnailUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400',
      coverUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=1200',
    },
    {
      id: 'program-advanced-yoga',
      title: 'İleri Seviye Yoga',
      description: 'Deneyimli yogiler için zorlayıcı pozlar ve gelişmiş teknikler.',
      level: 'ADVANCED' as const,
      durationMin: 60,
      durationWeeks: 12,
      status: 'PUBLISHED' as const,
      accessType: 'PAID' as const,
      price: 299,
      isPublished: true,
      categories: ['yoga', 'advanced'],
      promoVideoUrl: 'https://www.youtube.com/watch?v=9kOCY0KNByw',
      promoVideoSource: 'YOUTUBE' as const,
      promoVideoId: '9kOCY0KNByw',
      thumbnailUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400',
      coverUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1200',
    },
    {
      id: 'program-stress-relief',
      title: 'Stres Yönetimi Programı',
      description: 'Yoga, nefes çalışmaları ve meditasyon ile stresi azaltın.',
      level: 'BEGINNER' as const,
      durationMin: 20,
      durationWeeks: 4,
      status: 'DRAFT' as const,
      accessType: 'PREMIUM' as const,
      isPublished: false,
      categories: ['wellness', 'stress-relief'],
      promoVideoUrl: 'https://www.youtube.com/watch?v=COp7BR_Dvps',
      promoVideoSource: 'YOUTUBE' as const,
      promoVideoId: 'COp7BR_Dvps',
      thumbnailUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400',
      coverUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200',
    },
  ];

  for (const program of programsData) {
    await prisma.programs.upsert({
      where: { id: program.id },
      update: {},
      create: {
        ...program,
        instructorId: teacher.id,
      },
    });
  }
  console.log('📚 Programs ensured');

  // ============================================
  // CLASSES
  // ============================================
  const classesData = [
    {
      id: 'class-morning-yoga',
      title: 'Sabah Yoga Akışı',
      description: 'Güne enerjik başlamak için 30 dakikalık canlandırıcı yoga dersi.',
      duration: 30,
      level: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      category: 'yoga',
      isFree: true,
      videoUrl: 'https://www.youtube.com/watch?v=4pKly2JojMw',
      videoSource: 'YOUTUBE' as const,
      videoId: '4pKly2JojMw',
      videoDuration: 1800,
      thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    },
    {
      id: 'class-power-vinyasa',
      title: 'Power Vinyasa',
      description: 'Yoğun tempolu, güç odaklı vinyasa dersi.',
      duration: 45,
      level: 'INTERMEDIATE' as const,
      status: 'PUBLISHED' as const,
      category: 'yoga',
      isFree: false,
      videoUrl: 'https://www.youtube.com/watch?v=Eml2xnoLpYE',
      videoSource: 'YOUTUBE' as const,
      videoId: 'Eml2xnoLpYE',
      videoDuration: 2700,
      thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    },
    {
      id: 'class-gentle-stretch',
      title: 'Hafif Esneme',
      description: 'Kasları gevşeten, sakinleştirici esneme dersi.',
      duration: 25,
      level: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      category: 'yoga',
      isFree: true,
      videoUrl: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
      videoSource: 'YOUTUBE' as const,
      videoId: 'g_tea8ZNk5A',
      videoDuration: 1500,
      thumbnailUrl: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400',
    },
    {
      id: 'class-pilates-mat',
      title: 'Mat Pilates',
      description: 'Core güçlendirme ve esneklik için mat pilates.',
      duration: 40,
      level: 'INTERMEDIATE' as const,
      status: 'PUBLISHED' as const,
      category: 'pilates',
      isFree: false,
      videoUrl: 'https://www.youtube.com/watch?v=2MoGxae-zyo',
      videoSource: 'YOUTUBE' as const,
      videoId: '2MoGxae-zyo',
      videoDuration: 2400,
      thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
    },
    {
      id: 'class-yin-yoga',
      title: 'Yin Yoga',
      description: 'Derin esneme ve rahatlama için yavaş tempolu yoga.',
      duration: 50,
      level: 'ALL' as const,
      status: 'PUBLISHED' as const,
      category: 'yoga',
      isFree: false,
      videoUrl: 'https://www.youtube.com/watch?v=yVMvOXGMfWc',
      videoSource: 'YOUTUBE' as const,
      videoId: 'yVMvOXGMfWc',
      videoDuration: 3000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400',
    },
    {
      id: 'class-breathwork',
      title: 'Nefes Çalışması',
      description: 'Pranayama teknikleri ile nefes farkındalığı.',
      duration: 20,
      level: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      category: 'breathwork',
      isFree: true,
      videoUrl: 'https://www.youtube.com/watch?v=tybOi4hjZFQ',
      videoSource: 'YOUTUBE' as const,
      videoId: 'tybOi4hjZFQ',
      videoDuration: 1200,
      thumbnailUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400',
    },
    {
      id: 'class-evening-relax',
      title: 'Akşam Rahatlama',
      description: 'Gün sonunda rahatlamak için restoratif yoga.',
      duration: 35,
      level: 'BEGINNER' as const,
      status: 'DRAFT' as const,
      category: 'yoga',
      isFree: false,
      videoUrl: 'https://www.youtube.com/watch?v=COp7BR_Dvps',
      videoSource: 'YOUTUBE' as const,
      videoId: 'COp7BR_Dvps',
      videoDuration: 2100,
      thumbnailUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400',
    },
    {
      id: 'class-hiit-yoga',
      title: 'HIIT Yoga Fusion',
      description: 'Yüksek yoğunluklu interval antrenmanı ve yoga birleşimi.',
      duration: 40,
      level: 'ADVANCED' as const,
      status: 'PUBLISHED' as const,
      category: 'yoga',
      isFree: false,
      videoUrl: 'https://www.youtube.com/watch?v=9kOCY0KNByw',
      videoSource: 'YOUTUBE' as const,
      videoId: '9kOCY0KNByw',
      videoDuration: 2400,
      thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    },
    // Demo class with local video file
    {
      id: 'class-pilates-demo',
      title: '15 Dakika Pilates Başlangıç',
      description: 'Yeni başlayanlar için mükemmel 15 dakikalık pilates dersi. Core güçlendirme ve esneklik çalışmaları.',
      duration: 15,
      level: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      category: 'pilates',
      isFree: true,
      videoUrl: '/uploads/demo/pilates-demo.mp4',
      videoSource: 'UPLOAD' as const,
      videoDuration: 900,
      thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
    },
    // Demo class with Vimeo
    {
      id: 'class-yoga-vimeo-demo',
      title: 'Vinyasa Flow Demo',
      description: 'Orta seviye vinyasa yoga akışı. Nefes ve hareket senkronizasyonu.',
      duration: 30,
      level: 'INTERMEDIATE' as const,
      status: 'PUBLISHED' as const,
      category: 'yoga',
      isFree: false,
      videoUrl: 'https://vimeo.com/253989945',
      videoSource: 'VIMEO' as const,
      videoId: '253989945',
      videoDuration: 1800,
      thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    },
    // Vimeo - Meditation class
    {
      id: 'class-meditation-vimeo',
      title: 'Derin Meditasyon Rehberli',
      description: 'Nefes odaklı derin meditasyon seansı. Stres azaltma ve zihinsel berraklık.',
      duration: 20,
      level: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      category: 'meditation',
      isFree: true,
      videoUrl: 'https://vimeo.com/312974583',
      videoSource: 'VIMEO' as const,
      videoId: '312974583',
      videoDuration: 1200,
      thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    },
    // Dailymotion - Yoga class
    {
      id: 'class-yoga-dailymotion',
      title: 'Hatha Yoga Temelleri',
      description: 'Hatha yoga temel pozisyonları ve nefes teknikleri. Başlangıç seviyesi için ideal.',
      duration: 25,
      level: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      category: 'yoga',
      isFree: true,
      videoUrl: 'https://www.dailymotion.com/video/x6g8j7w',
      videoSource: 'DAILYMOTION' as const,
      videoId: 'x6g8j7w',
      videoDuration: 1500,
      thumbnailUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400',
    },
    // YouTube - Pilates class
    {
      id: 'class-pilates-youtube',
      title: '20 Dakika Full Body Pilates',
      description: 'Tüm vücudu çalıştıran etkili pilates rutini. Mat üzerinde yapılabilir.',
      duration: 20,
      level: 'INTERMEDIATE' as const,
      status: 'PUBLISHED' as const,
      category: 'pilates',
      isFree: false,
      videoUrl: 'https://www.youtube.com/watch?v=K56Z12XNQ5c',
      videoSource: 'YOUTUBE' as const,
      videoId: 'K56Z12XNQ5c',
      videoDuration: 1200,
      thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
    },
    // Vimeo - Breathwork
    {
      id: 'class-breathwork-vimeo',
      title: 'Pranayama Temelleri',
      description: 'Temel pranayama teknikleri ve nefes farkındalığı. Enerji artırıcı.',
      duration: 15,
      level: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      category: 'breathwork',
      isFree: true,
      videoUrl: 'https://vimeo.com/383936492',
      videoSource: 'VIMEO' as const,
      videoId: '383936492',
      videoDuration: 900,
      thumbnailUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400',
    },
    // YouTube - Restorative Yoga
    {
      id: 'class-restorative-youtube',
      title: 'Restorative Yoga - Gece Rahatlama',
      description: 'Uyku öncesi rahatlatıcı restorative yoga. Derin gevşeme ve rahatlama.',
      duration: 35,
      level: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      category: 'yoga',
      isFree: false,
      videoUrl: 'https://www.youtube.com/watch?v=BiWDsfZ3zbo',
      videoSource: 'YOUTUBE' as const,
      videoId: 'BiWDsfZ3zbo',
      videoDuration: 2100,
      thumbnailUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400',
    },
    // Dailymotion - Core workout
    {
      id: 'class-core-dailymotion',
      title: 'Core Güçlendirme',
      description: '15 dakikada etkili core egzersizleri. Karın ve sırt kaslarını güçlendirir.',
      duration: 15,
      level: 'INTERMEDIATE' as const,
      status: 'PUBLISHED' as const,
      category: 'pilates',
      isFree: true,
      videoUrl: 'https://www.dailymotion.com/video/x7u3gk4',
      videoSource: 'DAILYMOTION' as const,
      videoId: 'x7u3gk4',
      videoDuration: 900,
      thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    },
  ];

  for (const classData of classesData) {
    await prisma.classes.upsert({
      where: { id: classData.id },
      update: {},
      create: {
        ...classData,
        instructorId: teacher.id,
        schedule: new Date(),
      },
    });
  }
  console.log('🎓 Classes ensured');

  // ============================================
  // CHALLENGES
  // ============================================
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const challengesData = [
    {
      id: 'challenge-30-day-yoga',
      title: '30 Günlük Yoga Challenge',
      description: 'Her gün en az 15 dakika yoga yaparak sağlıklı bir alışkanlık edinin.',
      difficulty: 'BEGINNER' as const,
      categories: ['Yoga', 'Esneklik'],
      startAt: oneWeekAgo,
      endAt: oneMonthLater,
      targetDays: 30,
      dailyGoalMinutes: 15,
      dailyGoalType: 'DURATION' as const,
      xpReward: 1000,
      showLeaderboard: true,
      isActive: true,
      coverUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/3176/3176395.png',
    },
    {
      id: 'challenge-meditation-week',
      title: 'Meditasyon Haftası',
      description: '7 gün boyunca günde 10 dakika meditasyon yapın ve zihninizi dinlendirin.',
      difficulty: 'BEGINNER' as const,
      categories: ['Meditasyon', 'Stres Azaltma'],
      startAt: now,
      endAt: oneWeekLater,
      targetDays: 7,
      dailyGoalMinutes: 10,
      dailyGoalType: 'DURATION' as const,
      xpReward: 500,
      showLeaderboard: true,
      isActive: true,
      coverUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800',
      thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/2647/2647625.png',
    },
    {
      id: 'challenge-pilates-core',
      title: 'Pilates Core Challenge',
      description: '2 haftalık yoğun core güçlendirme programı.',
      difficulty: 'INTERMEDIATE' as const,
      categories: ['Pilates', 'Güç'],
      startAt: oneWeekLater,
      endAt: twoWeeksLater,
      targetDays: 14,
      dailyGoalMinutes: 20,
      dailyGoalType: 'DURATION' as const,
      xpReward: 750,
      showLeaderboard: true,
      isActive: true,
      coverUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
      thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png',
    },
    {
      id: 'challenge-breathwork-master',
      title: 'Nefes Ustası',
      description: 'Pranayama tekniklerini öğrenin ve ustalaşın.',
      difficulty: 'ADVANCED' as const,
      categories: ['Nefes', 'Meditasyon'],
      startAt: now,
      endAt: twoWeeksLater,
      targetDays: 14,
      dailyGoalMinutes: 15,
      dailyGoalType: 'DURATION' as const,
      xpReward: 800,
      showLeaderboard: false,
      isActive: true,
      coverUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
    },
    {
      id: 'challenge-flexibility-boost',
      title: 'Esneklik Artırma',
      description: '21 günde esnekliğinizi artırın.',
      difficulty: 'INTERMEDIATE' as const,
      categories: ['Yoga', 'Esneklik'],
      startAt: oneWeekLater,
      endAt: oneMonthLater,
      targetDays: 21,
      dailyGoalMinutes: 25,
      dailyGoalType: 'DURATION' as const,
      xpReward: 900,
      showLeaderboard: true,
      isActive: true,
      coverUrl: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800',
      thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/3176/3176363.png',
    },
    {
      id: 'challenge-morning-ritual',
      title: 'Sabah Ritüeli',
      description: '14 gün boyunca sabah rutini oluşturun.',
      difficulty: 'BEGINNER' as const,
      categories: ['Sabah', 'Alışkanlık'],
      startAt: now,
      endAt: twoWeeksLater,
      targetDays: 14,
      dailyGoalMinutes: 20,
      dailyGoalType: 'DURATION' as const,
      xpReward: 700,
      showLeaderboard: true,
      isActive: true,
      coverUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/869/869869.png',
    },
    {
      id: 'challenge-sleep-better',
      title: 'Daha İyi Uyku',
      description: '7 gece uyku öncesi meditasyon ile uyku kalitenizi artırın.',
      difficulty: 'BEGINNER' as const,
      categories: ['Uyku', 'Meditasyon'],
      startAt: now,
      endAt: oneWeekLater,
      targetDays: 7,
      dailyGoalMinutes: 15,
      dailyGoalType: 'DURATION' as const,
      xpReward: 450,
      showLeaderboard: false,
      isActive: true,
      coverUrl: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=800',
      thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/3236/3236952.png',
    },
  ];

  for (const challenge of challengesData) {
    await prisma.challenges.upsert({
      where: { id: challenge.id },
      update: {},
      create: challenge,
    });
  }
  console.log('🏆 Challenges ensured');

  // ============================================
  // GAMIFICATION: DAILY REWARDS CONFIG
  // ============================================
  const dailyRewardsConfig = [
    { day: 1, xp: 10, coins: 5, description: 'Day 1 Reward' },
    { day: 2, xp: 15, coins: 8, description: 'Day 2 Reward' },
    { day: 3, xp: 20, coins: 10, description: 'Day 3 Reward' },
    { day: 4, xp: 25, coins: 12, description: 'Day 4 Reward' },
    { day: 5, xp: 35, coins: 15, description: 'Day 5 Reward' },
    { day: 6, xp: 45, coins: 20, description: 'Day 6 Reward' },
    { day: 7, xp: 100, coins: 50, bonusItem: 'streak_freeze', description: 'Week Completion Bonus!' },
  ];

  await prisma.gamification_config.upsert({
    where: { key: 'daily_rewards_config' },
    update: { value: dailyRewardsConfig },
    create: {
      key: 'daily_rewards_config',
      value: dailyRewardsConfig,
      description: 'Daily login rewards configuration',
    },
  });
  console.log('🎁 Daily rewards config ensured');

  // ============================================
  // GAMIFICATION: XP LEVELS CONFIG
  // ============================================
  const xpLevelsConfig = [
    { level: 1, minXp: 0, maxXp: 100, title: 'Başlangıç' },
    { level: 2, minXp: 100, maxXp: 250, title: 'Çırak' },
    { level: 3, minXp: 250, maxXp: 500, title: 'Pratisyen' },
    { level: 4, minXp: 500, maxXp: 1000, title: 'Deneyimli' },
    { level: 5, minXp: 1000, maxXp: 2000, title: 'Uzman' },
    { level: 6, minXp: 2000, maxXp: 4000, title: 'Usta' },
    { level: 7, minXp: 4000, maxXp: 8000, title: 'Grandmaster' },
    { level: 8, minXp: 8000, maxXp: 15000, title: 'Efsane' },
    { level: 9, minXp: 15000, maxXp: 30000, title: 'Mitolojik' },
    { level: 10, minXp: 30000, maxXp: 999999, title: 'Tanrısal' },
  ];

  await prisma.gamification_config.upsert({
    where: { key: 'xp_levels_config' },
    update: { value: xpLevelsConfig },
    create: {
      key: 'xp_levels_config',
      value: xpLevelsConfig,
      description: 'XP level thresholds and titles',
    },
  });
  console.log('📈 XP levels config ensured');

  // ============================================
  // GAMIFICATION: XP REWARDS CONFIG
  // ============================================
  const xpRewardsConfig = {
    meditation_complete: 25,
    breathwork_complete: 20,
    yoga_complete: 30,
    daily_login: 10,
    streak_bonus_7: 50,
    streak_bonus_30: 200,
    challenge_complete: 100,
    achievement_unlock: 50,
    first_activity_of_day: 15,
    journal_entry: 10,
    mood_log: 5,
  };

  await prisma.gamification_config.upsert({
    where: { key: 'xp_rewards_config' },
    update: { value: xpRewardsConfig },
    create: {
      key: 'xp_rewards_config',
      value: xpRewardsConfig,
      description: 'XP rewards for various activities',
    },
  });
  console.log('💰 XP rewards config ensured');

  // ============================================
  // NOTIFICATIONS: DEMO NOTIFICATION LOGS
  // ============================================
  const demoNotifications = [
    {
      title: 'Dersiniz başlıyor!',
      body: 'Yoga dersiniz 15 dakika sonra başlıyor. Hazır mısınız?',
      status: 'SENT' as const,
      sentAt: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      title: 'Haftalık özet hazır',
      body: 'Bu hafta 5 ders tamamladınız ve 250 XP kazandınız!',
      status: 'SENT' as const,
      sentAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      title: 'Challenge hatırlatıcı',
      body: '30 Günlük Yoga Challenge devam ediyor. Bugünkü dersinizi kaçırmayın!',
      status: 'SENT' as const,
      sentAt: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      title: 'Yeni program eklendi',
      body: 'Sabah Yoga programı artık mevcut. Hemen keşfedin!',
      status: 'SENT' as const,
      sentAt: new Date(Date.now() - 1000 * 60 * 120),
    },
    {
      title: 'Streak hatırlatıcı',
      body: 'Bugün henüz bir aktivite yapmadınız. Seriyi korumak için bir ders tamamlayın!',
      status: 'PENDING' as const,
      sentAt: null,
    },
  ];

  // Get first user for demo notifications
  const firstUser = await prisma.users.findFirst();
  if (firstUser) {
    for (const notif of demoNotifications) {
      await prisma.notification_logs.create({
        data: {
          userId: firstUser.id,
          title: notif.title,
          body: notif.body,
          status: notif.status,
          sentAt: notif.sentAt,
        },
      });
    }
    console.log('🔔 Demo notification logs created');
  }

  // ============================================
  // NOTIFICATIONS: NOTIFICATION TEMPLATES CONFIG
  // ============================================
  const notificationTemplatesConfig = [
    {
      slug: 'welcome',
      name: 'Hoş Geldiniz',
      type: 'EMAIL',
      category: 'TRANSACTIONAL',
      subject: 'Yoga App\'e Hoş Geldiniz!',
      title: 'Hoş Geldiniz',
      body: 'Merhaba {{firstName}}, Yoga App ailesine hoş geldiniz!',
      htmlBody: '<h1>Hoş Geldiniz {{firstName}}!</h1><p>Yoga yolculuğunuza başlamak için hazırsınız.</p>',
      variables: ['firstName', 'lastName', 'email'],
      isActive: true,
    },
    {
      slug: 'password-reset',
      name: 'Şifre Sıfırlama',
      type: 'EMAIL',
      category: 'TRANSACTIONAL',
      subject: 'Şifre Sıfırlama Talebi',
      title: 'Şifre Sıfırlama',
      body: 'Merhaba {{firstName}}, şifrenizi sıfırlamak için linke tıklayın: {{resetLink}}',
      variables: ['firstName', 'resetLink', 'expiresIn'],
      isActive: true,
    },
    {
      slug: 'class-reminder',
      name: 'Ders Hatırlatıcı',
      type: 'PUSH',
      category: 'REMINDER',
      title: 'Dersiniz Yaklaşıyor!',
      body: '{{className}} dersiniz {{timeUntil}} sonra başlıyor.',
      variables: ['className', 'timeUntil', 'instructorName'],
      isActive: true,
    },
    {
      slug: 'challenge-completed',
      name: 'Challenge Tamamlandı',
      type: 'PUSH',
      category: 'TRANSACTIONAL',
      title: 'Tebrikler!',
      body: '{{challengeName}} challenge\'ını başarıyla tamamladınız!',
      variables: ['challengeName', 'completionDate', 'badge'],
      isActive: true,
    },
    {
      slug: 'new-program',
      name: 'Yeni Program',
      type: 'EMAIL',
      category: 'MARKETING',
      subject: 'Yeni Program: {{programName}}',
      title: 'Yeni Program Eklendi',
      body: 'Heyecan verici bir program daha! {{programName}} artık mevcut.',
      variables: ['programName', 'programDescription', 'instructorName'],
      isActive: true,
    },
  ];

  await prisma.gamification_config.upsert({
    where: { key: 'notification_templates_config' },
    update: { value: notificationTemplatesConfig },
    create: {
      key: 'notification_templates_config',
      value: notificationTemplatesConfig,
      description: 'Notification templates configuration',
    },
  });
  console.log('📧 Notification templates config ensured');

  // ============================================
  // NOTIFICATIONS: PUSH PROVIDER SETTINGS CONFIG
  // ============================================
  const pushProviderSettingsConfig = {
    providers: [
      {
        id: 'firebase',
        name: 'Firebase Cloud Messaging',
        provider: 'FIREBASE',
        isEnabled: false,
        isConfigured: false,
        config: {
          projectId: '',
          privateKey: '',
          clientEmail: '',
        },
      },
      {
        id: 'onesignal',
        name: 'OneSignal',
        provider: 'ONESIGNAL',
        isEnabled: false,
        isConfigured: false,
        config: {
          appId: '',
          apiKey: '',
        },
      },
      {
        id: 'expo',
        name: 'Expo Push Notifications',
        provider: 'EXPO',
        isEnabled: false,
        isConfigured: false,
        config: {
          accessToken: '',
        },
      },
    ],
    emailConfig: {
      provider: 'SMTP',
      isEnabled: false,
      isConfigured: false,
      fromEmail: '',
      fromName: '',
      config: {
        host: '',
        port: '587',
        username: '',
        password: '',
        secure: 'true',
      },
    },
  };

  await prisma.gamification_config.upsert({
    where: { key: 'push_provider_settings' },
    update: { value: pushProviderSettingsConfig },
    create: {
      key: 'push_provider_settings',
      value: pushProviderSettingsConfig,
      description: 'Push notification provider settings',
    },
  });
  console.log('📲 Push provider settings config ensured');

  // ============================================
  // NOTIFICATIONS: BROADCAST CAMPAIGNS CONFIG
  // ============================================
  const broadcastCampaignsConfig = [
    {
      id: 'campaign-1',
      name: 'Yeni Yıl Kampanyası',
      status: 'SENT',
      channels: ['push', 'email'],
      targetAudience: { type: 'ALL' },
      content: {
        title: 'Yeni Yıla Yoga ile Girin!',
        body: '2024\'te yoga yolculuğunuza başlayın. %20 indirim!',
        subject: 'Yeni Yıla Yoga ile Merhaba!',
      },
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      stats: {
        total: 5000,
        sent: 5000,
        delivered: 4850,
        opened: 2100,
        clicked: 450,
        failed: 150,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    },
    {
      id: 'campaign-2',
      name: 'Premium Kullanıcı Duyurusu',
      status: 'SCHEDULED',
      channels: ['push', 'inApp'],
      targetAudience: { type: 'ROLES', roles: ['PREMIUM'] },
      content: {
        title: 'Yeni Özellik: Canlı Dersler',
        body: 'Premium üyeliğinize özel canlı yoga dersleri başlıyor!',
      },
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      stats: {
        total: 1200,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: 'campaign-3',
      name: 'Haftalık Özet',
      status: 'SENDING',
      channels: ['email'],
      targetAudience: { type: 'ALL' },
      content: {
        title: 'Bu Haftanız Nasıl Geçti?',
        body: 'Haftalık yoga ilerlemenizi görüntüleyin.',
        subject: 'Haftalık Yoga Özetiniz',
      },
      stats: {
        total: 3500,
        sent: 2100,
        delivered: 2050,
        opened: 0,
        clicked: 0,
        failed: 50,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ];

  await prisma.gamification_config.upsert({
    where: { key: 'broadcast_campaigns_config' },
    update: { value: broadcastCampaignsConfig },
    create: {
      key: 'broadcast_campaigns_config',
      value: broadcastCampaignsConfig,
      description: 'Broadcast notification campaigns',
    },
  });
  console.log('📢 Broadcast campaigns config ensured');

  // ============================================
  // ADMIN AUDIT LOGS
  // ============================================
  const adminAuditLogs = [
    {
      adminId: admin.id,
      action: 'USER_CREATE' as const,
      entityType: 'USER',
      entityId: studentSam.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { email: studentSam.email, firstName: studentSam.firstName, lastName: studentSam.lastName },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    },
    {
      adminId: admin.id,
      action: 'USER_CREATE' as const,
      entityType: 'USER',
      entityId: studentEmma.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { email: studentEmma.email, firstName: studentEmma.firstName, lastName: studentEmma.lastName },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    },
    {
      adminId: admin.id,
      action: 'PROGRAM_CREATE' as const,
      entityType: 'PROGRAM',
      entityId: 'prog-demo-1',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { title: '30-Day Yoga Challenge', level: 'INTERMEDIATE' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    },
    {
      adminId: admin.id,
      action: 'PROGRAM_PUBLISH' as const,
      entityType: 'PROGRAM',
      entityId: 'prog-demo-1',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      metadata: { title: '30-Day Yoga Challenge', previousStatus: 'DRAFT', newStatus: 'PUBLISHED' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    },
    {
      adminId: admin.id,
      action: 'CLASS_CREATE' as const,
      entityType: 'CLASS',
      entityId: 'class-demo-1',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { title: 'Morning Flow', duration: 45, instructor: 'Taylor Johnson' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    },
    {
      adminId: admin.id,
      action: 'USER_UPDATE' as const,
      entityType: 'USER',
      entityId: studentSam.id,
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
      metadata: { field: 'subscription', oldValue: 'FREE', newValue: 'PREMIUM' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
    {
      adminId: admin.id,
      action: 'CHALLENGE_CREATE' as const,
      entityType: 'CHALLENGE',
      entityId: 'challenge-demo-1',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { title: 'Winter Wellness Challenge', duration: '7 days', participants: 0 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
    {
      adminId: admin.id,
      action: 'POSE_CREATE' as const,
      entityType: 'POSE',
      entityId: 'pose-demo-1',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { name: 'Downward Dog', sanskritName: 'Adho Mukha Svanasana', difficulty: 'BEGINNER' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      adminId: admin.id,
      action: 'CLASS_UPDATE' as const,
      entityType: 'CLASS',
      entityId: 'class-demo-1',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      metadata: { field: 'duration', oldValue: 45, newValue: 60 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    },
    {
      adminId: admin.id,
      action: 'SETTINGS_UPDATE' as const,
      entityType: 'SETTINGS',
      entityId: 'app-config',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { setting: 'enableNotifications', oldValue: false, newValue: true },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    },
    {
      adminId: admin.id,
      action: 'USER_BAN' as const,
      entityType: 'USER',
      entityId: 'user-banned-demo',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { reason: 'Spam activity', email: 'spammer@example.com' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    },
    {
      adminId: admin.id,
      action: 'PROGRAM_UPDATE' as const,
      entityType: 'PROGRAM',
      entityId: 'prog-demo-1',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { field: 'description', action: 'updated' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      adminId: admin.id,
      action: 'POSE_UPDATE' as const,
      entityType: 'POSE',
      entityId: 'pose-demo-1',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { field: 'benefits', action: 'added new benefits' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
    {
      adminId: admin.id,
      action: 'CLASS_DELETE' as const,
      entityType: 'CLASS',
      entityId: 'class-deleted-demo',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { title: 'Old Deprecated Class', reason: 'Content outdated' },
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      adminId: admin.id,
      action: 'USER_UNBAN' as const,
      entityType: 'USER',
      entityId: 'user-unbanned-demo',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      metadata: { reason: 'Appeal accepted', email: 'restored@example.com' },
      createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    },
  ];

  // Clear existing audit logs and insert fresh ones
  await prisma.admin_audit_logs.deleteMany({});
  for (const log of adminAuditLogs) {
    await prisma.admin_audit_logs.create({ data: log });
  }
  console.log('📋 Admin audit logs seeded');

  // ============================================
  // PODCASTS
  // ============================================
  const podcastsData = [
    {
      id: 'podcast-mindful-mornings',
      title: 'Mindful Mornings',
      slug: 'mindful-mornings',
      description: 'Güne farkındalıkla başlamanın yollarını keşfedin. Her sabah yeni bir meditasyon ve mindfulness pratiği ile uyanın.',
      shortDescription: 'Sabah meditasyonları ve farkındalık pratikleri',
      coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
      category: 'MINDFULNESS' as const,
      hostName: 'Ayşe Yoga',
      hostBio: '15 yıllık yoga ve meditasyon eğitmeni. Mindfulness pratisyeni.',
      hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      status: 'PUBLISHED' as const,
      isExplicit: false,
      language: 'tr',
      rssEnabled: true,
      totalEpisodes: 45,
      totalDuration: 81000, // 22.5 hours
      totalListens: 12500,
      subscriberCount: 3420,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180), // 6 months ago
    },
    {
      id: 'podcast-yoga-journey',
      title: 'Yoga Journey',
      slug: 'yoga-journey',
      description: 'Yoga felsefesi, asana teknikleri ve kişisel dönüşüm hikayeleri. Deneyimli yoga eğitmenleri ile derinlemesine sohbetler.',
      shortDescription: 'Yoga felsefesi ve pratik rehberlik',
      coverImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200',
      category: 'YOGA_INSTRUCTION' as const,
      hostName: 'Mehmet Asana',
      hostBio: 'RYT-500 sertifikalı yoga eğitmeni. Ashtanga ve Vinyasa uzmanı.',
      hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      status: 'PUBLISHED' as const,
      isExplicit: false,
      language: 'tr',
      rssEnabled: true,
      totalEpisodes: 32,
      totalDuration: 69120, // 19.2 hours
      totalListens: 8700,
      subscriberCount: 2150,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120), // 4 months ago
    },
    {
      id: 'podcast-breath-mastery',
      title: 'Breath Mastery',
      slug: 'breath-mastery',
      description: 'Nefes çalışmaları ve pranayama teknikleri üzerine kapsamlı bir rehber. Stres yönetimi, enerji artırma ve derin rahatlama.',
      shortDescription: 'Pranayama ve nefes teknikleri',
      coverImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
      category: 'BREATHWORK' as const,
      hostName: 'Dr. Zeynep Nefes',
      hostBio: 'Nefes terapisti ve wellness koçu. 10+ yıl deneyim.',
      hostAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      status: 'PUBLISHED' as const,
      isExplicit: false,
      language: 'tr',
      rssEnabled: true,
      totalEpisodes: 28,
      totalDuration: 50400, // 14 hours
      totalListens: 6200,
      subscriberCount: 1890,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 3 months ago
    },
    {
      id: 'podcast-sleep-sanctuary',
      title: 'Sleep Sanctuary',
      slug: 'sleep-sanctuary',
      description: 'Kaliteli uyku için meditasyonlar, uyku hikayeleri ve rahatlama teknikleri. Her gece huzurlu bir uykuya dalın.',
      shortDescription: 'Uyku meditasyonları ve hikayeler',
      coverImage: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=1200',
      category: 'SLEEP' as const,
      hostName: 'Luna Dreams',
      hostBio: 'Uyku uzmanı ve sesli içerik üreticisi. Rahatlatıcı sesler ve hikayeler.',
      hostAvatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200',
      status: 'PUBLISHED' as const,
      isExplicit: false,
      language: 'tr',
      rssEnabled: true,
      totalEpisodes: 52,
      totalDuration: 93600, // 26 hours
      totalListens: 18900,
      subscriberCount: 5670,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 240), // 8 months ago
    },
    {
      id: 'podcast-wellness-talks',
      title: 'Wellness Talks',
      slug: 'wellness-talks',
      description: 'Sağlık, wellness ve kişisel gelişim üzerine uzman konuklarla röportajlar. Beslenme, egzersiz ve mental sağlık.',
      shortDescription: 'Uzman röportajları ve wellness içgörüleri',
      coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200',
      category: 'WELLNESS' as const,
      hostName: 'Wellness Team',
      hostBio: 'Sağlık ve wellness alanında uzman ekip.',
      hostAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      status: 'PUBLISHED' as const,
      isExplicit: false,
      language: 'tr',
      rssEnabled: true,
      totalEpisodes: 38,
      totalDuration: 82080, // 22.8 hours
      totalListens: 9400,
      subscriberCount: 2780,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150), // 5 months ago
    },
    {
      id: 'podcast-meditation-basics',
      title: 'Meditation Basics',
      slug: 'meditation-basics',
      description: 'Meditasyona yeni başlayanlar için adım adım rehber. Temel teknikler, yaygın hatalar ve pratik ipuçları.',
      shortDescription: 'Başlangıç seviye meditasyon dersleri',
      coverImage: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=1200',
      category: 'MEDITATION' as const,
      hostName: 'Calm Mind',
      hostBio: 'Meditasyon öğretmeni. Başlangıç seviye eğitim uzmanı.',
      hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      status: 'DRAFT' as const,
      isExplicit: false,
      language: 'tr',
      rssEnabled: false,
      totalEpisodes: 12,
      totalDuration: 21600, // 6 hours
      totalListens: 0,
      subscriberCount: 0,
      publishedAt: null,
    },
  ];

  for (const podcast of podcastsData) {
    await prisma.podcasts.upsert({
      where: { id: podcast.id },
      update: podcast,
      create: podcast,
    });
  }
  console.log('🎙️ Podcasts seeded');

  // ============================================
  // LIVE STREAMS
  // ============================================
  const liveStreamsData = [
    {
      id: 'live-stream-morning-yoga',
      title: 'Morning Yoga Flow',
      description: 'Start your day with energizing vinyasa yoga. Perfect for all levels.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      instructorId: instructorProfile.id,
      coHostIds: [],
      type: 'YOGA_CLASS' as const,
      status: 'SCHEDULED' as const,
      scheduledStartAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
      scheduledEndAt: new Date(Date.now() + 1000 * 60 * 60 * 25), // Tomorrow + 1 hour
      maxParticipants: 100,
      currentParticipants: 0,
      isRecorded: true,
      requiresSubscription: true,
      minimumTier: 'FREE' as const,
      tags: ['yoga', 'morning', 'vinyasa', 'beginner-friendly'],
      level: 'BEGINNER' as const,
      equipment: ['yoga mat'],
      agoraChannelName: 'morning-yoga-flow-channel',
      chatEnabled: true,
      handRaiseEnabled: true,
      viewCount: 0,
      likeCount: 0,
    },
    {
      id: 'live-stream-meditation-master',
      title: 'Deep Meditation Masterclass',
      description: 'Learn advanced meditation techniques for stress relief and mental clarity.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      instructorId: instructorProfileAlex.id,
      coHostIds: [],
      type: 'MEDITATION' as const,
      status: 'SCHEDULED' as const,
      scheduledStartAt: new Date(Date.now() + 1000 * 60 * 60 * 48), // 2 days from now
      scheduledEndAt: new Date(Date.now() + 1000 * 60 * 60 * 49), // 2 days + 1 hour
      maxParticipants: 200,
      currentParticipants: 0,
      isRecorded: true,
      requiresSubscription: true,
      minimumTier: 'YOGA' as const,
      tags: ['meditation', 'advanced', 'stress-relief', 'mindfulness'],
      level: 'INTERMEDIATE' as const,
      equipment: ['cushion'],
      agoraChannelName: 'meditation-masterclass-channel',
      chatEnabled: true,
      handRaiseEnabled: true,
      viewCount: 0,
      likeCount: 0,
    },
    {
      id: 'live-stream-pilates-core',
      title: 'Pilates Core Intensive',
      description: 'Strengthen your core with focused Pilates exercises. Intermediate level.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
      instructorId: instructorProfileMaya.id,
      coHostIds: [],
      type: 'WORKSHOP' as const,
      status: 'SCHEDULED' as const,
      scheduledStartAt: new Date(Date.now() + 1000 * 60 * 60 * 72), // 3 days from now
      scheduledEndAt: new Date(Date.now() + 1000 * 60 * 60 * 73.5), // 3 days + 1.5 hours
      maxParticipants: 50,
      currentParticipants: 0,
      isRecorded: true,
      requiresSubscription: true,
      minimumTier: 'FREE' as const,
      tags: ['pilates', 'core', 'strength', 'intermediate'],
      level: 'INTERMEDIATE' as const,
      equipment: ['yoga mat', 'pilates ring'],
      agoraChannelName: 'pilates-core-intensive-channel',
      chatEnabled: true,
      handRaiseEnabled: true,
      viewCount: 0,
      likeCount: 0,
    },
    {
      id: 'live-stream-breathwork-ended',
      title: 'Breathwork Power Session',
      description: 'Powerful breathing exercises for energy and focus. Recorded session.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800',
      instructorId: instructorProfileAlex.id,
      coHostIds: [],
      type: 'YOGA_CLASS' as const,
      status: 'ENDED' as const,
      scheduledStartAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      scheduledEndAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      actualStartAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      actualEndAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      maxParticipants: 75,
      currentParticipants: 68,
      isRecorded: true,
      recordingUrl: 'https://storage.example.com/recordings/breathwork-session.mp4',
      recordingDuration: 3600, // 1 hour
      requiresSubscription: false,
      tags: ['breathwork', 'pranayama', 'energy', 'focus'],
      level: 'BEGINNER' as const,
      equipment: [],
      agoraChannelName: 'breathwork-power-channel',
      chatEnabled: true,
      handRaiseEnabled: true,
      viewCount: 245,
      likeCount: 89,
    },
    {
      id: 'live-stream-qa-session',
      title: 'Ask Me Anything: Yoga Journey',
      description: 'Live Q&A session with our senior yoga instructor. Ask your questions!',
      thumbnailUrl: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800',
      instructorId: instructorProfile.id,
      coHostIds: [instructorProfileMaya.id],
      type: 'Q_AND_A' as const,
      status: 'ENDED' as const,
      scheduledStartAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
      scheduledEndAt: new Date(Date.now() - 1000 * 60 * 60 * 23), // Yesterday + 1 hour
      actualStartAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      actualEndAt: new Date(Date.now() - 1000 * 60 * 60 * 22.5),
      maxParticipants: 150,
      currentParticipants: 127,
      isRecorded: true,
      recordingUrl: 'https://storage.example.com/recordings/qa-yoga-journey.mp4',
      recordingDuration: 5400, // 1.5 hours
      requiresSubscription: false,
      tags: ['q&a', 'community', 'yoga', 'beginner'],
      level: 'BEGINNER' as const,
      equipment: [],
      agoraChannelName: 'qa-yoga-journey-channel',
      chatEnabled: true,
      handRaiseEnabled: true,
      viewCount: 412,
      likeCount: 156,
    },
    {
      id: 'live-stream-special-event',
      title: 'New Year Wellness Workshop',
      description: 'Special event: Full-day wellness workshop with multiple instructors.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      instructorId: instructorProfile.id,
      coHostIds: [instructorProfileMaya.id, instructorProfileAlex.id],
      type: 'SPECIAL_EVENT' as const,
      status: 'CANCELLED' as const,
      scheduledStartAt: new Date(Date.now() + 1000 * 60 * 60 * 168), // 1 week from now
      scheduledEndAt: new Date(Date.now() + 1000 * 60 * 60 * 176), // 1 week + 8 hours
      maxParticipants: 500,
      currentParticipants: 0,
      isRecorded: true,
      requiresSubscription: true,
      minimumTier: 'YOGA' as const,
      price: 29.99,
      tags: ['special-event', 'workshop', 'wellness', 'new-year'],
      level: 'BEGINNER' as const,
      equipment: ['yoga mat', 'blocks', 'strap'],
      agoraChannelName: 'new-year-wellness-channel',
      chatEnabled: true,
      handRaiseEnabled: true,
      viewCount: 0,
      likeCount: 0,
    },
  ];

  for (const stream of liveStreamsData) {
    await prisma.live_streams.upsert({
      where: { id: stream.id },
      update: stream,
      create: stream,
    });
  }
  console.log('📺 Live streams seeded');

  // ============================================
  // CONTENT REPORTS (Moderation)
  // ============================================
  const contentReportsData = [
    {
      id: 'report-spam-comment',
      reporterId: studentSam.id,
      reason: 'SPAM' as const,
      description: 'Bu yorum reklam içeriyor ve ders konusuyla alakası yok.',
      targetType: 'COMMENT' as const,
      status: 'PENDING' as const,
    },
    {
      id: 'report-harassment-user',
      reporterId: studentEmma.id,
      reason: 'HARASSMENT' as const,
      description: 'Bu kullanıcı forumda diğer üyelere hakaret ediyor.',
      targetType: 'USER' as const,
      userId: studentSam.id,
      status: 'REVIEWING' as const,
    },
    {
      id: 'report-inappropriate-post',
      reporterId: teacherTaylor.id,
      reason: 'INAPPROPRIATE_CONTENT' as const,
      description: 'Paylaşım uygunsuz içerik barındırıyor.',
      targetType: 'POST' as const,
      status: 'PENDING' as const,
    },
    {
      id: 'report-misinformation-topic',
      reporterId: teacherMaya.id,
      reason: 'MISINFORMATION' as const,
      description: 'Bu konu başlığı yanlış sağlık bilgileri içeriyor.',
      targetType: 'TOPIC' as const,
      status: 'RESOLVED' as const,
      reviewedById: admin.id,
      reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      resolution: 'İçerik kaldırıldı ve kullanıcıya uyarı verildi.',
    },
    {
      id: 'report-copyright-post',
      reporterId: teacherAlex.id,
      reason: 'COPYRIGHT' as const,
      description: 'Bu paylaşımda telif hakkı ihlali var. Müzik izinsiz kullanılmış.',
      targetType: 'POST' as const,
      status: 'DISMISSED' as const,
      reviewedById: admin.id,
      reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      resolution: 'İncelendi, telif hakkı ihlali tespit edilmedi. Müzik lisanslı.',
    },
    {
      id: 'report-spam-user',
      reporterId: studentEmma.id,
      reason: 'SPAM' as const,
      description: 'Kullanıcı sürekli aynı linki paylaşıyor.',
      targetType: 'USER' as const,
      userId: studentSam.id,
      status: 'PENDING' as const,
    },
    {
      id: 'report-other-comment',
      reporterId: studentSam.id,
      reason: 'OTHER' as const,
      description: 'Yorum konu dışı ve tartışmayı bozuyor.',
      targetType: 'COMMENT' as const,
      status: 'REVIEWING' as const,
    },
    {
      id: 'report-harassment-comment',
      reporterId: teacherTaylor.id,
      reason: 'HARASSMENT' as const,
      description: 'Yorumda küfür ve hakaret içeren ifadeler var.',
      targetType: 'COMMENT' as const,
      status: 'RESOLVED' as const,
      reviewedById: admin.id,
      reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
      resolution: 'Yorum silindi, kullanıcı 7 gün süreyle yasaklandı.',
    },
  ];

  for (const report of contentReportsData) {
    await prisma.content_reports.upsert({
      where: { id: report.id },
      update: report,
      create: report,
    });
  }
  console.log('🚨 Content reports seeded');

  // ============================================
  // SUBSCRIPTIONS (User Subscriptions)
  // ============================================
  const subscriptionsData = [
    {
      id: 'sub-sam-premium',
      userId: studentSam.id,
      planId: 'plan-premium',
      provider: 'STRIPE' as const,
      status: 'ACTIVE' as const,
      interval: 'MONTHLY' as const,
      stripeCustomerId: 'cus_sample_sam',
      stripeSubscriptionId: 'sub_sample_sam_premium',
      currentPeriodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15), // 15 days from now
      autoRenew: true,
    },
    {
      id: 'sub-emma-yoga',
      userId: studentEmma.id,
      planId: 'plan-yoga',
      provider: 'STRIPE' as const,
      status: 'ACTIVE' as const,
      interval: 'YEARLY' as const,
      stripeCustomerId: 'cus_sample_emma',
      stripeSubscriptionId: 'sub_sample_emma_yoga',
      currentPeriodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 305), // ~305 days from now
      autoRenew: true,
    },
    {
      id: 'sub-taylor-meditation',
      userId: teacherTaylor.id,
      planId: 'plan-meditation',
      provider: 'APPLE' as const,
      status: 'ACTIVE' as const,
      interval: 'MONTHLY' as const,
      appleOriginalTransactionId: 'apple_txn_taylor_123',
      currentPeriodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20), // 20 days from now
      autoRenew: true,
    },
    {
      id: 'sub-maya-family',
      userId: teacherMaya.id,
      planId: 'plan-family',
      provider: 'GOOGLE' as const,
      status: 'ACTIVE' as const,
      interval: 'YEARLY' as const,
      googlePurchaseToken: 'google_token_maya_456',
      googleOrderId: 'GPA.1234-5678-9012-3456',
      currentPeriodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 335), // ~335 days from now
      autoRenew: true,
    },
    {
      id: 'sub-cancelled-yoga',
      userId: teacherAlex.id,
      planId: 'plan-yoga',
      provider: 'STRIPE' as const,
      status: 'CANCELLED' as const,
      interval: 'MONTHLY' as const,
      stripeCustomerId: 'cus_sample_alex',
      stripeSubscriptionId: 'sub_sample_alex_yoga',
      currentPeriodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45), // 45 days ago
      currentPeriodEnd: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // ended 15 days ago
      cancelledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
      cancelReason: 'Kullanmıyorum, tatile çıkıyorum.',
      autoRenew: false,
    },
    {
      id: 'sub-expired-premium',
      userId: admin.id,
      planId: 'plan-premium',
      provider: 'STRIPE' as const,
      status: 'EXPIRED' as const,
      interval: 'MONTHLY' as const,
      stripeCustomerId: 'cus_sample_admin',
      stripeSubscriptionId: 'sub_sample_admin_premium',
      currentPeriodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
      currentPeriodEnd: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // ended 30 days ago
      autoRenew: false,
    },
  ];

  for (const subscription of subscriptionsData) {
    await prisma.subscriptions.upsert({
      where: { id: subscription.id },
      update: subscription,
      create: subscription,
    });
  }
  console.log('💳 Subscriptions seeded');

  // ============================================
  // PAYMENTS
  // ============================================
  const paymentsData = [
    {
      id: 'payment-sam-premium-1',
      userId: studentSam.id,
      subscriptionId: 'sub-sam-premium',
      provider: 'STRIPE' as const,
      transactionId: 'pi_sam_premium_seed_1',
      amount: 149.99,
      currency: 'TRY',
      status: 'COMPLETED' as const,
      paymentMethod: 'CARD' as const,
      cardBrand: 'Visa',
      cardLast4: '4242',
      receiptUrl: 'https://pay.stripe.com/receipts/sample_sam_1',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    },
    {
      id: 'payment-emma-yoga-1',
      userId: studentEmma.id,
      subscriptionId: 'sub-emma-yoga',
      provider: 'STRIPE' as const,
      transactionId: 'pi_emma_yoga_seed_1',
      amount: 899.88,
      currency: 'TRY',
      status: 'COMPLETED' as const,
      paymentMethod: 'CARD' as const,
      cardBrand: 'Mastercard',
      cardLast4: '5555',
      receiptUrl: 'https://pay.stripe.com/receipts/sample_emma_1',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    },
    {
      id: 'payment-taylor-meditation-1',
      userId: teacherTaylor.id,
      subscriptionId: 'sub-taylor-meditation',
      provider: 'APPLE' as const,
      transactionId: 'apple_receipt_taylor_seed',
      amount: 79.99,
      currency: 'TRY',
      status: 'COMPLETED' as const,
      paymentMethod: 'APPLE_PAY' as const,
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    },
    {
      id: 'payment-maya-family-1',
      userId: teacherMaya.id,
      subscriptionId: 'sub-maya-family',
      provider: 'GOOGLE' as const,
      transactionId: 'google_order_maya_seed',
      amount: 2199.88,
      currency: 'TRY',
      status: 'COMPLETED' as const,
      paymentMethod: 'GOOGLE_PAY' as const,
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    },
    {
      id: 'payment-alex-yoga-1',
      userId: teacherAlex.id,
      subscriptionId: 'sub-cancelled-yoga',
      provider: 'STRIPE' as const,
      transactionId: 'pi_alex_yoga_seed_1',
      amount: 99.99,
      currency: 'TRY',
      status: 'COMPLETED' as const,
      paymentMethod: 'CARD' as const,
      cardBrand: 'Visa',
      cardLast4: '1234',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    },
    {
      id: 'payment-admin-premium-1',
      userId: admin.id,
      subscriptionId: 'sub-expired-premium',
      provider: 'STRIPE' as const,
      transactionId: 'pi_admin_premium_seed_1',
      amount: 149.99,
      currency: 'TRY',
      status: 'COMPLETED' as const,
      paymentMethod: 'CARD' as const,
      cardBrand: 'Amex',
      cardLast4: '0005',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    },
    {
      id: 'payment-failed-example',
      userId: studentSam.id,
      provider: 'STRIPE' as const,
      transactionId: 'pi_failed_seed_1',
      amount: 149.99,
      currency: 'TRY',
      status: 'FAILED' as const,
      paymentMethod: 'CARD' as const,
      cardBrand: 'Visa',
      cardLast4: '0002',
      failureCode: 'card_declined',
      failureMessage: 'Kartınız reddedildi. Lütfen bankanızla iletişime geçin.',
    },
    {
      id: 'payment-pending-example',
      userId: studentEmma.id,
      provider: 'STRIPE' as const,
      transactionId: 'pi_pending_seed_1',
      amount: 99.99,
      currency: 'TRY',
      status: 'PENDING' as const,
      paymentMethod: 'CARD' as const,
      cardBrand: 'Mastercard',
      cardLast4: '8888',
    },
    {
      id: 'payment-refunded-example',
      userId: teacherTaylor.id,
      provider: 'STRIPE' as const,
      transactionId: 'pi_refunded_seed_1',
      amount: 79.99,
      currency: 'TRY',
      status: 'REFUNDED' as const,
      paymentMethod: 'CARD' as const,
      cardBrand: 'Visa',
      cardLast4: '9999',
      refundedAmount: 79.99,
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
    },
  ];

  for (const payment of paymentsData) {
    await prisma.payments.upsert({
      where: { id: payment.id },
      update: payment,
      create: payment,
    });
  }
  console.log('💰 Payments seeded');

  // ============================================
  // PLAYLISTS
  // ============================================
  const playlistsData = [
    {
      id: 'playlist-morning-meditation',
      name: 'Sabah Meditasyonları',
      nameEn: 'Morning Meditations',
      description: 'Güne enerjik ve huzurlu başlamak için meditasyonlar',
      descriptionEn: 'Meditations to start your day with energy and peace',
      coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      color: '#8B5CF6',
      type: 'SYSTEM' as const,
      contentType: 'MEDITATION' as const,
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
      totalDuration: 1800,
      itemCount: 5,
      playCount: 1250,
      saveCount: 340,
    },
    {
      id: 'playlist-sleep-sounds',
      name: 'Uyku Sesleri',
      nameEn: 'Sleep Sounds',
      description: 'Derin ve huzurlu bir uyku için rahatlatıcı sesler',
      descriptionEn: 'Relaxing sounds for deep and peaceful sleep',
      coverImage: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=800',
      color: '#1E3A5F',
      type: 'CURATED' as const,
      contentType: 'SOUNDSCAPE' as const,
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
      totalDuration: 7200,
      itemCount: 10,
      playCount: 2340,
      saveCount: 890,
    },
    {
      id: 'playlist-breathwork-basics',
      name: 'Nefes Teknikleri Temelleri',
      nameEn: 'Breathwork Basics',
      description: 'Başlangıç seviyesi nefes egzersizleri',
      descriptionEn: 'Beginner level breathing exercises',
      coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      color: '#06B6D4',
      type: 'SYSTEM' as const,
      contentType: 'BREATHWORK' as const,
      isSystem: true,
      isPublic: true,
      isFeatured: false,
      isPublished: true,
      sortOrder: 3,
      totalDuration: 1200,
      itemCount: 8,
      playCount: 567,
      saveCount: 123,
    },
    {
      id: 'playlist-stress-relief',
      name: 'Stres Yönetimi',
      nameEn: 'Stress Relief',
      description: 'Stresi azaltmak için meditasyon ve nefes egzersizleri',
      descriptionEn: 'Meditation and breathing exercises to reduce stress',
      coverImage: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800',
      color: '#10B981',
      type: 'CURATED' as const,
      contentType: 'MIXED' as const,
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 4,
      totalDuration: 2400,
      itemCount: 12,
      playCount: 1890,
      saveCount: 456,
    },
    {
      id: 'playlist-focus-flow',
      name: 'Odaklanma ve Akış',
      nameEn: 'Focus & Flow',
      description: 'Konsantrasyonu artırmak ve akış haline geçmek için',
      descriptionEn: 'To increase concentration and enter flow state',
      coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
      color: '#F59E0B',
      type: 'GENERATED' as const,
      contentType: 'MEDITATION' as const,
      isSystem: false,
      isPublic: true,
      isFeatured: false,
      isPublished: true,
      sortOrder: 5,
      totalDuration: 900,
      itemCount: 4,
      playCount: 234,
      saveCount: 67,
    },
    {
      id: 'playlist-evening-wind-down',
      name: 'Akşam Gevşeme Rutini',
      nameEn: 'Evening Wind Down',
      description: 'Günü tamamlamak ve rahatlamak için akşam meditasyonları',
      descriptionEn: 'Evening meditations to complete the day and relax',
      coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
      color: '#6366F1',
      type: 'SYSTEM' as const,
      contentType: 'MIXED' as const,
      isSystem: true,
      isPublic: true,
      isFeatured: false,
      isPublished: true,
      sortOrder: 6,
      totalDuration: 1500,
      itemCount: 6,
      playCount: 789,
      saveCount: 234,
    },
    {
      id: 'playlist-yoga-beginners',
      name: 'Yeni Başlayanlar İçin Yoga',
      nameEn: 'Yoga for Beginners',
      description: 'Yogaya yeni başlayanlar için temel dersler',
      descriptionEn: 'Basic classes for yoga beginners',
      coverImage: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800',
      color: '#EC4899',
      type: 'COURSE' as const,
      contentType: 'MIXED' as const,
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 7,
      totalDuration: 5400,
      itemCount: 15,
      playCount: 3456,
      saveCount: 1234,
    },
    {
      id: 'playlist-nature-sounds',
      name: 'Doğa Sesleri',
      nameEn: 'Nature Sounds',
      description: 'Yağmur, orman, deniz ve kuş sesleri',
      descriptionEn: 'Rain, forest, ocean and bird sounds',
      coverImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      color: '#22C55E',
      type: 'CURATED' as const,
      contentType: 'SOUNDSCAPE' as const,
      isSystem: true,
      isPublic: true,
      isFeatured: false,
      isPublished: true,
      sortOrder: 8,
      totalDuration: 10800,
      itemCount: 20,
      playCount: 4567,
      saveCount: 2345,
    },
  ];

  for (const playlist of playlistsData) {
    await prisma.playlists.upsert({
      where: { id: playlist.id },
      update: playlist,
      create: playlist,
    });
  }
  console.log('🎵 Playlists seeded');

  // ============================================
  // STUDENT DATA - Favorites, Goals, Progress
  // ============================================

  // Get first class and program for student data
  const firstClass = await prisma.classes.findFirst();
  const firstProgram = await prisma.programs.findFirst();
  const firstPose = await prisma.poses.findFirst();

  // Add favorites for student Sam
  if (firstClass && studentSam) {
    await prisma.favorites.upsert({
      where: {
        userId_itemId_itemType: {
          userId: studentSam.id,
          itemId: firstClass.id,
          itemType: 'CLASS',
        },
      },
      update: {},
      create: {
        userId: studentSam.id,
        itemType: 'CLASS',
        itemId: firstClass.id,
      },
    });
  }

  if (firstProgram && studentSam) {
    await prisma.favorites.upsert({
      where: {
        userId_itemId_itemType: {
          userId: studentSam.id,
          itemId: firstProgram.id,
          itemType: 'PROGRAM',
        },
      },
      update: {},
      create: {
        userId: studentSam.id,
        itemType: 'PROGRAM',
        itemId: firstProgram.id,
      },
    });
  }

  if (firstPose && studentSam) {
    await prisma.favorites.upsert({
      where: {
        userId_itemId_itemType: {
          userId: studentSam.id,
          itemId: firstPose.id,
          itemType: 'POSE',
        },
      },
      update: {},
      create: {
        userId: studentSam.id,
        itemType: 'POSE',
        itemId: firstPose.id,
      },
    });
  }

  // Add video progress for student Sam
  if (firstClass && studentSam) {
    await prisma.video_progress.upsert({
      where: {
        userId_lessonId_lessonType: {
          userId: studentSam.id,
          lessonId: firstClass.id,
          lessonType: 'CLASS',
        },
      },
      update: {},
      create: {
        userId: studentSam.id,
        lessonType: 'CLASS',
        lessonId: firstClass.id,
        currentTime: 600,
        duration: 1800,
        percentage: 33.33,
        completed: false,
        lastWatchedAt: new Date(),
      },
    });
  }

  // Add user goals for student Sam
  if (studentSam) {
    await prisma.user_goals.upsert({
      where: {
        id: 'goal-sam-weekly-yoga',
      },
      update: {},
      create: {
        id: 'goal-sam-weekly-yoga',
        userId: studentSam.id,
        title: 'Haftalik Yoga',
        description: 'Haftada 3 gun yoga pratigi yap',
        type: 'PRACTICE_DAYS',
        targetValue: 3,
        currentValue: 1,
        unit: 'gun',
        period: 'WEEKLY',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user_goals.upsert({
      where: {
        id: 'goal-sam-daily-minutes',
      },
      update: {},
      create: {
        id: 'goal-sam-daily-minutes',
        userId: studentSam.id,
        title: 'Gunluk Pratik',
        description: 'Her gun 20 dakika pratik yap',
        type: 'PRACTICE_MINUTES',
        targetValue: 20,
        currentValue: 10,
        unit: 'dakika',
        period: 'DAILY',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user_goals.upsert({
      where: {
        id: 'goal-sam-monthly-streak',
      },
      update: {},
      create: {
        id: 'goal-sam-monthly-streak',
        userId: studentSam.id,
        title: 'Aylik Seri',
        description: 'Bu ay 10 gunluk seri yap',
        type: 'STREAK',
        targetValue: 10,
        currentValue: 5,
        unit: 'gun',
        period: 'MONTHLY',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Add user wellness stats for student Sam
  if (studentSam) {
    await prisma.user_wellness_stats.upsert({
      where: {
        userId: studentSam.id,
      },
      update: {
        totalSessionMinutes: 120,
        totalSessionCount: 8,
        totalMeditationMinutes: 30,
        totalMeditationCount: 3,
        currentStreak: 5,
        longestStreak: 7,
        lastActivityDate: new Date(),
      },
      create: {
        userId: studentSam.id,
        totalSessionMinutes: 120,
        totalSessionCount: 8,
        totalMeditationMinutes: 30,
        totalMeditationCount: 3,
        currentStreak: 5,
        longestStreak: 7,
        lastActivityDate: new Date(),
      },
    });
  }

  console.log('👨‍🎓 Student data seeded (favorites, goals, progress)');

  // ============================================================
  // VIDEO PROGRESS SEED DATA (for History Page)
  // ============================================================
  console.log('📹 Seeding video progress...');

  // Get existing classes for video progress
  const classesForProgress = await prisma.classes.findMany({
    take: 8,
    orderBy: { createdAt: 'asc' },
  });

  if (classesForProgress.length > 0 && student) {
    const videoProgressData = [
      // Completed videos
      {
        id: 'vp-student-class1',
        userId: student.id,
        lessonId: classesForProgress[0]?.id || 'class-morning-yoga',
        lessonType: 'CLASS' as const,
        currentTime: 1800, // 30 minutes
        duration: 1800,
        percentage: 100,
        completed: true,
        lastWatchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: 'vp-student-class2',
        userId: student.id,
        lessonId: classesForProgress[1]?.id || 'class-power-vinyasa',
        lessonType: 'CLASS' as const,
        currentTime: 2700, // 45 minutes
        duration: 2700,
        percentage: 100,
        completed: true,
        lastWatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 'vp-student-class3',
        userId: student.id,
        lessonId: classesForProgress[2]?.id || 'class-gentle-stretch',
        lessonType: 'CLASS' as const,
        currentTime: 1500, // 25 minutes
        duration: 1500,
        percentage: 100,
        completed: true,
        lastWatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      // In-progress videos
      {
        id: 'vp-student-class4',
        userId: student.id,
        lessonId: classesForProgress[3]?.id || 'class-pilates-mat',
        lessonType: 'CLASS' as const,
        currentTime: 1200, // 20 minutes watched
        duration: 2400, // 40 minutes total
        percentage: 50,
        completed: false,
        lastWatchedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        id: 'vp-student-class5',
        userId: student.id,
        lessonId: classesForProgress[4]?.id || 'class-yin-yoga',
        lessonType: 'CLASS' as const,
        currentTime: 900, // 15 minutes watched
        duration: 3000, // 50 minutes total
        percentage: 30,
        completed: false,
        lastWatchedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        id: 'vp-student-class6',
        userId: student.id,
        lessonId: classesForProgress[5]?.id || 'class-breathwork',
        lessonType: 'CLASS' as const,
        currentTime: 300, // 5 minutes watched
        duration: 1200, // 20 minutes total
        percentage: 25,
        completed: false,
        lastWatchedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
    ];

    for (const progress of videoProgressData) {
      await prisma.video_progress.upsert({
        where: {
          userId_lessonId_lessonType: {
            userId: progress.userId,
            lessonId: progress.lessonId,
            lessonType: progress.lessonType,
          },
        },
        update: {
          currentTime: progress.currentTime,
          duration: progress.duration,
          percentage: progress.percentage,
          completed: progress.completed,
          lastWatchedAt: progress.lastWatchedAt,
        },
        create: progress,
      });
    }

    console.log(`  ✓ Created ${videoProgressData.length} video progress entries for student`);
  }

  // Also add video progress for studentSam
  if (classesForProgress.length > 0 && studentSam) {
    const samVideoProgressData = [
      {
        id: 'vp-sam-class1',
        userId: studentSam.id,
        lessonId: classesForProgress[0]?.id || 'class-morning-yoga',
        lessonType: 'CLASS' as const,
        currentTime: 1800,
        duration: 1800,
        percentage: 100,
        completed: true,
        lastWatchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'vp-sam-class2',
        userId: studentSam.id,
        lessonId: classesForProgress[6]?.id || 'class-evening-relax',
        lessonType: 'CLASS' as const,
        currentTime: 2100,
        duration: 2100,
        percentage: 100,
        completed: true,
        lastWatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'vp-sam-class3',
        userId: studentSam.id,
        lessonId: classesForProgress[7]?.id || 'class-hiit-yoga',
        lessonType: 'CLASS' as const,
        currentTime: 1000,
        duration: 2400,
        percentage: 42,
        completed: false,
        lastWatchedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    ];

    for (const progress of samVideoProgressData) {
      await prisma.video_progress.upsert({
        where: {
          userId_lessonId_lessonType: {
            userId: progress.userId,
            lessonId: progress.lessonId,
            lessonType: progress.lessonType,
          },
        },
        update: {
          currentTime: progress.currentTime,
          duration: progress.duration,
          percentage: progress.percentage,
          completed: progress.completed,
          lastWatchedAt: progress.lastWatchedAt,
        },
        create: progress,
      });
    }

    console.log(`  ✓ Created ${samVideoProgressData.length} video progress entries for studentSam`);
  }

  console.log('📹 Video progress seeded');

  // ============================================================
  // FAVORITES SEED DATA (for Favorites Page)
  // ============================================================
  console.log('❤️ Seeding favorites...');

  // Get content for favorites
  const classesForFavorites = await prisma.classes.findMany({ take: 4 });
  const programsForFavorites = await prisma.programs.findMany({ take: 3 });
  const posesForFavorites = await prisma.poses.findMany({ take: 3 });

  if (student) {
    const favoritesData: Array<{
      id: string;
      userId: string;
      itemId: string;
      itemType: 'CLASS' | 'PROGRAM' | 'POSE';
      createdAt: Date;
    }> = [];

    // Add class favorites (2)
    classesForFavorites.slice(0, 2).forEach((cls, idx) => {
      favoritesData.push({
        id: `fav-student-class-${idx + 1}`,
        userId: student.id,
        itemId: cls.id,
        itemType: 'CLASS',
        createdAt: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000),
      });
    });

    // Add program favorites (2)
    programsForFavorites.slice(0, 2).forEach((prog, idx) => {
      favoritesData.push({
        id: `fav-student-program-${idx + 1}`,
        userId: student.id,
        itemId: prog.id,
        itemType: 'PROGRAM',
        createdAt: new Date(Date.now() - (idx + 3) * 24 * 60 * 60 * 1000),
      });
    });

    // Add pose favorites (2)
    posesForFavorites.slice(0, 2).forEach((pose, idx) => {
      favoritesData.push({
        id: `fav-student-pose-${idx + 1}`,
        userId: student.id,
        itemId: pose.id,
        itemType: 'POSE',
        createdAt: new Date(Date.now() - (idx + 5) * 24 * 60 * 60 * 1000),
      });
    });

    for (const fav of favoritesData) {
      // Delete existing and recreate to avoid id conflicts
      await prisma.favorites.deleteMany({
        where: {
          userId: fav.userId,
          itemId: fav.itemId,
          itemType: fav.itemType,
        },
      });
      await prisma.favorites.create({
        data: fav,
      });
    }

    console.log(`  ✓ Created ${favoritesData.length} favorites for student`);
  }

  // Also add favorites for studentSam
  if (studentSam) {
    const samFavoritesData: Array<{
      id: string;
      userId: string;
      itemId: string;
      itemType: 'CLASS' | 'PROGRAM' | 'POSE';
      createdAt: Date;
    }> = [];

    // Different items for Sam
    classesForFavorites.slice(2, 4).forEach((cls, idx) => {
      samFavoritesData.push({
        id: `fav-sam-class-${idx + 1}`,
        userId: studentSam.id,
        itemId: cls.id,
        itemType: 'CLASS',
        createdAt: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000),
      });
    });

    programsForFavorites.slice(1, 3).forEach((prog, idx) => {
      samFavoritesData.push({
        id: `fav-sam-program-${idx + 1}`,
        userId: studentSam.id,
        itemId: prog.id,
        itemType: 'PROGRAM',
        createdAt: new Date(Date.now() - (idx + 3) * 24 * 60 * 60 * 1000),
      });
    });

    posesForFavorites.slice(1, 3).forEach((pose, idx) => {
      samFavoritesData.push({
        id: `fav-sam-pose-${idx + 1}`,
        userId: studentSam.id,
        itemId: pose.id,
        itemType: 'POSE',
        createdAt: new Date(Date.now() - (idx + 5) * 24 * 60 * 60 * 1000),
      });
    });

    for (const fav of samFavoritesData) {
      // Delete existing and recreate to avoid id conflicts
      await prisma.favorites.deleteMany({
        where: {
          userId: fav.userId,
          itemId: fav.itemId,
          itemType: fav.itemType,
        },
      });
      await prisma.favorites.create({
        data: fav,
      });
    }

    console.log(`  ✓ Created ${samFavoritesData.length} favorites for studentSam`);
  }

  console.log('❤️ Favorites seeded');

  console.log('✅ All seed data created successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
